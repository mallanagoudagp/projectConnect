import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import all models to register them with Base
from app.models import families, parents, children, subscriptions, payments, notifications
from app.services.db import Base

# Postgres setup (uses your existing config)
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mallu123@localhost:5432/buildtrack")
postgres_engine = create_engine(POSTGRES_URL)
PostgresSession = sessionmaker(bind=postgres_engine)
postgres_session = PostgresSession()

# Create all tables in Postgres first
print("Creating tables in Postgres...")
Base.metadata.create_all(bind=postgres_engine)

try:
    # Create default subscription first since payments reference it
    print("Creating default subscription...")
    postgres_session.execute(text("""
        INSERT INTO subscriptions (id, parent_id, status, payment_status) 
        VALUES (1, 1, 'active', 'pending') 
        ON CONFLICT (id) DO NOTHING
    """))
    postgres_session.commit()
    
    # Now run your tests to see if the setup works
    print("Database setup complete! You can now run your tests.")
    print("Run: pytest tests/test_api.py")
    
except Exception as e:
    print(f"Setup failed: {e}")
    postgres_session.rollback()
finally:
    postgres_session.close()
