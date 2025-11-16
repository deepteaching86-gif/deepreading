"""
Fix session_code column length in perception_test_sessions table
=================================================================

Issue: Column defined as VARCHAR(20) but actual data is 23 chars
Solution: Alter column to VARCHAR(50) to match Prisma schema

Run with: python fix_session_code_column.py
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def get_database_url():
    """Get DATABASE_URL from environment"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        sys.exit(1)
    return database_url

def parse_database_url(url):
    """Parse PostgreSQL connection URL"""
    result = urlparse(url)
    return {
        'host': result.hostname,
        'port': result.port or 5432,
        'database': result.path[1:],
        'user': result.username,
        'password': result.password
    }

def fix_column_length():
    """Apply the column length fix"""
    print("🔧 Starting session_code column fix...")

    # Get database connection
    database_url = get_database_url()
    db_params = parse_database_url(database_url)

    print(f"📡 Connecting to database: {db_params['host']}/{db_params['database']}")

    try:
        # Connect to database
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()

        print("✅ Database connection established")

        # Check current column definition
        print("\n🔍 Checking current column definition...")
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'perception_test_sessions'
            AND column_name = 'session_code';
        """)

        current_def = cursor.fetchone()
        if current_def:
            col_name, data_type, max_length = current_def
            print(f"   Current: {col_name} {data_type}({max_length})")
        else:
            print("   ⚠️ Column not found - table may not exist yet")
            conn.close()
            return

        # Apply the fix
        print("\n🔧 Applying column length fix...")
        cursor.execute("""
            ALTER TABLE "perception_test_sessions"
            ALTER COLUMN "session_code" TYPE VARCHAR(50);
        """)

        conn.commit()
        print("✅ Column altered successfully")

        # Verify the change
        print("\n🔍 Verifying the change...")
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'perception_test_sessions'
            AND column_name = 'session_code';
        """)

        new_def = cursor.fetchone()
        if new_def:
            col_name, data_type, max_length = new_def
            print(f"   Updated: {col_name} {data_type}({max_length})")

            if max_length == 50:
                print("\n✅ SUCCESS: Column length updated to VARCHAR(50)")
            else:
                print(f"\n⚠️ WARNING: Expected VARCHAR(50), got VARCHAR({max_length})")

        # Close connection
        cursor.close()
        conn.close()

        print("\n🎉 Migration completed successfully!")

    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_column_length()
