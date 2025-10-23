"""认证与会话相关API。"""

from flask import jsonify, request, session
from sqlalchemy import or_

from app.api import bp
from app.models import User, db


def _extract_payload():
    data = request.get_json(silent=True)
    if not data:
        data = request.form.to_dict()
    return data or {}


def _serialize_user(user: User):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'updated_at': user.created_at.isoformat() if user.created_at else None,
    }


@bp.route('/register', methods=['POST'])
def register():
    """用户注册并创建会话。"""
    payload = _extract_payload()
    username = (payload.get('username') or '').strip()
    email = (payload.get('email') or '').strip()
    password = (payload.get('password') or '').strip()

    if not username or not email or not password:
        return jsonify({'success': False, 'error': '请完整填写注册信息'}), 400

    try:
        existing_user = User.query.filter(or_(User.username == username, User.email == email)).first()
        if existing_user:
            return jsonify({'success': False, 'error': '用户名或邮箱已被使用'}), 400

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        session.permanent = True
        session['user_id'] = user.id

        return jsonify({'success': True, 'data': _serialize_user(user)})
    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({'success': False, 'error': f'注册失败: {exc}'}), 500


@bp.route('/login', methods=['POST'])
def login():
    """用户登录并创建会话。"""
    payload = _extract_payload()
    username = (payload.get('username') or '').strip()
    password = (payload.get('password') or '').strip()

    if not username or not password:
        return jsonify({'success': False, 'error': '请输入用户名和密码'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'error': '账号或密码错误'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'error': '账号已被停用'}), 403

    session.permanent = True
    session['user_id'] = user.id

    return jsonify({'success': True, 'data': _serialize_user(user)})


@bp.route('/logout', methods=['POST'])
def logout():
    """注销当前会话。"""
    session.pop('user_id', None)
    return jsonify({'success': True, 'data': {'message': '已退出登录'}})


@bp.route('/session', methods=['GET'])
def session_info():
    """获取当前登录用户信息。"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    user = User.query.get(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'success': False, 'error': '未登录'}), 401

    return jsonify({'success': True, 'data': _serialize_user(user)})
