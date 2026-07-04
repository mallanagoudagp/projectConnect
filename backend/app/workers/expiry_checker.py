from app.services.db import SessionLocal
from app.models.subscriptions import Subscription
from datetime import datetime

def expire_bookings():
    db = SessionLocal()
    now = datetime.utcnow()
    expired = db.query(Subscription).filter(Subscription.status=='booked', Subscription.expires_at < now).all()
    for sub in expired:
        sub.status = 'expired'
        # TODO: push notifications to family & builder, free slots
    db.commit()
    db.close()

# To run: schedule with cron or background task
