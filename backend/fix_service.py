from app.services.db import engine
from sqlalchemy import text

conn = engine.connect()

# Create a service for Abhishek if it doesn't exist
service_exists = conn.execute(text("SELECT id FROM services WHERE builder_id=2")).first()
if not service_exists:
    conn.execute(text("INSERT INTO services (builder_id, type, price, category) VALUES (2, 'Custom Build', 150.0, 'models')"))
    conn.commit()

service_id = conn.execute(text("SELECT id FROM services WHERE builder_id=2")).first()[0]

# Link the latest unlinked requests to Abhishek
conn.execute(text(f"UPDATE project_requests SET service_id={service_id} WHERE service_id IS NULL AND status='Approved'"))
conn.commit()

print(f"Linked requests to Abhishek (service_id={service_id})")
conn.close()
