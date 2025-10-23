"""模型调用封装。"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

from app.services.constants import MIPEVAL_EXTRACTION_PROMPT, API_KEY


DEFAULT_RESULT: Dict[str, Any] = {
    "被测单位基础信息": {
        "unitName": "未提及",
        "unitType": "未提及",
        "unitLevel": "未提及",
        "unitAddress": "未提及",
        "contactPerson": "未提及",
        "contactPhone": "未提及",
        "contactEmail": "未提及",
        "unitCode": "未提及",
    },
    "被测信息系统信息": {
        "systemName": "未提及",
        "systemLevel": "未提及",
        "systemType": "未提及",
        "systemDeploymentMode": "未提及",
        "systemCoverageScope": "未提及",
        "systemOnlineTime": "未提及",
        "systemCoreFunction": "未提及",
        "systemNetworkTopologyDesc": "未提及",
        "passwordProductList": [],
    },
    "密评对接与计划信息": {
        "evaluationInstitutionName": "未提及",
        "evaluationTeamLeader": "未提及",
        "evaluationTeamLeaderPhone": "未提及",
        "plannedEvaluationStartTime": "未提及",
        "plannedEvaluationEndTime": "未提及",
        "onSiteEvaluationAddress": "未提及",
        "onSiteContactPerson": "未提及",
        "onSiteContactPhone": "未提及",
        "specialRequirements": "未提及",
    },
    "密评准备材料清单确认信息": {
        "passwordApplicationPlanPrepared": "未提及",
        "passwordPolicyDocumentPrepared": "未提及",
        "systemDesignDocumentPrepared": "未提及",
        "passwordProductCertificatePrepared": "未提及",
        "systemOperationLogSamplePrepared": "未提及",
        "previousEvaluationReportPrepared": "未提及",
    },
}


@dataclass
class ModelConfig:
    model_name: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    allow_fallback: bool = True


class ExtractionModel:
    """封装大模型调用逻辑，支持 OpenAI 接口，必要时回退到默认结果。"""

    def __init__(self, config: Optional[ModelConfig] = None) -> None:
        self.config = config or ModelConfig()

    def extract(self, source_text: str) -> Dict[str, Any]:
        """调用模型提取信息。"""
        try:
            response_text = self._call_model(source_text)
        except Exception as exc:  # noqa: BLE001
            if not self.config.allow_fallback:
                raise
            return self._fallback_result(reason=str(exc))

        return self._parse_response(response_text)

    # ---------------------------------------------------------------------
    def _call_model(self, source_text: str) -> str:
        api_key = self.config.api_key or os.getenv("DEEPINFRA_API_TOKEN") or API_KEY

        if not api_key:
            if self.config.allow_fallback:
                raise RuntimeError("缺少 DEEPINFRA_API_TOKEN，已使用回退结果。")
            raise RuntimeError("缺少 DEEPINFRA_API_TOKEN 环境变量。")

        import requests

        url = self.config.base_url or "https://api.deepinfra.com/v1/openai/chat/completions"
        headers = {
            "Authorization": f"bearer {api_key}",
            "Content-Type": "application/json",
        }
        # print(source_text)
        payload = {
            "model": self.config.model_name,
            "messages": [
                {"role": "system", "content": "你是一个严谨的中文信息抽取助手，只输出合法 JSON。"},
                {
                    "role": "user",
                    "content": f"{MIPEVAL_EXTRACTION_PROMPT}\n\n【待提取文本】\n{source_text}",
                },
            ],
            "temperature": 0.2,
        }

        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            raise RuntimeError(f"DeepInfra API 调用失败：{response.status_code} {response.text}")

        data = response.json()
        choices = data.get("choices")
        if not choices:
            raise RuntimeError("DeepInfra API 未返回 choices")
        print(choices[0]["message"].get("content", ""))
        return choices[0]["message"].get("content", "")

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        if not response_text:
            if self.config.allow_fallback:
                return self._fallback_result(reason="模型返回为空")
            raise ValueError("模型未返回任何内容")

        # 尝试找到第一个 JSON 开始字符 '{' 或 '['，并从该位置开始解析
        start_idx = None
        for ch in ("{", "["):
            i = response_text.find(ch)
            if i != -1 and (start_idx is None or i < start_idx):
                start_idx = i
        to_parse = response_text[start_idx:] if start_idx is not None else response_text

        try:
            data = json.loads(to_parse)
            return data
        except json.JSONDecodeError as exc:
            # 尝试去掉尾部可能的非 JSON 垃圾（查找最后一个 '}' 或 ']'）
            last_close = max(to_parse.rfind("}"), to_parse.rfind("]"))
            if last_close != -1:
                candidate = to_parse[: last_close + 1]
                try:
                    data = json.loads(candidate)
                    return data
                except json.JSONDecodeError:
                    pass

            if not self.config.allow_fallback:
                raise
            return self._fallback_result(reason=f"JSON 解析失败: {exc}")

    def check_connection(self) -> Dict[str, Any]:
        """快速检查 DeepInfra API 连接是否可用。

        Returns
        -------
        Dict[str, Any]
            包含 ``ok`` 布尔值和 ``detail`` 描述信息。
        """

        try:
            response_text = self._call_model("连接测试")
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "detail": str(exc)}

        return {"ok": True, "detail": response_text or "模型返回为空"}

    def _fallback_result(self, reason: str) -> Dict[str, Any]:
        fallback = json.loads(json.dumps(DEFAULT_RESULT, ensure_ascii=False))
        fallback.setdefault("_meta", {})["fallbackReason"] = reason
        return fallback
