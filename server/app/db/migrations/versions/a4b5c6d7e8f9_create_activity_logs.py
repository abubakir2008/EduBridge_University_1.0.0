"""create activity_logs table

Revision ID: a4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-06-09
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "a4b5c6d7e8f9"
down_revision = "f3a4b5c6d7e8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID,
            action VARCHAR(100) NOT NULL,
            detail TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)


def downgrade() -> None:
    op.drop_table("activity_logs")
