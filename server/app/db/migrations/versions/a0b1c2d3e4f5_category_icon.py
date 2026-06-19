"""рубрики: emoji → icon (ключ lucide-иконки)

Revision ID: a0b1c2d3e4f5
Revises: f8a9b0c1d2e3
Create Date: 2026-06-18
"""
from alembic import op

revision = "a0b1c2d3e4f5"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE post_categories ADD COLUMN IF NOT EXISTS icon VARCHAR(40);")
    op.execute("UPDATE post_categories SET icon = 'plane' WHERE slug = 'relocation';")
    op.execute("UPDATE post_categories SET icon = 'graduation-cap' WHERE slug = 'admission';")
    op.execute("UPDATE post_categories SET icon = 'languages' WHERE slug = 'languages';")
    op.execute("UPDATE post_categories SET icon = 'globe' WHERE slug = 'grants';")
    op.execute("ALTER TABLE post_categories DROP COLUMN IF EXISTS emoji;")


def downgrade() -> None:
    op.execute("ALTER TABLE post_categories ADD COLUMN IF NOT EXISTS emoji VARCHAR(16);")
    op.execute("ALTER TABLE post_categories DROP COLUMN IF EXISTS icon;")
