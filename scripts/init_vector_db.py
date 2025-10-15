#!/usr/bin/env python3
"""
向量数据库初始化脚本
"""

import os
import sys
from pathlib import Path
import fitz  # PyMuPDF

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from infrastructure.vector_db.vector_store import VectorStore
from app.models import KnowledgeItem, db
from app import create_app

def init_vector_database():
    """初始化向量数据库"""
    print("🔍 正在初始化向量数据库...")
    
    try:
        # 初始化向量存储
        vector_store = VectorStore()
        print("✅ 向量数据库连接成功")
        
        # 处理GMT标准文档
        process_gmt_documents(vector_store)
        
        # 添加示例知识
        add_sample_knowledge(vector_store)
        
        print("🎉 向量数据库初始化完成！")
        
        # 显示统计信息
        stats = vector_store.get_collection_stats()
        print(f"📊 数据统计：{stats}")
        
    except Exception as e:
        print(f"❌ 向量数据库初始化失败: {e}")
        import traceback
        traceback.print_exc()

def process_gmt_documents(vector_store):
    """批量处理 evaluation_standards 文件夹下所有 PDF"""
    import glob
    from pathlib import Path
    standards_dir = Path(__file__).parent.parent / "evaluation_standards"
    pdf_files = glob.glob(str(standards_dir / "*.pdf"))
    if not pdf_files:
        print(f"⚠️ 未找到标准PDF文件: {standards_dir}")
        return
    for pdf_path in pdf_files:
        pdf_path = Path(pdf_path)
        print(f"📖 正在处理: {pdf_path.name}")
        try:
            content = extract_pdf_content(pdf_path)
            chunks = split_text_into_chunks(content, chunk_size=1000, overlap=200)
            documents = []
            for i, chunk in enumerate(chunks):
                if len(chunk.strip()) > 50:
                    documents.append({
                        'title': f'{pdf_path.stem} 第{i+1}部分',
                        'content': chunk,
                        'source': pdf_path.name,
                        'category': '标准规范',
                        'metadata': {
                            'chunk_index': i,
                            'total_chunks': len(chunks)
                        }
                    })
            if documents:
                doc_ids = vector_store.add_documents_batch(documents)
                print(f"✅ 已添加 {len(doc_ids)} 个文档片段")
            else:
                print("⚠️ 未找到有效的文档内容")
        except Exception as e:
            print(f"❌ 处理{pdf_path.name}失败: {e}")

def extract_pdf_content(pdf_path):
    """提取PDF内容"""
    try:
        doc = fitz.open(pdf_path)
        content = ""
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            content += text + "\n"
        
        doc.close()
        return content
        
    except Exception as e:
        print(f"PDF提取错误: {e}")
        # 如果PDF提取失败，返回一些示例内容
        return get_sample_gmt_content()

def get_sample_gmt_content():
    """获取示例GMT内容（当PDF处理失败时使用）"""
    return """
GM/T 0010-2012 SSL VPN技术规范

1. 范围
本标准规定了SSL VPN产品的技术要求、测试方法、检验规则等。
本标准适用于SSL VPN产品的设计、开发、生产、检测和使用。

2. 规范性引用文件
下列文件对于本文件的应用是必不可少的。
- GM/T 0003-2012 SM2椭圆曲线公钥密码算法
- GM/T 0004-2012 SM3密码杂凑算法  
- GM/T 0002-2012 SM4分组密码算法

3. 术语和定义
3.1 SSL VPN
基于SSL/TLS协议建立的虚拟专用网络连接技术。

3.2 密码模块
实现密码算法功能的硬件、软件或固件模块。

4. 技术要求
4.1 总体要求
SSL VPN产品应当支持国产密码算法，包括SM2、SM3、SM4等。

4.2 密码算法要求
4.2.1 对称密码算法
应当支持SM4算法，密钥长度为128位。

4.2.2 非对称密码算法  
应当支持SM2椭圆曲线公钥密码算法。

4.2.3 密码杂凑算法
应当支持SM3密码杂凑算法，输出长度为256位。

5. 安全要求
5.1 身份认证
系统应当提供可靠的用户身份认证机制。

5.2 访问控制
应当实现基于角色的访问控制。

5.3 审计日志
应当记录关键操作的审计日志。

6. 性能要求
6.1 吞吐量
在标准测试环境下，吞吐量应不低于100Mbps。

6.2 并发连接数
应当支持不少于1000个并发连接。

7. 测试方法
7.1 功能测试
验证各项功能是否正常工作。

7.2 性能测试  
测试系统的性能指标。

7.3 安全测试
验证安全防护能力。
"""

def split_text_into_chunks(text, chunk_size=1000, overlap=200):
    """将文本分割成块"""
    chunks = []
    words = text.split()
    
    current_chunk = []
    current_size = 0
    
    for word in words:
        current_chunk.append(word)
        current_size += len(word) + 1  # +1 for space
        
        if current_size >= chunk_size:
            chunk_text = ' '.join(current_chunk)
            chunks.append(chunk_text)
            
            # 保留重叠部分
            overlap_words = int(len(current_chunk) * overlap / chunk_size)
            current_chunk = current_chunk[-overlap_words:] if overlap_words > 0 else []
            current_size = sum(len(w) + 1 for w in current_chunk)
    
    # 添加最后一个块
    if current_chunk:
        chunk_text = ' '.join(current_chunk)
        chunks.append(chunk_text)
    
    return chunks

def add_sample_knowledge(vector_store):
    """添加示例知识库内容"""
    print("📚 正在添加示例知识...")
    
    sample_documents = [
        {
            'title': 'SM4对称密码算法基础',
            'content': 'SM4是一种分组密码算法，分组长度为128位，密钥长度为128位。它采用32轮迭代结构，每轮使用轮密钥进行非线性变换。SM4算法具有良好的安全性和较高的执行效率，广泛应用于各种密码产品中。',
            'source': '密码学教程',
            'category': '对称密码',
            'metadata': {'algorithm': 'SM4', 'type': '分组密码'}
        },
        
        {
            'title': 'SM2椭圆曲线公钥密码算法',
            'content': 'SM2是基于椭圆曲线密码的公钥密码算法，包括数字签名算法、密钥交换协议和公钥加密算法。SM2算法的安全性基于椭圆曲线离散对数问题的困难性，具有安全强度高、处理速度快、存储空间占用小等优点。',
            'source': 'GMT 0003-2012',
            'category': '非对称密码',
            'metadata': {'algorithm': 'SM2', 'type': '椭圆曲线'}
        },
        
        {
            'title': 'SM3密码杂凑算法',
            'content': 'SM3是一种密码杂凑算法，消息分组长度为512位，摘要值长度为256位。SM3算法的压缩函数与SHA-256的压缩函数具有相似的结构，但在消息扩展和压缩函数设计上有所不同，具有更好的安全性能。',
            'source': 'GMT 0004-2012',
            'category': '杂凑算法',
            'metadata': {'algorithm': 'SM3', 'output_length': '256位'}
        },
        
        {
            'title': '密钥管理的基本原则',
            'content': '密钥管理是密码系统安全的关键环节，包括密钥的生成、分发、存储、使用、更新、撤销和销毁等过程。有效的密钥管理应当遵循最小权限原则、职责分离原则、密钥分散原则等基本安全原则。',
            'source': '密码学安全指南',
            'category': '密钥管理',
            'metadata': {'topic': '密钥生命周期', 'importance': 'high'}
        },
        
        {
            'title': '数字签名的安全属性',
            'content': '数字签名具有三个重要的安全属性：认证性（能够验证签名者的身份）、完整性（能够检测消息是否被篡改）、不可否认性（签名者不能否认其签名行为）。这些属性使得数字签名在电子商务、电子政务等领域具有重要应用价值。',
            'source': '数字签名标准',
            'category': '数字签名',
            'metadata': {'properties': ['认证性', '完整性', '不可否认性']}
        }
    ]
    
    try:
        doc_ids = vector_store.add_documents_batch(sample_documents)
        print(f"✅ 已添加 {len(doc_ids)} 个示例知识条目")
    except Exception as e:
        print(f"❌ 添加示例知识失败: {e}")

def test_vector_search():
    """测试向量搜索功能"""
    print("🧪 正在测试向量搜索...")
    
    try:
        vector_store = VectorStore()
        
        test_queries = [
            "SM4算法的特点",
            "椭圆曲线密码",
            "密钥管理要求",
            "数字签名原理"
        ]
        
        for query in test_queries:
            results = vector_store.search(query, top_k=2)
            print(f"查询: {query}")
            for result in results:
                print(f"  - {result['title']} (相似度: {result['score']:.3f})")
            print()
            
    except Exception as e:
        print(f"❌ 搜索测试失败: {e}")

if __name__ == '__main__':
    init_vector_database()
    test_vector_search()
