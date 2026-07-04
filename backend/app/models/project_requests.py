from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.db import Base

class ProjectRequest(Base):
    __tablename__ = 'project_requests'
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey('children.id'))
    service_id = Column(Integer, ForeignKey('services.id'))
    status = Column(String, default='Pending') # Pending, Approved, In Progress, Completed
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    child = relationship("Child")
    service = relationship("Service")

class Approval(Base):
    __tablename__ = 'approvals'
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('project_requests.id'), unique=True)
    parent_id = Column(Integer, ForeignKey('parents.id'))
    status = Column(String, default='Pending')
    locked_at = Column(DateTime, nullable=True)
    
    request = relationship("ProjectRequest")
    parent = relationship("Parent")
