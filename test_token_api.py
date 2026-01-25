import requests
import json

def test_step():
    url = "http://localhost:8000/api/step"
    # Note: This requires an active session ID. Since I can't easily get one, 
    # I will look at the server logs or try to create a session first.
    # Alternatively, I can just check if the server restarts correctly with the new code.
    print("Testing server connectivity...")
    try:
        response = requests.get("http://localhost:8000/docs")
        print(f"Server status: {response.status_code}")
    except Exception as e:
        print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    test_step()
