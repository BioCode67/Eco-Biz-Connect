"""create ai_analysis_reports table

Revision ID: 0003_ai_reports
Revises: 0002_business_data
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_ai_reports"
down_revision: Union[str, None] = "0002_business_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_analysis_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_data_id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("summary", sa.String(length=512), nullable=False),
        sa.Column("sales_forecast", sa.JSON(), nullable=False),
        sa.Column("cost_optimization_tips", sa.JSON(), nullable=False),
        sa.Column("district_comparison", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["business_data_id"], ["business_data.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["merchant_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_data_id"),
    )
    op.create_index(
        op.f("ix_ai_analysis_reports_merchant_id"), "ai_analysis_reports", ["merchant_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_analysis_reports_merchant_id"), table_name="ai_analysis_reports")
    op.drop_table("ai_analysis_reports")
