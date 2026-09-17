from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.parents import Parent
from app.models.children import Child
from app.models.families import Family
from app.services.db import get_db
from app.services.auth_dependency import get_current_user

router = APIRouter()


# ─── Basic parent CRUD (legacy) ───────────────────────────────────────────────

@router.post('/parents')
def create_parent(name: str, email: str, family_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.exc import IntegrityError
    parent = Parent(name=name, email=email, family_id=family_id)
    db.add(parent)
    try:
        db.commit()
        db.refresh(parent)
        return {"id": parent.id, "name": parent.name, "email": parent.email, "family_id": parent.family_id}
    except IntegrityError:
        db.rollback()
        return {"error": "Parent with this email already exists."}


@router.get('/parents/{parent_id}')
def get_parent(parent_id: int, db: Session = Depends(get_db)):
    parent = db.query(Parent).filter_by(id=parent_id).first()
    if parent:
        return {"id": parent.id, "name": parent.name, "email": parent.email, "family_id": parent.family_id}
    return {}


# ─── Children management ──────────────────────────────────────────────────────

@router.get('/parents/children')
def list_children(
    email: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """GET /parents/children?email= — list the parent's linked children."""
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="Forbidden.")

    parent = db.query(Parent).filter(Parent.email == email).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    children = db.query(Child).filter(Child.family_id == parent.family_id).all()
    return [{"id": c.id, "name": c.name, "email": c.email} for c in children]


class LinkChildBody(BaseModel):
    parent_email: str
    child_email: str


@router.post('/parents/children/link')
def link_child(
    body: LinkChildBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Link a student account to a parent's family."""
    if current_user["email"] != body.parent_email:
        raise HTTPException(status_code=403, detail="Forbidden: You can only link children to your own account.")

    parent = db.query(Parent).filter(Parent.email == body.parent_email).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found.")

    child = db.query(Child).filter(Child.email == body.child_email).first()
    if not child:
        raise HTTPException(
            status_code=404,
            detail="No student account found with that email. The student must sign up first.",
        )

    if child.family_id is not None and child.family_id != parent.family_id:
        raise HTTPException(status_code=400, detail="This student is already linked to a different family.")

    child.family_id = parent.family_id
    db.commit()

    return {"message": f"{child.name} has been linked to your family.", "child_id": child.id}
