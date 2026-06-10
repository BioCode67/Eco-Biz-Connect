"""create financial_products table

Revision ID: 0005_financial_products
Revises: 0004_blockchain_esg
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_financial_products"
down_revision: Union[str, None] = "0004_blockchain_esg"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "financial_products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_code", sa.String(length=64), nullable=False),
        sa.Column("bank_name", sa.String(length=128), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("base_rate", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("max_amount", sa.Integer(), nullable=False),
        sa.Column("term_months", sa.Integer(), nullable=False),
        sa.Column("min_esg_grade", sa.String(length=2), nullable=False),
        sa.Column("cached_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_financial_products_product_code"),
        "financial_products",
        ["product_code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_financial_products_product_code"), table_name="financial_products")
    op.drop_table("financial_products")
