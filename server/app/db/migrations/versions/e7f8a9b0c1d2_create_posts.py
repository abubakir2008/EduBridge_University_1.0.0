"""create posts table (блог / SEO-статьи)

Revision ID: e7f8a9b0c1d2
Revises: c6d7e8f9a0b1
Create Date: 2026-06-17
"""
from alembic import op

revision = "e7f8a9b0c1d2"
down_revision = "c6d7e8f9a0b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(300) NOT NULL UNIQUE,
            category VARCHAR(40) NOT NULL DEFAULT 'admission',
            excerpt VARCHAR(500),
            content TEXT,
            cover_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
            seo_title VARCHAR(300),
            seo_description VARCHAR(500),
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            author_id UUID REFERENCES users(id) ON DELETE SET NULL,
            published_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            deleted_at TIMESTAMPTZ
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_posts_slug ON posts(slug);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_posts_status ON posts(status);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_posts_category ON posts(category);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS posts;")
