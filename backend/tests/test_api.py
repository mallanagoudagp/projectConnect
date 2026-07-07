
import threading
from app.services.db import SessionLocal, Base, engine
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

import pytest
from app.models.subscriptions import Subscription

from app.services.auth_dependency import get_current_user

def mock_get_current_user():
    return {
        "user_id": "mock-test-id",
        "email": "john@example.com",
        "role": "admin"
    }

@pytest.fixture(autouse=True)
def setup_payment_prereqs():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    db = SessionLocal()
    if not db.query(Subscription).filter_by(id=1).first():
        sub = Subscription(id=1, parent_id=1, status='active', payment_status='paid')
        db.add(sub)
        db.commit()
    db.close()

def test_create_and_refund_payment():
    # Create a payment
    create_resp = client.post('/payments/create', json={
        'subscription_id': 1,
        'amount': 50.0,
        'gateway_id': 'gw_refund'
    })
    assert create_resp.status_code == 200
    payment_id = create_resp.json()['id']

    # Approve the payment
    approve_resp = client.post(f'/payments/{payment_id}/approve', json={
        'idempotency_key': 'refund-key-1'
    })
    assert approve_resp.status_code == 200

    # Refund the payment
    refund_resp = client.post(f'/payments/{payment_id}/refund', json={
        'idempotency_key': 'refund-key-2'
    })
    assert refund_resp.status_code == 200
    assert refund_resp.json()['status'] == 'refunded'

    # Try refunding again (should fail or be idempotent)
    refund_again = client.post(f'/payments/{payment_id}/refund', json={
        'idempotency_key': 'refund-key-3'
    })
    assert refund_again.status_code == 400 or refund_again.json()['status'] == 'refunded'
    
def test_concurrent_payment_approval():
    # Create payment
    create_resp = client.post('/payments/create', json={
        'subscription_id': 1,
        'amount': 100.0,
        'gateway_id': 'gw_race'
    })
    assert create_resp.status_code == 200
    payment_id = create_resp.json()['id']

    results = []
    import uuid
    def approve():
        # Each thread uses its own DB session
        db = SessionLocal()
        try:
            resp = client.post(f'/payments/{payment_id}/approve', json={
                'idempotency_key': str(uuid.uuid4())
            })
            results.append(resp.status_code)
        finally:
            db.close()

    threads = [threading.Thread(target=approve) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Only one should succeed (200), others should fail (400)
    assert results.count(200) == 1
    assert results.count(400) == 4

def test_create_and_list_notifications():
    # Create notification
    payload = {
        "type": "info",
        "message": "Test notification",
        "data": {"foo": "bar"}
    }
    create_resp = client.post('/families/1/notifications', json=payload)
    assert create_resp.status_code == 200
    assert create_resp.json()["status"] == "created"

    # List notifications
    list_resp = client.get('/families/1/notifications')
    assert list_resp.status_code == 200
    notifications = list_resp.json()
    assert any(n["message"] == "Test notification" for n in notifications)
    
import pytest
from fastapi.testclient import TestClient
from app.main import app

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_create_family():
    response = client.post('/families', params={'name': 'Smith Family'})
    assert response.status_code == 200
    assert response.json()['name'] == 'Smith Family'

def test_create_parent():
    response = client.post('/parents', params={'name': 'John Smith', 'email': 'john@example.com', 'family_id': 1})
    assert response.status_code == 200
    data = response.json()
    if "error" in data:
        assert data["error"] == "Parent with this email already exists."
    else:
        assert data["name"] == "John Smith"

def test_create_child():
    response = client.post('/children', params={'name': 'Alice', 'grade': '5', 'age': 10, 'avatar': 'avatar.png', 'family_id': 1})
    assert response.status_code == 200
    assert response.json()['name'] == 'Alice'


def test_create_payment_and_approve():
    # Create payment
    create_resp = client.post('/payments/create', json={
        'subscription_id': 1,
        'amount': 100.0,
        'gateway_id': 'gw_123'
    })
    assert create_resp.status_code == 200
    payment_id = create_resp.json()['id']

    # Approve payment with idempotency key
    approve_resp = client.post(f'/payments/{payment_id}/approve', json={
        'idempotency_key': 'test-key-1'
    })
    assert approve_resp.status_code == 200
    assert approve_resp.json()['status'] == 'approved'

    # Approve again with same idempotency key (should be idempotent)
    approve_resp2 = client.post(f'/payments/{payment_id}/approve', json={
        'idempotency_key': 'test-key-1'
    })
    assert approve_resp2.status_code == 200
    assert approve_resp2.json()['status'] == 'approved'

    # Approve again with different idempotency key (should fail)
    approve_resp3 = client.post(f'/payments/{payment_id}/approve', json={
        'idempotency_key': 'test-key-2'
    })
    assert approve_resp3.status_code == 400
    assert 'failed' in approve_resp3.json()['detail']
