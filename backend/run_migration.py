"""
Direct database migration execution
"""

import psycopg2

# Direct connection parameters
db_params = {
    'host': 'aws-1-ap-northeast-2.pooler.supabase.com',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres.sxnjeqqvqbhueqbwsnpj',
    'password': 'DEEP2025!@#$'
}

print(f"Connecting to: {db_params['host']}/{db_params['database']}")

try:
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()
    print("Connected successfully")

    # List perception tables first
    print("\nListing perception tables...")
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'perception%'
        ORDER BY table_name;
    """)

    tables = cursor.fetchall()
    print(f"Found {len(tables)} perception table(s):")
    for table in tables:
        print(f"  - {table[0]}")

    # Check current column definition
    print("\nChecking current column...")
    cursor.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'perception_test_sessions'
        AND column_name = 'session_code';
    """)

    current_def = cursor.fetchone()
    if current_def:
        col_name, data_type, max_length = current_def
        print(f"Current: {col_name} {data_type}({max_length})")
    else:
        print("WARNING: Column not found")
        conn.close()
        exit(0)

    # Apply the fix
    print("\nApplying ALTER TABLE...")
    cursor.execute("""
        ALTER TABLE "perception_test_sessions"
        ALTER COLUMN "session_code" TYPE VARCHAR(50);
    """)

    conn.commit()
    print("ALTER TABLE executed successfully")

    # Verify the change
    print("\nVerifying change...")
    cursor.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'perception_test_sessions'
        AND column_name = 'session_code';
    """)

    new_def = cursor.fetchone()
    if new_def:
        col_name, data_type, max_length = new_def
        print(f"Updated: {col_name} {data_type}({max_length})")

        if max_length == 50:
            print("\nSUCCESS: Column length updated to VARCHAR(50)")
        else:
            print(f"\nWARNING: Expected VARCHAR(50), got VARCHAR({max_length})")

    # Close connection
    cursor.close()
    conn.close()

    print("\nMigration completed successfully!")

except Exception as e:
    print(f"\nError: {e}")
    exit(1)
