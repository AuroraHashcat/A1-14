#!/usr/bin/env python3
"""
密码学评测系统主启动文件
"""

import os
from dotenv import load_dotenv
from app import create_app

# 加载环境变量
load_dotenv()

# 创建Flask应用实例
app = create_app()

if __name__ == '__main__':
    # 获取配置
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 启动密码学评测系统...")
    print(f"🌐 访问地址: http://{host}:{port}")
    print(f"🔧 调试模式: {'开启' if debug else '关闭'}")
    
    # 启动应用
    app.run(
        host=host,
        port=port,
        debug=debug
    )
