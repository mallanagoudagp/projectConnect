from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.subscriptions import Subscription
from app.services.db import get_db

router = APIRouter()

@router.post('/parents/{parent_id}/subscriptions/{subscription_id}/approve')
def approve_subscription(parent_id: int, subscription_id: int, db: Session = Depends(get_db)):
    # Transaction-safe approval logic
    sub = db.query(Subscription).filter_by(id=subscription_id).with_for_update().first()
    if not sub:
        raise HTTPException(status_code=404, detail='Subscription not found')
    if sub.status != 'pending':
        raise HTTPException(status_code=409, detail='Already processed')
    # TODO: call payment gateway with idempotency key
    sub.status = 'active'
    sub.payment_status = 'paid'
    db.commit()
    # TODO: emit notification via socketio
    return {'status': 'approved'}
