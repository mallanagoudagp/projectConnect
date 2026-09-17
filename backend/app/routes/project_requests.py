from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.project_requests import ProjectRequest
from app.models.children import Child
from app.models.builders import Builder, Service
from app.models.notifications import Notification
from app.models.parents import Parent
from app.services.db import get_db
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/project-requests", tags=["project-requests"])


class SubmitRequestBody(BaseModel):
    title: str
    description: Optional[str] = None
    budget: Optional[float] = None
    # builder_id = None means "Global Marketplace"
    builder_id: Optional[int] = None
    service_id: Optional[int] = None


@router.post("")
def submit_project_request(
    body: SubmitRequestBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Student submits a new project request. Appears as Pending Parent Approval on the parent's dashboard."""
    if current_user.get("role") not in ("student", "child"):
        raise HTTPException(status_code=403, detail="Only students can submit project requests.")

    child = db.query(Child).filter(Child.email == current_user["email"]).first()
    if not child:
        raise HTTPException(status_code=404, detail="Student record not found. Please contact support.")

    if child.family_id is None:
        raise HTTPException(
            status_code=400,
            detail="Your account is not linked to a parent yet. Ask your parent to add you from their dashboard first.",
        )

    # Validate builder if specified
    if body.builder_id is not None:
        builder = db.query(Builder).filter(Builder.id == body.builder_id).first()
        if not builder:
            raise HTTPException(status_code=404, detail="Builder not found.")

    project = ProjectRequest(
        child_id=child.id,
        service_id=body.service_id,
        builder_id=body.builder_id,  # None = global marketplace
        title=body.title,
        description=body.description,
        budget=body.budget,
        status="Pending Parent Approval",
        progress=0,
    )
    db.add(project)
    db.flush()

    # Notify parent
    parent = db.query(Parent).filter(Parent.family_id == child.family_id).first()
    if parent:
        notif = Notification(
            user_email=parent.email,
            family_id=parent.family_id,
            type="new_request",
            message=f"{child.name} submitted a new project request: '{body.title}'. Please review it.",
            read=False,
        )
        db.add(notif)

    db.add(Notification(
        user_email=child.email,
        family_id=child.family_id,
        type="request_submitted",
        message=f"Your project request '{body.title}' was submitted and is waiting for parent approval.",
        read=False,
    ))

    db.commit()
    db.refresh(project)

    return {
        "id": project.id,
        "title": project.title,
        "status": project.status,
        "message": "Request submitted successfully. Your parent will review it shortly.",
    }


@router.get("")
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Student sees all their own project requests."""
    child = db.query(Child).filter(Child.email == current_user["email"]).first()
    if not child:
        raise HTTPException(status_code=404, detail="Student record not found.")

    requests = db.query(ProjectRequest).filter(ProjectRequest.child_id == child.id).all()
    result = []
    for r in requests:
        builder_name = None
        if r.builder_id:
            b = db.query(Builder).filter(Builder.id == r.builder_id).first()
            builder_name = b.name if b else None
        elif r.service_id:
            s = db.query(Service).filter(Service.id == r.service_id).first()
            if s:
                b = db.query(Builder).filter(Builder.id == s.builder_id).first()
                builder_name = b.name if b else None

        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "budget": r.budget,
            "final_price": r.final_price,
            "status": r.status,
            "progress": r.progress,
            "builder_name": builder_name or "Global Marketplace",
            "created_at": r.created_at,
        })
    return result
