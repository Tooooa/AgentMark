import time
start = time.time()
print("Importing agents...")
try:
    import agents
    print(f"Imported agents in {time.time() - start:.2f}s")
except Exception as e:
    print(f"Failed to import: {e}")
