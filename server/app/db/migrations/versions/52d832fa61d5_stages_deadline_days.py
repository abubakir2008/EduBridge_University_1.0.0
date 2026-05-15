"""stages_deadline_days

Revision ID: 52d832fa61d5
Revises: d0c2371f715b
Create Date: 2026-05-15 09:36:52.277031

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '52d832fa61d5'
down_revision: Union[str, None] = 'd0c2371f715b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('stages', sa.Column('deadline_days', sa.Integer(), nullable=True))
    op.drop_column('stages', 'deadline')


def downgrade() -> None:
    op.add_column('stages', sa.Column('deadline', sa.DATE(), nullable=True))
    op.drop_column('stages', 'deadline_days')
