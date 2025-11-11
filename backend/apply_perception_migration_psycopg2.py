"""
Apply Visual Perception Test table migration to database using psycopg2
Safe to run - only creates new tables, doesn't modify existing ones
"""

import os
from pathlib import Path
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    """Apply SQL migration for Visual Perception Test tables"""

    # Read SQL file
    sql_file = Path(__file__).parent / "prisma" / "migrations" / "visual_perception_tables.sql"

    if not sql_file.exists():
        print(f"[ERROR] SQL file not found: {sql_file}")
        return False

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print("[*] Applying Visual Perception Test table migration...")
    print(f"[*] SQL file: {sql_file}")
    print()

    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("[ERROR] DATABASE_URL environment variable not found")
        return False

    # Connect to database
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = False  # Use transaction
        cursor = conn.cursor()

        print("[OK] Connected to database")
        print()

        try:
            # Execute the entire SQL script
            cursor.execute(sql_content)

            # Commit transaction
            conn.commit()

            print("[OK] Migration completed successfully!")
            print()
            print("Created tables:")
            print("  - perception_passages")
            print("  - perception_questions")
            print("  - perception_test_sessions")
            print("  - perception_gaze_data")
            print("  - perception_responses")
            print("  - perception_test_results")
            print()
            print("Next step: Run sample data seeding")
            print("   python -m app.perception.sample_data")

            return True

        except Exception as e:
            print(f"[ERROR] Error executing migration: {e}")
            conn.rollback()
            import traceback
            traceback.print_exc()
            return False

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"[ERROR] Error connecting to database: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = apply_migration()
    exit(0 if success else 1)
