"""add university program and admission fields

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-05-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('universities', sa.Column('province', sa.String(100), nullable=True))
    op.add_column('universities', sa.Column('min_requirements', sa.Text(), nullable=True))

    op.add_column('universities', sa.Column('programs_bachelor_chinese', sa.JSON(), nullable=True))
    op.add_column('universities', sa.Column('programs_masters_chinese', sa.JSON(), nullable=True))
    op.add_column('universities', sa.Column('programs_bachelor_english', sa.JSON(), nullable=True))
    op.add_column('universities', sa.Column('programs_masters_english', sa.JSON(), nullable=True))

    op.add_column('universities', sa.Column('has_language_year', sa.Boolean(), nullable=True, server_default='false'))

    op.add_column('universities', sa.Column('tuition_bachelor', sa.String(300), nullable=True))
    op.add_column('universities', sa.Column('tuition_masters', sa.String(300), nullable=True))
    op.add_column('universities', sa.Column('tuition_language_year', sa.String(300), nullable=True))
    op.add_column('universities', sa.Column('application_fee', sa.String(200), nullable=True))

    op.add_column('universities', sa.Column('dormitory_info', sa.Text(), nullable=True))

    op.add_column('universities', sa.Column('documents_bachelor', sa.JSON(), nullable=True))
    op.add_column('universities', sa.Column('documents_masters', sa.JSON(), nullable=True))
    op.add_column('universities', sa.Column('documents_language_year', sa.JSON(), nullable=True))

    op.add_column('universities', sa.Column('difficulty', sa.String(50), nullable=True))
    op.add_column('universities', sa.Column('deadline', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('universities', 'deadline')
    op.drop_column('universities', 'difficulty')
    op.drop_column('universities', 'documents_language_year')
    op.drop_column('universities', 'documents_masters')
    op.drop_column('universities', 'documents_bachelor')
    op.drop_column('universities', 'dormitory_info')
    op.drop_column('universities', 'application_fee')
    op.drop_column('universities', 'tuition_language_year')
    op.drop_column('universities', 'tuition_masters')
    op.drop_column('universities', 'tuition_bachelor')
    op.drop_column('universities', 'has_language_year')
    op.drop_column('universities', 'programs_masters_english')
    op.drop_column('universities', 'programs_bachelor_english')
    op.drop_column('universities', 'programs_masters_chinese')
    op.drop_column('universities', 'programs_bachelor_chinese')
    op.drop_column('universities', 'min_requirements')
    op.drop_column('universities', 'province')
