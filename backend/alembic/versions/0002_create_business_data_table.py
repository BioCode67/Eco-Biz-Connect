"""create business_data table

Revision ID: 0002_business_data
Revises: 91d9987d5d32
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_business_data"
down_revision: Union[str, None] = "91d9987d5d32"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "business_data",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column(
            "processing_status",
            sa.Enum(
                "UPLOADED",
                "PARSING",
                "PARSED",
                "AI_QUEUED",
                "AI_COMPLETED",
                "ESG_COMPLETED",
                "FAILED",
                name="processing_status",
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_business_data_merchant_id"), "business_data", ["merchant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_business_data_merchant_id"), table_name="business_data")
    op.drop_table("business_data")
