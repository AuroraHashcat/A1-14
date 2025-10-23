#!/usr/bin/env python3
"""
数据库初始化脚本
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app import create_app, db
from app.models import User, Evaluation, Evidence, Report, KnowledgeItem, Query, System, SystemPreparation
from app.services.system_service import ensure_default_system_for_user
from werkzeug.security import generate_password_hash
import uuid

def init_database():
    """初始化数据库"""
    app = create_app()
    
    with app.app_context():
        print("🗄️  正在初始化数据库...")
        
        # 删除所有表（如果存在）
        db.drop_all()
        print("✅ 已清除旧数据")
        
        # 创建所有表
        db.create_all()
        print("✅ 已创建数据表")

        ensure_default_system_for_user(None)
        print("✅ 已确保平台默认测评系统存在")
        
        # 创建默认用户
        user_ids = create_default_users()

        for user_id in user_ids:
            ensure_default_system_for_user(user_id)
        print("✅ 已为默认用户创建专属默认测评系统")
        
        # 创建示例数据
        create_sample_data()
        
        print("🎉 数据库初始化完成！")

def create_default_users():
    """创建默认用户"""
    print("👤 正在创建默认用户...")
    
    # 管理员用户
    admin_user = User(
        username='admin',
        email='admin@crypto-eval.com',
        password_hash=generate_password_hash('admin123'),
        is_active=True
    )
    
    # 测试用户
    test_user = User(
        username='test',
        email='test@crypto-eval.com',
        password_hash=generate_password_hash('test123'),
        is_active=True
    )
    
    demo_user = User(
        username='demo_user',
        email='demo@crypto-eval.com',
        password_hash=generate_password_hash('Demo@123'),
        is_active=True
    )

    db.session.add(admin_user)
    db.session.add(test_user)
    db.session.add(demo_user)
    db.session.commit()
    
    print("✅ 已创建默认用户:")
    print("   - admin/admin123 (管理员)")
    print("   - test/test123 (测试用户)")
    print("   - demo_user/Demo@123 (示范账号)")

    return [admin_user.id, test_user.id, demo_user.id]

def create_sample_data():
    """创建示例数据"""
    print("📋 正在创建示例数据...")
    
    # 获取用户
    admin_user = User.query.filter_by(username='admin').first()
    
    # 创建示例评测任务
    evaluation1 = Evaluation(
        uuid=str(uuid.uuid4()),
        title='SM4对称密码算法实现评测',
        description='对某公司开发的SM4密码算法实现进行安全性和性能评测',
        status='completed',
        user_id=admin_user.id
    )
    
    evaluation2 = Evaluation(
        uuid=str(uuid.uuid4()),
        title='RSA数字签名算法合规性检测',
        description='验证RSA数字签名算法实现是否符合GMT标准要求',
        status='processing',
        user_id=admin_user.id
    )
    
    evaluation3 = Evaluation(
        uuid=str(uuid.uuid4()),
        title='椭圆曲线密码算法性能测试',
        description='对ECC算法的计算性能和安全强度进行全面评测',
        status='pending',
        user_id=admin_user.id
    )
    
    db.session.add_all([evaluation1, evaluation2, evaluation3])
    db.session.commit()
    
    # 创建示例报告
    report1 = Report(
        uuid=str(uuid.uuid4()),
        title='SM4算法实现评测报告',
        content='''# SM4对称密码算法实现评测报告

## 执行摘要
本报告对某公司开发的SM4密码算法实现进行了全面的安全性和性能评测。经过测试，该实现基本符合GM/T 0002-2012标准要求。

## 测试环境
- 测试平台：Windows 10 x64
- 处理器：Intel Core i7-8700K
- 内存：16GB DDR4
- 测试工具：自研评测系统

## 技术分析
### 算法正确性
✅ 加密/解密功能正确
✅ 密钥扩展算法符合标准
✅ 轮函数实现正确

### 性能分析
- 加密速度：245.6 MB/s
- 解密速度：238.2 MB/s
- 密钥生成时间：< 1ms

## 安全评估
### 侧信道攻击防护
⚠️ 建议增强时序攻击防护
✅ 功耗分析防护良好

### 随机数生成
✅ 使用符合标准的随机数生成器
✅ 熵源质量良好

## 符合性评估
✅ 符合GM/T 0002-2012标准
✅ 通过所有标准测试向量
⚠️ 部分实现细节需要优化

## 建议和结论
1. 建议加强时序攻击防护机制
2. 优化密钥调度算法的实现效率
3. 增加更完善的错误处理机制

总体评价：该SM4算法实现质量良好，建议在完善上述问题后投入使用。
''',
        summary='SM4算法实现基本符合GMT标准要求，性能表现良好，但需要在侧信道攻击防护方面进行优化。',
        status='approved',
        score=85.5,
        evaluation_id=evaluation1.id,
        recommendations=[
            '加强时序攻击防护',
            '优化密钥调度算法',
            '完善错误处理机制'
        ]
    )
    
    db.session.add(report1)
    
    # 创建示例知识库条目
    knowledge_items = [
        KnowledgeItem(
            title='SM4对称密码算法',
            content='SM4是中华人民共和国政府采用的一种分组密码标准，由国家密码管理局于2012年3月21日发布。SM4算法是一种分组长度为128位的分组密码算法，密钥长度为128位。',
            source='GMT 0002-2012',
            category='对称密码',
            tags=['SM4', '分组密码', '国密算法']
        ),
        
        KnowledgeItem(
            title='数字签名算法原理',
            content='数字签名是一种用于验证数字信息真实性的密码学技术。它能够确保信息的完整性、认证发送者身份，并提供不可否认性。',
            source='GMT 0003-2012',
            category='数字签名',
            tags=['数字签名', '身份认证', '不可否认']
        ),
        
        KnowledgeItem(
            title='密钥管理系统要求',
            content='密钥管理系统应当具备密钥生成、分发、存储、使用、归档和销毁的完整生命周期管理能力，确保密钥在各个阶段的安全性。',
            source='GMT 0006-2012',
            category='密钥管理',
            tags=['密钥管理', '生命周期', '安全要求']
        )
    ]
    
    db.session.add_all(knowledge_items)
    
    # 创建示例查询记录
    queries = [
        Query(
            question='SM4算法的分组长度是多少？',
            answer='SM4算法的分组长度为128位（16字节）。',
            user_id=admin_user.id
        ),
        
        Query(
            question='数字签名的主要作用是什么？',
            answer='数字签名的主要作用包括：1. 验证信息完整性；2. 认证发送者身份；3. 提供不可否认性。',
            user_id=admin_user.id
        )
    ]
    
    db.session.add_all(queries)
    db.session.commit()
    
    print("✅ 已创建示例数据:")
    print(f"   - {len([evaluation1, evaluation2, evaluation3])} 个评测任务")
    print(f"   - {len([report1])} 个评测报告")
    print(f"   - {len(knowledge_items)} 个知识库条目")
    print(f"   - {len(queries)} 个查询记录")

if __name__ == '__main__':
    init_database()
