"""add_new_tables_and_columns

Revision ID: 3c79bdf929ef
Revises: 
Create Date: 2026-05-15 08:47:12.078476

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '3c79bdf929ef'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline migration — all tables already exist in DB.
    # JSONB vs JSON type difference is cosmetic, no change needed.
    pass


def downgrade() -> None:
    pass
