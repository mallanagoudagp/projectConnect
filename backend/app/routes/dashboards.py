from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.services.db import get_db
from app.models.parents import Parent
from app.models.children import Child
from app.models.builders import Builder, Service
from app.models.project_requests import ProjectRequest, Approval
from typing import List, Dict, Any

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

@router.get("/parent")
def get_parent_dashboard(email: str, db: Session = Depends(get_db)):
    parent = db.query(Parent).filter(Parent.email == email).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
        
    children = db.query(Child).filter(Child.family_id == parent.family_id).all()
    child_ids = [c.id for c in children]
    
    projects = db.query(ProjectRequest).options(
        joinedload(ProjectRequest.service).joinedload(Service.builder),
        joinedload(ProjectRequest.child)
    ).filter(ProjectRequest.child_id.in_(child_ids)).all()
    
    # Format response
    active_projects = []
    pending_projects = []
    for p in projects:
        proj_data = {
            "id": p.id,
            "child_name": p.child.name if p.child else "Unknown",
            "service_name": p.service.type if p.service else "Unknown",
            "builder_name": p.service.builder.name if p.service and p.service.builder else "Unknown",
            "price": p.service.price if p.service else 0,
            "status": p.status,
            "progress": p.progress,
            "created_at": p.created_at
        }
        if p.status == "Pending":
            pending_projects.append(proj_data)
        else:
            active_projects.append(proj_data)
        
    return {
        "parent": {"id": parent.id, "name": parent.name, "email": parent.email},
        "children": [{"id": c.id, "name": c.name} for c in children],
        "projects": active_projects,
        "pending_approvals": pending_projects,
        "notifications": [
            {"id": 1, "message": "Demo Notification: Check your student's progress!", "createdAt": "2 hours ago"}
        ]
    }

@router.get("/child")
def get_child_dashboard(child_id: int, db: Session = Depends(get_db)):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
        
    projects = db.query(ProjectRequest).options(
        joinedload(ProjectRequest.service).joinedload(Service.builder)
    ).filter(ProjectRequest.child_id == child_id).all()
    
    formatted_projects = []
    for p in projects:
        formatted_projects.append({
            "id": p.id,
            "service_name": p.service.type if p.service else "Unknown",
            "builder_name": p.service.builder.name if p.service and p.service.builder else "Unknown",
            "status": p.status,
            "progress": p.progress
        })
        
    return {
        "child": {"id": child.id, "name": child.name},
        "projects": formatted_projects
    }

@router.get("/builder")
def get_builder_dashboard(email: str, db: Session = Depends(get_db)):
    builder = db.query(Builder).filter(Builder.email == email).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
        
    services = db.query(Service).filter(Service.builder_id == builder.id).all()
    service_ids = [s.id for s in services]
    
    projects = db.query(ProjectRequest).options(
        joinedload(ProjectRequest.child)
    ).filter(ProjectRequest.service_id.in_(service_ids)).all()
    
    formatted_projects = []
    for p in projects:
        formatted_projects.append({
            "id": p.id,
            "child_name": p.child.name if p.child else "Unknown",
            "status": p.status,
            "progress": p.progress
        })
        
    return {
        "builder": {"id": builder.id, "name": builder.name, "rating": builder.rating_avg},
        "projects": formatted_projects
    }
