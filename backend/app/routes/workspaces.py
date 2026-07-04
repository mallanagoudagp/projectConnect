from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.services.db import get_db
from app.models.project_requests import ProjectRequest
from app.models.sessions import Session as LearningSession
from app.models.builders import Service, Builder
from app.models.children import Child
from app.models.escrow import Escrow
from app.models.files import FileAttachment
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
def get_workspace(project_id: int, db: Session = Depends(get_db)):
    """Fetch the full unified workspace state for a project request"""
    project = db.query(ProjectRequest).options(
        joinedload(ProjectRequest.service).joinedload(Service.builder),
        joinedload(ProjectRequest.child)
    ).filter(ProjectRequest.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project Workspace not found")
        
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

@router.post("/{project_id}/sessions")
def propose_session(project_id: int, req: ProposeSessionRequest, db: Session = Depends(get_db)):
    """Builder proposes a session"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
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

@router.put("/{project_id}/sessions/{session_id}/approve")
def approve_session(project_id: int, session_id: int, db: Session = Depends(get_db)):
    """Parent/Student approves a proposed session"""
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
def update_progress(project_id: int, req: UpdateProgressRequest, db: Session = Depends(get_db)):
    """Builder updates the project progress"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if req.progress < 0 or req.progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
        
    project.progress = req.progress
    if req.progress == 100:
        project.status = "Completed"
    
    db.commit()
    return {"message": f"Progress updated to {req.progress}%"}
