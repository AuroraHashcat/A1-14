"""业务逻辑：测评准备信息"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app import db
from app.models import System, SystemPreparation


def get_system_preparation(system_id: str) -> Optional[dict[str, Any]]:
    """获取指定系统的测评准备信息。"""
    record = SystemPreparation.query.get(system_id)
    return record.data if record else None


def upsert_system_preparation(system_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """创建或更新测评准备信息。"""
    system = System.query.get(system_id)
    if not system:
        raise ValueError('系统不存在')

    now = datetime.utcnow()
    record = SystemPreparation.query.get(system_id)
    if record:
        record.data = data
        record.updated_at = now
    else:
        record = SystemPreparation(system_id=system_id, data=data, created_at=now, updated_at=now)
        db.session.add(record)

    system.updated_at = now
    db.session.commit()
    return record.data
