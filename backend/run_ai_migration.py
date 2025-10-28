"""
Run AI CAT System Database Migration
=====================================

Creates the ai_generated_items table and related indexes.
"""

import psycopg2

DATABASE_URL = "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

def run_migration():
    """Execute AI tables migration."""

    with open("app/ai/migrations/001_create_ai_tables.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        print("Running AI tables migration...")
        cur.execute(sql)
        conn.commit()
        print("[SUCCESS] Migration completed successfully!")

        # Verify table was created
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name = 'ai_generated_items'
        """)

        if cur.fetchone():
            print("[SUCCESS] Table 'ai_generated_items' created successfully")
        else:
            print("[WARNING] Table not found after migration")

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Migration failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
