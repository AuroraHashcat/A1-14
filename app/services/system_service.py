"""业务逻辑：测评系统管理"""

from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any, Optional

from app import db
from app.models import Evidence, System, User

DEFAULT_SYSTEM_SOURCE = "crypto-eval-default-system"
GLOBAL_DEFAULT_SYSTEM_ID = hashlib.sha256(DEFAULT_SYSTEM_SOURCE.encode("utf-8")).hexdigest()[:24]
DEFAULT_SYSTEM_NAME = "默认测评系统"


def default_system_id_for_user(user_id: Optional[int]) -> str:
    if user_id is None:
        return GLOBAL_DEFAULT_SYSTEM_ID
    seed = f"{DEFAULT_SYSTEM_SOURCE}-{user_id}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()[:24]


def generate_system_id(seed: str, *, attempt: int = 0) -> str:
    """根据种子生成系统ID，避免使用随机数。"""
    base = f"{seed}-{datetime.utcnow().isoformat(timespec='microseconds')}-{attempt}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:24]


def ensure_unique_system_id(seed: str) -> str:
    """生成在数据库中唯一的系统ID。"""
    attempt = 0
    while True:
        candidate = generate_system_id(seed, attempt=attempt)
        if not System.query.get(candidate):
            return candidate
        attempt += 1


def ensure_default_system_for_user(user_id: Optional[int]) -> System:
    """确保用户默认测评系统存在并返回。"""
    system_id = default_system_id_for_user(user_id)
    system = System.query.get(system_id)
    if not system:
        query = System.query.filter_by(name=DEFAULT_SYSTEM_NAME)
        if user_id is None:
            query = query.filter(System.owner_id.is_(None))
        else:
            query = query.filter(System.owner_id == user_id)
        system = query.first()
    if system:
        updated = False
        if system.name != DEFAULT_SYSTEM_NAME:
            system.name = DEFAULT_SYSTEM_NAME
            updated = True
        if system.owner_id != user_id:
            system.owner_id = user_id
            updated = True
        desired_owner = _resolve_owner_name(user_id)
        if system.owner != desired_owner:
            system.owner = desired_owner
            updated = True
        if updated:
            db.session.commit()
        return system

    system = System(
        id=system_id,
        name=DEFAULT_SYSTEM_NAME,
        owner=_resolve_owner_name(user_id),
        description="平台内置默认测评系统，供演示与快速体验使用。",
        owner_id=user_id
    )
    db.session.add(system)
    db.session.commit()
    return system


def _resolve_owner_name(user_id: Optional[int]) -> str:
    if user_id is None:
        return "平台默认系统"
    owner = User.query.get(user_id)
    return owner.username if owner else "平台默认系统"


def serialize_system(
    system: System,
    *,
    evidence_total: Optional[int] = None,
    evidence_parsed: Optional[int] = None
) -> dict[str, Any]:
    """序列化系统对象用于API响应。"""
    total = evidence_total
    parsed = evidence_parsed

    if total is None or parsed is None:
        evidence_query = system.evidences
        if total is None:
            total = evidence_query.count()
        if parsed is None:
            parsed = evidence_query.filter(Evidence.extracted_text.isnot(None)).count()

    total = total or 0
    parsed = parsed or 0

    return {
        "id": system.id,
        "name": system.name,
        "code": system.code,
        "level": system.level,
        "owner": system.owner,
        "ownerUsername": system.owner_user.username if getattr(system, "owner_user", None) else None,
        "description": system.description,
        "createdAt": system.created_at.isoformat() if system.created_at else None,
        "updatedAt": system.updated_at.isoformat() if system.updated_at else None,
        "ownerId": system.owner_id,
        "isDefault": system.id == default_system_id_for_user(system.owner_id),
        "evidenceTotal": total,
        "evidenceParsed": parsed,
    }
