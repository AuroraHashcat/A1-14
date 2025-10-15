"""
大模型客户端
"""

import os
import requests
import json
from typing import Dict, Any, Optional
from config import Config

class LLMClient:
    """DeepInfra大模型客户端"""
    
    def __init__(self):
        self.api_key = Config.DEEPINFRA_API_KEY
        self.base_url = Config.DEEPINFRA_BASE_URL
        self.model_name = Config.MODEL_NAME
        
        if not self.api_key:
            raise ValueError("DEEPINFRA_API_KEY not configured")
    
    def generate(self, prompt: str, max_tokens: int = 2000, temperature: float = 0.7) -> str:
        """生成文本"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': self.model_name,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': max_tokens,
                'temperature': temperature,
                'top_p': 0.9,
                'frequency_penalty': 0.0,
                'presence_penalty': 0.0
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result['choices'][0]['message']['content']
            
        except requests.exceptions.RequestException as e:
            print(f"API request error: {e}")
            return f"API调用错误: {str(e)}"
        
        except KeyError as e:
            print(f"Response parsing error: {e}")
            return f"响应解析错误: {str(e)}"
        
        except Exception as e:
            print(f"Unexpected error: {e}")
            return f"未知错误: {str(e)}"
    
    def generate_with_context(self, prompt: str, context: str, max_tokens: int = 2000) -> str:
        """基于上下文生成文本"""
        full_prompt = f"""上下文信息：
{context}

基于上述上下文信息，请回答以下问题：
{prompt}"""
        
        return self.generate(full_prompt, max_tokens=max_tokens)
    
    def analyze_document(self, document_text: str, analysis_type: str = "general") -> Dict[str, Any]:
        """分析文档内容"""
        analysis_prompts = {
            "general": "请分析以下文档的主要内容、关键信息和重要特征：",
            "security": "请从网络安全和密码学角度分析以下文档，识别安全相关的技术要点、风险和建议：",
            "compliance": "请分析以下文档是否符合相关标准和规范，识别合规性问题和改进建议："
        }
        
        prompt = analysis_prompts.get(analysis_type, analysis_prompts["general"])
        full_prompt = f"{prompt}\n\n{document_text[:4000]}..."  # 限制文档长度
        
        response = self.generate(full_prompt, max_tokens=1500)
        
        return {
            "analysis_type": analysis_type,
            "analysis": response,
            "document_length": len(document_text)
        }
    
    def test_connection(self) -> bool:
        """测试API连接"""
        try:
            test_response = self.generate("Hello", max_tokens=10)
            return len(test_response) > 0
        except:
            return False
