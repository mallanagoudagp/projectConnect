from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.services.db import get_db
from app.models.project_requests import ProjectRequest
from app.models.sessions import Session as LearningSession
from app.models.builders import Service, Builder
from app.models.children import Child
from app.models.parents import Parent
from app.models.escrow import Escrow
from app.models.files import FileAttachment
from app.services.auth_dependency import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

class ProposeSessionRequest(BaseModel):
    topic: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: str

class UpdateProgressRequest(BaseModel):
    progress: int

@router.get("/{project_id}")
def get_workspace(project_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Fetch the full unified workspace state for a project request"""
    project = db.query(ProjectRequest).options(
        joinedload(ProjectRequest.service).joinedload(Service.builder),
        joinedload(ProjectRequest.child)
    ).filter(ProjectRequest.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project Workspace not found")
        
    # Authorization check:
    # Only the assigned builder of the service, parent of the child, or child can access this workspace.
    authorized = False
    if current_user["role"] == "builder":
        builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
        if builder and project.service and project.service.builder_id == builder.id:
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
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not authorized to view this project workspace."
        )

    sessions = db.query(LearningSession).filter(LearningSession.project_request_id == project_id).all()
    escrow = db.query(Escrow).filter(Escrow.project_request_id == project_id).first()
    files = db.query(FileAttachment).filter(FileAttachment.project_request_id == project_id).all()
    
    return {
        "id": project.id,
        "status": project.status,
        "progress": project.progress,
        "created_at": project.created_at,
        "files": [
            {
                "id": f.id,
                "file_name": f.file_name,
                "file_url": f.file_url,
                "uploader_role": f.uploader_role,
                "created_at": f.created_at
            } for f in files
        ],
        "escrow": {
            "amount": escrow.amount if escrow else 0,
            "status": escrow.status if escrow else "none"
        },
        "service": {
            "type": project.service.type if project.service else "Unknown",
            "category": project.service.category if project.service else "Unknown",
        },
        "builder": {
            "name": project.service.builder.name if project.service and project.service.builder else "Unknown",
            "email": project.service.builder.email if project.service and project.service.builder else "Unknown"
        },
        "student": {
            "name": project.child.name if project.child else "Unknown",
            "grade": project.child.grade if project.child else "Unknown",
        },
        "sessions": [
            {
                "id": s.id,
                "topic": s.topic,
                "scheduled_at": s.scheduled_at,
                "duration_minutes": s.duration_minutes,
                "meeting_link": s.meeting_link,
                "status": s.status
            } for s in sessions
        ]
    }

@router.post("/{project_id}/approve")
def approve_project(project_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Parent approves a pending project request from a student."""
    if current_user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can approve project requests.")

    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project request not found.")

    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    child = db.query(Child).filter(Child.id == project.child_id).first()
    if not parent or not child or parent.family_id != child.family_id:
        raise HTTPException(status_code=403, detail="You can only approve requests from your own children.")

    project.status = "Approved"
    db.commit()
    return {"message": "Project request approved.", "project_id": project_id}

@router.post("/{project_id}/sessions")
def propose_session(project_id: int, req: ProposeSessionRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Builder proposes a session"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorization check: only the assigned builder can propose a session
    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder or not project.service or project.service.builder_id != builder.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not the assigned builder for this project workspace."
        )
        
    session = LearningSession(
        project_request_id=project_id,
        topic=req.topic,
        scheduled_at=req.scheduled_at,
        duration_minutes=req.duration_minutes,
        meeting_link=req.meeting_link,
        status="proposed"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"message": "Session proposed successfully", "session_id": session.id}

@router.post("/{project_id}/sessions/{session_id}/approve")
@router.put("/{project_id}/sessions/{session_id}/approve")
def approve_session(project_id: int, session_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Parent/Student approves a proposed session"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorization check: only parent linked to this project request (or admin) can approve a session
    authorized = False
    if current_user["role"] == "parent":
        parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
        child = db.query(Child).filter(Child.id == project.child_id).first()
        if parent and child and parent.family_id == child.family_id:
            authorized = True
    elif current_user["role"] == "admin":
        authorized = True

    if not authorized:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only parents can approve proposed sessions for this workspace."
        )

    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.project_request_id == project_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = "scheduled"
    db.commit()
    return {"message": "Session approved and scheduled"}

@router.put("/{project_id}/progress")
def update_progress(project_id: int, req: UpdateProgressRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Builder updates the project progress"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorization check: only the assigned builder can update progress
    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder or not project.service or project.service.builder_id != builder.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You are not the assigned builder for this project workspace."
        )
        
    if req.progress < 0 or req.progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
        
    project.progress = req.progress
    if req.progress == 100:
        project.status = "Completed"
    
    db.commit()
    return {"message": f"Progress updated to {req.progress}%"}
