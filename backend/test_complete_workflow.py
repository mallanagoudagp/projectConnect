"""
Simple test script that uses requests to test the FastAPI endpoints
without importing the full application
"""
import requests
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("✓ Health endpoint working")

def test_payment_workflow():
    """Test the complete payment workflow"""
    # 1. Create a payment
    payment_data = {
        'subscription_id': 1,
        'amount': 50.0,
        'gateway_id': 'gw_test_refund'
    }
    
    create_response = requests.post(f"{BASE_URL}/payments/create", json=payment_data)
    assert create_response.status_code == 200
    payment = create_response.json()
    payment_id = payment['id']
    print(f"✓ Created payment {payment_id}")
    
    # 2. Approve the payment
    approve_data = {'idempotency_key': 'test_approve_key'}
    approve_response = requests.post(f"{BASE_URL}/payments/{payment_id}/approve", json=approve_data)
    assert approve_response.status_code == 200
    approved_payment = approve_response.json()
    assert approved_payment['status'] == 'approved'
    print(f"✓ Approved payment {payment_id}")
    
    # 3. Refund the payment
    refund_data = {'idempotency_key': 'test_refund_key'}
    refund_response = requests.post(f"{BASE_URL}/payments/{payment_id}/refund", json=refund_data)
    assert refund_response.status_code == 200
    refunded_payment = refund_response.json()
    assert refunded_payment['status'] == 'refunded'
    print(f"✓ Refunded payment {payment_id}")
    
    # 4. Try refunding again (should be idempotent or fail)
    refund_again = requests.post(f"{BASE_URL}/payments/{payment_id}/refund", json={'idempotency_key': 'test_refund_key_2'})
    # Should either be idempotent (200) or fail (400)
    assert refund_again.status_code in [200, 400]
    print(f"✓ Duplicate refund handled correctly")

def test_concurrent_approvals():
    """Test concurrent payment approvals"""
    import threading
    
    # Create a payment
    payment_data = {
        'subscription_id': 1,
        'amount': 100.0,
        'gateway_id': 'gw_race_test'
    }
    
    create_response = requests.post(f"{BASE_URL}/payments/create", json=payment_data)
    assert create_response.status_code == 200
    payment_id = create_response.json()['id']
    print(f"✓ Created payment {payment_id} for race test")
    
    results = []
    
    def approve_payment():
        try:
            response = requests.post(f"{BASE_URL}/payments/{payment_id}/approve", 
                                   json={'idempotency_key': 'race_test_key'})
            results.append(response.status_code)
        except Exception as e:
            results.append(f"Error: {e}")
    
    # Start multiple threads
    threads = []
    for i in range(3):
        thread = threading.Thread(target=approve_payment)
        threads.append(thread)
        thread.start()
    
    # Wait for all threads
    for thread in threads:
        thread.join()
    
    # Check results - should have one success and others should be handled gracefully
    success_count = sum(1 for r in results if r == 200)
    print(f"✓ Concurrent approvals: {success_count} success, {len(results) - success_count} handled")
    assert success_count >= 1  # At least one should succeed

if __name__ == "__main__":
    try:
        print("Testing FastAPI endpoints...")
        test_health()
        test_payment_workflow()
        test_concurrent_approvals()
        print("\n🎉 All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
