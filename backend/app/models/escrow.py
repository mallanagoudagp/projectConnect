from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.services.db import Base

class Escrow(Base):
    __tablename__ = 'escrow_payments'
    
    id = Column(Integer, primary_key=True, index=True)
    project_request_id = Column(Integer, ForeignKey('project_requests.id'), unique=True)
    amount = Column(Float, nullable=False)
    status = Column(String, default="held") # 'held', 'released', 'refunded'
    created_at = Column(DateTime, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)
