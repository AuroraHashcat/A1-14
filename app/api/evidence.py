"""
证据文件相关API
"""

from flask import request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.api import bp
from app.models import Evidence, Evaluation, db
from app.services.evidence_service import EvidenceService
import os
import uuid

@bp.route('/evaluations/<int:eval_id>/evidences', methods=['POST'])
def upload_evidence(eval_id):
    """上传证据文件"""
    try:
        evaluation = Evaluation.query.get_or_404(eval_id)
        
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': '未找到上传文件'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': '未选择文件'
            }), 400
        
        if file:
            # 生成安全的文件名
            original_filename = secure_filename(file.filename)
            filename = f"{uuid.uuid4()}_{original_filename}"
            
            # 确保上传目录存在
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            
            # 保存文件
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # 获取文件信息
            file_size = os.path.getsize(file_path)
            file_type = file.content_type or 'unknown'
            
            # 创建证据记录
            evidence = Evidence(
                filename=filename,
                original_filename=original_filename,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size,
                evaluation_id=eval_id
            )
            
            db.session.add(evidence)
            db.session.commit()
            
            # 异步处理文件内容提取
            service = EvidenceService()
            service.extract_content_async(evidence.id)
            
            return jsonify({
                'success': True,
                'data': {
                    'id': evidence.id,
                    'filename': evidence.original_filename,
                    'file_type': evidence.file_type,
                    'file_size': evidence.file_size
                }
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/evaluations/<int:eval_id>/evidences', methods=['GET'])
def get_evidences(eval_id):
    """获取评测任务的所有证据文件"""
    try:
        evaluation = Evaluation.query.get_or_404(eval_id)
        evidences = evaluation.evidences.all()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': evidence.id,
                'filename': evidence.original_filename,
                'file_type': evidence.file_type,
                'file_size': evidence.file_size,
                'has_extracted_text': bool(evidence.extracted_text),
                'created_at': evidence.created_at.isoformat()
            } for evidence in evidences]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/evidences/<int:evidence_id>', methods=['GET'])
def get_evidence(evidence_id):
    """获取单个证据文件详情"""
    try:
        evidence = Evidence.query.get_or_404(evidence_id)
        
        return jsonify({
            'success': True,
            'data': {
                'id': evidence.id,
                'filename': evidence.original_filename,
                'file_type': evidence.file_type,
                'file_size': evidence.file_size,
                'extracted_text': evidence.extracted_text,
                'metadata': evidence.metadata,
                'created_at': evidence.created_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/evidences/<int:evidence_id>/extract', methods=['POST'])
def extract_evidence_content(evidence_id):
    """手动触发证据内容提取"""
    try:
        evidence = Evidence.query.get_or_404(evidence_id)
        
        service = EvidenceService()
        result = service.extract_content(evidence_id)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
