"""add_student_stage_deadlines

Revision ID: d0c2371f715b
Revises: 8c83e1efa620
Create Date: 2026-05-15 09:24:07.087475

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd0c2371f715b'
down_revision: Union[str, None] = '8c83e1efa620'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('student_stage_deadlines',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_progress_id', sa.UUID(), nullable=False),
        sa.Column('stage_id', sa.UUID(), nullable=False),
        sa.Column('deadline', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['stage_id'], ['stages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_progress_id'], ['student_progress.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_progress_id', 'stage_id', name='uq_progress_stage_deadline'),
    )


def downgrade() -> None:
    op.drop_table('student_stage_deadlines')
