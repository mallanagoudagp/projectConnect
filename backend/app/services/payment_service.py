from sqlalchemy.orm import Session
from sqlalchemy import select, update, exc
from app.models.payments import Payment

# Transaction-safe approval/payment logic

def approve_payment(db: Session, payment_id: int, idempotency_key: str) -> bool:
    try:
        with db.begin():
            # Lock the payment row for update
            payment = db.execute(
                select(Payment).where(Payment.id == payment_id).with_for_update()
            ).scalar_one_or_none()
            if not payment:
                return False
            # Check idempotency
            if payment.status == 'approved' and getattr(payment, 'idempotency_key', None) == idempotency_key:
                return True
            if payment.status == 'approved':
                return False
            # Approve payment and set idempotency key
            payment.status = 'approved'
            payment.idempotency_key = idempotency_key
            db.add(payment)
        return True
    except exc.SQLAlchemyError:
        db.rollback()
        return False

def refund_payment(db: Session, payment_id: int, idempotency_key: str) -> bool:
    try:
        with db.begin():
            # Lock the payment row for update
            payment = db.execute(
                select(Payment).where(Payment.id == payment_id).with_for_update()
            ).scalar_one_or_none()
            if not payment:
                return False
            # Check idempotency
            if payment.status == 'refunded' and getattr(payment, 'idempotency_key', None) == idempotency_key:
                return True
            if payment.status == 'refunded':
                return False
            # Refund payment and set idempotency key
            payment.status = 'refunded'
            payment.idempotency_key = idempotency_key
            db.add(payment)
        return True
    except exc.SQLAlchemyError:
        db.rollback()
        return False

# -----------------------------------------------------
# Phase 7: Mock Payment Gateway for Escrow
# -----------------------------------------------------

class MockPaymentGateway:
    """
    A mock interface to represent future Stripe/Braintree SDKs.
    """
    @staticmethod
    def process_charge(amount: float, source_token: str) -> dict:
        """Simulates charging a parent's credit card."""
        print(f"[MOCK STRIPE] Charged ${amount} via token {source_token}")
        return {"status": "success", "transaction_id": "txn_mock_12345"}
        
    @staticmethod
    def transfer_to_builder(amount: float, builder_account_id: str) -> dict:
        """Simulates transferring funds to a Builder's connected account."""
        print(f"[MOCK STRIPE] Transferred ${amount} to builder account {builder_account_id}")
        return {"status": "success", "transfer_id": "tr_mock_98765"}
