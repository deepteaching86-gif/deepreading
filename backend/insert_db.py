"""
Database Insertion Script for 600 Items
========================================

Inserts passages and items from SQL files into PostgreSQL database.
"""

import os
import sys
import psycopg2
from psycopg2 import sql

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Database connection
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DEEP2025%21%40%23%24@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres'
)

def execute_sql_file(file_path, description):
    """Execute SQL file"""
    print(f"\n{'='*60}")
    print(f">> {description}")
    print(f"{'='*60}")

    # Read SQL file
    with open(file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"[*] File: {file_path}")
    print(f"[*] SQL size: {len(sql_content):,} characters")

    # Connect and execute
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print(f"[*] Executing SQL...")
        cursor.execute(sql_content)

        # Get row count
        if cursor.rowcount > 0:
            print(f"[+] Inserted {cursor.rowcount} rows")
        else:
            print(f"[+] Execution complete")

        conn.commit()
        cursor.close()
        conn.close()

        print(f"[SUCCESS] {description}")
        return True

    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def main():
    """Main execution"""
    print("\n" + "="*60)
    print("Database Insertion Script - 600 Items")
    print("="*60)
    print(f"[*] Database: {DATABASE_URL[:50]}...")

    # Step 1: Insert passages
    passages_success = execute_sql_file(
        'insert_passages_fixed.sql',
        'Inserting 100 Passages'
    )

    if not passages_success:
        print("\n[ERROR] Passages insertion failed. Stopping.")
        return

    # Step 2: Insert items
    items_success = execute_sql_file(
        'insert_600_items_fixed.sql',
        'Inserting 600 Items'
    )

    if not items_success:
        print("\n[ERROR] Items insertion failed.")
        return

    # Final summary
    print("\n" + "="*60)
    print("[SUCCESS] DATABASE INSERTION COMPLETE")
    print("="*60)
    print("[*] Summary:")
    print("  - Passages: 100 inserted")
    print("  - Items: 600 inserted")
    print("  - Total: 700 records")
    print("\n[+] All data successfully inserted into database!")

if __name__ == '__main__':
    main()
