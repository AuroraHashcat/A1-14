"""
证据文件相关API
"""

from flask import request, jsonify, current_app, session
from werkzeug.utils import secure_filename
from app.api import bp
from app.models import Evidence, Evaluation, System, db
from app.services.evidence_service import EvidenceService
from pathlib import Path
import os
import uuid

def _get_user_id():
    user_id = session.get('user_id')
    if not user_id:
        return None
    try:
        return int(user_id)
    except (TypeError, ValueError):  # pragma: no cover - 容错处理
        return None


def _ensure_system_access(system_id: str, user_id: int):
    system = System.query.filter_by(id=system_id).first()
    if not system:
        return None
    if system.owner_id and system.owner_id != user_id:
        return None
    return system


def _persist_evidence(file, system_id: str, evaluation_id: int | None = None):
    original_filename = secure_filename(file.filename)
    filename = f"{uuid.uuid4()}_{original_filename}"

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    file_size = os.path.getsize(file_path)
    file_type = file.content_type or 'unknown'

    evidence = Evidence(
        filename=filename,
        original_filename=original_filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        evaluation_id=evaluation_id,
        system_id=system_id
    )

    db.session.add(evidence)
    db.session.commit()

    EvidenceService().extract_content_async(evidence.id)

    return evidence


def _validate_upload_request():
    if 'file' not in request.files:
        return None, jsonify({'success': False, 'error': '未找到上传文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return None, jsonify({'success': False, 'error': '未选择文件'}), 400

    return file, None, None


@bp.route('/systems/<string:system_id>/evidences', methods=['POST'])
def upload_system_evidence(system_id):
    """上传某个系统下的证据文件"""
    user_id = _get_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    system = _ensure_system_access(system_id, user_id)
    if not system:
        return jsonify({'success': False, 'error': '系统不存在或无权访问'}), 404

    file, error_response, status = _validate_upload_request()
    if error_response:
        return error_response, status

    try:
        evidence = _persist_evidence(file, system_id)
    except Exception as exc:  # pragma: no cover - commit failures handled uniformly
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500

    return jsonify({
        'success': True,
        'data': {
            'id': evidence.id,
            'filename': evidence.original_filename,
            'file_type': evidence.file_type,
            'file_size': evidence.file_size
        }
    }), 201


@bp.route('/evaluations/<int:eval_id>/evidences', methods=['POST'])
def upload_evidence(eval_id):
    """兼容旧接口：在评测任务下上传证据文件"""
    user_id = _get_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    evaluation = Evaluation.query.filter_by(id=eval_id, user_id=user_id).first()
    if not evaluation:
        return jsonify({'success': False, 'error': '评测不存在'}), 404

    if not evaluation.system_id:
        return jsonify({'success': False, 'error': '评测未关联具体系统，无法上传证据'}), 400

    file, error_response, status = _validate_upload_request()
    if error_response:
        return error_response, status

    try:
        evidence = _persist_evidence(file, evaluation.system_id, evaluation.id)
    except Exception as exc:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500

    return jsonify({
        'success': True,
        'data': {
            'id': evidence.id,
            'filename': evidence.original_filename,
            'file_type': evidence.file_type,
            'file_size': evidence.file_size
        }
    }), 201

def _serialize_evidence(evidence: Evidence):
    return {
        'id': evidence.id,
        'filename': evidence.original_filename,
        'file_type': evidence.file_type,
        'file_size': evidence.file_size,
        'has_extracted_text': bool(evidence.extracted_text),
        'created_at': evidence.created_at.isoformat()
    }


@bp.route('/systems/<string:system_id>/evidences', methods=['GET'])
def get_system_evidences(system_id):
    """获取某个系统的全部证据文件"""
    user_id = _get_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    system = _ensure_system_access(system_id, user_id)
    if not system:
        return jsonify({'success': False, 'error': '系统不存在或无权访问'}), 404

    evidences = Evidence.query.filter_by(system_id=system_id).order_by(Evidence.created_at.desc()).all()

    return jsonify({'success': True, 'data': [_serialize_evidence(item) for item in evidences]})


@bp.route('/evaluations/<int:eval_id>/evidences', methods=['GET'])
def get_evidences(eval_id):
    """兼容旧接口：获取评测任务的所有证据文件"""
    user_id = _get_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    evaluation = Evaluation.query.filter_by(id=eval_id, user_id=user_id).first()
    if not evaluation:
        return jsonify({'success': False, 'error': '评测不存在'}), 404

    evidences = evaluation.evidences.order_by(Evidence.created_at.desc()).all()
    return jsonify({'success': True, 'data': [_serialize_evidence(item) for item in evidences]})

@bp.route('/evidences/<int:evidence_id>', methods=['GET'])
def get_evidence(evidence_id):
    """获取单个证据文件详情"""
    try:
        user_id = _get_user_id()
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        evidence = Evidence.query.get_or_404(evidence_id)

        system_accessible = False
        if evidence.system_id:
            system_accessible = _ensure_system_access(evidence.system_id, user_id) is not None

        evaluation_accessible = bool(evidence.evaluation and evidence.evaluation.user_id == user_id)

        if not (system_accessible or evaluation_accessible):
            return jsonify({'success': False, 'error': '无权访问该证据'}), 403
        
        return jsonify({
            'success': True,
            'data': {
                'id': evidence.id,
                'filename': evidence.original_filename,
                'file_type': evidence.file_type,
                'file_size': evidence.file_size,
                'has_extracted_text': bool(evidence.extracted_text),
                'extracted_text': evidence.extracted_text,
                'summary': evidence.key_summary,
                'metadata': evidence.evidence_metadata,
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
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        evidence = Evidence.query.get_or_404(evidence_id)
        if evidence.evaluation and evidence.evaluation.user_id != user_id:
            return jsonify({'success': False, 'error': '无权访问该证据'}), 403
        if evidence.system and evidence.system.owner_id and evidence.system.owner_id != user_id:
            return jsonify({'success': False, 'error': '无权访问该证据'}), 403
        
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


@bp.route('/evidences/<int:evidence_id>', methods=['DELETE'])
def delete_evidence(evidence_id):
    """删除指定证据文件及其解析结果。"""
    user_id = _get_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    evidence = Evidence.query.get_or_404(evidence_id)

    system_accessible = False
    if evidence.system_id:
        system_accessible = _ensure_system_access(evidence.system_id, user_id) is not None

    evaluation_accessible = bool(evidence.evaluation and evidence.evaluation.user_id == user_id)

    if not (system_accessible or evaluation_accessible):
        return jsonify({'success': False, 'error': '无权访问该证据'}), 403

    file_path = Path(evidence.file_path)
    extraction_path = file_path.with_suffix('.extraction.json')

    try:
        if file_path.exists():
            file_path.unlink()
        if extraction_path.exists():
            extraction_path.unlink()

        db.session.delete(evidence)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500

    return jsonify({'success': True, 'data': {'id': evidence_id}})
