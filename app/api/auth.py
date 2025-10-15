"""
占位API文件，避免导入错误
"""

from app.api import bp

# 这些文件将在后续创建服务层后完善
@bp.route('/auth/placeholder')
def auth_placeholder():
    return {'message': 'Auth API placeholder'}
