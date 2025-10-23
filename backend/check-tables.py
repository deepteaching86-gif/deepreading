#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Check if English test tables exist in Supabase database
"""
import sys
import io

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import psycopg2
except ImportError:
    print("[ERROR] psycopg2 not installed. Installing...")
    import os
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2

def check_tables():
    """Check if English test tables exist"""

    # URL-encoded password: ! = %21, @ = %40, # = %23, $ = %24
    conn_string = "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres"

    print("[*] Connecting to Supabase PostgreSQL...")

    try:
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()

        print("[+] Connected successfully\n")

        # Check for English test tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('passages', 'items', 'english_test_sessions', 'english_test_responses')
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()

        print(f"[*] Checking English test tables:")
        print(f"    Expected: passages, items, english_test_sessions, english_test_responses\n")

        if tables:
            print(f"[+] Found {len(tables)} table(s):")
            for (table_name,) in tables:
                print(f"    [+] {table_name}")

                # Get row count
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                count = cursor.fetchone()[0]
                print(f"        Rows: {count}")
        else:
            print("[-] No English test tables found")
            print("\n[ACTION REQUIRED]")
            print("Please run the SQL script in Supabase Console:")
            print("  File: backend/prisma/create-english-test-tables.sql")
            print("  Guide: backend/prisma/SUPABASE-SETUP-GUIDE.md")

        # Check for enum types
        print("\n[*] Checking enum types:")
        cursor.execute("""
            SELECT typname
            FROM pg_type
            WHERE typname IN ('ItemDomain', 'TextType', 'ItemStatus')
            ORDER BY typname;
        """)

        enums = cursor.fetchall()
        if enums:
            print(f"[+] Found {len(enums)} enum type(s):")
            for (type_name,) in enums:
                print(f"    [+] {type_name}")
        else:
            print("[-] No enum types found")

        cursor.close()
        conn.close()

        print("\n" + "="*60)
        if len(tables) == 4:
            print("[SUCCESS] All tables exist! Ready for seeding.")
            print("\nNext step:")
            print("  npx ts-node prisma/seed-english-test.ts")
            return True
        else:
            print("[INCOMPLETE] Missing tables. Follow setup guide.")
            return False

    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        print("\nPossible causes:")
        print("  1. Network connectivity issue")
        print("  2. Database credentials changed")
        print("  3. Supabase service temporarily unavailable")
        return False

if __name__ == "__main__":
    success = check_tables()
    sys.exit(0 if success else 1)
