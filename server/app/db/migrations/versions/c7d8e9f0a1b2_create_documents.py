"""documents: таблица документов студента с типом и вердиктом ИИ

Revision ID: c7d8e9f0a1b2
Revises: b1c2d3e4f5a6
Create Date: 2026-06-22
"""
from alembic import op

revision = "c7d8e9f0a1b2"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE documenttype AS ENUM (
                'passport', 'certificate', 'diploma', 'transcript',
                'language_certificate', 'motivation_letter', 'recommendation',
                'photo', 'medical', 'other'
            );
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
            CREATE TYPE documentstatus AS ENUM ('pending', 'approved', 'rejected');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        CREATE TABLE IF NOT EXISTS documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
            doc_type documenttype NOT NULL DEFAULT 'other',
            status documentstatus NOT NULL DEFAULT 'pending',
            detected_type VARCHAR(100),
            ai_verdict TEXT,
            ai_reasons JSONB,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS ix_documents_user_id ON documents(user_id);
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP TABLE IF EXISTS documents;
        DROP TYPE IF EXISTS documentstatus;
        DROP TYPE IF EXISTS documenttype;
        """
    )
