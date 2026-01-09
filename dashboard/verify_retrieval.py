
import requests
import time
import json

BASE_URL = "http://localhost:8000"
API_KEY = "test_key"
SCENARIO_ID = "test_scenario"

def verify():
    print("1. Initializing Session...")
    res = requests.post(f"{BASE_URL}/api/init", json={
        "apiKey": API_KEY,
        "scenarioId": SCENARIO_ID,
        "payload": "1010"
    })
    
    if res.status_code != 200:
        print("Init failed:", res.text)
        return
    
    data = res.json()
    session_id = data["sessionId"]
    print(f"Session ID: {session_id}")

    # Wait a bit for retriever to potentially be ready if it wasn't
    # In app.py, init_retriever is async startup.
    print("Waiting for retriever initialization (5s)...")
    time.sleep(5)

    print("2. Sending Continue Request with new prompt...")
    # "book a flight" should trigger some retrieval if the logic works 
    # and if there are ANY tools indexed (even if not flight tools, it triggers retrieval).
    prompt = "I need to book a flight to Paris."
    
    res = requests.post(f"{BASE_URL}/api/continue", json={
        "sessionId": session_id,
        "prompt": prompt
    })
    
    if res.status_code != 200:
        print("Continue failed:", res.text)
        return

    cont_data = res.json()
    print("Continue Response:", json.dumps(cont_data, indent=2))
    
    if "new_tools_count" in cont_data:
        count = cont_data["new_tools_count"]
        print(f"VERIFICATION RESULT: Retrieved {count} new tools.")
        if count > 0:
            print("SUCCESS: Tool retrieval execution confirmed.")
        else:
            print("WARNING: Tool retrieval returned 0 tools. (Retriever might be empty or loading or no match)")
    else:
        print("ERROR: new_tools_count field missing. Did server restart with changes?")

if __name__ == "__main__":
    verify()
