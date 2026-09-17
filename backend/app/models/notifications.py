from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime
from datetime import datetime
from app.services.db import Base

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, index=True, nullable=True)
    user_email = Column(String, index=True, nullable=True)  # recipient email
    type = Column(String, nullable=True)
    message = Column(String)
    data = Column(JSON, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

