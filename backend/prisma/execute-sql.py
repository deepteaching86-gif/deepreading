#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Execute SQL script directly on Supabase PostgreSQL database
"""
import sys
import os
import io

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Installing...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2

def execute_sql_file(sql_file_path: str):
    """Execute SQL file on Supabase database"""

    # Connection string (URL-encoded password: ! = %21, @ = %40, # = %23, $ = %24)
    conn_string = "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres"

    print(f"[*] Connecting to Supabase PostgreSQL...")

    try:
        # Connect to database
        conn = psycopg2.connect(conn_string)
        conn.autocommit = False
        cursor = conn.cursor()

        print(f"[+] Connected successfully")
        print(f"[*] Reading SQL file: {sql_file_path}")

        # Read SQL file
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        print(f"[*] Executing SQL script...")

        # Execute SQL
        cursor.execute(sql_content)
        conn.commit()

        print(f"[+] SQL script executed successfully!")
        print(f"[*] Tables created:")

        # List tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('passages', 'items', 'english_test_sessions', 'english_test_responses')
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        for (table_name,) in tables:
            print(f"  [+] {table_name}")

        cursor.close()
        conn.close()

        print("\n[SUCCESS] Database setup complete!")
        return True

    except Exception as e:
        print(f"[ERROR] Error executing SQL: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    sql_file = os.path.join(os.path.dirname(__file__), "create-english-test-tables.sql")

    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        sys.exit(1)

    success = execute_sql_file(sql_file)
    sys.exit(0 if success else 1)
