#!/usr/bin/env python3
"""数据库升级脚本：为 evidences 表新增 key_summary 列。"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import inspect, text

# 将项目根目录加入 Python 路径
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app, db  # noqa: E402


def column_exists(table_name: str, column_name: str) -> bool:
    """判断指定数据表中是否存在给定列。"""
    inspector = inspect(db.engine)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def add_key_summary_column() -> bool:
    """在 evidences 表中新增 key_summary 列（若不存在）。"""
    if column_exists("evidences", "key_summary"):
        return False

    ddl = text("ALTER TABLE evidences ADD COLUMN key_summary TEXT")
    db.session.execute(ddl)
    return True


def main() -> None:
    app = create_app()
    with app.app_context():
        added = add_key_summary_column()

        if added:
            # 初始化历史数据，避免产生 NULL 值
            db.session.execute(
                text("UPDATE evidences SET key_summary = '' WHERE key_summary IS NULL")
            )
            db.session.commit()
            print("✅ 已新增 key_summary 列并初始化历史数据。")
        else:
            print("ℹ️ key_summary 列已存在，无需更新。")


if __name__ == "__main__":
    main()
