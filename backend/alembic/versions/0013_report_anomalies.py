"""add anomalies JSON column to ai_analysis_reports

Revision ID: 0013_report_anomalies
Revises: 0012_spec_fields
Create Date: 2026-06-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0013_report_anomalies"
down_revision: Union[str, None] = "0012_spec_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_analysis_reports",
        sa.Column("anomalies", sa.JSON(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("ai_analysis_reports", "anomalies")
