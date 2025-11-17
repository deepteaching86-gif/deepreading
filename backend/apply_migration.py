"""
Direct SQL execution for session_code column fix
No emojis to avoid Windows encoding issues
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

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

def main():
    # Get database connection
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    db_params = parse_database_url(database_url)
    print(f"Connecting to: {db_params['host']}/{db_params['database']}")

    try:
        # Connect to database
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()

        print("Connected successfully")

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
            print("WARNING: Column not found - table may not exist yet")
            conn.close()
            sys.exit(0)

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

    except psycopg2.OperationalError as e:
        print(f"\nDatabase connection error: {e}")
        sys.exit(1)
    except psycopg2.Error as e:
        print(f"\nDatabase error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
