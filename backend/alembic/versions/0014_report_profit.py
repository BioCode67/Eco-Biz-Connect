"""add profit JSON column to ai_analysis_reports

Revision ID: 0014_report_profit
Revises: 0013_report_anomalies
Create Date: 2026-06-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_report_profit"
down_revision: Union[str, None] = "0013_report_anomalies"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_analysis_reports",
        sa.Column("profit", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ai_analysis_reports", "profit")
