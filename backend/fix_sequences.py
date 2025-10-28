"""
Fix database sequences for AI-generated content
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(database_url)
cur = conn.cursor()

try:
    # Reset passages sequence
    cur.execute("SELECT setval('passages_id_seq', (SELECT MAX(id) FROM passages));")
    print("[OK] Reset passages_id_seq")

    # Reset items sequence
    cur.execute("SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));")
    print("[OK] Reset items_id_seq")

    # Reset ai_generated_items sequence if it exists
    cur.execute("""
        SELECT setval('ai_generated_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ai_generated_items));
    """)
    print("[OK] Reset ai_generated_items_id_seq")

    conn.commit()
    print("\n[SUCCESS] All sequences reset successfully!")

except Exception as e:
    print(f"[ERROR] {e}")
    conn.rollback()
finally:
    cur.close()
    conn.close()
