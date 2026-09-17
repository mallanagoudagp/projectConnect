from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
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
    
    service_projects = (
        db.query(ProjectRequest)
        .options(joinedload(ProjectRequest.service))
        .filter(ProjectRequest.service_id.in_(service_ids)).all()
        if service_ids else []
    )
    direct_projects = (
        db.query(ProjectRequest)
        .options(joinedload(ProjectRequest.service))
        .filter(ProjectRequest.builder_id == builder_id).all()
    )
    projects_by_id = {p.id: p for p in service_projects + direct_projects}
    project_ids = set(projects_by_id)

    # Released escrow is authoritative when it exists. Older/demo completed
    # projects may not have an escrow row, so use their completed value once.
    escrow_rows = (
        db.query(Escrow)
        .filter(Escrow.project_request_id.in_(project_ids))
        .all()
        if project_ids else []
    )
    released_by_project = {
        escrow.project_request_id: escrow.amount
        for escrow in escrow_rows
        if escrow.status == "released"
    }
    total_earnings = 0.0
    for project_id, project in projects_by_id.items():
        if project_id in released_by_project:
            total_earnings += released_by_project[project_id]
        elif project.status == "Completed":
            total_earnings += project.final_price or (project.service.price if project.service else None) or project.budget or 0
    
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
        
    # Completed projects count
    completed_count = db.query(ProjectRequest).filter(
        ProjectRequest.service_id.in_(service_ids),
        ProjectRequest.status == "Completed",
    ).count()
    completed_count += db.query(ProjectRequest).filter(
        ProjectRequest.builder_id == builder_id,
        ProjectRequest.status == "Completed",
    ).count()

    return {
        "total_earnings": total_earnings,
        "average_rating": round(avg_rating, 1),
        "total_reviews": len(reviews),
        "projects_completed": completed_count,
        "recent_reviews": formatted_reviews
    }
