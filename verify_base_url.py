from openai import OpenAI
import os

key = "sk-bc4f9ad465724cd6acfa9abd55817d06"

print("--- Testing without /v1 ---")
client = OpenAI(api_key=key, base_url="https://api.deepseek.com")
try:
    client.chat.completions.create(model="deepseek-chat", messages=[{"role":"user", "content":"hi"}])
    print("Success without /v1")
except Exception as e:
    print(f"Failed without /v1: {e}")

print("\n--- Testing with /v1 ---")
client2 = OpenAI(api_key=key, base_url="https://api.deepseek.com/v1")
try:
    client2.chat.completions.create(model="deepseek-chat", messages=[{"role":"user", "content":"hi"}])
    print("Success with /v1")
except Exception as e:
    print(f"Failed with /v1: {e}")
