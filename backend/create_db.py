from app.services.db import Base, engine
import app.models  # Ensure all models are imported

Base.metadata.create_all(bind=engine)
print("Database tables created successfully.")
