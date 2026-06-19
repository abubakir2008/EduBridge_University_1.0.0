"""create post_categories table + сид 4 рубрик

Revision ID: f8a9b0c1d2e3
Revises: e7f8a9b0c1d2
Create Date: 2026-06-18
"""
from alembic import op

revision = "f8a9b0c1d2e3"
down_revision = "e7f8a9b0c1d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS post_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(120) NOT NULL,
            slug VARCHAR(120) NOT NULL UNIQUE,
            description VARCHAR(300),
            emoji VARCHAR(16),
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT now(),
            deleted_at TIMESTAMPTZ
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_post_categories_slug ON post_categories(slug);")
    # Сид стартовых рубрик (slug совпадает с прежними значениями Post.category)
    op.execute("""
        INSERT INTO post_categories (name, slug, description, emoji, sort_order) VALUES
        ('Переезд и виза', 'relocation', 'Виза, документы, адаптация, жильё', '✈️', 1),
        ('Поступление и документы', 'admission', 'Этапы, письма, сроки, выбор вуза', '🎓', 2),
        ('Языки и тесты', 'languages', 'IELTS, TOEFL, HSK и подготовка', '🗣️', 3),
        ('Гранты, страны и жизнь', 'grants', 'Стипендии, обзоры стран, жизнь студента', '🌍', 4)
        ON CONFLICT (slug) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS post_categories;")
