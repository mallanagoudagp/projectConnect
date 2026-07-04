from sqlalchemy import Column, Integer, String, ForeignKey
from app.services.db import Base

class Parent(Base):
    __tablename__ = 'parents'
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey('families.id'))
    name = Column(String)
    email = Column(String, unique=True)
