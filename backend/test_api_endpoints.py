import requests
import json

# Test the health endpoint
try:
    response = requests.get('http://localhost:8000/health')
    print(f"Health endpoint status: {response.status_code}")
    print(f"Health response: {response.json()}")
except Exception as e:
    print(f"Health endpoint error: {e}")

# Test creating a payment
try:
    payment_data = {
        'subscription_id': 1,
        'amount': 50.0,
        'gateway_id': 'gw_test'
    }
    response = requests.post('http://localhost:8000/payments/create', json=payment_data)
    print(f"Create payment status: {response.status_code}")
    if response.status_code == 200:
        payment = response.json()
        print(f"Created payment: {payment}")
        
        # Test approving the payment
        approve_data = {'idempotency_key': 'test_key_1'}
        approve_response = requests.post(f'http://localhost:8000/payments/{payment["id"]}/approve', json=approve_data)
        print(f"Approve payment status: {approve_response.status_code}")
        print(f"Approve response: {approve_response.json()}")
        
    else:
        print(f"Create payment error: {response.text}")
except Exception as e:
    print(f"Payment API error: {e}")
