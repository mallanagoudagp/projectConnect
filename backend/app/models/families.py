from sqlalchemy import Column, Integer, String
from app.services.db import Base

class Family(Base):
    __tablename__ = 'families'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
