import sqlite3
import json

conn = sqlite3.connect('data/conversations.db')
cursor = conn.cursor()

# Get all conversations
cursor.execute('SELECT id, title_en, total_steps FROM conversations ORDER BY created_at DESC LIMIT 10')
rows = cursor.fetchall()

print("=== All Conversations ===")
for row in rows:
    print(f"ID: {row[0]}")
    print(f"Title: {row[1]}")
    print(f"Steps: {row[2]}")
    
    # Check if has baseline data
    cursor.execute('SELECT steps_json FROM conversations WHERE id = ?', (row[0],))
    steps_row = cursor.fetchone()
    if steps_row and steps_row[0]:
        steps = json.loads(steps_row[0])
        if steps:
            has_baseline = 'baseline' in steps[0]
            print(f"Has baseline: {has_baseline}")
            if has_baseline:
                print(f"Baseline data: {steps[0]['baseline']}")
    print("-" * 50)

conn.close()
