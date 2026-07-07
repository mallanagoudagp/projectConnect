"""
Alembic migration: add email column to children table so students
can be looked up by their Supabase auth email instead of a hardcoded integer ID.
"""
revision = '004_add_child_email'
down_revision = '003_add_missing_tables'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column(
        'children',
        sa.Column('email', sa.String, unique=True, nullable=True)
    )


def downgrade():
    op.drop_column('children', 'email')
