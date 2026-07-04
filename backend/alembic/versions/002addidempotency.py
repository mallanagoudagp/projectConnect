"""
Alembic migration: add idempotency_key column to payments
"""
revision = '002addidempotency'
down_revision = '001_create_tables'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('payments', sa.Column('idempotency_key', sa.String(), nullable=True))
    op.create_index('ix_payments_idempotency_key', 'payments', ['idempotency_key'])

def downgrade():
    op.drop_index('ix_payments_idempotency_key', table_name='payments')
    op.drop_column('payments', 'idempotency_key')
