"""
报告相关API
"""

from app.api import bp

@bp.route('/report/placeholder')  
def report_placeholder():
    return {'message': 'Report API placeholder'}
