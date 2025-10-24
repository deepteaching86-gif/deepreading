"""
Insert 600 Items + 100 Passages into Supabase Database
=======================================================

Executes SQL files to populate the English Adaptive Test database.
"""

import psycopg2
from urllib.parse import quote_plus

# Supabase connection details
DB_HOST = "db.sxnjeqqvqbhueqbwsnpj.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres.sxnjeqqvqbhueqbwsnpj"
DB_PASSWORD = "DeepReading2025!@#$SecureDB"
DB_PORT = 5432

def execute_sql_file(cursor, filename: str):
    """Execute SQL statements from a file"""
    print(f"[EXECUTING] {filename}...")

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            sql = f.read()

        # Execute the SQL
        cursor.execute(sql)
        print(f"[OK] {filename} executed successfully")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to execute {filename}")
        print(f"  Error: {str(e)}")
        return False

def main():
    print("[START] Connecting to database...")
    print()

    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )

        cursor = conn.cursor()
        print("[OK] Connected to Supabase")
        print()

        # 1. First, clear existing data (optional - comment out if you want to keep existing data)
        print("[CLEANUP] Removing existing items and passages...")
        cursor.execute("DELETE FROM items WHERE domain IN ('grammar', 'vocabulary', 'reading');")
        cursor.execute("DELETE FROM passages;")
        conn.commit()
        print("[OK] Existing data cleared")
        print()

        # 2. Insert passages first (because items reference passages)
        success1 = execute_sql_file(cursor, 'insert_passages_fixed.sql')
        if success1:
            conn.commit()
            print("[OK] Passages committed to database")
            print()
        else:
            conn.rollback()
            print("[ROLLBACK] Passages insert failed")
            return

        # 3. Insert items
        success2 = execute_sql_file(cursor, 'insert_600_items_fixed.sql')
        if success2:
            conn.commit()
            print("[OK] Items committed to database")
            print()
        else:
            conn.rollback()
            print("[ROLLBACK] Items insert failed")
            return

        # 4. Verify counts
        print("[VERIFY] Checking database...")
        cursor.execute("SELECT COUNT(*) FROM passages;")
        passage_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*), domain FROM items WHERE domain IN ('grammar', 'vocabulary', 'reading') GROUP BY domain ORDER BY domain;")
        item_counts = cursor.fetchall()

        print(f"  - Passages: {passage_count}")
        for count, domain in item_counts:
            print(f"  - {domain.capitalize()}: {count}")

        total_items = sum(count for count, _ in item_counts)
        print(f"  - Total Items: {total_items}")
        print()

        if passage_count == 100 and total_items == 600:
            print("[SUCCESS] All 600 items + 100 passages inserted successfully!")
        else:
            print(f"[WARNING] Expected 100 passages and 600 items, but got {passage_count} passages and {total_items} items")

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        print(f"[ERROR] Database error: {e}")
        print()
        print("[NOTE] If you see connection errors, this might be a network issue.")
        print("       You can manually run the SQL files in Supabase SQL Editor:")
        print("       1. Go to https://supabase.com/dashboard")
        print("       2. Navigate to SQL Editor")
        print("       3. Run insert_passages_fixed.sql first")
        print("       4. Then run insert_600_items_fixed.sql")

    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")

if __name__ == "__main__":
    main()
