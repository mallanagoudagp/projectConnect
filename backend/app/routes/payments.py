from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.payments import Payment
from app.services.db import get_db
from app.services.payment_service import approve_payment, refund_payment


router = APIRouter()

class CreatePaymentRequest(BaseModel):
    subscription_id: int
    amount: float
    gateway_id: str
class ApprovePaymentRequest(BaseModel):
    idempotency_key: str
@router.post('/payments/{payment_id}/approve')
def approve_payment_route(payment_id: int, req: ApprovePaymentRequest, db: Session = Depends(get_db)):
    success = approve_payment(db, payment_id, req.idempotency_key)
    if success:
        return {"status": "approved"}
    raise HTTPException(status_code=400, detail="Payment approval failed or already processed")

class RefundPaymentRequest(BaseModel):
    idempotency_key: str

@router.post('/payments/{payment_id}/refund')
def refund_payment_route(payment_id: int, req: RefundPaymentRequest, db: Session = Depends(get_db)):
    success = refund_payment(db, payment_id, req.idempotency_key)
    if success:
        return {"status": "refunded"}
    raise HTTPException(status_code=400, detail="Payment refund failed or already processed")

@router.post('/payments/create')
def create_payment(req: CreatePaymentRequest, db: Session = Depends(get_db)):
    payment = Payment(
        subscription_id=req.subscription_id,
        amount=req.amount,
        gateway_id=req.gateway_id
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {
        "id": payment.id,
        "subscription_id": payment.subscription_id,
        "amount": payment.amount,
        "status": payment.status,
        "gateway_id": payment.gateway_id
    }

@router.post('/payments/confirm')
def confirm_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter_by(id=payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail='Payment not found')
    payment.status = 'paid'
    db.commit()
    db.refresh(payment)
    return {"id": payment.id, "subscription_id": payment.subscription_id, "amount": payment.amount, "status": payment.status, "gateway_id": payment.gateway_id}
