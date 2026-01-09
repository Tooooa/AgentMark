import json
from pathlib import Path
import os

saved_dir = Path("/root/autodl-tmp/AgentMark2/AgentMark/dashboard/src/data/saved")
files = list(saved_dir.glob("*.json"))

# Group by Title
by_title = {}
for f in files:
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
        # Handle title object or string
        title = data.get("title")
        if isinstance(title, dict):
            title_str = title.get("en", str(title))
        else:
            title_str = str(title)
            
        if title_str not in by_title:
            by_title[title_str] = []
        by_title[title_str].append(f)
    except Exception as e:
        print(f"Error reading {f}: {e}")

# Delete duplicates (keep newest)
deleted_count = 0
for title, file_list in by_title.items():
    if len(file_list) > 1:
        # Sort by mtime desc
        file_list.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        # Keep first (index 0)
        to_delete = file_list[1:]
        for f in to_delete:
            print(f"Deleting duplicate '{title}': {f.name}")
            os.remove(f)
            deleted_count += 1

print(f"Cleanup complete. Deleted {deleted_count} duplicate files.")
