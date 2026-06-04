"""add university media columns (photo_file_ids, video_url, video_file_id)

These columns exist on the University model (the "university media" feature) but the
original migration that created them was lost during a rebase, so a fresh database
ended up missing them. Added idempotently so it is safe on databases that already
have the columns (e.g. long-lived dev/prod) and on brand-new ones.

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-06-04
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "f3a4b5c6d7e8"
down_revision = "e2f3a4b5c6d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE universities ADD COLUMN IF NOT EXISTS photo_file_ids JSON")
    op.execute("ALTER TABLE universities ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)")
    op.execute("ALTER TABLE universities ADD COLUMN IF NOT EXISTS video_file_id UUID")
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'universities_video_file_id_fkey'
            ) THEN
                ALTER TABLE universities
                    ADD CONSTRAINT universities_video_file_id_fkey
                    FOREIGN KEY (video_file_id) REFERENCES files(id) ON DELETE SET NULL;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE universities DROP CONSTRAINT IF EXISTS universities_video_file_id_fkey")
    op.execute("ALTER TABLE universities DROP COLUMN IF EXISTS video_file_id")
    op.execute("ALTER TABLE universities DROP COLUMN IF EXISTS video_url")
    op.execute("ALTER TABLE universities DROP COLUMN IF EXISTS photo_file_ids")
