"""文件读取逻辑，支持 Word 与 Excel。"""

from __future__ import annotations

from functools import lru_cache
import os
import io
from pathlib import Path
import sys
import tempfile
import threading
import traceback
from typing import Iterable, Union, Optional
from paddleocr import PaddleOCR
from app.services.constants import POPPLER_PATH, TESSERACT_CMD
import fitz

PathLike = Union[str, Path]


def read_document(path: PathLike) -> str:
    """读取文档并返回文本。

    支持的类型：
      - Word: .docx
      - Excel: .xlsx, .xlsm
      - 图片: .png, .jpg, .jpeg, .bmp, .tif, .tiff
      - PDF: .pdf（需要提供 `poppler_path`，或系统环境已配置 Poppler）

    可选参数：
      - poppler_path: PDF 转图片时传递给 pdf2image 的 poppler 路径
      - tesseract_cmd: 指定 tesseract 可执行文件路径（会设置到 pytesseract.pytesseract.tesseract_cmd）

    Args:
        path: 文件路径。
        poppler_path: 可选，PDF 转图片所需的 Poppler bin 目录路径。
        tesseract_cmd: 可选，指定 tesseract 可执行文件完整路径。

    Raises:
        ValueError: 当文件扩展名不受支持时。
    """

    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"未找到文件：{file_path}")

    suffix = file_path.suffix.lower()

    # 文档类型
    if suffix == ".docx":
        return _read_docx(file_path)
    if suffix in {".xlsx", ".xlsm"}:
        return _read_excel(file_path)

    # 图片类型（延迟导入 heavy libs）
    if suffix in {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}:
        # return _ocr_image_file(file_path, tesseract_cmd=TESSERACT_CMD)
        return _ocr_image_file(file_path)

    # PDF（需要 poppler）
    if suffix == ".pdf":
        return _ocr_pdf(file_path, poppler_path=POPPLER_PATH, tesseract_cmd=TESSERACT_CMD)
    # if suffix == ".pdf":
    #     return _read_pdf_simple(file_path)

    raise ValueError(f"暂不支持的文件类型：{suffix}")


def _read_docx(path: Path) -> str:
    from docx import Document  # type: ignore

    doc = Document(path)
    parts: list[str] = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            parts.append(text)

    for table in doc.tables:
        parts.extend(_flatten_table(table))

    return "\n".join(parts)


def _flatten_table(table) -> Iterable[str]:
    for row in table.rows:
        row_values = [cell.text.strip() for cell in row.cells if cell.text.strip()]
        if row_values:
            yield "\t".join(row_values)


def _read_excel(path: Path) -> str:
    from openpyxl import load_workbook  # type: ignore

    wb = _open_workbook(path, load_workbook)
    try:
        parts: list[str] = []
        for sheet in wb.worksheets:
            parts.append(f"# 工作表：{sheet.title}")
            for row in sheet.iter_rows(values_only=True):
                row_values = [str(cell).strip() for cell in row if cell is not None and str(cell).strip()]
                if row_values:
                    parts.append("\t".join(row_values))
    finally:
        wb.close()
    return "\n".join(parts)


def _open_workbook(path: Path, load_workbook):
    # openpyxl.load_workbook 默认打开文件句柄，我们用二进制流避免潜在锁。
    with path.open("rb") as fh:
        data = fh.read()
    return load_workbook(io.BytesIO(data), data_only=True)


def _ocr_image_file(path: Path, *, tesseract_cmd: Optional[str] = None) -> str:
    """对图片文件执行 OCR，使用 PaddleOCR，返回识别文本。"""
    # 懒加载 PaddleOCR，避免导入时的重依赖开销
    from paddleocr import PaddleOCR

    def _get_paddle_ocr():
        # 单例保存 OCR 实例
        if not hasattr(_get_paddle_ocr, "ocr"):
            _get_paddle_ocr.ocr = PaddleOCR(use_textline_orientation=True, lang='ch')
        return _get_paddle_ocr.ocr

    ocr = _get_paddle_ocr()

    # 支持传入 Path 或 str 路径
    img_path = str(path)
    # 使用 PaddleOCR 的 predict 接口并提取文本（兼容不同返回结构）
    try:
        result = ocr.predict(img_path)
    except Exception as e:
        raise RuntimeError(f"PaddleOCR 识别图片失败: {img_path}, 错误: {e}") from e

    # 复用 test.py 中的提取逻辑，尽量兼容不同版本返回格式
    rec_texts = []
    if isinstance(result, list) and len(result) > 0:
        first_item = result[0]
        if hasattr(first_item, 'rec_texts'):
            rec_texts = first_item.rec_texts
        else:
            def deep_search(obj, target_key='rec_texts'):
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if k == target_key and isinstance(v, list):
                            return v
                        if isinstance(v, (dict, list)):
                            res = deep_search(v, target_key)
                            if res is not None:
                                return res
                elif isinstance(obj, list):
                    for item in obj:
                        res = deep_search(item, target_key)
                        if res is not None:
                            return res
                return None
            rec_texts = deep_search(first_item) or []

    return "\n".join(rec_texts)


# def _read_pdf_simple(path: Path) -> str:
#     """读取 PDF 文件（直接提取文本，不转图片）"""
#     try:
#         doc = fitz.open(path)
#         text_parts = []
        
#         for page_num in range(len(doc)):
#             page = doc.load_page(page_num)
#             text = page.get_text()
#             if text.strip():
#                 text_parts.append(f"=== 第 {page_num + 1} 页 ===")
#                 text_parts.append(text)
        
#         doc.close()
#         print("\n".join(text_parts))
#         return "\n".join(text_parts)
#     except Exception as e:
#         raise RuntimeError(f"读取 PDF 失败: {e}")

def _ocr_pdf(path: Path, *, poppler_path: Optional[str] = None, tesseract_cmd: Optional[str] = None) -> str:
    """将 PDF 每页转为图片后逐页使用 PaddleOCR 识别，返回合并文本。"""
    # 延迟导入并增强错误提示
    try:
        from pdf2image import convert_from_path  # type: ignore
    except Exception as e:
        raise RuntimeError("缺少 pdf2image 依赖或导入失败，请安装 pdf2image") from e

    import tempfile
    import shutil
    # 确保 poppler_path 有意义
    poppler_dir = poppler_path or POPPLER_PATH
    if poppler_dir:
        pdftoppm_path = Path(poppler_dir) / ("pdftoppm.exe" if os.name == "nt" else "pdftoppm")
        if not pdftoppm_path.exists():
            # 仍然允许系统 PATH 中存在 pdftoppm（convert_from_path 会尝试）
            # 但给出明确提示以便排查
            if not shutil.which("pdftoppm"):
                raise FileNotFoundError(
                    f"未找到 pdftoppm 可执行文件。请安装 Poppler 并确保 pdftoppm 在 PATH 中，"
                    f"或将 POPPLER_PATH 设置为正确的 Poppler bin 目录（当前检查: {pdftoppm_path})。"
                )

    if not path.exists():
        raise FileNotFoundError(f"要处理的 PDF 文件不存在: {path}")

    all_texts: list[str] = []
    # 将每页暂存为图片文件，再交给 PaddleOCR 识别（复用 _ocr_image_file）
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            pages = convert_from_path(str(path), dpi=300, output_folder=temp_dir, poppler_path=poppler_dir)
        except FileNotFoundError as e:
            # 通常表示找不到 pdftoppm，可打印更具体提示
            raise FileNotFoundError(
                f"convert_from_path 调用失败，可能未安装 Poppler 或 poppler_path 配置错误。"
                f"poppler_path={poppler_dir}"
            ) from e
        except Exception as e:
            raise RuntimeError(f"将 PDF 转为图片时出错: {e}") from e

        for i, page in enumerate(pages):
            tmp_img = Path(temp_dir) / f"page_{i}.png"
            page.save(str(tmp_img), "PNG")
            page_text = _ocr_image_file(tmp_img, tesseract_cmd=tesseract_cmd)
            if page_text:
                all_texts.append(page_text)

    return "\n".join(all_texts)
