from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.services.db import get_db
from app.models.parents import Parent
from app.models.children import Child
from app.models.builders import Builder, Service
from app.models.project_requests import ProjectRequest
from app.models.notifications import Notification
from app.services.auth_dependency import get_current_user
import json

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

# Statuses the parent needs to take action on
PENDING_PARENT_STATUSES = {
    "Pending Parent Approval",
    "Pending Final Parent Approval",
    "Pending Parent Completion Review",
}

# Statuses where a parent can still delete/cancel
CANCELLABLE_STATUSES = {
    "Pending Parent Approval",
    "Pending Builder Acceptance",
    "Pending Final Parent Approval",
}


def _format_project(p: ProjectRequest, child_name: str = None) -> dict:
    """Convert a ProjectRequest ORM row to a JSON-serialisable dict."""
    builder_name = "No builder assigned yet"
    if p.builder_id:
        # Direct builder assignment (global marketplace claim / direct pick)
        pass  # resolved by caller with a joined query
    elif p.service and p.service.builder:
        builder_name = p.service.builder.name

    return {
        "id": p.id,
        "title": p.title or (p.service.type if p.service else "Project"),
        "child_name": child_name or (p.child.name if p.child else "Unknown"),
        "builder_name": builder_name,
        "budget": p.budget,
        "final_price": p.final_price,
        "status": p.status,
        "progress": p.progress,
        "created_at": str(p.created_at),
        "can_delete": p.status in CANCELLABLE_STATUSES,
        "needs_parent_action": p.status in PENDING_PARENT_STATUSES,
    }


# ─── Parent Dashboard ─────────────────────────────────────────────────────────

@router.get("/parent")
def get_parent_dashboard(
    email: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own dashboard.")

    parent = db.query(Parent).filter(Parent.email == email).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    children = db.query(Child).filter(Child.family_id == parent.family_id).all()
    child_ids = [c.id for c in children]
    child_map = {c.id: c.name for c in children}

    projects = (
        db.query(ProjectRequest)
        .options(
            joinedload(ProjectRequest.service).joinedload(Service.builder),
            joinedload(ProjectRequest.child),
        )
        .filter(ProjectRequest.child_id.in_(child_ids))
        .order_by(ProjectRequest.created_at.desc())
        .all()
    )

    # Resolve builder names for direct-assigned (global marketplace) requests
    builder_ids = [p.builder_id for p in projects if p.builder_id]
    builders_by_id = {}
    if builder_ids:
        for b in db.query(Builder).filter(Builder.id.in_(builder_ids)).all():
            builders_by_id[b.id] = b.name

    all_projects = []
    pending_approvals = []
    for p in projects:
        proj = _format_project(p, child_map.get(p.child_id))
        # Override builder_name for direct-assignment
        if p.builder_id and p.builder_id in builders_by_id:
            proj["builder_name"] = builders_by_id[p.builder_id]
        all_projects.append(proj)
        if p.status in PENDING_PARENT_STATUSES:
            pending_approvals.append(proj)

    # Real notifications
    notifs = (
        db.query(Notification)
        .filter(Notification.user_email == email)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )
    notifications = [
        {"id": n.id, "message": n.message, "type": n.type, "read": n.read, "createdAt": str(n.created_at)}
        for n in notifs
    ]

    return {
        "parent": {"id": parent.id, "name": parent.name, "email": parent.email},
        "children": [{"id": c.id, "name": c.name, "email": c.email} for c in children],
        "projects": all_projects,
        "pending_approvals": pending_approvals,
        "notifications": notifications,
    }


# ─── Student / Child Dashboard ────────────────────────────────────────────────

@router.get("/student")
@router.get("/child")
def get_child_dashboard(
    email: str = None,
    child_id: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not email and not child_id:
        raise HTTPException(status_code=400, detail="Provide email or child_id")

    if email:
        child = db.query(Child).filter(Child.email == email).first()
    else:
        child = db.query(Child).filter(Child.id == child_id).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    authorized = False
    if current_user["role"] in ("student", "child") and child.email == current_user["email"]:
        authorized = True
    elif current_user["role"] == "parent":
        parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
        if parent and parent.family_id == child.family_id:
            authorized = True

    if not authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to view this dashboard.")

    projects = (
        db.query(ProjectRequest)
        .options(joinedload(ProjectRequest.service).joinedload(Service.builder))
        .filter(ProjectRequest.child_id == child.id)
        .order_by(ProjectRequest.created_at.desc())
        .all()
    )

    # Resolve direct-assigned builder names
    builder_ids = [p.builder_id for p in projects if p.builder_id]
    builders_by_id = {}
    if builder_ids:
        for b in db.query(Builder).filter(Builder.id.in_(builder_ids)).all():
            builders_by_id[b.id] = b.name

    formatted = []
    for p in projects:
        builder_name = "No builder assigned yet"
        if p.builder_id and p.builder_id in builders_by_id:
            builder_name = builders_by_id[p.builder_id]
        elif p.service and p.service.builder:
            builder_name = p.service.builder.name

        formatted.append({
            "id": p.id,
            "title": p.title or (p.service.type if p.service else "Project"),
            "builder_name": builder_name,
            "budget": p.budget,
            "final_price": p.final_price,
            "status": p.status,
            "progress": p.progress,
            "created_at": str(p.created_at) if p.created_at else None,
        })

    # Notifications for this student
    notifs = (
        db.query(Notification)
        .filter(Notification.user_email == child.email)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )
    notifications = [
        {"id": n.id, "message": n.message, "read": n.read, "createdAt": str(n.created_at)}
        for n in notifs
    ]

    return {
        "child": {"id": child.id, "name": child.name, "email": child.email},
        "projects": formatted,
        "notifications": notifications,
    }


# ─── Builder Dashboard ────────────────────────────────────────────────────────

@router.get("/builder")
def get_builder_dashboard(
    email: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own dashboard.")

    builder = db.query(Builder).filter(Builder.email == email).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    services = db.query(Service).filter(Service.builder_id == builder.id).all()
    service_ids = [s.id for s in services]

    # Projects via service
    projects_via_service = (
        db.query(ProjectRequest)
        .options(joinedload(ProjectRequest.child))
        .filter(ProjectRequest.service_id.in_(service_ids))
        .all()
    ) if service_ids else []

    # Projects directly assigned (global marketplace claims)
    projects_direct = (
        db.query(ProjectRequest)
        .options(joinedload(ProjectRequest.child))
        .filter(ProjectRequest.builder_id == builder.id)
        .all()
    )

    # Merge, deduplicate
    all_project_ids = set()
    all_projects = []
    for p in list(projects_via_service) + list(projects_direct):
        if p.id not in all_project_ids:
            all_project_ids.add(p.id)
            all_projects.append(p)

    # Separate: pending review vs active/completed
    pending_requests = []   # Pending Builder Acceptance — builder needs to act
    active_projects = []    # In Progress / Completed / etc.

    for p in all_projects:
        proj_data = {
            "id": p.id,
            "title": p.title or "Untitled Project",
            "child_name": p.child.name if p.child else "Unknown",
            "budget": p.budget,
            "final_price": p.final_price,
            "status": p.status,
            "progress": p.progress,
        }
        if p.status == "Pending Builder Acceptance":
            pending_requests.append(proj_data)
        else:
            active_projects.append(proj_data)

    # Global marketplace requests (Pending Builder Acceptance, no builder assigned)
    global_requests = (
        db.query(ProjectRequest)
        .options(joinedload(ProjectRequest.child))
        .filter(
            ProjectRequest.status == "Pending Builder Acceptance",
            ProjectRequest.builder_id.is_(None),
            ProjectRequest.service_id.is_(None),
        )
        .all()
    )
    global_pool = [
        {
            "id": p.id,
            "title": p.title or "Untitled Project",
            "child_name": p.child.name if p.child else "Unknown",
            "budget": p.budget,
            "status": p.status,
        }
        for p in global_requests
    ]

    # Services offered
    services_data = [
        {
            "id": s.id,
            "title": s.title or s.type,
            "type": s.type,
            "price": s.price,
            "category": s.category,
        }
        for s in services
    ]

    # Notifications
    notifs = (
        db.query(Notification)
        .filter(Notification.user_email == email)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )
    notifications = [
        {"id": n.id, "message": n.message, "read": n.read, "createdAt": str(n.created_at)}
        for n in notifs
    ]

    return {
        "builder": {"id": builder.id, "name": builder.name, "rating": builder.rating_avg},
        "projects": active_projects,
        "pending_requests": pending_requests,
        "global_pool": global_pool,
        "services": services_data,
        "notifications": notifications,
    }
