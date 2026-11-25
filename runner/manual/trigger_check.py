import requests

url = "http://localhost:8000/api/runner/trigger"
payload = {"intent": "create a task called review the design docs", "user_id": "test_user"}
headers = {"Content-Type": "application/json"}

try:
    resp = requests.post(url, json=payload, headers=headers)
    print("STATUS:", resp.status_code)
    print("RESPONSE:", resp.json())
except Exception as e:
    print("ERROR:", str(e))
