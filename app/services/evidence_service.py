"""证据处理服务（支持单个与批量证据文件内容抽取）"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from flask import current_app

from app.models import Evidence, db
from app.services.constants import EVIDENCE_SUMMARY_PROMPT
from app.services.file_reader import read_document
from infrastructure.llm.llm_client import LLMClient


class EvidenceService:
    """证据文件处理服务（整合文件读取与模型抽取流程）"""

    def __init__(self):
        # 创建线程池，用于并行执行 OCR / 模型抽取等任务
        # max_workers 可根据 CPU 核数与任务复杂度调整
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.llm_client = LLMClient()

    def _submit_with_context(self, func, *args, **kwargs):
        """在线程池中执行任务时保留 Flask 应用上下文。"""
        app = current_app._get_current_object()

        def _runner():
            with app.app_context():
                return func(*args, **kwargs)

        return self.executor.submit(_runner)

    # =============================================================
    # 单文件抽取逻辑
    # =============================================================
    def extract_content(self, evidence_id: int) -> Dict[str, Any]:
        """
        提取单个证据文件内容，并调用模型进行信息抽取。

        Args:
            evidence_id (int): Evidence 数据库记录 ID。

        Returns:
            dict: 包含抽取结果、成功标志、输出文件路径等信息。
        """
        # Step 0: 查询数据库中的 Evidence 记录
        evidence = Evidence.query.get(evidence_id)
        if not evidence:
            raise ValueError(f"Evidence with id {evidence_id} not found")

        try:
            input_path = Path(evidence.file_path)

            # Step 1: 读取文件原文
            source_text = read_document(input_path) or ""
            source_text = source_text if isinstance(source_text, str) else str(source_text)

            # Step 2: 生成关键信息总结
            summary_text = self._summarize_for_mipeval(source_text)

            # Step 3: 更新数据库记录
            metadata = evidence.evidence_metadata or {}
            if not isinstance(metadata, dict):
                metadata = {"_legacy": metadata}
            metadata.update(
                {
                    "summaryModel": getattr(self.llm_client, "model_name", "unknown"),
                    "summaryGeneratedAt": datetime.utcnow().isoformat() + "Z",
                    "rawTextLength": len(source_text or ""),
                }
            )

            evidence.extracted_text = source_text
            evidence.key_summary = summary_text
            evidence.evidence_metadata = metadata
            db.session.commit()

            # Step 4: 返回成功结果
            return {
                "evidence_id": evidence_id,
                "text": source_text,
                "summary": summary_text,
                "metadata": metadata,
                "success": True,
            }

        except Exception as e:
            # 捕获异常，保证单个文件出错不会影响批处理
            return {
                "evidence_id": evidence_id,
                "error": str(e),
                "success": False
            }

    def _summarize_for_mipeval(self, source_text: str) -> str:
        """调用大模型生成面向密评的关键信息总结。"""
        cleaned_text = (source_text or "").strip()
        if not cleaned_text:
            return "原始文本为空，未生成总结。"

        max_chars = 8000
        truncated = cleaned_text[:max_chars]
        if len(cleaned_text) > max_chars:
            truncated += "\n\n【提示】原文已截断，仅保留前 8000 个字符用于生成摘要。"

        prompt = f"{EVIDENCE_SUMMARY_PROMPT}\n\n【证据原文摘录】\n{truncated}"

        try:
            return self.llm_client.generate(prompt, max_tokens=1200, temperature=0.2)
        except Exception as exc:  # noqa: BLE001
            current_app.logger.exception("生成证据摘要失败：%s", exc)
            return "自动摘要失败，请复核证据原文。"

    # =============================================================
    # 批量同步抽取逻辑
    # =============================================================
    def extract_batch(self, evidence_ids: List[int]) -> Dict[str, Any]:
        """
        批量提取多个证据文件内容（同步方式）。

        Args:
            evidence_ids (List[int]): 待处理的 Evidence 记录 ID 列表。

        Returns:
            dict: 汇总结果，包括总数、成功数、失败数、各项结果明细。
        """
        results = []

        # 顺序执行，每个文件单独抽取
        for eid in evidence_ids:
            result = self.extract_content(eid)
            results.append(result)

        # 汇总统计结果
        summary = {
            "total": len(evidence_ids),                           # 总文件数
            "success": sum(1 for r in results if r["success"]),    # 成功数量
            "failed": sum(1 for r in results if not r["success"]), # 失败数量
            "results": results                                     # 每个文件的详细结果
        }
        return summary

    # =============================================================
    # 批量异步抽取逻辑（推荐用于大批量文件）
    # =============================================================
    def extract_content_async(self, evidence_id: int):
        """异步提取单个证据文件内容，确保拥有应用上下文。"""
        return self._submit_with_context(self.extract_content, evidence_id)

    def extract_batch_async(self, evidence_ids: List[int]):
        """
        异步批量执行抽取任务（并发执行）。

        每个文件在独立线程中运行，不会相互阻塞。
        返回一个 Future 对象，可在外部通过 future.result() 获取结果。

        Args:
            evidence_ids (List[int]): 待处理的 Evidence 记录 ID 列表。

        Returns:
            concurrent.futures.Future: 异步任务结果。
        """
        # 将每个文件抽取任务提交给线程池
        futures = {self._submit_with_context(self.extract_content, eid): eid for eid in evidence_ids}

        def _collect_results():
            """
            内部函数：收集所有 Future 执行结果并汇总统计。
            """
            results = []
            for future in as_completed(futures):
                eid = futures[future]
                try:
                    # 等待单个任务执行完成
                    results.append(future.result())
                except Exception as e:
                    # 捕获线程中异常，防止任务中断
                    results.append({
                        "evidence_id": eid,
                        "error": str(e),
                        "success": False
                    })

            # 汇总最终统计结果
            summary = {
                "total": len(evidence_ids),
                "success": sum(1 for r in results if r["success"]),
                "failed": sum(1 for r in results if not r["success"]),
                "results": results
            }
            return summary

        # 提交聚合任务，返回 Future（可等待）
        return self.executor.submit(_collect_results)
