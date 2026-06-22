"""users: email необязателен (заявки приходят без email)

Revision ID: d8e9f0a1b2c3
Revises: c7d8e9f0a1b2
Create Date: 2026-06-22
"""
from alembic import op

revision = "d8e9f0a1b2c3"
down_revision = "c7d8e9f0a1b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;")


def downgrade() -> None:
    # Откат: вернуть NOT NULL можно только если нет строк с NULL email.
    op.execute("ALTER TABLE users ALTER COLUMN email SET NOT NULL;")
