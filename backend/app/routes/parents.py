from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.parents import Parent
from app.services.db import get_db

router = APIRouter()

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
