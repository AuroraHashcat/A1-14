"""
密码学评测系统应用包
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
import os

# 初始化扩展
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    """
    应用工厂函数
    """
    import os
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../web/templates')
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../web/static')
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config.from_object(config_class)
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    
    # 注册蓝图
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    from web.routes import bp as web_bp
    app.register_blueprint(web_bp)
    
    # 创建必要的目录
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs('./logs', exist_ok=True)
    
    return app

# 导入模型（避免循环导入）
from app import models
