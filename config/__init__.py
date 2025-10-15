"""
应用配置文件
"""

import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """基础配置类"""
    
    # Flask基础配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///crypto_eval.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 文件上传配置
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or './data/uploads'
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    
    # DeepInfra API配置
    DEEPINFRA_API_KEY = os.environ.get('DEEPINFRA_API_KEY')
    DEEPINFRA_BASE_URL = os.environ.get('DEEPINFRA_BASE_URL') or 'https://api.deepinfra.com/v1/openai'
    MODEL_NAME = os.environ.get('MODEL_NAME') or 'microsoft/WizardLM-2-8x22B'
    
    # 向量数据库配置
    CHROMA_PERSIST_DIRECTORY = os.environ.get('CHROMA_PERSIST_DIRECTORY') or './data/chroma_db'
    EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL') or 'sentence-transformers/all-MiniLM-L6-v2'
    
    # 日志配置
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'
    LOG_FILE = os.environ.get('LOG_FILE') or './logs/app.log'

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
