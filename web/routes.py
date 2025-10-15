"""
Web路由
"""

from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash
from app.models import Evaluation, Evidence, Report, User
from app.models import db
import os
from app.services.evaluation_service import EvaluationService
import fitz

bp = Blueprint('web', __name__)

@bp.route('/')
def index():
    """首页"""
    return render_template('index.html')

@bp.route('/evaluations')
def evaluations():
    """评测任务列表页面"""
    evaluations = Evaluation.query.order_by(Evaluation.created_at.desc()).all()
    return render_template('evaluations.html', evaluations=evaluations)

@bp.route('/evaluations/<int:eval_id>')
def evaluation_detail(eval_id):
    """评测任务详情页面"""
    evaluation = Evaluation.query.get_or_404(eval_id)
    evidences = evaluation.evidences.all()
    reports = evaluation.reports.all()
    
    return render_template('evaluation_detail.html', 
                         evaluation=evaluation, 
                         evidences=evidences, 
                         reports=reports)

@bp.route('/knowledge')
def knowledge():
    """知识库查询页面"""
    return render_template('knowledge.html')

@bp.route('/reports')
def reports():
    """报告列表页面"""
    reports = Report.query.order_by(Report.created_at.desc()).all()
    return render_template('reports.html', reports=reports)

@bp.route('/reports/<int:report_id>')
def report_detail(report_id):
    """报告详情页面"""
    report = Report.query.get_or_404(report_id)
    return render_template('report_detail.html', report=report)

@bp.route('/upload', methods=['GET', 'POST'])
def upload():
    """文件上传页面，支持多证据测评"""
    result = None
    if request.method == 'POST':
        files = request.files.getlist('files')
        if files and any(f.filename for f in files):
            # 获取当前用户id，未登录则用1（游客）
            user_id = session.get('user_id') or 1
            # 创建评测任务
            evaluation = Evaluation(title='批量证据测评', description='自动上传测评', user_id=user_id)
            db.session.add(evaluation)
            db.session.commit()
            evidence_count = 0
            for file in files:
                if not file.filename:
                    continue
                save_path = os.path.join(bp.root_path, '../data/uploads', file.filename)
                file.save(save_path)
                content = ''
                if file.filename.lower().endswith('.pdf'):
                    try:
                        doc = fitz.open(save_path)
                        for page_num in range(len(doc)):
                            page = doc.load_page(page_num)
                            content += page.get_text() + '\n'
                        doc.close()
                    except Exception as e:
                        content = f'PDF解析失败: {e}'
                else:
                    try:
                        content = file.read().decode('utf-8', errors='ignore')
                    except Exception as e:
                        content = f'文件解析失败: {e}'
                evidence = Evidence(
                    filename=file.filename,
                    original_filename=file.filename,
                    file_path=save_path,
                    file_type=file.filename.split('.')[-1],
                    file_size=os.path.getsize(save_path),
                    extracted_text=content,
                    evidence_metadata={},
                    evaluation_id=evaluation.id
                )
                db.session.add(evidence)
                evidence_count += 1
            db.session.commit()
            # 自动调用测评服务
            service = EvaluationService()
            try:
                eval_result = service.process_evaluation(evaluation)
                result = f"测评完成，已上传{evidence_count}个证据，报告ID: {eval_result['report_id']}"
            except Exception as e:
                result = f"测评失败: {e}"
        else:
            result = "未选择文件"
    return render_template('upload.html', result=result)

@bp.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            flash('登录成功')
            return redirect(url_for('web.admin'))
        else:
            error = '用户名或密码错误'
    return render_template('login.html', error=error)

@bp.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        if User.query.filter_by(username=username).first():
            error = '用户名已存在'
        elif User.query.filter_by(email=email).first():
            error = '邮箱已注册'
        else:
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            flash('注册成功，请登录')
            return redirect(url_for('web.login'))
    return render_template('register.html', error=error)

@bp.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('已退出登录')
    return redirect(url_for('web.login'))

# 管理后台只允许登录用户访问
@bp.route('/admin')
def admin():
    user_id = session.get('user_id')
    if not user_id:
        flash('请先登录')
        return redirect(url_for('web.login'))
    stats = {
        'total_evaluations': Evaluation.query.count(),
        'total_evidences': Evidence.query.count(),
        'total_reports': Report.query.count(),
        'pending_evaluations': Evaluation.query.filter_by(status='pending').count()
    }
    return render_template('admin.html', stats=stats)
