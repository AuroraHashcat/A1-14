"""测评准备信息相关API。"""

from flask import jsonify, request, session

from app.api import bp
from app.models import System
from app.services.preparation_service import get_system_preparation, upsert_system_preparation
from app.services.system_service import ensure_default_system_for_user


def _load_accessible_system(system_id: str, *, for_update: bool) -> tuple[System | None, tuple | None]:
    """加载用户可访问的系统并返回系统对象及错误响应。"""
    user_id = session.get('user_id')
    try:
        normalized_user_id = int(user_id) if user_id is not None else None
    except (TypeError, ValueError):  # pragma: no cover - 容错
        normalized_user_id = None

    ensure_default_system_for_user(normalized_user_id)
    system = System.query.get(system_id)
    if not system:
        return None, (jsonify({'success': False, 'error': '系统不存在'}), 404)

    owner_id = system.owner_id
    user_id = normalized_user_id

    if owner_id:
        if not user_id:
            return None, (jsonify({'success': False, 'error': '未登录'}), 401)
        if owner_id != user_id:
            return None, (jsonify({'success': False, 'error': '无权访问该系统'}), 403)

    return system, None


@bp.route('/systems/<string:system_id>/preparation', methods=['GET'])
def get_preparation(system_id: str):
    """获取测评准备信息。"""
    system, error = _load_accessible_system(system_id, for_update=False)
    if error:
        return error
    assert system is not None

    data = get_system_preparation(system.id)
    return jsonify({'success': True, 'data': {'systemId': system.id, 'projectInfo': data}})


@bp.route('/systems/<string:system_id>/preparation', methods=['PUT'])
def update_preparation(system_id: str):
    """保存测评准备信息。"""
    system, error = _load_accessible_system(system_id, for_update=True)
    if error:
        return error
    assert system is not None

    payload = request.get_json(silent=True) or {}
    project_info = payload.get('projectInfo')
    if project_info is None or not isinstance(project_info, dict):
        return jsonify({'success': False, 'error': '请提供有效的项目信息'}), 400

    try:
        stored = upsert_system_preparation(system.id, project_info)
    except ValueError as exc:  # 系统不存在（理论上不会出现）
        return jsonify({'success': False, 'error': str(exc)}), 404

    return jsonify({'success': True, 'data': {'systemId': system.id, 'projectInfo': stored}})
