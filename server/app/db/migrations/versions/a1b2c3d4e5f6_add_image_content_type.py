"""add image content type to lessons

Revision ID: a1b2c3d4e5f6
Revises: 52d832fa61d5
Create Date: 2026-05-15

"""
from alembic import op

revision = 'a1b2c3d4e5f6'
down_revision = '52d832fa61d5'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE contenttype ADD VALUE IF NOT EXISTS 'image'")


def downgrade():
    pass
