import psycopg2

db_params = {
    'host': 'aws-1-ap-northeast-2.pooler.supabase.com',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres.sxnjeqqvqbhueqbwsnpj',
    'password': 'DEEP2025!@#$'
}

print(f"Connecting to: {db_params['host']}")

try:
    conn = psycopg2.connect(**db_params)
    cursor = cursor.cursor()
    
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'perception%'
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print("\nPerception-related tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nError: {e}")
