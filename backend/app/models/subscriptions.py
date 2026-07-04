from sqlalchemy import Column, Integer, String
from app.services.db import Base

class Subscription(Base):
    __tablename__ = 'subscriptions'
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, index=True)
    status = Column(String, default='pending')
    payment_status = Column(String, default='pending')
