#!/usr/bin/env python3
"""重新识别GMT标准PDF并载入向量数据库。"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Dict, Set

# 项目根目录入路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services.file_reader import read_document
from infrastructure.vector_db.vector_store import VectorStore


STANDARDS_FILES = [
    Path("evaluation_standards/GBT+39786-2021.pdf"),
    Path("evaluation_standards/GBT+43206-2023.pdf"),
]

OUTPUT_DIR = project_root / "data" / "knowledge"


def extract_text_files() -> List[Path]:
    """使用 file_reader 将目标 PDF 转为文本文件。"""
    extracted_paths: List[Path] = []
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for pdf_path in STANDARDS_FILES:
        abs_path = project_root / pdf_path
        if not abs_path.exists():
            print(f"⚠️ 文件不存在，跳过: {abs_path}")
            continue

        print(f"📄 正在识别: {pdf_path.name}")
        try:
            text = read_document(abs_path)
        except Exception as exc:  # noqa: BLE001
            print(f"❌ 识别 {pdf_path.name} 失败: {exc}")
            continue
        output_path = OUTPUT_DIR / f"{pdf_path.stem}.txt"
        output_path.write_text(text, encoding="utf-8")
        extracted_paths.append(output_path)
        print(f"✅ 文本已写入: {output_path.relative_to(project_root)}")

    return extracted_paths


def collect_text_files(initial_paths: List[Path]) -> List[Path]:
    """收集 data/knowledge 下的所有文本文件。"""
    unique_paths: Set[Path] = set(initial_paths)
    for txt_file in OUTPUT_DIR.glob("*.txt"):
        unique_paths.add(txt_file)
    collected = sorted(unique_paths)
    if not collected:
        print(f"⚠️ 未在 {OUTPUT_DIR} 找到任何文本文件")
    else:
        print(f"📚 共找到 {len(collected)} 个文本文件用于载入")
    return collected


def split_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """将文本按字符长度切分，支持重叠。"""
    if not text:
        return []

    text = text.strip()
    if not text:
        return []

    chunks: List[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == length:
            break
        start = max(end - overlap, start + 1)

    return chunks


def rebuild_vector_store(text_paths: List[Path]) -> None:
    """根据提取的文本重新构建向量库条目。"""
    if not text_paths:
        print("⚠️ 没有可用于载入的文本文件，终止。")
        return

    store = VectorStore()
    print("🧹 正在清空现有集合...")
    stats = store.get_collection_stats()
    total = stats.get("total_documents", 0)
    if total:
        ids = store.collection.get()["ids"]
        if ids:
            store.collection.delete(ids=ids)
            print(f"✅ 已删除 {len(ids)} 条旧文档")

    documents: List[Dict[str, str]] = []
    for text_path in text_paths:
        content = text_path.read_text(encoding="utf-8")
        segments = split_text(content, chunk_size=1000, overlap=200)
        for idx, seg in enumerate(segments):
            documents.append(
                {
                    "title": f"{text_path.stem} 第{idx + 1}段",
                    "content": seg,
                    "source": text_path.name,
                    "category": "标准规范",
                    "metadata": {
                        "origin": text_path.stem,
                        "chunk_index": idx,
                        "total_chunks": len(segments),
                    },
                }
            )

    if not documents:
        print("⚠️ 没有可用内容，终止。")
        return

    print(f"📦 正在写入 {len(documents)} 条文档片段...")
    store.add_documents_batch(documents)
    print("🎉 向量数据库已更新。")


def main() -> None:
    # extracted = extract_text_files()
    text_paths = collect_text_files([])
    rebuild_vector_store(text_paths)


if __name__ == "__main__":
    main()
