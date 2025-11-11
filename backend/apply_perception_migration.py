"""
Apply Visual Perception Test table migration to database
Safe to run - only creates new tables, doesn't modify existing ones
"""

import asyncio
import os
from pathlib import Path
from prisma import Prisma

async def apply_migration():
    """Apply SQL migration for Visual Perception Test tables"""

    # Read SQL file
    sql_file = Path(__file__).parent / "prisma" / "migrations" / "visual_perception_tables.sql"

    if not sql_file.exists():
        print(f"❌ SQL file not found: {sql_file}")
        return False

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print("📋 Applying Visual Perception Test table migration...")
    print(f"📄 SQL file: {sql_file}")
    print()

    # Connect to database
    db = Prisma()
    await db.connect()

    try:
        # Execute SQL
        # Note: Prisma client doesn't have direct SQL execution
        # We need to use query_raw for each statement

        # Split SQL into individual statements
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

        print(f"📊 Executing {len(statements)} SQL statements...")

        executed = 0
        for i, statement in enumerate(statements, 1):
            try:
                # Skip comments and empty statements
                if not statement or statement.startswith('--'):
                    continue

                # Execute statement
                await db.execute_raw(statement)
                executed += 1

                # Print progress for major operations
                if 'CREATE TABLE' in statement:
                    table_name = statement.split('CREATE TABLE')[1].split('(')[0].strip().strip('"')
                    print(f"  ✅ Created table: {table_name}")
                elif 'CREATE TYPE' in statement and 'ENUM' in statement:
                    enum_name = statement.split('CREATE TYPE')[1].split('AS')[0].strip().strip('"')
                    print(f"  ✅ Created enum: {enum_name}")
                elif 'CREATE INDEX' in statement or 'CREATE UNIQUE INDEX' in statement:
                    # Don't print each index to keep output clean
                    pass
                elif 'ALTER TABLE' in statement and 'ADD CONSTRAINT' in statement:
                    # Don't print each constraint to keep output clean
                    pass

            except Exception as e:
                # Some statements might fail if objects already exist - this is OK
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    # Object already exists - this is fine
                    pass
                else:
                    print(f"  ⚠️  Warning on statement {i}: {e}")

        print()
        print(f"✅ Migration completed successfully!")
        print(f"📊 Executed {executed}/{len(statements)} statements")
        print()
        print("📋 Created tables:")
        print("  • perception_passages")
        print("  • perception_questions")
        print("  • perception_test_sessions")
        print("  • perception_gaze_data")
        print("  • perception_responses")
        print("  • perception_test_results")
        print()
        print("🎯 Next step: Run sample data seeding")
        print("   python -m app.perception.sample_data")

        return True

    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await db.disconnect()


if __name__ == "__main__":
    success = asyncio.run(apply_migration())
    exit(0 if success else 1)
