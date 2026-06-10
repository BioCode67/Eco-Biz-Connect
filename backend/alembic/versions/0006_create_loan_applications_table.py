"""create loan_applications table

Revision ID: 0006_loan_applications
Revises: 0005_financial_products
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0006_loan_applications"
down_revision: Union[str, None] = "0005_financial_products"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "loan_applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("financial_product_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("applied_rate", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("term_months", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", name="loan_status"),
            nullable=False,
        ),
        sa.Column("decision_reason", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["financial_product_id"], ["financial_products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_loan_applications_merchant_id"), "loan_applications", ["merchant_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_loan_applications_merchant_id"), table_name="loan_applications")
    op.drop_table("loan_applications")
