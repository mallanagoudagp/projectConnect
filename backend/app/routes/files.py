from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.db import get_db
from app.models.files import FileAttachment
from app.models.project_requests import ProjectRequest
from app.models.parents import Parent
from app.models.children import Child
from app.models.builders import Builder, Service
from app.services.auth_dependency import get_current_user
from typing import List

router = APIRouter(prefix="/workspaces", tags=["files"])

class FileUploadRequest(BaseModel):
    file_name: str
    file_url: str
    uploader_role: str

@router.post("/{project_id}/files")
def attach_file_to_workspace(project_id: int, req: FileUploadRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Saves a file attachment record (URL) to the workspace"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project Workspace not found")
        
    # Authorization check:
    # Only parent, student/child, or assigned builder of the project can upload files.
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
            detail="Forbidden: You are not authorized to upload files to this workspace."
        )

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
def get_workspace_files(project_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Gets all file attachments for a specific workspace"""
    project = db.query(ProjectRequest).filter(ProjectRequest.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project Workspace not found")
        
    # Authorization check:
    # Only parent, student/child, or assigned builder of the project can read workspace files.
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
            detail="Forbidden: You are not authorized to view files for this workspace."
        )

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
