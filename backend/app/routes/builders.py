from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.models.builders import Builder, Service
from app.models.project_requests import ProjectRequest
from app.services.db import get_db
from app.services.auth_dependency import get_current_user, require_role
import json

router = APIRouter(prefix="/builders", tags=["builders"])


class OnboardRequest(BaseModel):
    email: str
    name: str
    blurb: str
    categories: List[str]
    service_type: str
    service_price: float
    service_category: str


class AddServiceBody(BaseModel):
    title: str
    type: str
    price: float
    category: str
    description: Optional[str] = None


# ─── List all verified builders ───────────────────────────────────────────────

@router.get("")
def get_builders(db: Session = Depends(get_db)):
    """Fetch all verified builders with services and completed project count."""
    builders = db.query(Builder).filter(Builder.verification_status == "verified").all()

    result = []
    for b in builders:
        services = db.query(Service).filter(Service.builder_id == b.id).all()
        categories = json.loads(b.categories) if b.categories else []
        portfolio = json.loads(b.portfolio) if b.portfolio else []

        # Aggregate completed projects count
        service_ids = [s.id for s in services]
        completed_count = 0
        if service_ids:
            completed_count = (
                db.query(ProjectRequest)
                .filter(
                    ProjectRequest.service_id.in_(service_ids),
                    ProjectRequest.status == "Completed",
                )
                .count()
            )
        # Also count direct-assigned completed projects
        completed_count += (
            db.query(ProjectRequest)
            .filter(
                ProjectRequest.builder_id == b.id,
                ProjectRequest.status == "Completed",
            )
            .count()
        )

        result.append({
            "id": b.id,
            "name": b.name,
            "rating": b.rating_avg,
            "image": portfolio[0] if portfolio else "/placeholder.svg",
            "projects": completed_count,
            "categories": categories,
            "portfolio": portfolio,
            "blurb": b.blurb,
            "services": [
                {
                    "id": s.id,
                    "title": s.title or s.type,
                    "type": s.type,
                    "price": s.price,
                    "category": s.category,
                }
                for s in services
            ],
        })
    return result


# ─── Services CRUD ────────────────────────────────────────────────────────────

@router.post("/services")
def add_service(
    email: str,
    body: AddServiceBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Builder adds a new service offering."""
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="Forbidden.")

    builder = db.query(Builder).filter(Builder.email == email).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found.")

    service = Service(
        builder_id=builder.id,
        title=body.title,
        type=body.type,
        price=body.price,
        category=body.category,
        description=body.description,
    )
    db.add(service)
    db.commit()
    db.refresh(service)

    return {
        "id": service.id,
        "title": service.title,
        "type": service.type,
        "price": service.price,
        "category": service.category,
        "message": "Service added successfully.",
    }


@router.delete("/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Builder deletes one of their services."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    builder = db.query(Builder).filter(Builder.email == current_user["email"]).first()
    if not builder or service.builder_id != builder.id:
        raise HTTPException(status_code=403, detail="Forbidden: This service does not belong to you.")

    db.delete(service)
    db.commit()
    return {"message": "Service deleted."}


# ─── Onboarding ───────────────────────────────────────────────────────────────

@router.post("/onboard")
def onboard_builder(
    req: OnboardRequest,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    """Builder submits onboarding profile."""
    builder = db.query(Builder).filter(Builder.email == req.email).first()

    if not builder:
        builder = Builder(email=req.email, verification_status="verified", rating_avg=0.0)
        db.add(builder)
        db.commit()
        db.refresh(builder)

    builder.name = req.name
    builder.blurb = req.blurb
    builder.categories = json.dumps(req.categories)
    builder.portfolio = json.dumps(
        ["/placeholder.svg?height=140&width=240&query=portfolio", "/placeholder.svg?height=140&width=240&query=item"]
    )

    existing_service = db.query(Service).filter(Service.builder_id == builder.id).first()
    if existing_service:
        existing_service.type = req.service_type
        existing_service.price = req.service_price
        existing_service.category = req.service_category
    else:
        service = Service(
            builder_id=builder.id,
            type=req.service_type,
            price=req.service_price,
            category=req.service_category,
        )
        db.add(service)

    db.commit()
    return {"message": "Onboarding submitted successfully."}


# ─── Pending builders (admin) ─────────────────────────────────────────────────

@router.get("/pending")
def get_pending_builders(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin")),
):
    builders = db.query(Builder).filter(Builder.verification_status == "pending").all()
    result = []
    for b in builders:
        categories = json.loads(b.categories) if b.categories else []
        result.append({
            "id": b.id,
            "name": b.name,
            "email": b.email,
            "blurb": b.blurb,
            "categories": categories,
            "status": b.verification_status,
        })
    return result


@router.post("/{builder_id}/verify")
def verify_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_role("admin")),
):
    builder = db.query(Builder).filter(Builder.id == builder_id).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    builder.verification_status = "verified"
    db.commit()
    return {"message": "Builder verified successfully"}
