from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.children import Child
from app.services.db import get_db

router = APIRouter()

@router.post('/children')
def create_child(name: str, grade: str, age: int, avatar: str, family_id: int, db: Session = Depends(get_db)):
    child = Child(name=name, grade=grade, age=age, avatar=avatar, family_id=family_id)
    db.add(child)
    db.commit()
    db.refresh(child)
    return {"id": child.id, "name": child.name, "grade": child.grade, "age": child.age, "avatar": child.avatar, "family_id": child.family_id}

@router.get('/children/{child_id}')
def get_child(child_id: int, db: Session = Depends(get_db)):
    child = db.query(Child).filter_by(id=child_id).first()
    if child:
        return {"id": child.id, "name": child.name, "grade": child.grade, "age": child.age, "avatar": child.avatar, "family_id": child.family_id}
    return {}
