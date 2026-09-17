from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.db import Base

class ProjectRequest(Base):
    __tablename__ = 'project_requests'
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey('children.id'))
    service_id = Column(Integer, ForeignKey('services.id'), nullable=True)
    # Direct builder assignment (null = global marketplace)
    builder_id = Column(Integer, ForeignKey('builders.id'), nullable=True)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    budget = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)   # Set by builder when they quote
    # Status machine:
    # Pending Parent Approval → Pending Builder Acceptance → Pending Final Parent Approval
    # → In Progress → Pending Parent Completion Review → Completed | Declined
    status = Column(String, default='Pending Parent Approval')
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    child = relationship("Child")
    service = relationship("Service", foreign_keys=[service_id])

class Approval(Base):
    __tablename__ = 'approvals'
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey('project_requests.id'), unique=True)
    parent_id = Column(Integer, ForeignKey('parents.id'))
    status = Column(String, default='Pending')
    locked_at = Column(DateTime, nullable=True)
    
    request = relationship("ProjectRequest")
    parent = relationship("Parent")
