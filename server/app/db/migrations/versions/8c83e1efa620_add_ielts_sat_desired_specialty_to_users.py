"""add_ielts_sat_desired_specialty_to_users

Revision ID: 8c83e1efa620
Revises: 3c79bdf929ef
Create Date: 2026-05-15 09:02:15.110169

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '8c83e1efa620'
down_revision: Union[str, None] = '3c79bdf929ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('ielts_score', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('sat_score', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('desired_specialty', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'desired_specialty')
    op.drop_column('users', 'sat_score')
    op.drop_column('users', 'ielts_score')
