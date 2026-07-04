from sqlalchemy import Column, Integer, String, JSON
from app.services.db import Base

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, index=True)
    type = Column(String)
    message = Column(String)
    data = Column(JSON)
