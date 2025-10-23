#!/usr/bin/env python3
"""数据库升级脚本：为测评系统引入按用户隔离的唯一约束。"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import inspect, text

# 项目根目录加入 Python 路径，便于导入应用模块
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app, db  # noqa: E402
from app.models import System, User  # noqa: E402
from app.services.system_service import ensure_default_system_for_user  # noqa: E402

UNIQUE_INDEX_NAME = "uq_system_owner_name_idx"


def unique_index_exists(table_name: str, index_name: str) -> bool:
    inspector = inspect(db.engine)
    for index in inspector.get_indexes(table_name):
        if index.get("name") == index_name:
            return True
    return False


def normalize_system_names() -> None:
    """去除系统名称里的首尾空白字符。"""
    db.session.execute(text("UPDATE systems SET name = TRIM(name) WHERE name IS NOT NULL"))


def ensure_owner_display_names() -> None:
    """确保系统记录中的 owner 字段存在人类可读名称。"""
    systems = System.query.filter(System.owner_id.isnot(None)).all()
    for system in systems:
        if system.owner and system.owner.strip():
            continue
        owner = User.query.get(system.owner_id)
        if owner:
            system.owner = owner.username


def detect_duplicates() -> list[tuple[int, str, int]]:
    """检测同一用户下是否存在重名系统。"""
    result = db.session.execute(
        text(
            """
            SELECT owner_id, name, COUNT(*) AS cnt
            FROM systems
            WHERE owner_id IS NOT NULL
            GROUP BY owner_id, name
            HAVING cnt > 1
            """
        )
    )
    return [(row.owner_id, row.name, row.cnt) for row in result]


def create_unique_index() -> None:
    if unique_index_exists("systems", UNIQUE_INDEX_NAME):
        return

    db.session.execute(
        text(
            f"CREATE UNIQUE INDEX {UNIQUE_INDEX_NAME} "
            "ON systems (owner_id, name) "
            "WHERE owner_id IS NOT NULL"
        )
    )


def main() -> None:
    app = create_app()
    with app.app_context():
        # 确保全局默认系统及每个用户的默认系统存在
        ensure_default_system_for_user(None)
        for user_id, in db.session.query(User.id).all():
            ensure_default_system_for_user(user_id)

        normalize_system_names()
        ensure_owner_display_names()
        db.session.commit()

        duplicates = detect_duplicates()
        if duplicates:
            print("❌ 检测到同一用户下存在重名系统，请先手动处理后再运行脚本。")
            for owner_id, name, count in duplicates:
                print(f"  - user_id={owner_id}, name={name}, count={count}")
            sys.exit(1)

        create_unique_index()
        db.session.commit()
        print("✅ 系统多租户结构升级完成。")


if __name__ == "__main__":
    main()
