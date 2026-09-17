from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.services.db import get_db
from app.models.reviews import Review
from app.models.project_requests import ProjectRequest
from app.models.parents import Parent
from app.models.children import Child
from app.models.builders import Builder, Service
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    project_id: int
    rating: int
    comment: str


@router.get("")
def get_my_reviews(
    builder_id: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    GET /reviews?builder_id=N  — fetch reviews for a specific builder (public).
    GET /reviews               — builder fetches their own reviews (auth required).
    """
    if builder_id is not None:
        target_builder_id = builder_id
    elif current_user["role"] == "builder":
        builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
        if not builder:
            raise HTTPException(status_code=404, detail="Builder not found.")
        target_builder_id = builder.id
    else:
        raise HTTPException(status_code=400, detail="Provide builder_id query param.")

    reviews = (
        db.query(Review)
        .filter(Review.builder_id == target_builder_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    result = []
    for r in reviews:
        parent = db.query(Parent).filter(Parent.id == r.parent_id).first()
        project = db.query(ProjectRequest).filter(ProjectRequest.id == r.project_request_id).first()
        result.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "parent_name": parent.name if parent else "Anonymous",
            "project_title": project.title if project else "Project",
            "created_at": r.created_at,
        })
    return result


@router.post("")
def submit_review(
    req: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Parent submits a review for a completed project."""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only the parent of the child can review
    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to review this project.")

    if project.status != "Completed":
        raise HTTPException(status_code=400, detail="Project must be completed to leave a review")

    existing = db.query(Review).filter(Review.project_request_id == req.project_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this project")

    # Resolve builder_id
    builder_id = project.builder_id
    if not builder_id and project.service_id:
        service = db.query(Service).filter(Service.id == project.service_id).first()
        builder_id = service.builder_id if service else None

    review = Review(
        project_request_id=req.project_id,
        parent_id=parent.id,
        builder_id=builder_id,
        rating=req.rating,
        comment=req.comment,
    )
    db.add(review)
    db.flush()

    # Update builder's average rating
    if builder_id:
        avg = (
            db.query(func.avg(Review.rating))
            .filter(Review.builder_id == builder_id)
            .scalar()
        )
        builder = db.query(Builder).filter(Builder.id == builder_id).first()
        if builder and avg is not None:
            builder.rating_avg = round(float(avg), 2)

    db.commit()
    return {"message": "Review submitted successfully!"}
