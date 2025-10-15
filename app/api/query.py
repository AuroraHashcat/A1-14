"""
查询相关API
"""

from app.api import bp

@bp.route('/query/placeholder')
def query_placeholder():
    return {'message': 'Query API placeholder'}
