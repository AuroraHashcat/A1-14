"""
数据模型
"""

from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # 关系
    evaluations = db.relationship('Evaluation', backref='user', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Evaluation(db.Model):
    """评测任务模型"""
    __tablename__ = 'evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外键
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # 关系
    evidences = db.relationship('Evidence', backref='evaluation', lazy='dynamic', cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='evaluation', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Evaluation {self.title}>'

class Evidence(db.Model):
    """证据文件模型"""
    __tablename__ = 'evidences'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))  # image, pdf, docx, etc.
    file_size = db.Column(db.Integer)
    extracted_text = db.Column(db.Text)  # OCR或文档解析结果
    evidence_metadata = db.Column(db.JSON)  # 文件元数据（原名 metadata，避免SQLAlchemy保留字冲突）
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 外键
    evaluation_id = db.Column(db.Integer, db.ForeignKey('evaluations.id'), nullable=False)
    
    def __repr__(self):
        return f'<Evidence {self.original_filename}>'

class Report(db.Model):
    """评测报告模型"""
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)  # 报告主要内容
    summary = db.Column(db.Text)  # 报告摘要
    status = db.Column(db.String(20), default='draft')  # draft, reviewing, approved, rejected
    score = db.Column(db.Float)  # 评分
    recommendations = db.Column(db.JSON)  # 建议和改进意见
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外键
    evaluation_id = db.Column(db.Integer, db.ForeignKey('evaluations.id'), nullable=False)
    
    def __repr__(self):
        return f'<Report {self.title}>'

class KnowledgeItem(db.Model):
    """知识库条目模型"""
    __tablename__ = 'knowledge_items'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(200))  # 来源文档
    category = db.Column(db.String(100))  # 分类
    tags = db.Column(db.JSON)  # 标签
    embedding_id = db.Column(db.String(100))  # 向量数据库中的ID
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<KnowledgeItem {self.title}>'

class Query(db.Model):
    """查询记录模型"""
    __tablename__ = 'queries'
    
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text)
    context = db.Column(db.JSON)  # 检索到的相关文档
    feedback = db.Column(db.String(20))  # good, bad, neutral
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 外键（可选，匿名查询时为空）
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def __repr__(self):
        return f'<Query {self.question[:50]}...>'
