"""create token_transactions table

Revision ID: 0008_token_transactions
Revises: 0007_sto_audit
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0008_token_transactions"
down_revision: Union[str, None] = "0007_sto_audit"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "token_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("investor_id", sa.Integer(), nullable=False),
        sa.Column("sto_asset_id", sa.Integer(), nullable=False),
        sa.Column("quantity_purchased", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("total_amount_paid", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("on_chain_tx_hash", sa.String(length=66), nullable=True),
        sa.Column("block_number", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["investor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sto_asset_id"], ["sto_assets.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_token_transactions_investor_id"), "token_transactions", ["investor_id"], unique=False
    )
    op.create_index(
        op.f("ix_token_transactions_sto_asset_id"), "token_transactions", ["sto_asset_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_token_transactions_sto_asset_id"), table_name="token_transactions")
    op.drop_index(op.f("ix_token_transactions_investor_id"), table_name="token_transactions")
    op.drop_table("token_transactions")
