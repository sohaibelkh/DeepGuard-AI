"""ECG analysis schema: users full_name, analyses table, drop scans

Revision ID: b2c3d4e5f6a7
Revises: 17aee4829cf1
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa


revision = 'b2c3d4e5f6a7'
down_revision = '17aee4829cf1'
branch_labels = None
depends_on = None


def upgrade():
    # Create analyses table if it doesn't exist
    # Use try/except to handle idempotency
    try:
        op.create_table('analyses',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('file_name', sa.String(length=255), nullable=False),
            sa.Column('prediction', sa.String(length=64), nullable=False),
            sa.Column('confidence', sa.Float(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        with op.batch_alter_table('analyses', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_analyses_user_id'), ['user_id'], unique=False)
    except Exception:
        pass  # Table already exists

    # Drop scans table if it exists
    try:
        with op.batch_alter_table('scans', schema=None) as batch_op:
            batch_op.drop_index(batch_op.f('ix_scans_user_id'))
        op.drop_table('scans')
    except Exception:
        pass  # Table doesn't exist

    # Update users table to have full_name
    # First, check if users table has the columns we expect
    try:
        # Try to drop email index if it exists
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.drop_index(batch_op.f('ix_users_email'))
    except Exception:
        pass
    
    # Add full_name column if it doesn't exist
    try:
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.add_column(sa.Column('full_name', sa.String(length=255), nullable=True))
    except Exception:
        pass  # Column already exists
    
    # Set full_name based on username or provide default
    try:
        op.execute("UPDATE users SET full_name = username WHERE full_name IS NULL AND username IS NOT NULL")
        op.execute("UPDATE users SET full_name = 'User' WHERE full_name IS NULL")
    except Exception:
        # If username doesn't exist, update is harmless
        pass
    
    # Make full_name not null
    try:
        with op.batch_alter_table('users', schema=None) as batch_op:
            batch_op.alter_column('full_name', nullable=False)
    except Exception:
        pass

    # Drop username and role by recreating table (SQLite requires this)
    try:
        op.create_table('users_new',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        with op.batch_alter_table('users_new', schema=None) as batch_op:
            batch_op.create_index('ix_users_email', ['email'], unique=True)
        op.execute(
            "INSERT INTO users_new (id, full_name, email, password_hash, created_at) "
            "SELECT id, full_name, email, password_hash, created_at FROM users"
        )
        op.drop_table('users')
        op.rename_table('users_new', 'users')
    except Exception:
        # Only recreate table if users_new doesn't already exist
        # This means the old users table structure is gone
        try:
            with op.batch_alter_table('users', schema=None) as batch_op:
                batch_op.create_index('ix_users_email', ['email'], unique=True)
        except Exception:
            pass


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_email')
    op.create_table('users_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users_old', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_old_email'), ['email'], unique=True)
    op.execute(
        "INSERT INTO users_old (id, username, email, password_hash, role, created_at) "
        "SELECT id, full_name, email, password_hash, 'analyst', created_at FROM users"
    )
    op.drop_table('users')
    op.rename_table('users_old', 'users')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index('ix_users_email', ['email'], unique=True)

    op.create_table('scans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=16), nullable=False),
        sa.Column('prediction', sa.String(length=8), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('processing_time', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('scans', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_scans_user_id'), ['user_id'], unique=False)

    with op.batch_alter_table('analyses', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_analyses_user_id'))
    op.drop_table('analyses')
