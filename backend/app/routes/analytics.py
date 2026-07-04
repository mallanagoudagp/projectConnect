from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.services.db import get_db
from app.models.reviews import Review
from app.models.escrow import Escrow
from app.models.project_requests import ProjectRequest
from app.models.builders import Service
from app.models.parents import Parent

router = APIRouter(prefix="/builders", tags=["analytics"])

@router.get("/{builder_id}/analytics")
def get_builder_analytics(builder_id: int, db: Session = Depends(get_db)):
    """Retrieves total earnings, average rating, and recent reviews for a builder."""
    
    # Calculate Total Earnings (Escrow status == 'released')
    # First find all project IDs for this builder
    services = db.query(Service).filter(Service.builder_id == builder_id).all()
    service_ids = [s.id for s in services]
    
    projects = db.query(ProjectRequest).filter(ProjectRequest.service_id.in_(service_ids)).all()
    project_ids = [p.id for p in projects]
    
    total_earnings = db.query(func.sum(Escrow.amount)).filter(
        Escrow.project_request_id.in_(project_ids),
        Escrow.status == 'released'
    ).scalar() or 0.0
    
    # Get Reviews
    reviews = db.query(Review).filter(Review.builder_id == builder_id).order_by(Review.created_at.desc()).all()
    
    avg_rating = 0.0
    if reviews:
        avg_rating = sum([r.rating for r in reviews]) / len(reviews)
        
    formatted_reviews = []
    for r in reviews:
        parent = db.query(Parent).filter(Parent.id == r.parent_id).first()
        parent_name = parent.name if parent else "Anonymous Parent"
        formatted_reviews.append({
            "id": r.id,
            "parent_name": parent_name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at
        })
        
    return {
        "total_earnings": total_earnings,
        "average_rating": round(avg_rating, 1),
        "total_reviews": len(reviews),
        "recent_reviews": formatted_reviews
    }
