"""rename lessons.body to content

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-05-15

"""
from alembic import op

revision = 'b2c3d4e5f6a1'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('lessons', 'body', new_column_name='content')


def downgrade():
    op.alter_column('lessons', 'content', new_column_name='body')
