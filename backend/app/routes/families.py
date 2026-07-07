from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.families import Family
from app.models.parents import Parent
from app.models.children import Child
from app.services.db import get_db
from app.services.auth_dependency import get_current_user

router = APIRouter()

@router.post('/families')
def create_family(name: str, db: Session = Depends(get_db)):
    fam = Family(name=name)
    db.add(fam)
    db.commit()
    db.refresh(fam)
    return {"id": fam.id, "name": fam.name}

@router.get('/families/{family_id}')
def get_family(family_id: int, db: Session = Depends(get_db)):
    fam = db.query(Family).filter_by(id=family_id).first()
    if fam:
        return {"id": fam.id, "name": fam.name}
    return {}

class AddChildRequest(BaseModel):
    child_email: str

@router.post('/families/add-child')
def add_child_to_family(
    req: AddChildRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Parent links an existing student account to their family by email."""
    if current_user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can add children to a family.")

    parent = db.query(Parent).filter(Parent.email == current_user["email"]).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent record not found.")

    child = db.query(Child).filter(Child.email == req.child_email).first()
    if not child:
        raise HTTPException(
            status_code=404,
            detail=f"No student account found with email {req.child_email}. Ask the student to sign up first."
        )

    if child.family_id is not None and child.family_id != parent.family_id:
        raise HTTPException(status_code=409, detail="This student is already linked to another family.")

    child.family_id = parent.family_id
    db.commit()
    db.refresh(child)
    return {"message": f"Student '{child.name}' linked to your family.", "child_id": child.id, "child_name": child.name}

