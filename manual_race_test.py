import requests, concurrent.futures, time

BASE = "http://localhost:8000"
SUBSCRIPTION_ID = 1
APPROVAL_THREADS = 8
IDEMPOTENCY_KEY = "race-key-1"

def create_payment():
    r = requests.post(f"{BASE}/payments/create", json={
        "subscription_id": SUBSCRIPTION_ID,
        "amount": 123.45,
        "gateway_id": "gw_race"
    })
    r.raise_for_status()
    return r.json()["id"]

def approve(payment_id, key):
    return requests.post(
        f"{BASE}/payments/{payment_id}/approve",
        json={"idempotency_key": key},
        timeout=5
    )

def main():
    print("Creating payment...")
    payment_id = create_payment()
    print("Payment ID:", payment_id)

    print(f"Firing {APPROVAL_THREADS} concurrent approvals (same idempotency key)...")
    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=APPROVAL_THREADS) as ex:
        futures = [ex.submit(approve, payment_id, IDEMPOTENCY_KEY) for _ in range(APPROVAL_THREADS)]
    elapsed = time.time() - start

    statuses = [f.result().status_code for f in futures]
    bodies = [f.result().json() for f in futures]

    success = statuses.count(200)
    failures = len(statuses) - success

    print("Statuses:", statuses)
    print("Success bodies (first 2):", bodies[:2])
    print(f"Elapsed: {elapsed:.3f}s")
    print(f"200 count: {success} | non-200 count: {failures}")

    # Extra: try a different idempotency key after approval
    different = approve(payment_id, "race-key-2")
    print("Different key attempt:", different.status_code, different.json())

    print("\nExpected:")
    print("- All calls with the SAME idempotency key should return 200 (purely idempotent) OR")
    print("- Exactly one 200 and others 400 if your logic rejects duplicate same-key attempts.")
    print("- Different key after approval should be 400 (already processed).")

if __name__ == "__main__":
    main()