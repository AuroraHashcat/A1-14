#!/usr/bin/env python3
"""
快速启动脚本
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("❌ 需要Python 3.8或更高版本")
        sys.exit(1)
    print(f"✅ Python版本: {sys.version}")

def check_dependencies():
    """检查依赖是否安装"""
    print("🔍 检查依赖包...")
    
    try:
        import flask
        print("✅ Flask已安装")
    except ImportError:
        print("❌ Flask未安装，请运行: pip install -r requirements.txt")
        return False
    
    try:
        import chromadb
        print("✅ ChromaDB已安装")
    except ImportError:
        print("⚠️ ChromaDB未安装，向量数据库功能将不可用")
    
    try:
        import sentence_transformers
        print("✅ SentenceTransformers已安装")
    except ImportError:
        print("⚠️ SentenceTransformers未安装，向量化功能将不可用")
    
    return True

def setup_environment():
    """设置环境"""
    print("🔧 设置环境...")
    
    # 检查.env文件
    env_file = Path('.env')
    if not env_file.exists():
        env_example = Path('.env.example')
        if env_example.exists():
            print("📋 复制环境配置文件...")
            with open(env_example, 'r', encoding='utf-8') as f:
                content = f.read()
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print("✅ 已创建.env文件，请编辑配置API密钥")
        else:
            print("⚠️ 未找到.env.example文件")
    
    # 创建必要的目录
    directories = [
        'data/uploads',
        'data/chroma_db', 
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
    
    print("✅ 环境设置完成")

def init_database():
    """初始化数据库"""
    print("🗄️ 初始化数据库...")
    
    try:
        subprocess.run([sys.executable, 'scripts/init_db.py'], check=True)
        print("✅ 数据库初始化完成")
    except subprocess.CalledProcessError as e:
        print(f"❌ 数据库初始化失败: {e}")
        return False
    except FileNotFoundError:
        print("❌ 找不到初始化脚本")
        return False
    
    return True

def init_vector_db():
    """初始化向量数据库"""
    print("🔍 初始化向量数据库...")
    
    try:
        subprocess.run([sys.executable, 'scripts/init_vector_db.py'], check=True)
        print("✅ 向量数据库初始化完成")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ 向量数据库初始化失败: {e}")
        print("   系统仍可正常运行，但知识库功能可能受限")
    except FileNotFoundError:
        print("⚠️ 找不到向量数据库初始化脚本")

def start_application():
    """启动应用"""
    print("🚀 启动应用...")
    
    try:
        subprocess.run([sys.executable, 'run.py'], check=True)
    except KeyboardInterrupt:
        print("\n👋 应用已停止")
    except subprocess.CalledProcessError as e:
        print(f"❌ 应用启动失败: {e}")

def main():
    """主函数"""
    print("🎯 密码学评测系统启动程序")
    print("=" * 50)
    
    # 检查Python版本
    check_python_version()
    
    # 检查依赖
    if not check_dependencies():
        print("\n❌ 依赖检查失败，请先安装依赖:")
        print("pip install -r requirements.txt")
        return
    
    # 设置环境
    setup_environment()
    
    # 询问是否需要初始化
    print("\n🤔 是否需要初始化数据库？")
    print("1. 是，进行完整初始化（推荐首次运行）")
    print("2. 否，直接启动应用")
    
    choice = input("请选择 (1/2): ").strip()
    
    if choice == '1':
        # 初始化数据库
        if not init_database():
            print("❌ 数据库初始化失败，无法继续")
            return
        
        # 初始化向量数据库
        init_vector_db()
    
    # 启动应用
    start_application()

if __name__ == '__main__':
    main()
