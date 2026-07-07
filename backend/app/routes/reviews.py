from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.db import get_db
from app.models.reviews import Review
from app.models.project_requests import ProjectRequest
from app.models.parents import Parent
from app.models.children import Child
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

class ReviewCreate(BaseModel):
    project_id: int
    rating: int
    comment: str

@router.post("")
def submit_review(req: ReviewCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Submits a new review for a completed project."""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorization / Ownership check:
    # Only the parent of the child associated with the project can leave a review.
    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not authorized to review this project."
        )

    if project.status != "Completed":
        raise HTTPException(status_code=400, detail="Project must be completed to leave a review")
        
    # Check if a review already exists
    existing_review = db.query(Review).filter(Review.project_request_id == req.project_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this project")
        
    # Assuming parent_id is attached to project, and builder_id to service
    from app.models.project_requests import Approval
    approval = db.query(Approval).filter(Approval.request_id == req.project_id).first()
    parent_id = approval.parent_id if approval else None
    
    from app.models.builders import Service
    service = db.query(Service).filter(Service.id == project.service_id).first()
    builder_id = service.builder_id if service else None
    
    review = Review(
        project_request_id=req.project_id,
        parent_id=parent_id,
        builder_id=builder_id,
        rating=req.rating,
        comment=req.comment
    )
    db.add(review)
    db.commit()
    
    return {"message": "Review submitted successfully!"}
