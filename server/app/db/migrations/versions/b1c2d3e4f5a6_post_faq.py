"""posts: добавить поле faq (список вопрос/ответ)

Revision ID: b1c2d3e4f5a6
Revises: a0b1c2d3e4f5
Create Date: 2026-06-19
"""
from alembic import op

revision = "b1c2d3e4f5a6"
down_revision = "a0b1c2d3e4f5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS faq JSONB;")


def downgrade() -> None:
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS faq;")
