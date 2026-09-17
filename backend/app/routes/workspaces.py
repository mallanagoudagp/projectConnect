from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.services.db import get_db
from app.models.project_requests import ProjectRequest
from app.models.sessions import Session as LearningSession
from app.models.builders import Service, Builder
from app.models.children import Child
from app.models.parents import Parent
from app.models.notifications import Notification
from app.models.files import FileAttachment
from app.services.auth_dependency import get_current_user
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _notify(db: Session, user_email: str, message: str, notif_type: str = "info", family_id: int = None):
    """Fire a notification to a user by email."""
    notif = Notification(
        user_email=user_email,
        family_id=family_id,
        type=notif_type,
        message=message,
        read=False,
    )
    db.add(notif)
    # No commit here — caller commits

def _get_project_or_404(db: Session, project_id: int) -> ProjectRequest:
    project = db.query(ProjectRequest).options(
        joinedload(ProjectRequest.service).joinedload(Service.builder),
        joinedload(ProjectRequest.child),
    ).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _ensure_not_rejected(project: ProjectRequest):
    if project.status in ("Declined", "Rejected", "Rejected by Builder"):
        raise HTTPException(status_code=409, detail="Rejected projects are read-only. Create a new request to try again.")


# ─── Pydantic bodies ─────────────────────────────────────────────────────────

class ProposeSessionRequest(BaseModel):
    topic: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: str

class UpdateProgressRequest(BaseModel):
    progress: int

class BuilderAcceptRequest(BaseModel):
    final_price: float

class AttachFileRequest(BaseModel):
    file_name: str
    file_url: str
    uploader_role: str


# ─── GET workspace ────────────────────────────────────────────────────────────

@router.get("/{project_id}")
def get_workspace(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Fetch the full unified workspace state for a project request"""
    project = _get_project_or_404(db, project_id)

    # Authorization
    authorized = False
    if current_user["role"] == "builder":
        builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
        if builder:
            # Builder is assigned directly or via service
            if project.builder_id == builder.id:
                authorized = True
            elif project.service and project.service.builder_id == builder.id:
                authorized = True
    elif current_user["role"] == "parent":
        parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if parent and child and parent.family_id == child.family_id:
            authorized = True
    elif current_user["role"] in ("student", "child"):
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if child and child.email == current_user["email"]:
            authorized = True

    if not authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to view this workspace.")

    sessions = db.query(LearningSession).filter(LearningSession.project_request_id == project_id).all()
    files = db.query(FileAttachment).filter(FileAttachment.project_request_id == project_id).all()

    # Resolve builder info — may come from service or direct assignment
    builder_name = "Unknown"
    builder_email = "Unknown"
    if project.service and project.service.builder:
        builder_name = project.service.builder.name
        builder_email = project.service.builder.email
    elif project.builder_id:
        b = db.query(Builder).filter(Builder.id == project.builder_id).first()
        if b:
            builder_name = b.name
            builder_email = b.email

    return {
        "id": project.id,
        "title": project.title or (project.service.type if project.service else "Project"),
        "description": project.description,
        "status": project.status,
        "progress": project.progress,
        "budget": project.budget,
        "final_price": project.final_price,
        "created_at": project.created_at,
        "files": [
            {
                "id": f.id,
                "file_name": f.file_name,
                "file_url": f.file_url,
                "uploader_role": f.uploader_role,
                "created_at": f.created_at,
            }
            for f in files
        ],
        "builder": {"name": builder_name, "email": builder_email},
        "student": {
            "name": project.child.name if project.child else "Unknown",
            "grade": project.child.grade if project.child else "Unknown",
        },
        "service": {
            "type": project.service.type if project.service else "Custom Project",
            "category": project.service.category if project.service else "General",
        },
        "sessions": [
            {
                "id": s.id,
                "topic": s.topic,
                "scheduled_at": s.scheduled_at,
                "duration_minutes": s.duration_minutes,
                "meeting_link": s.meeting_link,
                "status": s.status,
            }
            for s in sessions
        ],
    }


# ─── Approve (Parent) ─────────────────────────────────────────────────────────

@router.post("/{project_id}/approve")
def approve_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Parent approves a pending request → sends to builder (Pending Builder Acceptance)."""
    if current_user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can approve project requests.")

    project = _get_project_or_404(db, project_id)

    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(status_code=403, detail="You can only approve requests from your own children.")

    if project.status != "Pending Parent Approval":
        raise HTTPException(status_code=400, detail=f"Cannot approve: current status is '{project.status}'")

    project.status = "Pending Builder Acceptance"
    db.flush()

    # Notify the builder if one is assigned
    builder_email = None
    if project.builder_id:
        b = db.query(Builder).filter(Builder.id == project.builder_id).first()
        if b:
            builder_email = b.email
    elif project.service and project.service.builder:
        builder_email = project.service.builder.email

    if builder_email:
        _notify(db, builder_email, f"New project request: '{project.title}' is waiting for your review.", "request")
    if child:
        _notify(db, child.email, f"Your parent approved '{project.title}'. It is now waiting for builder review.", "approval", parent.family_id)
    # Global marketplace: no specific builder to notify — all builders will see it

    db.commit()
    return {"message": "Request approved and sent to builder.", "project_id": project_id}


# ─── Reject (Builder) ─────────────────────────────────────────────────────────

@router.post("/{project_id}/reject")
def reject_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Builder declines a request → status becomes Declined."""
    if current_user.get("role") != "builder":
        raise HTTPException(status_code=403, detail="Only builders can reject requests.")

    project = _get_project_or_404(db, project_id)
    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found.")

    # Builder must be the assigned one
    assigned = (project.builder_id == builder.id) or (
        project.service and project.service.builder_id == builder.id
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this project.")

    if project.status != "Pending Builder Acceptance":
        raise HTTPException(status_code=400, detail=f"Cannot reject: current status is '{project.status}'")

    project.status = "Declined"
    db.flush()

    # Notify parent
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if child:
        parent = db.query(Parent).filter(Parent.family_id == child.family_id).first()
        if parent:
            _notify(db, parent.email, f"Builder declined your request: '{project.title}'.", "rejection")
        _notify(db, child.email, f"The builder declined your request: '{project.title}'.", "rejection", child.family_id)

    db.commit()
    return {"message": "Request declined.", "project_id": project_id}


# ─── Builder Accept + Quote ───────────────────────────────────────────────────

@router.post("/{project_id}/builder-accept")
def builder_accept(
    project_id: int,
    body: BuilderAcceptRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Builder accepts and sets a final price quote → Pending Final Parent Approval."""
    if current_user.get("role") != "builder":
        raise HTTPException(status_code=403, detail="Only builders can accept requests.")

    project = _get_project_or_404(db, project_id)
    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found.")

    # For global marketplace requests, any verified builder can claim
    if project.builder_id is None and project.service_id is None:
        # Claim it
        project.builder_id = builder.id
    else:
        # Must be the assigned builder
        assigned = (project.builder_id == builder.id) or (
            project.service and project.service.builder_id == builder.id
        )
        if not assigned:
            raise HTTPException(status_code=403, detail="You are not assigned to this project.")

    if project.status != "Pending Builder Acceptance":
        raise HTTPException(status_code=400, detail=f"Cannot accept: current status is '{project.status}'")

    project.final_price = body.final_price
    project.status = "Pending Final Parent Approval"
    db.flush()

    # Notify parent
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if child:
        parent = db.query(Parent).filter(Parent.family_id == child.family_id).first()
        if parent:
            _notify(
                db,
                parent.email,
                f"Builder quoted ${body.final_price:.2f} for '{project.title}'. Review and confirm to start the project.",
                "quote",
                family_id=parent.family_id,
            )
            _notify(db, child.email, f"A builder submitted a quote for '{project.title}'. Your parent is reviewing it.", "quote", child.family_id)

    db.commit()
    return {
        "message": "Quote submitted. Waiting for parent confirmation.",
        "project_id": project_id,
        "final_price": body.final_price,
    }


# ─── Parent Confirm Quote ─────────────────────────────────────────────────────

@router.post("/{project_id}/parent-confirm")
def parent_confirm(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Parent confirms the builder's quote → project goes In Progress."""
    if current_user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can confirm quotes.")

    project = _get_project_or_404(db, project_id)
    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if project.status != "Pending Final Parent Approval":
        raise HTTPException(status_code=400, detail=f"Cannot confirm: current status is '{project.status}'")

    project.status = "In Progress"
    db.flush()

    # Notify builder
    builder_email = None
    if project.builder_id:
        b = db.query(Builder).filter(Builder.id == project.builder_id).first()
        if b:
            builder_email = b.email
    elif project.service and project.service.builder:
        builder_email = project.service.builder.email

    if builder_email:
        _notify(db, builder_email, f"Parent confirmed your quote for '{project.title}'. Project is now In Progress!", "confirmed")
    _notify(db, child.email, f"Your project '{project.title}' is now in progress.", "confirmed", child.family_id)

    db.commit()
    return {"message": "Quote confirmed. Project is now In Progress.", "project_id": project_id}


# ─── Update Progress (Builder) ────────────────────────────────────────────────

@router.put("/{project_id}/progress")
@router.post("/{project_id}/progress")
def update_progress(
    project_id: int,
    req: UpdateProgressRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Builder updates the project progress %."""
    project = _get_project_or_404(db, project_id)
    _ensure_not_rejected(project)

    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder:
        raise HTTPException(status_code=403, detail="Only builders can update progress.")

    assigned = (project.builder_id == builder.id) or (
        project.service and project.service.builder_id == builder.id
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="You are not the assigned builder for this project.")

    if req.progress < 0 or req.progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")

    project.progress = req.progress

    if req.progress == 100:
        project.status = "Pending Parent Completion Review"
        db.flush()
        # Notify parent
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if child:
            parent = db.query(Parent).filter(Parent.family_id == child.family_id).first()
            if parent:
                _notify(
                    db,
                    parent.email,
                    f"Builder has completed '{project.title}'! Please review and release payment.",
                    "completion",
                    family_id=parent.family_id,
                )
            _notify(db, child.email, f"Your project '{project.title}' is ready for your parent to review.", "completion", child.family_id)

    db.commit()
    return {"message": f"Progress updated to {req.progress}%", "status": project.status}


# ─── Verify Completion (Parent) ───────────────────────────────────────────────

@router.post("/{project_id}/verify-completion")
def verify_completion(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Parent verifies completed work → status becomes Completed."""
    if current_user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can verify completion.")

    project = _get_project_or_404(db, project_id)
    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(status_code=403, detail="Forbidden.")

    if project.status != "Pending Parent Completion Review":
        raise HTTPException(status_code=400, detail=f"Cannot verify: current status is '{project.status}'")

    project.status = "Completed"
    db.flush()

    # Notify builder
    builder_email = None
    if project.builder_id:
        b = db.query(Builder).filter(Builder.id == project.builder_id).first()
        if b:
            builder_email = b.email
    elif project.service and project.service.builder:
        builder_email = project.service.builder.email

    if builder_email:
        _notify(db, builder_email, f"Payment released! Parent verified completion of '{project.title}'.", "payment")
    _notify(db, child.email, f"Your project '{project.title}' was completed by your parent.", "completed", child.family_id)

    db.commit()
    return {"message": "Project verified as completed. Payment released to builder.", "project_id": project_id}


# ─── Cancel / Delete (Parent) ─────────────────────────────────────────────────

@router.post("/{project_id}/cancel")
def cancel_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Parent cancels a pending request (only while not yet In Progress)."""
    if current_user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can cancel requests.")

    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(status_code=403, detail="Forbidden.")

    cancellable = {
        "Pending Parent Approval",
        "Pending Builder Acceptance",
        "Pending Final Parent Approval",
    }
    if project.status not in cancellable:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a project that is '{project.status}'. Cancellation is only allowed before the project starts."
        )

    db.delete(project)
    db.commit()
    return {"message": "Project request deleted successfully."}


# ─── Sessions ─────────────────────────────────────────────────────────────────

@router.post("/{project_id}/sessions")
def propose_session(
    project_id: int,
    req: ProposeSessionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Builder proposes a session."""
    project = _get_project_or_404(db, project_id)
    _ensure_not_rejected(project)
    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder:
        raise HTTPException(status_code=403, detail="Only builders can propose sessions.")

    assigned = (project.builder_id == builder.id) or (
        project.service and project.service.builder_id == builder.id
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="You are not the assigned builder for this project.")

    session = LearningSession(
        project_request_id=project_id,
        topic=req.topic,
        scheduled_at=req.scheduled_at,
        duration_minutes=req.duration_minutes,
        meeting_link=req.meeting_link,
        status="proposed",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"message": "Session proposed successfully", "session_id": session.id}


@router.post("/{project_id}/sessions/{session_id}/approve")
@router.put("/{project_id}/sessions/{session_id}/approve")
def approve_session(
    project_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Parent/Student approves a proposed session."""
    project = _get_project_or_404(db, project_id)
    _ensure_not_rejected(project)

    authorized = False
    if current_user["role"] == "parent":
        parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if parent and child and parent.family_id == child.family_id:
            authorized = True
    elif current_user["role"] in ("student", "child"):
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if child and child.email == current_user["email"]:
            authorized = True

    if not authorized:
        raise HTTPException(status_code=403, detail="Only the parent or student can approve sessions.")

    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.project_request_id == project_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "scheduled"
    db.commit()
    return {"message": "Session approved and scheduled"}


# ─── File attachment ──────────────────────────────────────────────────────────

@router.post("/{project_id}/files")
def attach_file(
    project_id: int,
    body: AttachFileRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Any participant can attach a file to the workspace."""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _ensure_not_rejected(project)

    attachment = FileAttachment(
        project_request_id=project_id,
        file_name=body.file_name,
        file_url=body.file_url,
        uploader_role=body.uploader_role,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return {"message": "File attached successfully", "id": attachment.id}
