"""add expected_yield, co2_offset_per_year, location to sto_assets

Revision ID: 0011_sto_yield_co2
Revises: 0010_user_is_active
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0011_sto_yield_co2"
down_revision: Union[str, None] = "0010_user_is_active"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sto_assets", sa.Column("expected_yield", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0"))
    op.add_column("sto_assets", sa.Column("co2_offset_per_year", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("sto_assets", sa.Column("location", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("sto_assets", "location")
    op.drop_column("sto_assets", "co2_offset_per_year")
    op.drop_column("sto_assets", "expected_yield")
