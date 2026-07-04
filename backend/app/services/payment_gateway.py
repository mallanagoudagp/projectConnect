# Simulated payment gateway integration

def process_payment(subscription_id, amount, idempotency_key):
    # TODO: Integrate with Stripe/Razorpay
    # For now, simulate success
    return {'status': 'success', 'gateway_id': f'gw_{subscription_id}_{idempotency_key}'}
