import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = os.environ.get('DATABASE_URL') or "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DEEP2025%21%40%23%24@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

def verify_insertion():
    """Verify 600 items insertion"""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    print("=" * 60)
    print("Database Verification - 600 Items")
    print("=" * 60)

    # Check total items
    cursor.execute("SELECT COUNT(*) as total FROM items;")
    total = cursor.fetchone()['total']
    print(f"[*] Total items in database: {total}")

    # Check by domain
    cursor.execute("""
        SELECT domain, COUNT(*) as count
        FROM items
        GROUP BY domain
        ORDER BY domain;
    """)
    domains = cursor.fetchall()
    print(f"\n[*] Items by domain:")
    for row in domains:
        print(f"    - {row['domain']}: {row['count']}")

    # Check by stage and panel
    cursor.execute("""
        SELECT stage, panel, COUNT(*) as count
        FROM items
        GROUP BY stage, panel
        ORDER BY stage, panel;
    """)
    stages = cursor.fetchall()
    print(f"\n[*] Items by stage and panel:")
    for row in stages:
        print(f"    - Stage {row['stage']}, Panel {row['panel']}: {row['count']}")

    # Check passages
    cursor.execute("SELECT COUNT(*) as total FROM passages;")
    passage_count = cursor.fetchone()['total']
    print(f"\n[*] Total passages in database: {passage_count}")

    # Check reading items with passages
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM items
        WHERE passage_id IS NOT NULL;
    """)
    reading_with_passages = cursor.fetchone()['count']
    print(f"[*] Reading items with passages: {reading_with_passages}")

    cursor.close()
    conn.close()

    print("=" * 60)
    print("[SUCCESS] Verification complete!")
    print("=" * 60)

if __name__ == "__main__":
    verify_insertion()
