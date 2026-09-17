from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.notifications import Notification
from app.services.db import get_db
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


class CreateNotificationBody(BaseModel):
    user_email: str
    message: str
    type: Optional[str] = "info"
    family_id: Optional[int] = None


@router.get("")
def list_notifications(
    email: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """GET /notifications?email=  — returns all notifications for a user."""
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="Forbidden.")

    notifs = (
        db.query(Notification)
        .filter(Notification.user_email == email)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "read": n.read,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if notif.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    notif.read = True
    db.commit()
    return {"message": "Marked as read."}


# Legacy family-based endpoints (kept for backward compat)
@router.post("/families/{family_id}")
def create_family_notification(family_id: int, payload: CreateNotificationBody, db: Session = Depends(get_db)):
    notif = Notification(
        family_id=family_id,
        user_email=payload.user_email,
        type=payload.type,
        message=payload.message,
    )
    db.add(notif)
    db.commit()
    return {"status": "created"}


@router.get("/families/{family_id}")
def list_family_notifications(family_id: int, db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.family_id == family_id).all()
    return [{"id": n.id, "message": n.message, "type": n.type, "read": n.read} for n in notifs]
