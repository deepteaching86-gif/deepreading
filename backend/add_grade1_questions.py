import psycopg2
from psycopg2.extras import Json

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

    # Get grade 1 passage ID
    cursor.execute("""
        SELECT id FROM perception_passages WHERE grade = 1 LIMIT 1;
    """)

    grade1_passage = cursor.fetchone()
    if not grade1_passage:
        print("ERROR: No grade 1 passage found")
        exit(1)

    grade1_passage_id = grade1_passage[0]
    print(f"Grade 1 Passage ID: {grade1_passage_id}")

    # Get one grade 2 passage with questions
    cursor.execute("""
        SELECT id FROM perception_passages WHERE grade = 2 LIMIT 1;
    """)

    grade2_passage = cursor.fetchone()
    if not grade2_passage:
        print("ERROR: No grade 2 passage found")
        exit(1)

    grade2_passage_id = grade2_passage[0]
    print(f"Grade 2 Passage ID: {grade2_passage_id}")

    # Get questions from grade 2 passage
    cursor.execute("""
        SELECT question_number, question_text, options, correct_answer, question_type
        FROM perception_questions
        WHERE passage_id = %s
        ORDER BY question_number;
    """, (grade2_passage_id,))

    questions = cursor.fetchall()
    print(f"\nFound {len(questions)} questions from grade 2 passage")

    if len(questions) == 0:
        print("ERROR: No questions found for grade 2 passage")
        exit(1)

    # Check if grade 1 passage already has questions
    cursor.execute("""
        SELECT COUNT(*) FROM perception_questions WHERE passage_id = %s;
    """, (grade1_passage_id,))

    existing_count = cursor.fetchone()[0]

    if existing_count > 0:
        print(f"\nGrade 1 passage already has {existing_count} questions")
        print("Skipping insertion")
    else:
        # Copy questions to grade 1 passage
        print("\nCopying questions to grade 1 passage...")

        for q in questions:
            question_number, question_text, options, correct_answer, question_type = q

            cursor.execute("""
                INSERT INTO perception_questions
                (passage_id, question_number, question_text, options, correct_answer, question_type)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                grade1_passage_id,  # Use grade 1 passage ID
                question_number,
                question_text,
                Json(options),  # Wrap dict with Json() for JSONB type
                correct_answer,
                question_type
            ))

            new_id = cursor.fetchone()[0]
            print(f"  {question_number}. Created question ID: {new_id[:8]}...")

        conn.commit()
        print(f"\nSUCCESS: Copied {len(questions)} questions to grade 1 passage")

    # Verify final state
    cursor.execute("""
        SELECT p.grade, p.title, COUNT(q.id) as question_count
        FROM perception_passages p
        LEFT JOIN perception_questions q ON q.passage_id = p.id
        GROUP BY p.id, p.grade, p.title
        ORDER BY p.grade;
    """)

    print("\nFinal state:")
    for grade, title, qcount in cursor.fetchall():
        print(f"  Grade {grade}: {qcount} questions")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()
