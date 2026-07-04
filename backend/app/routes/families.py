from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.families import Family
from app.services.db import get_db

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
