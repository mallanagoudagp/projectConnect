import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import payments, notifications, families, parents, children, subscriptions  # import all your models

# SQLite setup
SQLITE_URL = "sqlite:///c:/Users/malla/Downloads/build-track-app-design (1)/backend/test.db" # Update this path to your actual SQLite file
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SqliteSession = sessionmaker(bind=sqlite_engine)
sqlite_session = SqliteSession()

# Postgres setup (uses your existing config)
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:mallu123@localhost:5432/buildtrack")
postgres_engine = create_engine(POSTGRES_URL)
PostgresSession = sessionmaker(bind=postgres_engine)
postgres_session = PostgresSession()

def migrate_table(Model):
    rows = sqlite_session.query(Model).all()
    for row in rows:
        postgres_session.merge(row)  # merge avoids duplicate PK errors
    postgres_session.commit()
    print(f"Migrated {len(rows)} rows for {Model.__name__}")

if __name__ == "__main__":
    migrate_table(payments.Payment)
    migrate_table(notifications.Notification)
    migrate_table(families.Family)
    migrate_table(parents.Parent)
    migrate_table(children.Child)
    migrate_table(subscriptions.Subscription)
    print("Migration complete.")