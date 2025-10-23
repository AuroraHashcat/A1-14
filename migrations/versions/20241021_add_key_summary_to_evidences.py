"""add key_summary column to evidences

Revision ID: 20241021_add_key_summary
Revises: 
Create Date: 2025-10-21 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20241021_add_key_summary"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("evidences", sa.Column("key_summary", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("evidences", "key_summary")
