"""create dividends table

Revision ID: 0009_dividends
Revises: 0008_token_transactions
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0009_dividends"
down_revision: Union[str, None] = "0008_token_transactions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dividends",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sto_asset_id", sa.Integer(), nullable=False),
        sa.Column("per_token_amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("distribution_date", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("on_chain_tx_hash", sa.String(length=66), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["sto_asset_id"], ["sto_assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_dividends_sto_asset_id"), "dividends", ["sto_asset_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_dividends_sto_asset_id"), table_name="dividends")
    op.drop_table("dividends")
