"""create blockchain_records and esg_scores tables

Revision ID: 0004_blockchain_esg
Revises: 0003_ai_reports
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_blockchain_esg"
down_revision: Union[str, None] = "0003_ai_reports"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "blockchain_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "record_type",
            sa.Enum("ESG_ANCHOR", "TOKEN_PURCHASE", "DIVIDEND", "STO_DEPLOY", name="blockchain_record_type"),
            nullable=False,
        ),
        sa.Column("data_hash", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=66), nullable=False),
        sa.Column("block_number", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tx_hash"),
    )

    op.create_table(
        "esg_scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("business_data_id", sa.Integer(), nullable=False),
        sa.Column("env_score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("social_score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("governance_score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("composite_score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("score_grade", sa.String(length=2), nullable=False),
        sa.Column("on_chain_tx_hash", sa.String(length=66), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["business_data_id"], ["business_data.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_esg_scores_merchant_id"), "esg_scores", ["merchant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_esg_scores_merchant_id"), table_name="esg_scores")
    op.drop_table("esg_scores")
    op.drop_table("blockchain_records")
