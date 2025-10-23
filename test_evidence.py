"""
修正版证据服务测试 - 根据实际模型字段调整
"""

import sys
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def quick_test():
    """快速测试单个文件"""
    from app.services.evidence_service import EvidenceService
    from app.models import Evidence, db, Evaluation, System
    from app import create_app
    
    app = create_app()
    
    with app.app_context():
        service = EvidenceService()
        
        # 测试文件路径 - 修改为你的实际文件
        test_files = [
            "/home/wuchenxi/projects/A1-14/GBT+39786-2021.pdf",   
            # "/home/wuchenxi/projects/A1-14/test.pdf",    # 修改为PDF路径
        ]
        
        # 首先检查或创建一个评估记录（用于外键）
        evaluation = Evaluation.query.first()
        if not evaluation:
            print("⚠️ 没有找到评估记录，正在创建测试评估...")
            evaluation = Evaluation(
                name="测试评估",
                created_at=datetime.utcnow()
            )
            db.session.add(evaluation)
            db.session.commit()
            print(f"✅ 创建测试评估记录: ID={evaluation.id}")
        
        # 检查或创建一个系统记录（用于 system_id 外键）
        system = System.query.first()
        if not system:
            print("⚠️ 没有找到系统记录，正在创建测试系统...")
            system = System(
                name="测试系统",
                description="用于测试的默认系统",
                created_at=datetime.utcnow()
            )
            db.session.add(system)
            db.session.commit()
            print(f"✅ 创建测试系统记录: ID={system.id}")
        
        for file_path in test_files:
            if not Path(file_path).exists():
                print(f"❌ 文件不存在: {file_path}")
                continue
                
            print(f"\n🔍 测试文件: {file_path}")
            print("=" * 50)
            
            try:
                # 获取文件信息
                file_stat = Path(file_path).stat()
                file_type = "image/jpeg" if file_path.lower().endswith(('.jpg', '.jpeg', '.png')) else "application/pdf"
                
                # 创建证据记录 - 使用正确的字段名，包含 system_id
                evidence = Evidence(
                    filename=Path(file_path).name,           # 存储的文件名
                    original_filename=Path(file_path).name,  # 原始文件名
                    file_path=str(file_path),               # 文件路径
                    file_type=file_type,                    # 文件类型
                    file_size=file_stat.st_size,            # 文件大小
                    evaluation_id=evaluation.id,            # 评估外键
                    system_id=system.id                     # 系统外键 - 新增
                )
                
                db.session.add(evidence)
                db.session.commit()
                
                print(f"✅ 创建证据记录成功! ID: {evidence.id}")
                print(f"   文件名: {evidence.filename}")
                print(f"   文件类型: {evidence.file_type}")
                print(f"   文件大小: {evidence.file_size} bytes")
                print(f"   评估ID: {evidence.evaluation_id}")
                print(f"   系统ID: {evidence.system_id}")
                
                # 提取内容
                print("🔄 开始提取文件内容...")
                result = service.extract_content(evidence.id)
                
                if result['success']:
                    print("✅ 提取成功!")
                    print(f"📁 JSON文件: {result.get('output_path')}")
                    
                    # 显示JSON文件内容
                    output_path = result.get('output_path')
                    if output_path and Path(output_path).exists():
                        json_content = Path(output_path).read_text(encoding='utf-8')
                        print("📄 JSON内容预览:")
                        print(json_content[:500] + "..." if len(json_content) > 500 else json_content)
                        
                        # 检查数据库更新
                        db.session.refresh(evidence)
                        print(f"💾 数据库更新:")
                        print(f"   - 提取文本长度: {len(evidence.extracted_text or '')} 字符")
                        print(f"   - 证据元数据: {evidence.evidence_metadata}")
                else:
                    print("❌ 提取失败!")
                    print(f"错误: {result.get('error')}")
                    
            except Exception as e:
                print(f"❌ 处理失败: {e}")
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    quick_test()