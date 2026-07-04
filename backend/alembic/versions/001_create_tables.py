"""
Alembic migration: create all initial tables
"""
# Alembic revision identifiers
revision = '001_create_tables'
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'families',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String),
    )
    op.create_table(
        'parents',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('family_id', sa.Integer, sa.ForeignKey('families.id')),
        sa.Column('name', sa.String),
        sa.Column('email', sa.String, unique=True),
    )
    op.create_table(
        'children',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('family_id', sa.Integer, sa.ForeignKey('families.id')),
        sa.Column('name', sa.String),
        sa.Column('grade', sa.String),
        sa.Column('age', sa.Integer),
        sa.Column('avatar', sa.String),
    )
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('parent_id', sa.Integer),
        sa.Column('status', sa.String, default='pending'),
        sa.Column('payment_status', sa.String, default='pending'),
    )
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('subscription_id', sa.Integer, sa.ForeignKey('subscriptions.id')),
        sa.Column('amount', sa.Float),
        sa.Column('status', sa.String, default='pending'),
        sa.Column('gateway_id', sa.String),
    )
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('family_id', sa.Integer),
        sa.Column('type', sa.String),
        sa.Column('message', sa.String),
        sa.Column('data', sa.JSON),
    )

def downgrade():
    op.drop_table('notifications')
    op.drop_table('payments')
    op.drop_table('subscriptions')
    op.drop_table('children')
    op.drop_table('parents')
    op.drop_table('families')
