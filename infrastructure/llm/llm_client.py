"""
大模型客户端
"""

import os
import requests
import json
import re
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
    
    def judge_evaluation(self, evaluation_text: str, context: str = "", max_tokens: int = 2000) -> Dict[str, Any]:
        """智能判定：结构化递进式密评报告生成，自动提取 markdown 代码块 JSON"""
        prompt = '''你是密码应用安全测评专家，请对以下测评记录进行结构化、递进式判定，输出内容包括：\n\n{
  "unit_evaluations": [
    {
      "unit_name": "单元名称",
      "evidence": "原始证据摘要",
      "score": 8,
      "comment": "测评简要评价"
    }
  ],
  "dak_judgement": [
    {
      "unit_name": "单元名称",
      "D": {"result": "符合/不符合", "reason": "..."},
      "A": {"result": "符合/不符合", "reason": "..."},
      "K": {"result": "符合/不符合", "reason": "..."
    }
  ],
  "problems": [
    {
      "unit_name": "单元名称",
      "dak": "D/A/K",
      "description": "具体问题描述"
    }
  ],
  "suggestions": [
    {
      "problem_ref": 0,
      "suggestion": "针对问题的具体建议"
    }
  ],
  "scores": {
    "units": {"单元名称": 8},
    "total": 85,
    "scoring_method": "依据GB/T 39786评分标准，总分不得超过100分"
  },
  "overall_evaluation": {
    "conclusion": "符合/基本符合/不符合",
    "reason": "结论说明"
  }
}\n\n请严格按照上述JSON结构输出，字段齐全，内容详实，且各部分内容要前后呼应、递进。\n特别注意：总分不得超过100分。\n\n测评记录：\n'''
        full_prompt = f"{prompt}{evaluation_text}\n"
        if context:
            full_prompt = f"上下文信息：\n{context}\n\n" + full_prompt
        response = self.generate(full_prompt, max_tokens=max_tokens)
        # 尝试直接解析
        try:
            return json.loads(response)
        except Exception:
            # 尝试提取 markdown 代码块中的 JSON
            match = re.search(r"```(?:json)?\\s*([\s\S]+?)```", response)
            if match:
                json_str = match.group(1)
                try:
                    return json.loads(json_str)
                except Exception:
                    pass
            # 尝试提取第一个大括号包裹的 JSON
            match2 = re.search(r"({[\s\S]+})", response)
            if match2:
                json_str = match2.group(1)
                try:
                    return json.loads(json_str)
                except Exception:
                    pass
            return {"raw": response}

    def review_report(self, report_text: str, context: str = "", max_tokens: int = 1500) -> Dict[str, Any]:
        """智能评审：结构化校验密评报告"""
        prompt = '''请对以下密评报告进行智能评审，要求：\n- 检查各部分内容是否齐全、结构是否合理。\n- 检查所有“不符合”项是否有对应的问题描述和改进建议。\n- 检查总体评价是否与分数和主要问题相符。\n- 逐条列出发现的问题和改进建议。\n- 输出结构化JSON，包含每条问题的描述、建议、严重性，以及总体评价。\n\n输出示例：\n{
  "problems": [
    {"description": "问题描述", "suggestion": "改进建议", "severity": "高/中/低"}
  ],
  "overall_review": {"conclusion": "总体评价", "consistency": "逻辑一致性说明", "completeness": "内容完整性说明"}
}\n\n请严格按照上述JSON结构输出。\n\n报告内容：\n'''
        full_prompt = f"{prompt}{report_text}\n"
        if context:
            full_prompt = f"上下文信息：\n{context}\n\n" + full_prompt
        response = self.generate(full_prompt, max_tokens=max_tokens)
        try:
            return json.loads(response)
        except Exception:
            return {"raw": response}
