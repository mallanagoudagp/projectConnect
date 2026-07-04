from fastapi import APIRouter, Depends, HTTPException
from app.models.notifications import Notification
from app.services.db import get_db

router = APIRouter()

@router.post('/families/{family_id}/notifications')
def create_notification(family_id: int, payload: dict, db=Depends(get_db)):
    # Save notification to DB
    notif = Notification(family_id=family_id, **payload)
    db.add(notif)
    db.commit()
    # Emit via socket
    # TODO: integrate with socketio_manager
    return {'status': 'created'}

@router.get('/families/{family_id}/notifications')
def list_notifications(family_id: int, db=Depends(get_db)):
    return db.query(Notification).filter_by(family_id=family_id).all()
