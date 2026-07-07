from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.project_requests import ProjectRequest
from app.models.children import Child
from app.services.db import get_db
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/project-requests", tags=["project-requests"])

class SubmitRequestBody(BaseModel):
    title: str
    description: Optional[str] = None
    budget: Optional[float] = None

@router.post("")
def submit_project_request(
    body: SubmitRequestBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Student submits a new project request. Appears as Pending on the parent's dashboard."""
    if current_user.get("role") not in ("student", "child"):
        raise HTTPException(status_code=403, detail="Only students can submit project requests.")

    child = db.query(Child).filter(Child.email == current_user["email"]).first()
    if not child:
        raise HTTPException(status_code=404, detail="Student record not found. Please contact support.")

    if child.family_id is None:
        raise HTTPException(
            status_code=400,
            detail="Your account is not linked to a parent yet. Ask your parent to add you from their dashboard first."
        )

    project = ProjectRequest(
        child_id=child.id,
        service_id=None,       # No builder assigned yet — parent assigns after approval
        title=body.title,
        description=body.description,
        budget=body.budget,
        status="Pending",
        progress=0,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "id": project.id,
        "title": project.title,
        "status": project.status,
        "message": "Request submitted successfully. Your parent will review it shortly."
    }

@router.get("")
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Student sees all their own project requests."""
    child = db.query(Child).filter(Child.email == current_user["email"]).first()
    if not child:
        raise HTTPException(status_code=404, detail="Student record not found.")

    requests = db.query(ProjectRequest).filter(ProjectRequest.child_id == child.id).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "budget": r.budget,
            "status": r.status,
            "progress": r.progress,
            "created_at": r.created_at,
        }
        for r in requests
    ]
