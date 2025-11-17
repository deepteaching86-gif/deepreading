import os
import sys
import re

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = os.environ.get('DATABASE_URL') or "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DEEP2025%21%40%23%24@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

if not DATABASE_URL:
    print("[ERROR] DATABASE_URL environment variable not set")
    sys.exit(1)

def fix_passage_ids(input_file, output_file):
    """
    Fix passage_id references in SQL file.
    Update passage_id from 1-100 to 133-232 (offset +132)
    """
    print(f"[*] Reading SQL file: {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"[*] Fixing passage_id references (1-100 -> 133-232)...")

    # Replace passage_id values
    # Pattern: (passage_id_value, where passage_id_value is a number
    def replace_passage_id(match):
        original_id = int(match.group(1))
        if 1 <= original_id <= 100:
            new_id = original_id + 132  # Offset by 132 to get 133-232
            return f"({new_id},"
        else:
            return match.group(0)  # Keep unchanged if outside range

    # Match pattern: (number, at the start of a line (passage_id position)
    # This pattern specifically targets the VALUES clause format
    sql_fixed = re.sub(r'\((\d+),', replace_passage_id, sql_content)

    print(f"[*] Writing corrected SQL to: {output_file}")

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_fixed)

    print(f"[SUCCESS] Passage IDs updated successfully!")
    return output_file

def execute_sql_file(file_path, description):
    """Execute SQL file"""
    import psycopg2

    print(f"[*] Executing {description}...")
    print(f"    File: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        cursor.execute(sql_content)
        conn.commit()

        print(f"[SUCCESS] {description} completed!")
        print(f"    Rows affected: {cursor.rowcount}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] Failed to execute {description}")
        print(f"    Error: {e}")
        raise

if __name__ == "__main__":
    print("=" * 60)
    print("Fix Passage IDs and Insert 600 Items")
    print("=" * 60)

    input_file = "insert_600_items_fixed.sql"
    output_file = "insert_600_items_corrected.sql"

    # Step 1: Fix passage IDs
    corrected_file = fix_passage_ids(input_file, output_file)

    # Step 2: Execute corrected SQL
    execute_sql_file(corrected_file, "Insert 600 Items (Corrected)")

    print("=" * 60)
    print("[SUCCESS] All items inserted successfully!")
    print("=" * 60)
