"""create sto_assets and audit_logs tables

Revision ID: 0007_sto_audit
Revises: 0006_loan_applications
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007_sto_audit"
down_revision: Union[str, None] = "0006_loan_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sto_assets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("issuer_id", sa.Integer(), nullable=False),
        sa.Column("asset_type", sa.Enum("SOLAR", "WIND", "FOREST", "HYDRO", name="asset_type"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column("total_token_supply", sa.Integer(), nullable=False),
        sa.Column("remaining_tokens", sa.Integer(), nullable=False),
        sa.Column("token_price", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("contract_address", sa.String(length=64), nullable=True),
        sa.Column("contract_abi", sa.JSON(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("DRAFTING", "COMPILING", "DEPLOYING", "LISTED", "SOLD_OUT", "CLOSED", name="sto_status"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["issuer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sto_assets_issuer_id"), "sto_assets", ["issuer_id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("target_type", sa.String(length=64), nullable=True),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("detail", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_actor_id"), "audit_logs", ["actor_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_logs_actor_id"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_sto_assets_issuer_id"), table_name="sto_assets")
    op.drop_table("sto_assets")
