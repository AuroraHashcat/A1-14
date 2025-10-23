"""
知识库服务
"""

from app.models import KnowledgeItem, db
from infrastructure.llm.llm_client import LLMClient
from infrastructure.vector_db.vector_store import VectorStore
from typing import List, Dict, Any
import json

class KnowledgeService:
    """知识库服务"""
    
    def __init__(self):
        self.llm_client = LLMClient()
        self.vector_store = VectorStore()
    
    def query(self, question: str, top_k: int = 5) -> Dict[str, Any]:
        """知识库查询"""
        try:
            # 1. 向量检索相关文档
            search_results = self.vector_store.search(question, top_k=top_k)

            # 调试输出版：打印检索结果方便排查文档内容
            try:
                debug_payload = []
                for item in search_results:
                    debug_payload.append({
                        'id': item.get('id'),
                        'title': item.get('title'),
                        'source': item.get('source'),
                        'score': item.get('score'),
                        'content': item.get('content')
                    })
                print("[KnowledgeService] Retrieved documents:", json.dumps(debug_payload, ensure_ascii=False))
            except Exception as debug_error:  # noqa: BLE001 - 调试输出不可影响主逻辑
                print(f"[KnowledgeService] Failed to dump retrieved docs: {debug_error}")
            
            # 2. 构建上下文
            context = self._build_context(search_results)
            
            # 3. 使用大模型生成回答
            answer = self._generate_answer(question, context)
            
            # 4. 计算置信度
            confidence = self._calculate_confidence(search_results)
            
            sources_payload = []
            for result in search_results:
                snippet = self._build_snippet(result.get('content', ''))
                raw_source = result.get('source')
                source_url = (
                    raw_source
                    if isinstance(raw_source, str) and raw_source.startswith(("http://", "https://"))
                    else None
                )
                sources_payload.append({
                    'title': result.get('title') or raw_source,
                    'url': source_url,
                    'source': raw_source,
                    'score': result.get('score'),
                    'raw_score': result.get('raw_score'),
                    'snippet': snippet,
                    'content': result.get('content')
                })

            return {
                'answer': answer,
                'context': context,
                'sources': sources_payload,
                'confidence': confidence
            }
            
        except Exception as e:
            return {
                'answer': f"抱歉，查询过程中出现错误: {str(e)}",
                'context': [],
                'sources': [],
                'confidence': 0.0
            }
    
    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """知识库搜索"""
        try:
            results = self.vector_store.search(query, top_k=limit)
            formatted_results = []

            for item in results:
                formatted_results.append({
                    'id': item.get('id'),
                    'title': item.get('title', ''),
                    'snippet': self._build_snippet(item.get('content', '')),
                    'score': item.get('score'),
                    'raw_score': item.get('raw_score'),
                    'content': item.get('content', ''),
                    'source': item.get('source')
                })

            return formatted_results
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def generate_questions(self, topic: str, difficulty: str = 'medium', count: int = 5) -> List[Dict[str, Any]]:
        """生成测试题目"""
        try:
            # 检索相关知识
            relevant_docs = self.vector_store.search(topic, top_k=3)
            context = self._build_context(relevant_docs)
            
            # 构建题目生成提示词
            prompt = self._build_question_generation_prompt(topic, difficulty, count, context)
            
            # 使用大模型生成题目
            response = self.llm_client.generate(prompt)
            
            # 解析生成的题目
            questions = self._parse_questions(response)
            
            return questions
            
        except Exception as e:
            print(f"Question generation error: {e}")
            return []
    
    def _build_context(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """构建上下文信息"""
        context = []
        for result in search_results:
            context.append({
                'title': result.get('title', ''),
                'content': result.get('content', ''),
                'source': result.get('source', ''),
                'score': result.get('score', 0.0)
            })
        return context

    def _build_snippet(self, text: str, length: int = 200) -> str:
        """生成简短摘要"""
        if not text:
            return ''
        snippet = text.strip().replace('\n', ' ')
        if len(snippet) <= length:
            return snippet
        return snippet[:length].rstrip() + '...'
    
    def _generate_answer(self, question: str, context: List[Dict[str, Any]]) -> str:
        """基于上下文生成回答"""
        # 构建提示词
        context_text = "\n\n".join([
            f"文档标题: {ctx['title']}\n内容: {ctx['content'][:1000]}..."
            for ctx in context[:3]  # 只使用前3个最相关的文档
        ])
        
        prompt = f"""基于以下GMT密码学标准文档内容，回答用户问题。请确保回答准确、专业且有依据。

相关文档内容：
{context_text}

用户问题：{question}

请提供详细且准确的回答："""
        
        return self.llm_client.generate(prompt)
    
    def _calculate_confidence(self, search_results: List[Dict[str, Any]]) -> float:
        """计算回答置信度"""
        if not search_results:
            return 0.0
        
        # 基于检索结果的相似度分数计算置信度
        scores = [result.get('score', 0.0) for result in search_results]
        avg_score = sum(scores) / len(scores)

        confidence = max(0.0, min(1.0, avg_score))
        return confidence
    
    def _build_question_generation_prompt(self, topic: str, difficulty: str, count: int, context: List[Dict[str, Any]]) -> str:
        """构建题目生成提示词"""
        context_text = "\n\n".join([
            f"文档: {ctx['title']}\n内容: {ctx['content'][:800]}..."
            for ctx in context[:2]
        ])
        
        difficulty_map = {
            'easy': '基础级别，适合初学者',
            'medium': '中等难度，需要一定理论基础',
            'hard': '高级难度，需要深入理解和实践经验'
        }
        
        prompt = f"""你是一个密码学考试出题专家。基于以下GMT标准文档内容，围绕"{topic}"主题生成{count}道{difficulty_map.get(difficulty, '中等难度')}的选择题。

相关文档内容：
{context_text}

要求：
1. 题目要紧密围绕"{topic}"主题
2. 难度水平：{difficulty_map.get(difficulty, '中等')}
3. 每道题包含4个选项（A、B、C、D）
4. 提供正确答案和详细解释
5. 题目要有实际应用价值

请以以下JSON格式返回：
{{
    "questions": [
        {{
            "question": "题目内容",
            "options": {{
                "A": "选项A",
                "B": "选项B", 
                "C": "选项C",
                "D": "选项D"
            }},
            "correct_answer": "A",
            "explanation": "答案解释"
        }}
    ]
}}"""
        
        return prompt
    
    def _parse_questions(self, response: str) -> List[Dict[str, Any]]:
        """解析生成的题目"""
        try:
            parsed = json.loads(response)
            return parsed.get('questions', [])
        except json.JSONDecodeError:
            # 如果JSON解析失败，尝试提取题目信息
            return self._extract_questions_from_text(response)
    
    def _extract_questions_from_text(self, text: str) -> List[Dict[str, Any]]:
        """从文本中提取题目信息（备用方法）"""
        # 简化的文本解析逻辑
        questions = []
        lines = text.split('\n')
        
        current_question = {}
        for line in lines:
            line = line.strip()
            if line.startswith(('1.', '2.', '3.', '4.', '5.')):
                if current_question:
                    questions.append(current_question)
                current_question = {'question': line, 'options': {}, 'correct_answer': '', 'explanation': ''}
            elif line.startswith(('A.', 'B.', 'C.', 'D.')):
                option = line[0]
                content = line[2:].strip()
                current_question['options'][option] = content
        
        if current_question:
            questions.append(current_question)
        
        return questions
