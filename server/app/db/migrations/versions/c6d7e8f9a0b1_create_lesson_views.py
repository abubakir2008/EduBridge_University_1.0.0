"""create lesson_views table (принудительное прохождение уроков)

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
Create Date: 2026-06-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "c6d7e8f9a0b1"
down_revision = "b5c6d7e8f9a0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS lesson_views (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            viewed_at TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT uq_lesson_view_user_lesson UNIQUE (user_id, lesson_id)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_lesson_views_user_id ON lesson_views(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_lesson_views_lesson_id ON lesson_views(lesson_id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS lesson_views;")
