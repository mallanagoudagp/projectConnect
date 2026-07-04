from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.db import Base

class Session(Base):
    __tablename__ = 'sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    project_request_id = Column(Integer, ForeignKey('project_requests.id'))
    topic = Column(String)
    scheduled_at = Column(DateTime)
    duration_minutes = Column(Integer, default=60)
    meeting_link = Column(String, nullable=True)
    status = Column(String, default="proposed") # proposed, scheduled, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project_request = relationship("ProjectRequest", backref="sessions")
