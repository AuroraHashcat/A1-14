#!/usr/bin/env python3
"""数据库升级脚本：为证据与评测记录补充系统外键。"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import inspect, text

# 将项目根目录加入 Python 路径，方便导入应用模块
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app import create_app, db  # noqa: E402
from app.services.system_service import ensure_default_system_for_user  # noqa: E402


def column_exists(table_name: str, column_name: str) -> bool:
    """检查指定数据表是否已经存在某列。"""
    inspector = inspect(db.engine)
    return any(column['name'] == column_name for column in inspector.get_columns(table_name))


def add_column_if_missing(table_name: str, column_name: str, column_def: str) -> bool:
    """若表中不存在指定列，则执行 ALTER TABLE 添加列。"""
    if column_exists(table_name, column_name):
        return False

    ddl = text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")
    db.session.execute(ddl)
    return True


def evidence_requires_rebuild() -> bool:
    """检查 evidences.evaluation_id 是否仍为 NOT NULL 约束。"""
    inspector = inspect(db.engine)
    for column in inspector.get_columns('evidences'):
        if column['name'] == 'evaluation_id':
            return not column['nullable']
    return False


def rebuild_evidences_table():
    """重新构建 evidences 表，使 evaluation_id 允许 NULL。"""
    connection = db.session.connection()
    connection.execute(text('PRAGMA foreign_keys=OFF'))

    connection.execute(
        text(
            """
            CREATE TABLE evidences_new (
                id INTEGER PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50),
                file_size INTEGER,
                extracted_text TEXT,
                evidence_metadata JSON,
                created_at DATETIME,
                evaluation_id INTEGER REFERENCES evaluations(id),
                system_id VARCHAR(32) NOT NULL REFERENCES systems(id)
            )
            """
        )
    )

    connection.execute(
        text(
            """
            INSERT INTO evidences_new (
                id, filename, original_filename, file_path, file_type, file_size,
                extracted_text, evidence_metadata, created_at, evaluation_id, system_id
            )
            SELECT
                id, filename, original_filename, file_path, file_type, file_size,
                extracted_text, evidence_metadata, created_at, evaluation_id, system_id
            FROM evidences
            """
        )
    )

    connection.execute(text('DROP TABLE evidences'))
    connection.execute(text('ALTER TABLE evidences_new RENAME TO evidences'))
    connection.execute(text('PRAGMA foreign_keys=ON'))


def main() -> None:
    app = create_app()
    with app.app_context():
        # 确保存在默认系统，稍后会将历史数据绑定到该系统上
        default_system = ensure_default_system_for_user(None)

        # 1. evidences.system_id
        added_evidence_column = add_column_if_missing('evidences', 'system_id', 'VARCHAR(32)')
        if added_evidence_column:
            # 将历史证据全部归属到默认系统，避免出现 NULL 值
            db.session.execute(
                text("UPDATE evidences SET system_id = :system_id WHERE system_id IS NULL"),
                {"system_id": default_system.id}
            )

        # 2. evaluations.system_id
        added_evaluation_column = add_column_if_missing('evaluations', 'system_id', 'VARCHAR(32)')
        if added_evaluation_column:
            db.session.execute(
                text("UPDATE evaluations SET system_id = :system_id WHERE system_id IS NULL"),
                {"system_id": default_system.id}
            )

        # 3. 如果 evidences.evaluation_id 仍为 NOT NULL，重建表结构
        if evidence_requires_rebuild():
            rebuild_evidences_table()

        db.session.commit()
        print("✅ 数据库升级完成。")


if __name__ == '__main__':
    main()
