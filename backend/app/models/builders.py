from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.db import Base

class Builder(Base):
    __tablename__ = 'builders'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Assuming JWT auth ID is string/UUID
    name = Column(String)
    email = Column(String, unique=True)
    verification_status = Column(String, default='pending')
    rating_avg = Column(Float, default=0.0)
    blurb = Column(String, nullable=True)
    categories = Column(String, nullable=True) # JSON array as string
    portfolio = Column(String, nullable=True) # JSON array as string

class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    builder_id = Column(Integer, ForeignKey('builders.id'))
    title = Column(String, nullable=True)  # user-facing name e.g. "Solar System Model"
    type = Column(String)  # Guided Learning, Hybrid Learning, Model Delivery
    description = Column(Text, nullable=True)
    price = Column(Float)
    category = Column(String)

    builder = relationship("Builder")

