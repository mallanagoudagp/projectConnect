from sqlalchemy import Column, Integer, String, ForeignKey, Float
from app.services.db import Base

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id'))
    amount = Column(Float)
    status = Column(String, default='pending')
    gateway_id = Column(String)
    idempotency_key = Column(String, nullable=True, index=True)

