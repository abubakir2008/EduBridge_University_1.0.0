"""add user matching fields for university selection

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-05-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'e2f3a4b5c6d7'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('toefl_score', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('hsk_level', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('max_budget_rmb', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('wants_language_year', sa.String(10), nullable=True))
    op.add_column('users', sa.Column('preferred_difficulty', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('program_level', sa.String(20), nullable=True))


def downgrade():
    op.drop_column('users', 'program_level')
    op.drop_column('users', 'preferred_difficulty')
    op.drop_column('users', 'wants_language_year')
    op.drop_column('users', 'max_budget_rmb')
    op.drop_column('users', 'hsk_level')
    op.drop_column('users', 'toefl_score')
