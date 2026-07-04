from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.services.db import Base

class FileAttachment(Base):
    __tablename__ = 'file_attachments'
    
    id = Column(Integer, primary_key=True, index=True)
    project_request_id = Column(Integer, ForeignKey('project_requests.id'))
    uploader_role = Column(String) # 'builder' or 'student'
    file_name = Column(String)
    file_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
