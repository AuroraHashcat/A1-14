"""测评系统管理相关API。"""

from flask import jsonify, request, session
from sqlalchemy import func

from app import db
from app.api import bp
from app.models import Evidence, System, User
from app.services.system_service import (
    DEFAULT_SYSTEM_NAME,
    GLOBAL_DEFAULT_SYSTEM_ID,
    default_system_id_for_user,
    ensure_default_system_for_user,
    ensure_unique_system_id,
    serialize_system,
)


def _extract_payload() -> dict:
    data = request.get_json(silent=True)
    if not data:
        data = request.form.to_dict()
    return data or {}


def _get_current_user_id() -> int | None:
    user_id = session.get('user_id')
    if user_id is None:
        return None
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


@bp.route('/systems', methods=['GET'])
def list_systems():
    """列出当前用户可见的测评系统。"""
    user_id = _get_current_user_id()
    ensure_default_system_for_user(user_id)

    query = System.query
    if user_id:
        query = query.filter(System.owner_id == user_id)
    else:
        query = query.filter(System.owner_id.is_(None))

    systems = query.order_by(System.created_at.asc()).all()
    system_ids = [system.id for system in systems]

    evidence_totals: dict[str, int] = {}
    evidence_parsed: dict[str, int] = {}

    if system_ids:
        total_rows = (
            db.session.query(Evidence.system_id, func.count(Evidence.id))
            .filter(Evidence.system_id.in_(system_ids))
            .group_by(Evidence.system_id)
            .all()
        )
        evidence_totals = {system_id: count for system_id, count in total_rows}

        parsed_rows = (
            db.session.query(Evidence.system_id, func.count(Evidence.id))
            .filter(Evidence.system_id.in_(system_ids), Evidence.extracted_text.isnot(None))
            .group_by(Evidence.system_id)
            .all()
        )
        evidence_parsed = {system_id: count for system_id, count in parsed_rows}

    payload = [
        serialize_system(
            item,
            evidence_total=evidence_totals.get(item.id, 0),
            evidence_parsed=evidence_parsed.get(item.id, 0)
        )
        for item in systems
    ]

    return jsonify({'success': True, 'data': payload})


@bp.route('/systems', methods=['POST'])
def create_system():
    """创建新的测评系统。"""
    user_id = _get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    owner_user = User.query.get(user_id)
    if not owner_user:
        return jsonify({'success': False, 'error': '用户不存在'}), 404

    payload = _extract_payload()
    name = (payload.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'error': '请填写系统名称'}), 400

    existing = System.query.filter_by(owner_id=user_id, name=name).first()
    if existing:
        return jsonify({'success': False, 'error': '当前用户下已存在同名系统'}), 409

    code = (payload.get('code') or '').strip() or None
    level = (payload.get('level') or '').strip() or None
    owner_field = payload.get('owner')
    owner = owner_field.strip() if isinstance(owner_field, str) else None
    if not owner:
        owner = owner_user.username
    description = (payload.get('description') or '').strip() or None

    default_id = default_system_id_for_user(user_id)
    system_id = ensure_unique_system_id(name)
    if name == DEFAULT_SYSTEM_NAME:
        system_id = default_id

    system = System(
        id=system_id,
        name=name,
        code=code,
        level=level,
        owner=owner,
        description=description,
        owner_id=user_id
    )

    db.session.add(system)
    db.session.commit()

    return jsonify({'success': True, 'data': serialize_system(system, evidence_total=0, evidence_parsed=0)}), 201


@bp.route('/users/<string:username>/systems/<string:system_name>', methods=['GET'])
def get_system_by_owner_and_name(username: str, system_name: str):
    """按用户名与系统名称获取系统详情。"""
    normalized_name = system_name.strip()
    if not normalized_name:
        return jsonify({'success': False, 'error': '系统名称不能为空'}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'success': False, 'error': '用户不存在'}), 404

    current_user_id = _get_current_user_id()
    if current_user_id != user.id:
        return jsonify({'success': False, 'error': '无权访问该系统'}), 403

    system = System.query.filter_by(owner_id=user.id, name=normalized_name).first()
    if not system:
        return jsonify({'success': False, 'error': '系统不存在'}), 404

    total = system.evidences.count()
    parsed = system.evidences.filter(Evidence.extracted_text.isnot(None)).count()

    return jsonify({
        'success': True,
        'data': serialize_system(system, evidence_total=total, evidence_parsed=parsed)
    })


@bp.route('/systems/<string:system_id>', methods=['DELETE'])
def delete_system(system_id: str):
    """删除指定测评系统。"""
    user_id = _get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    if system_id == GLOBAL_DEFAULT_SYSTEM_ID:
        return jsonify({'success': False, 'error': '默认测评系统不可删除'}), 400

    user_default_id = default_system_id_for_user(user_id)
    if system_id == user_default_id:
        return jsonify({'success': False, 'error': '默认测评系统不可删除'}), 400

    system = System.query.get(system_id)
    if not system:
        return jsonify({'success': False, 'error': '系统不存在'}), 404

    if system.owner_id != user_id:
        return jsonify({'success': False, 'error': '无权删除该系统'}), 403

    db.session.delete(system)
    db.session.commit()

    return jsonify({'success': True, 'data': {'id': system_id}})
