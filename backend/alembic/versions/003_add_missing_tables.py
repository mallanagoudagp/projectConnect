"""
Alembic migration: create tables for builders, services, project_requests,
approvals, sessions, escrow_payments, file_attachments, and reviews.

These tables were previously only created via Base.metadata.create_all()
in create_db.py / seed.py and were missing from Alembic's migration
history entirely. Running `alembic upgrade head` on a fresh database
without this migration would leave these 8 tables missing.
"""
revision = '003_add_missing_tables'
down_revision = '002addidempotency'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'builders',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.String, index=True),
        sa.Column('name', sa.String),
        sa.Column('email', sa.String, unique=True),
        sa.Column('verification_status', sa.String, server_default='pending'),
        sa.Column('rating_avg', sa.Float, server_default='0.0'),
        sa.Column('blurb', sa.String, nullable=True),
        sa.Column('categories', sa.String, nullable=True),
        sa.Column('portfolio', sa.String, nullable=True),
    )

    op.create_table(
        'services',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('builder_id', sa.Integer, sa.ForeignKey('builders.id')),
        sa.Column('type', sa.String),
        sa.Column('price', sa.Float),
        sa.Column('category', sa.String),
    )

    op.create_table(
        'project_requests',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('child_id', sa.Integer, sa.ForeignKey('children.id')),
        sa.Column('service_id', sa.Integer, sa.ForeignKey('services.id')),
        sa.Column('status', sa.String, server_default='Pending'),
        sa.Column('progress', sa.Integer, server_default='0'),
        sa.Column('created_at', sa.DateTime),
    )

    op.create_table(
        'approvals',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('request_id', sa.Integer, sa.ForeignKey('project_requests.id'), unique=True),
        sa.Column('parent_id', sa.Integer, sa.ForeignKey('parents.id')),
        sa.Column('status', sa.String, server_default='Pending'),
        sa.Column('locked_at', sa.DateTime, nullable=True),
    )

    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('project_request_id', sa.Integer, sa.ForeignKey('project_requests.id')),
        sa.Column('topic', sa.String),
        sa.Column('scheduled_at', sa.DateTime),
        sa.Column('duration_minutes', sa.Integer, server_default='60'),
        sa.Column('meeting_link', sa.String, nullable=True),
        sa.Column('status', sa.String, server_default='proposed'),
        sa.Column('created_at', sa.DateTime),
    )

    op.create_table(
        'escrow_payments',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('project_request_id', sa.Integer, sa.ForeignKey('project_requests.id'), unique=True),
        sa.Column('amount', sa.Float, nullable=False),
        sa.Column('status', sa.String, server_default='held'),
        sa.Column('created_at', sa.DateTime),
        sa.Column('released_at', sa.DateTime, nullable=True),
    )

    op.create_table(
        'file_attachments',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('project_request_id', sa.Integer, sa.ForeignKey('project_requests.id')),
        sa.Column('uploader_role', sa.String),
        sa.Column('file_name', sa.String),
        sa.Column('file_url', sa.String),
        sa.Column('created_at', sa.DateTime),
    )

    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('project_request_id', sa.Integer, sa.ForeignKey('project_requests.id')),
        sa.Column('parent_id', sa.Integer, sa.ForeignKey('parents.id')),
        sa.Column('builder_id', sa.Integer, sa.ForeignKey('builders.id')),
        sa.Column('rating', sa.Integer),
        sa.Column('comment', sa.String),
        sa.Column('created_at', sa.DateTime),
    )


def downgrade():
    op.drop_table('reviews')
    op.drop_table('file_attachments')
    op.drop_table('escrow_payments')
    op.drop_table('sessions')
    op.drop_table('approvals')
    op.drop_table('project_requests')
    op.drop_table('services')
    op.drop_table('builders')
