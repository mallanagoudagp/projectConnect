import pytest
from sqlalchemy import text
from app.services.db import engine, SessionLocal

def test_database_connection():
    """Test that we can connect to the database"""
    with SessionLocal() as session:
        result = session.execute(text("SELECT 1"))
        assert result.scalar() == 1
        print("Database connection test passed!")

def test_create_basic_payment():
    """Test creating a payment without using FastAPI client"""
    from app.models.payments import Payment
    
    with SessionLocal() as session:
        # Create a test payment
        payment = Payment(
            subscription_id=1,
            amount=50.0,
            status='pending',
            gateway_id='test_gw',
            idempotency_key='test_key_1'
        )
        session.add(payment)
        session.commit()
        session.refresh(payment)
        
        assert payment.id is not None
        assert payment.amount == 50.0
        print(f"Created payment with ID: {payment.id}")

if __name__ == "__main__":
    test_database_connection()
    test_create_basic_payment()
    print("All basic tests passed!")
