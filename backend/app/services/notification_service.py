from app.models.notifications import Notification
from app.services.db import SessionLocal
from app.services.socketio_server import socket_manager

def notify_and_save(family_id, payload):
    db = SessionLocal()
    notif = Notification(family_id=family_id, type=payload['type'], message=payload.get('message'), data=payload)
    db.add(notif)
    db.commit()
    db.close()
    # Emit notification via socketio
    socket_manager.emit('notification', payload, room=f'family_{family_id}')
