import psycopg2

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
    print("Connected successfully\n")

    # Get one of the existing grade 2 passages
    print("Fetching existing grade 2 passage...")
    cursor.execute("""
        SELECT id, title, content, word_count, sentence_count, category, difficulty
        FROM perception_passages
        WHERE grade = 2
        LIMIT 1;
    """)
    
    existing = cursor.fetchone()
    if not existing:
        print("ERROR: No grade 2 passages found to copy")
        conn.close()
        exit(1)
    
    print(f"Found passage: {existing[1][:50]}...")
    
    # Check if grade 1 passage already exists
    cursor.execute("SELECT COUNT(*) FROM perception_passages WHERE grade = 1;")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"\nGrade 1 passages already exist ({count} found)")
        print("Skipping insertion")
    else:
        # Insert as grade 1 passage
        print("\nInserting as grade 1 passage...")
        cursor.execute("""
            INSERT INTO perception_passages 
            (grade, title, content, word_count, sentence_count, category, difficulty, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            1,  # grade 1
            existing[1],  # title
            existing[2],  # content
            existing[3],  # word_count
            existing[4],  # sentence_count
            existing[5],  # category
            existing[6],  # difficulty
            True  # is_active
        ))
        
        new_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"SUCCESS: Created grade 1 passage with ID: {new_id}")
    
    # Verify
    print("\nVerifying grade distribution...")
    cursor.execute("""
        SELECT grade, COUNT(*) as count
        FROM perception_passages
        GROUP BY grade
        ORDER BY grade;
    """)
    
    distribution = cursor.fetchall()
    print("\nGrade distribution:")
    for grade, count in distribution:
        print(f"  Grade {grade}: {count} passage(s)")
    
    cursor.close()
    conn.close()
    
    print("\nCompleted successfully!")

except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
