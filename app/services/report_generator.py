"""报告生成服务：整合准备信息与证据解析生成密评报告。"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

import requests

from app.services.constants import API_KEY, MIPEVAL_REPORT_PROMPT
from app.services.model_client import ModelConfig
from infrastructure.llm.llm_client import LLMClient


class ReportGenerator:
    """调用大模型生成密评报告，并在失败时提供回退内容。"""

    def __init__(self, config: ModelConfig | None = None) -> None:
        self.config = config or ModelConfig(allow_fallback=True)

    def generate(self, system_name: str, payload: Dict[str, Any]) -> str:
        """生成报告正文。

        Parameters
        ----------
        system_name: str
            系统名称，用于提示模型撰写背景。
        payload: Dict[str, Any]
            组合后的准备信息与证据内容。
        """

        # Use the project's LLM client judge_evaluation prompt to produce
        # a structured, recursive evaluation JSON. We pass the combined
        # payload as the evaluation text so the model can synthesize
        # unit-level judgements, D/A/K breakdowns, problems, suggestions
        # and scoring according to the judge_evaluation schema.
        serialized = json.dumps(payload, ensure_ascii=False, indent=2)

        client = LLMClient()
        try:
            result = client.judge_evaluation(serialized, context=system_name, max_tokens=4000)

            # If the client returned parsed JSON, pretty-print it as the
            # report content. If it returned raw text (parsing failed),
            # use that raw text.
            if isinstance(result, dict):
                # If the client returned a dict with a 'raw' key, prefer
                # the raw text so we preserve model output when it's not
                # strictly JSON.
                if 'raw' in result:
                    return str(result['raw']).strip()
                return json.dumps(result, ensure_ascii=False, indent=2)

            return str(result).strip()
        except Exception as exc:  # noqa: BLE001
            return self._fallback_report(payload, reason=str(exc))

    # ------------------------------------------------------------------
    def _call_model(self, user_content: str) -> str:
        api_key = self.config.api_key or os.getenv("DEEPINFRA_API_TOKEN") or API_KEY
        if not api_key:
            raise RuntimeError("缺少 DEEPINFRA_API_TOKEN 环境变量")

        url = self.config.base_url or "https://api.deepinfra.com/v1/openai/chat/completions"
        headers = {
            "Authorization": f"bearer {api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.config.model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一名资深的密码应用测评专家，请基于提供的资料撰写正式、准确的中文报告。",
                },
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.4,
        }

        response = requests.post(url, headers=headers, json=body, timeout=90)
        if response.status_code != 200:
            raise RuntimeError(f"报告生成失败：{response.status_code} {response.text}")

        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError("模型未返回有效内容")

        return choices[0]["message"].get("content", "")

    def _fallback_report(self, payload: Dict[str, Any], *, reason: str) -> str:
        lines = [
            "# 密评报告（自动生成）",
            f"> 提示：调用在线模型失败，已根据本地数据生成简要报告。原因：{reason}",
        ]

        system_info = payload.get("system") or {}
        prep = payload.get("preparation")
        evidences = payload.get("evidences") or []

        name = system_info.get("name", "未命名系统")
        owner = system_info.get("owner") or system_info.get("ownerName") or "--"
        lines.append("\n## 执行摘要")
        lines.append(f"- 被测系统：{name}")
        lines.append(f"- 归属：{owner}")
        lines.append(f"- 证据数量：{len(evidences)}")

        lines.append("\n## 项目背景")
        if prep:
            lines.append("已收集测评准备信息，详情如下 JSON：")
            lines.append("```json")
            lines.append(json.dumps(prep, ensure_ascii=False, indent=2))
            lines.append("```")
        else:
            lines.append("尚未填写测评准备信息。")

        lines.append("\n## 证据要点")
        if evidences:
            for item in evidences:
                summary = item.get("summary") or item.get("extracted")
                snippet: str
                if isinstance(summary, dict):
                    snippet = json.dumps(summary, ensure_ascii=False)
                else:
                    snippet = str(summary or "无解析内容")
                snippet = snippet[:400]
                lines.append(f"- {item.get('filename', '未命名文件')}：{snippet}")
        else:
            lines.append("尚未上传或解析证据。")

        lines.append("\n## 风险与问题")
        lines.append("由于缺少模型输出，风险项需人工补充。")

        lines.append("\n## 建议措施")
        lines.append("建议尽快补充完整的模型服务配置，重新生成报告。")

        lines.append("\n## 结论与下一步计划")
        lines.append("参考上述数据，待模型服务恢复后可生成完整报告。")

        return "\n".join(lines)
