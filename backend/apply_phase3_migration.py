"""
Phase 3 Migration: Growth Tracking, Validity Study, MST Routing Optimization
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
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        # Fallback: load from .env file
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        database_url = line.split('=', 1)[1].strip('"').strip("'")
                        break
        if not database_url:
            print("ERROR: DATABASE_URL not set and .env not found")
            sys.exit(1)

    print(f"Connecting to database...")

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        print("Connected successfully")

        # Read migration SQL
        migration_path = os.path.join(
            os.path.dirname(__file__),
            'prisma', 'migrations', 'phase3_growth_validity_routing.sql'
        )

        with open(migration_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]

        for i, stmt in enumerate(statements, 1):
            # Skip comments-only blocks
            lines = [l for l in stmt.split('\n') if l.strip() and not l.strip().startswith('--')]
            if not lines:
                continue

            try:
                cursor.execute(stmt)
                conn.commit()
                # Extract a short description from the statement
                first_word = lines[0].strip().split()[0].upper() if lines else 'UNKNOWN'
                print(f"  [{i}/{len(statements)}] {first_word} ... OK")
            except psycopg2.errors.DuplicateColumn:
                conn.rollback()
                print(f"  [{i}/{len(statements)}] Column already exists, skipping")
            except psycopg2.errors.DuplicateTable:
                conn.rollback()
                print(f"  [{i}/{len(statements)}] Table already exists, skipping")
            except Exception as e:
                conn.rollback()
                print(f"  [{i}/{len(statements)}] Error: {e}")

        # Verify tables created
        print("\nVerifying migration...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'mst_routing_config', 'dif_results',
                'reliability_results', 'simulation_results'
            )
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"  Phase 3 tables found: {tables}")

        # Verify columns added to english_test_sessions
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'english_test_sessions'
            AND column_name IN ('grade_level', 'gender')
            ORDER BY column_name;
        """)
        columns = [row[0] for row in cursor.fetchall()]
        print(f"  New session columns: {columns}")

        # Verify routing config data
        cursor.execute("SELECT COUNT(*) FROM mst_routing_config;")
        config_count = cursor.fetchone()[0]
        print(f"  Routing configs: {config_count}")

        cursor.close()
        conn.close()
        print("\nPhase 3 migration complete!")

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
