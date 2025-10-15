"""
评测业务服务
"""

from app.models import Evaluation, Evidence, Report, db
from app.services.evidence_service import EvidenceService
from infrastructure.llm.llm_client import LLMClient
from typing import Dict, Any, List
import json

class EvaluationService:
    """评测服务"""
    
    def __init__(self):
        self.evidence_service = EvidenceService()
        self.llm_client = LLMClient()
    
    def process_evaluation(self, evaluation: Evaluation) -> Dict[str, Any]:
        """处理评测任务"""
        try:
            # 更新状态为处理中
            evaluation.status = 'processing'
            db.session.commit()
            
            # 1. 确保所有证据文件已提取内容
            evidences = evaluation.evidences.all()
            self._ensure_evidences_processed(evidences)
            
            # 2. 分析证据内容
            analysis_result = self._analyze_evidences(evidences)
            
            # 3. 生成评测报告
            report = self._generate_report(evaluation, analysis_result)
            
            # 4. 更新评测状态
            evaluation.status = 'completed'
            db.session.commit()
            
            return {
                'evaluation_id': evaluation.id,
                'status': 'completed',
                'report_id': report.id,
                'analysis': analysis_result
            }
            
        except Exception as e:
            evaluation.status = 'failed'
            db.session.commit()
            raise e
    
    def _ensure_evidences_processed(self, evidences: List[Evidence]):
        """确保所有证据文件已处理"""
        for evidence in evidences:
            if not evidence.extracted_text:
                self.evidence_service.extract_content(evidence.id)
    
    def _analyze_evidences(self, evidences: List[Evidence]) -> Dict[str, Any]:
        """分析证据内容"""
        # 收集所有文本内容
        all_text = []
        for evidence in evidences:
            if evidence.extracted_text:
                all_text.append({
                    'filename': evidence.original_filename,
                    'text': evidence.extracted_text,
                    'metadata': evidence.metadata
                })
        
        # 使用大模型分析
        analysis_prompt = self._build_analysis_prompt(all_text)
        analysis_result = self.llm_client.generate(analysis_prompt)
        
        try:
            # 尝试解析JSON结果
            parsed_result = json.loads(analysis_result)
        except:
            # 如果解析失败，返回原始文本
            parsed_result = {'raw_analysis': analysis_result}
        
        return {
            'evidences_count': len(evidences),
            'total_text_length': sum(len(item['text']) for item in all_text),
            'analysis': parsed_result
        }
    
    def _build_analysis_prompt(self, text_data: List[Dict[str, Any]]) -> str:
        """构建分析提示词"""
        prompt = """你是一个密码学产品评测专家。请分析以下证据文件内容，并按照GMT标准进行评估。

证据文件：
"""
        
        for item in text_data:
            prompt += f"\n文件名: {item['filename']}\n"
            prompt += f"内容: {item['text'][:2000]}...\n"  # 限制长度
            prompt += "---\n"
        
        prompt += """
请从以下方面进行分析：
1. 密码算法类型和参数
2. 安全强度评估
3. 实现标准符合性
4. 潜在安全风险
5. 改进建议

请以JSON格式返回分析结果，包含以上各个方面的详细评估。
"""
        return prompt
    
    def _generate_report(self, evaluation: Evaluation, analysis: Dict[str, Any]) -> Report:
        """生成评测报告"""
        # 构建报告生成提示词
        report_prompt = f"""
基于以下分析结果，生成一份专业的密码学产品评测报告。

评测任务：{evaluation.title}
任务描述：{evaluation.description}

分析结果：
{json.dumps(analysis, ensure_ascii=False, indent=2)}

请生成一份包含以下部分的完整报告：
1. 执行摘要
2. 测试环境和方法
3. 技术分析
4. 安全评估
5. 符合性评估
6. 建议和结论

报告应该专业、详细且易于理解。
"""
        
        # 使用大模型生成报告
        report_content = self.llm_client.generate(report_prompt)
        
        # 生成报告摘要
        summary_prompt = f"请为以下报告生成一个简洁的摘要（不超过500字）：\n\n{report_content}"
        summary = self.llm_client.generate(summary_prompt)
        
        # 计算评分（简化逻辑）
        score = self._calculate_score(analysis)
        
        # 创建报告记录
        report = Report(
            title=f"{evaluation.title} - 评测报告",
            content=report_content,
            summary=summary,
            score=score,
            evaluation_id=evaluation.id,
            recommendations=analysis.get('analysis', {}).get('recommendations', [])
        )
        
        db.session.add(report)
        db.session.commit()
        
        return report
    
    def _calculate_score(self, analysis: Dict[str, Any]) -> float:
        """计算评分（简化实现）"""
        # 这里是简化的评分逻辑，实际应该基于具体的评估标准
        base_score = 70.0
        
        # 根据分析结果调整分数
        analysis_data = analysis.get('analysis', {})
        
        # 示例调整逻辑
        if isinstance(analysis_data, dict):
            if 'security_risks' in analysis_data:
                risks = analysis_data['security_risks']
                if isinstance(risks, list):
                    base_score -= len(risks) * 5  # 每个风险扣5分
            
            if 'compliance_score' in analysis_data:
                compliance = analysis_data.get('compliance_score', 0)
                if isinstance(compliance, (int, float)):
                    base_score = base_score * 0.7 + compliance * 0.3
        
        return max(0.0, min(100.0, base_score))
