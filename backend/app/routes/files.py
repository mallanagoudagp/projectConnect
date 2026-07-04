from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.db import get_db
from app.models.files import FileAttachment
from app.models.project_requests import ProjectRequest
from typing import List

router = APIRouter(prefix="/workspaces", tags=["files"])

class FileUploadRequest(BaseModel):
    file_name: str
    file_url: str
    uploader_role: str

@router.post("/{project_id}/files")
def attach_file_to_workspace(project_id: int, req: FileUploadRequest, db: Session = Depends(get_db)):
    """Saves a file attachment record (URL) to the workspace"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project Workspace not found")
        
    file_att = FileAttachment(
        project_request_id=project_id,
        uploader_role=req.uploader_role,
        file_name=req.file_name,
        file_url=req.file_url
    )
    db.add(file_att)
    db.commit()
    
    return {"message": "File attached successfully", "id": file_att.id}

@router.get("/{project_id}/files")
def get_workspace_files(project_id: int, db: Session = Depends(get_db)):
    """Gets all file attachments for a specific workspace"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project Workspace not found")
        
    files = db.query(FileAttachment).filter(FileAttachment.project_request_id == project_id).all()
    
    return {
        "files": [
            {
                "id": f.id,
                "file_name": f.file_name,
                "file_url": f.file_url,
                "uploader_role": f.uploader_role,
                "created_at": f.created_at
            } for f in files
        ]
    }
