from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.db import get_db
from app.models.builders import Builder, Service
from typing import List
from pydantic import BaseModel
import json

router = APIRouter(prefix="/builders", tags=["builders"])

class OnboardRequest(BaseModel):
    email: str
    name: str
    blurb: str
    categories: List[str]
    # For simplicity, we assume they list one default service right now
    service_type: str
    service_price: float
    service_category: str

@router.get("")
def get_builders(db: Session = Depends(get_db)):
    """Fetch all verified builders"""
    builders = db.query(Builder).filter(Builder.verification_status == "verified").all()
    
    result = []
    for b in builders:
        services = db.query(Service).filter(Service.builder_id == b.id).all()
        categories = json.loads(b.categories) if b.categories else []
        portfolio = json.loads(b.portfolio) if b.portfolio else []
        
        result.append({
            "id": b.id,
            "name": b.name,
            "rating": b.rating_avg,
            "image": portfolio[0] if portfolio else "/placeholder.svg",
            "projects": 0, # Could be aggregated from completed project_requests
            "categories": categories,
            "portfolio": portfolio,
            "blurb": b.blurb,
            "services": [{"type": s.type, "price": s.price, "category": s.category} for s in services]
        })
    return result

@router.get("/pending")
def get_pending_builders(db: Session = Depends(get_db)):
    """Fetch all pending builders for admin view"""
    builders = db.query(Builder).filter(Builder.verification_status == "pending").all()
    
    result = []
    for b in builders:
        categories = json.loads(b.categories) if b.categories else []
        result.append({
            "id": b.id,
            "name": b.name,
            "email": b.email,
            "blurb": b.blurb,
            "categories": categories,
            "status": b.verification_status
        })
    return result

@router.post("/onboard")
def onboard_builder(req: OnboardRequest, db: Session = Depends(get_db)):
    """Builder submits onboarding profile"""
    # Check if builder already exists
    builder = db.query(Builder).filter(Builder.email == req.email).first()
    
    if not builder:
        builder = Builder(email=req.email, verification_status="pending", rating_avg=0.0)
        db.add(builder)
        db.commit()
        db.refresh(builder)
    
    # Update profile
    builder.name = req.name
    builder.blurb = req.blurb
    builder.categories = json.dumps(req.categories)
    # Give them a default portfolio placeholder
    builder.portfolio = json.dumps(["/placeholder.svg?height=140&width=240&query=portfolio", "/placeholder.svg?height=140&width=240&query=item"])
    
    # Update or add service
    existing_service = db.query(Service).filter(Service.builder_id == builder.id).first()
    if existing_service:
        existing_service.type = req.service_type
        existing_service.price = req.service_price
        existing_service.category = req.service_category
    else:
        service = Service(
            builder_id=builder.id,
            type=req.service_type,
            price=req.service_price,
            category=req.service_category
        )
        db.add(service)
        
    db.commit()
    return {"message": "Onboarding submitted successfully, pending verification."}

@router.post("/{builder_id}/verify")
def verify_builder(builder_id: int, db: Session = Depends(get_db)):
    """Admin verifies a builder"""
    builder = db.query(Builder).filter(Builder.id == builder_id).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
        
    builder.verification_status = "verified"
    db.commit()
    return {"message": "Builder verified successfully"}
