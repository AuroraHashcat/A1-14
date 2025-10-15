"""
向量数据库存储
"""

import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
from config import Config
import uuid

class VectorStore:
    """向量数据库存储"""
    
    def __init__(self):
        self.persist_directory = Config.CHROMA_PERSIST_DIRECTORY
        self.embedding_model_name = Config.EMBEDDING_MODEL
        
        # 确保持久化目录存在
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # 初始化ChromaDB客户端
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        
        # 初始化嵌入模型，改为本地路径
        self.embedding_model = SentenceTransformer('data/models/all-MiniLM-L6-v2')
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name="gmt_standards",
            metadata={"description": "GMT密码学标准知识库"}
        )
    
    def add_document(self, 
                    title: str, 
                    content: str, 
                    source: str,
                    category: str = "standard",
                    metadata: Optional[Dict[str, Any]] = None) -> str:
        """添加文档到向量库"""
        try:
            # 生成嵌入向量
            embedding = self.embedding_model.encode(content).tolist()
            
            # 生成唯一ID
            doc_id = str(uuid.uuid4())
            
            # 准备元数据
            doc_metadata = {
                "title": title,
                "source": source,
                "category": category,
                "content_length": len(content)
            }
            
            if metadata:
                doc_metadata.update(metadata)
            
            # 添加到集合
            self.collection.add(
                embeddings=[embedding],
                documents=[content],
                metadatas=[doc_metadata],
                ids=[doc_id]
            )
            
            return doc_id
            
        except Exception as e:
            print(f"Error adding document: {e}")
            raise e
    
    def add_documents_batch(self, documents: List[Dict[str, Any]]) -> List[str]:
        """批量添加文档"""
        try:
            contents = [doc['content'] for doc in documents]
            embeddings = self.embedding_model.encode(contents).tolist()
            
            doc_ids = [str(uuid.uuid4()) for _ in documents]
            metadatas = []
            
            for doc in documents:
                metadata = {
                    "title": doc.get('title', ''),
                    "source": doc.get('source', ''),
                    "category": doc.get('category', 'standard'),
                    "content_length": len(doc['content'])
                }
                # 修复：将所有 list 类型的 metadata 字段转为字符串
                for k, v in doc.get('metadata', {}).items():
                    if isinstance(v, list):
                        metadata[k] = ','.join(map(str, v))
                    else:
                        metadata[k] = v
                metadatas.append(metadata)
            
            self.collection.add(
                embeddings=embeddings,
                documents=contents,
                metadatas=metadatas,
                ids=doc_ids
            )
            
            return doc_ids
            
        except Exception as e:
            print(f"Error adding documents batch: {e}")
            raise e
    
    def search(self, query: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """搜索相关文档"""
        try:
            # 生成查询嵌入向量
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # 执行搜索
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_dict
            )
            
            # 格式化结果
            formatted_results = []
            
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    result = {
                        'id': results['ids'][0][i],
                        'content': results['documents'][0][i],
                        'score': 1 - results['distances'][0][i],  # 转换为相似度分数
                        'metadata': results['metadatas'][0][i]
                    }
                    
                    # 添加元数据字段到顶层
                    result.update({
                        'title': result['metadata'].get('title', ''),
                        'source': result['metadata'].get('source', ''),
                        'category': result['metadata'].get('category', '')
                    })
                    
                    formatted_results.append(result)
            
            return formatted_results
            
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []
    
    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取文档"""
        try:
            results = self.collection.get(
                ids=[doc_id],
                include=['documents', 'metadatas']
            )
            
            if results['documents']:
                return {
                    'id': doc_id,
                    'content': results['documents'][0],
                    'metadata': results['metadatas'][0]
                }
            
            return None
            
        except Exception as e:
            print(f"Error getting document by ID: {e}")
            return None
    
    def delete_document(self, doc_id: str) -> bool:
        """删除文档"""
        try:
            self.collection.delete(ids=[doc_id])
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """获取集合统计信息"""
        try:
            count = self.collection.count()
            
            return {
                'total_documents': count,
                'collection_name': self.collection.name,
                'embedding_model': self.embedding_model_name
            }
        except Exception as e:
            print(f"Error getting collection stats: {e}")
            return {}
    
    def update_document(self, doc_id: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """更新文档"""
        try:
            # 生成新的嵌入向量
            embedding = self.embedding_model.encode(content).tolist()
            
            # 更新文档
            update_data = {
                'embeddings': [embedding],
                'documents': [content],
                'ids': [doc_id]
            }
            
            if metadata:
                update_data['metadatas'] = [metadata]
            
            self.collection.update(**update_data)
            return True
            
        except Exception as e:
            print(f"Error updating document: {e}")
            return False
