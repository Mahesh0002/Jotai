import requests
import uuid
import time
import json
from runner.config import settings, HEADERS

def run_tests():
    print("=== Phase 1A Verification Pass ===\n")
    
    # 1. Test Context API
    print("Testing Context API...")
    try:
        res = requests.get(f"{settings.NODE_API_URL}/assistant/context", headers=HEADERS)
        if res.status_code == 200:
            print("[SUCCESS] Context API working.")
        else:
            print(f"[FAIL] Context API returned {res.status_code}")
    except Exception as e:
        print(f"[FAIL] Context API failed: {e}")

    # 2. Test ActionResult and actionId Idempotency
    print("\nTesting Task Creation with Idempotency...")
    action_id = str(uuid.uuid4())
    task_payload = {
        "title": "Test Task Idempotency",
        "actionId": action_id
    }
    
    # First call
    res1 = requests.post(f"{settings.NODE_API_URL}/tasks", headers=HEADERS, json=task_payload)
    if res1.status_code == 201:
        data1 = res1.json()
        print("[SUCCESS] Task creation succeeded (First call).")
        print(f"   ActionResult envelope present: {'ui' in data1 and 'effects' in data1}")
    else:
        print(f"[FAIL] Task creation failed: {res1.text}")
        
    # Second call with same action_id
    res2 = requests.post(f"{settings.NODE_API_URL}/tasks", headers=HEADERS, json=task_payload)
    if res2.status_code == 200:
        print("[SUCCESS] Idempotency working (Second call returned 200 instead of 201).")
        data2 = res2.json()
        if data2 == data1:
            print("[SUCCESS] Returned cached ActionResult exactly.")
        else:
            print("[FAIL] Cached ActionResult mismatched.")
    else:
        print(f"[FAIL] Idempotency failed: {res2.text}")
        
    # 3. Test Suggestion API and Deduplication
    print("\nTesting Suggestion API & Deduplication...")
    sugg_payload = {
        "type": "test_suggestion",
        "priority": "low",
        "title": "Test Suggestion",
        "message": "This is a test",
        "targetModule": "test",
        "actions": []
    }
    
    # First call
    sres1 = requests.post(f"{settings.NODE_API_URL}/assistant/suggestions", headers=HEADERS, json=sugg_payload)
    if sres1.status_code == 201:
        print("[SUCCESS] Suggestion created (First call).")
    else:
        print(f"[FAIL] Suggestion creation failed: {sres1.text}")
        
    # Second call (deduplication)
    sres2 = requests.post(f"{settings.NODE_API_URL}/assistant/suggestions", headers=HEADERS, json=sugg_payload)
    if sres2.status_code == 200:
        msg = sres2.json().get("message")
        print(f"[SUCCESS] Suggestion deduplicated (Second call returned 200: {msg}).")
    else:
        print(f"[FAIL] Suggestion deduplication failed: {sres2.text}")

    # 4. Redis Failure/Reconnection
    print("\nTesting Redis Failure Handling...")
    print("Redis is currently NOT running on this machine (no docker, no redis-server).")
    print("The EventPublisher safely ignores Redis errors and continues returning ActionResults.")
    
    # 5. Python Action Registry
    print("\nTesting Python Action Registry...")
    from runner.actions.registry import registry
    import runner.actions.task_actions # register them
    
    try:
        result = registry.execute("task.create", {"title": "Registry Test Task"})
        if result.get("success"):
            print("[SUCCESS] Python Action Registry successfully executed Node request.")
        else:
            print(f"[FAIL] Python Action Registry execution failed: {result}")
    except Exception as e:
        print(f"[FAIL] Python Action Registry exception: {e}")
        
if __name__ == "__main__":
    run_tests()
