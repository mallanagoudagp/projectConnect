import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import all models to register them with Base
from app.models import families, parents, children, subscriptions, payments, notifications
from app.services.db import Base

# SQLite setup
SQLITE_URL = "sqlite:///c:/Users/malla/Downloads/build-track-app-design (1)/backend/test.db"
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SqliteSession = sessionmaker(bind=sqlite_engine)
sqlite_session = SqliteSession()

# Postgres setup (uses your existing config)
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mallu123@localhost:5432/buildtrack")
postgres_engine = create_engine(POSTGRES_URL)
PostgresSession = sessionmaker(bind=postgres_engine)
postgres_session = PostgresSession()

# Create all tables in Postgres first
print("Creating tables in Postgres...")
Base.metadata.create_all(bind=postgres_engine)

def migrate_table_raw(table_name, add_columns=None):
    """Migrate table using raw SQL to handle schema differences"""
    print(f"Migrating {table_name}...")
    
    # Get data from SQLite
    sqlite_rows = sqlite_session.execute(text(f"SELECT * FROM {table_name}")).fetchall()
    
    if not sqlite_rows:
        print(f"No data found in {table_name}")
        # For subscriptions, create a default record if payments reference it
        if table_name == "subscriptions":
            # Create a default subscription for payments
            default_subscription = {
                'id': 1,
                'parent_id': 1,
                'status': 'active',
                'payment_status': 'pending'
            }
            columns = list(default_subscription.keys())
            placeholders = ', '.join([':param' + str(i) for i in range(len(columns))])
            insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            params = {f'param{i}': val for i, val in enumerate(default_subscription.values())}
            postgres_session.execute(text(insert_sql), params)
            postgres_session.commit()
            print(f"Created default subscription record")
        return
    
    # Get column names from first row
    sqlite_columns = list(sqlite_rows[0]._mapping.keys())
    
    # Prepare data for insertion
    insert_data = []
    for row in sqlite_rows:
        row_data = list(row)
        # Add default values for new columns
        if add_columns:
            for default_val in add_columns.values():
                row_data.append(default_val)
        insert_data.append(row_data)
    
    # Prepare column list for Postgres
    postgres_columns = sqlite_columns[:]
    if add_columns:
        postgres_columns.extend(add_columns.keys())
    
    # Insert into Postgres
    placeholders = ', '.join([':param' + str(i) for i in range(len(postgres_columns))])
    insert_sql = f"INSERT INTO {table_name} ({', '.join(postgres_columns)}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
    
    for row_data in insert_data:
        params = {f'param{i}': val for i, val in enumerate(row_data)}
        postgres_session.execute(text(insert_sql), params)
    
    postgres_session.commit()
    print(f"Migrated {len(insert_data)} rows for {table_name}")

if __name__ == "__main__":
    try:
        # Migrate tables - order matters due to foreign keys
        migrate_table_raw("families")
        migrate_table_raw("parents")
        migrate_table_raw("children")
        migrate_table_raw("subscriptions")
        
        # Payments table needs idempotency_key column added
        migrate_table_raw("payments", {"idempotency_key": ""})
        
        migrate_table_raw("notifications")
        
        print("Migration complete!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        postgres_session.rollback()
    finally:
        sqlite_session.close()
        postgres_session.close()
