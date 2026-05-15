"""soft delete: add deleted_at to users and universities

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a1
Create Date: 2026-05-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('deleted_at', TIMESTAMP(timezone=True), nullable=True))
    op.add_column('universities', sa.Column('deleted_at', TIMESTAMP(timezone=True), nullable=True))
    op.create_index('ix_users_deleted_at', 'users', ['deleted_at'])
    op.create_index('ix_universities_deleted_at', 'universities', ['deleted_at'])


def downgrade():
    op.drop_index('ix_users_deleted_at', 'users')
    op.drop_index('ix_universities_deleted_at', 'universities')
    op.drop_column('users', 'deleted_at')
    op.drop_column('universities', 'deleted_at')
