from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.services.db import Base

class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(Integer, primary_key=True, index=True)
    project_request_id = Column(Integer, ForeignKey('project_requests.id'))
    parent_id = Column(Integer, ForeignKey('parents.id'))
    builder_id = Column(Integer, ForeignKey('builders.id'))
    rating = Column(Integer) # 1 to 5
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
