from sqlalchemy import Column, Integer, String, ForeignKey
from app.services.db import Base

class Child(Base):
    __tablename__ = 'children'
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey('families.id'))
    name = Column(String)
    email = Column(String, unique=True, nullable=True)  # student's auth email
    grade = Column(String)
    age = Column(Integer)
    avatar = Column(String)
