"""add spec-complete fields across domain models

Revision ID: 0012_spec_fields
Revises: 0011_sto_yield_co2
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012_spec_fields"
down_revision: Union[str, None] = "0011_sto_yield_co2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=32), nullable=True))

    op.add_column("sto_assets", sa.Column("installed_capacity_mw", sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column("sto_assets", sa.Column("dividend_period_months", sa.Integer(), nullable=False, server_default="3"))

    op.add_column("loan_applications", sa.Column("loan_purpose", sa.String(length=255), nullable=True))
    op.add_column("loan_applications", sa.Column("bank_reference_id", sa.String(length=64), nullable=True))
    op.add_column("loan_applications", sa.Column("decision_received_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("dividends", sa.Column("total_distributed_amount", sa.Numeric(precision=18, scale=2), nullable=False, server_default="0"))

    op.add_column("token_transactions", sa.Column("payment_gateway_ref", sa.String(length=64), nullable=True))

    op.add_column("blockchain_records", sa.Column("associated_entity_type", sa.String(length=48), nullable=True))
    op.add_column("blockchain_records", sa.Column("associated_entity_id", sa.Integer(), nullable=True))
    op.add_column("blockchain_records", sa.Column("network_id", sa.String(length=32), nullable=False, server_default="ebc-l2-testnet"))
    op.add_column("blockchain_records", sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("blockchain_records", "confirmed_at")
    op.drop_column("blockchain_records", "network_id")
    op.drop_column("blockchain_records", "associated_entity_id")
    op.drop_column("blockchain_records", "associated_entity_type")
    op.drop_column("token_transactions", "payment_gateway_ref")
    op.drop_column("dividends", "total_distributed_amount")
    op.drop_column("loan_applications", "decision_received_at")
    op.drop_column("loan_applications", "bank_reference_id")
    op.drop_column("loan_applications", "loan_purpose")
    op.drop_column("sto_assets", "dividend_period_months")
    op.drop_column("sto_assets", "installed_capacity_mw")
    op.drop_column("users", "phone")
    op.drop_column("users", "name")
