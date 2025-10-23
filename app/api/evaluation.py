"""
评测相关API
"""

from flask import request, jsonify, session
from app.api import bp
from app.models import Evaluation, db
from app.services.evaluation_service import EvaluationService
import uuid

@bp.route('/evaluations', methods=['GET'])
def get_evaluations():
    """获取评测列表"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        evaluations = Evaluation.query.filter_by(user_id=user_id).all()
        return jsonify({
            'success': True,
            'data': [{
                'id': eval.id,
                'uuid': eval.uuid,
                'title': eval.title,
                'description': eval.description,
                'status': eval.status,
                'created_at': eval.created_at.isoformat(),
                'updated_at': eval.updated_at.isoformat()
            } for eval in evaluations]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/evaluations', methods=['POST'])
def create_evaluation():
    """创建新的评测任务"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        data = request.get_json(silent=True) or request.form
        
        # 验证必填字段
        if not data.get('title'):
            return jsonify({
                'success': False,
                'error': '标题不能为空'
            }), 400
        
        # 创建评测任务
        evaluation = Evaluation(
            uuid=str(uuid.uuid4()),
            title=data['title'],
            description=data.get('description', ''),
            user_id=user_id
        )
        
        db.session.add(evaluation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': evaluation.id,
                'uuid': evaluation.uuid,
                'title': evaluation.title,
                'status': evaluation.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/evaluations/<int:eval_id>', methods=['GET'])
def get_evaluation(eval_id):
    """获取单个评测任务详情"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        evaluation = Evaluation.query.filter_by(id=eval_id, user_id=user_id).first()
        if not evaluation:
            return jsonify({'success': False, 'error': '评测不存在'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'id': evaluation.id,
                'uuid': evaluation.uuid,
                'title': evaluation.title,
                'description': evaluation.description,
                'status': evaluation.status,
                'created_at': evaluation.created_at.isoformat(),
                'updated_at': evaluation.updated_at.isoformat(),
                'evidences_count': evaluation.evidences.count(),
                'reports_count': evaluation.reports.count()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/evaluations/<int:eval_id>/process', methods=['POST'])
def process_evaluation(eval_id):
    """开始处理评测任务"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        evaluation = Evaluation.query.filter_by(id=eval_id, user_id=user_id).first()
        if not evaluation:
            return jsonify({'success': False, 'error': '评测不存在'}), 404
        
        if evaluation.status != 'pending':
            return jsonify({
                'success': False,
                'error': '只能处理待处理状态的评测任务'
            }), 400
        
        # 调用评测服务
        service = EvaluationService()
        result = service.process_evaluation(evaluation)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
