"""报告相关API"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from flask import jsonify, request, session, send_file

from app.api import bp
from app.models import Evidence, Evaluation, Report, System
from app.services.preparation_service import get_system_preparation
from app.services.evaluation_service import EvaluationService
from app.models import Evaluation, db
from app.services.export_service import build_report_docx


def _get_user_id() -> int | None:
    user_id = session.get('user_id')
    if user_id is None:
        return None
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def _ensure_system_access(system_id: str, user_id: int | None) -> System | None:
    system = System.query.filter_by(id=system_id).first()
    if not system:
        return None
    if system.owner_id and system.owner_id != user_id:
        return None
    return system


@bp.route('/reports', methods=['GET'])
def get_reports():
    """获取报告列表"""
    try:
        user_id = _get_user_id()
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        reports = Report.query.join(Evaluation).filter(Evaluation.user_id == user_id).order_by(Report.created_at.desc()).all()

        return jsonify({
            'success': True,
            'data': [{
                'id': report.id,
                'uuid': report.uuid,
                'title': report.title,
                'status': report.status,
                'score': report.score,
                'summary': report.summary,
                'created_at': report.created_at.isoformat(),
                'evaluation': {
                    'id': report.evaluation.id,
                    'title': report.evaluation.title,
                    'status': report.evaluation.status
                }
            } for report in reports]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/reports/<int:report_id>', methods=['GET'])
def get_report(report_id: int):
    """获取报告详情"""
    try:
        user_id = _get_user_id()
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        report = Report.query.get_or_404(report_id)
        if report.evaluation.user_id != user_id:
            return jsonify({'success': False, 'error': '无权访问该报告'}), 403

        evaluation = report.evaluation

        return jsonify({
            'success': True,
            'data': {
                'id': report.id,
                'uuid': report.uuid,
                'title': report.title,
                'status': report.status,
                'score': report.score,
                'summary': report.summary,
                'content': report.content,
                'recommendations': report.recommendations or [],
                'created_at': report.created_at.isoformat(),
                'updated_at': report.updated_at.isoformat(),
                'evaluation': {
                    'id': evaluation.id,
                    'uuid': evaluation.uuid,
                    'title': evaluation.title,
                    'description': evaluation.description,
                    'status': evaluation.status,
                    'created_at': evaluation.created_at.isoformat(),
                    'updated_at': evaluation.updated_at.isoformat()
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/reports/<int:report_id>/export', methods=['GET'])
def export_report(report_id: int):
    """导出指定报告为 Word 文档。"""
    try:
        user_id = _get_user_id()
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        report = Report.query.get_or_404(report_id)
        if not report.evaluation or report.evaluation.user_id != user_id:
            return jsonify({'success': False, 'error': '无权导出该报告'}), 403

        buffer, filename = build_report_docx(report)
        return send_file(
            buffer,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=filename,
        )

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def _serialize_evidence_for_report(evidence: Evidence) -> Dict[str, Any]:
    return {
        'id': evidence.id,
        'filename': evidence.original_filename,
        'fileType': evidence.file_type,
        'uploadedAt': evidence.created_at.isoformat() if evidence.created_at else None,
        'metadata': evidence.evidence_metadata,
        'rawText': evidence.extracted_text,
        'summary': evidence.key_summary,
    }


@bp.route('/systems/<string:system_id>/reports/generate', methods=['POST'])
def generate_system_report(system_id: str):
    """结合测评准备与证据解析结果生成报告。"""

    user_id = _get_user_id()
    if not user_id:
        return jsonify({'success': False, 'error': '未登录'}), 401

    system = _ensure_system_access(system_id, user_id)
    if not system:
        return jsonify({'success': False, 'error': '系统不存在或无权访问'}), 404

    preparation_data = get_system_preparation(system_id)
    evidences = (
        Evidence.query.filter_by(system_id=system_id)
        .order_by(Evidence.created_at.asc())
        .all()
    )
    evidence_payload = [_serialize_evidence_for_report(item) for item in evidences]

    # Create a new Evaluation record for this generation run
    evaluation = Evaluation(
        title=f"自动评测 - {system.name} - {datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        description='由系统自动触发的报告生成',
        status='pending',
        user_id=user_id,
        system_id=system.id,
    )
    db.session.add(evaluation)
    db.session.commit()

    # Associate system evidences with this evaluation (if not already assigned)
    evidences = Evidence.query.filter_by(system_id=system_id).order_by(Evidence.created_at.asc()).all()
    for ev in evidences:
        if not ev.evaluation_id:
            ev.evaluation_id = evaluation.id
    db.session.commit()

    # Run evaluation service to process evidences and generate report
    eval_service = EvaluationService()
    # 查找该系统最新的报告，如果存在则覆盖
    latest_report = (
        Report.query.join(Evaluation)
        .filter(Evaluation.system_id == system.id)
        .order_by(Report.created_at.desc())
        .first()
    )
    overwrite_id = latest_report.id if latest_report else None
    result = eval_service.process_evaluation(evaluation, overwrite_report_id=overwrite_id)

    # Build response using the created/overwritten report and analysis
    generated_at = datetime.utcnow().isoformat() + 'Z'

    report_obj = None
    if result.get('report_id'):
        report_obj = Report.query.get(result.get('report_id'))

    response_data = {
        'systemId': system.id,
        'systemName': system.name,
        'generatedAt': generated_at,
        'reportId': result.get('report_id'),
        'score': result.get('report_score'),
        'content': None,
        'summary': None,
        'recommendations': [],
        'analysis': result.get('analysis'),
    }

    if report_obj:
        response_data.update({
            'content': report_obj.content,
            'summary': report_obj.summary,
            'recommendations': report_obj.recommendations or [],
        })

    return jsonify({'success': True, 'data': response_data})


@bp.route('/systems/<string:system_id>/reports/latest', methods=['GET'])
def get_system_latest_report(system_id: str):
    """返回指定系统的最新报告（如果存在），并做权限校验。"""
    try:
        user_id = _get_user_id()
        if not user_id:
            return jsonify({'success': False, 'error': '未登录'}), 401

        system = _ensure_system_access(system_id, user_id)
        if not system:
            return jsonify({'success': False, 'error': '系统不存在或无权访问'}), 404

        # 查询该系统下最新的报告（按创建时间）
        report = (
            Report.query.join(Evaluation)
            .filter(Evaluation.system_id == system.id)
            .order_by(Report.created_at.desc())
            .first()
        )

        if not report:
            return jsonify({'success': True, 'data': None})

        evaluation = report.evaluation

        return jsonify({
            'success': True,
            'data': {
                'id': report.id,
                'uuid': report.uuid,
                'title': report.title,
                'status': report.status,
                'score': report.score,
                'summary': report.summary,
                'content': report.content,
                'recommendations': report.recommendations or [],
                'created_at': report.created_at.isoformat(),
                'updated_at': report.updated_at.isoformat(),
                'evaluation': {
                    'id': evaluation.id,
                    'uuid': evaluation.uuid,
                    'title': evaluation.title,
                    'description': evaluation.description,
                    'status': evaluation.status,
                    'created_at': evaluation.created_at.isoformat(),
                    'updated_at': evaluation.updated_at.isoformat()
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
