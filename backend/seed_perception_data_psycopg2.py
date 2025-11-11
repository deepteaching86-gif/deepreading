"""
Sample Data for Visual Perception Test (Grade 2) using psycopg2
Run this script to populate the database with sample passages and questions
for 2nd grade students.

Usage:
    python seed_perception_data_psycopg2.py
"""

import os
import uuid
import psycopg2
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Sample passages for Grade 2
GRADE_2_PASSAGES = [
    {
        "id": str(uuid.uuid4()),
        "grade": 2,
        "title": "토끼와 거북이",
        "content": """옛날 어느 숲 속에 빠른 토끼와 느린 거북이가 살았습니다.

토끼는 늘 자신의 빠른 다리를 자랑했습니다. "나는 세상에서 가장 빠르단 말이야!" 토끼가 말했습니다.

거북이는 토끼에게 말했습니다. "그럼 우리 경주를 해볼까?" 토끼는 웃으며 대답했습니다. "좋아, 하지만 너는 질 거야!"

경주가 시작되었습니다. 토끼는 빠르게 달려 나갔습니다. 거북이는 천천히 걸었습니다.

한참을 달린 토끼는 뒤를 돌아보았습니다. 거북이는 아직 멀리 있었습니다. "잠깐 쉬어도 되겠어." 토끼는 나무 아래에서 잠이 들었습니다.

거북이는 쉬지 않고 계속 걸었습니다. 마침내 거북이가 결승선에 도착했습니다. 토끼가 깨어났을 때는 이미 늦었습니다.

거북이가 말했습니다. "천천히 가도 포기하지 않으면 이길 수 있어!"
""",
        "word_count": 156,
        "sentence_count": 14,
        "category": "동화",
        "difficulty": "easy",
        "questions": [
            {
                "question_number": 1,
                "question_text": "토끼는 무엇을 자랑했나요?",
                "options": [
                    {"id": "A", "text": "빠른 다리"},
                    {"id": "B", "text": "예쁜 꼬리"},
                    {"id": "C", "text": "긴 귀"},
                    {"id": "D", "text": "큰 눈"}
                ],
                "correct_answer": "A",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "토끼는 경주 중에 무엇을 했나요?",
                "options": [
                    {"id": "A", "text": "밥을 먹었습니다"},
                    {"id": "B", "text": "잠을 잤습니다"},
                    {"id": "C", "text": "친구를 만났습니다"},
                    {"id": "D", "text": "물을 마셨습니다"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 3,
                "question_text": "경주에서 누가 이겼나요?",
                "options": [
                    {"id": "A", "text": "토끼"},
                    {"id": "B", "text": "거북이"},
                    {"id": "C", "text": "둘 다"},
                    {"id": "D", "text": "아무도"}
                ],
                "correct_answer": "B",
                "question_type": "inference"
            },
            {
                "question_number": 4,
                "question_text": "이 이야기가 우리에게 주는 교훈은 무엇인가요?",
                "options": [
                    {"id": "A", "text": "빨리 달려야 이긴다"},
                    {"id": "B", "text": "잠을 많이 자야 한다"},
                    {"id": "C", "text": "포기하지 않으면 이길 수 있다"},
                    {"id": "D", "text": "친구와 경쟁하면 안 된다"}
                ],
                "correct_answer": "C",
                "question_type": "main_idea"
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "grade": 2,
        "title": "개미와 베짱이",
        "content": """여름이었습니다. 개미는 열심히 일했습니다. 개미는 겨울을 준비하며 먹이를 모았습니다.

베짱이는 나무 아래에서 노래를 불렀습니다. "개미야, 왜 그렇게 열심히 일하니? 나와 같이 놀자!" 베짱이가 말했습니다.

개미는 대답했습니다. "나는 겨울을 준비해야 해. 너도 먹이를 모으는 게 좋을 거야."

베짱이는 웃으며 말했습니다. "겨울은 아직 멀었어. 지금은 노는 게 더 중요해!" 베짱이는 계속 노래를 불렀습니다.

가을이 지나고 겨울이 왔습니다. 눈이 많이 내렸습니다. 개미는 따뜻한 집에서 모아둔 먹이를 먹었습니다.

베짱이는 추위에 떨며 먹을 것을 찾았습니다. 베짱이는 개미의 집에 찾아갔습니다. "개미야, 먹을 것 좀 나눠줄 수 있니?"

개미는 베짱이를 안으로 들였습니다. "앞으로는 미리 준비하는 게 좋아." 개미가 말했습니다.
""",
        "word_count": 178,
        "sentence_count": 15,
        "category": "동화",
        "difficulty": "easy",
        "questions": [
            {
                "question_number": 1,
                "question_text": "여름에 개미는 무엇을 했나요?",
                "options": [
                    {"id": "A", "text": "노래를 불렀습니다"},
                    {"id": "B", "text": "먹이를 모았습니다"},
                    {"id": "C", "text": "잠을 잤습니다"},
                    {"id": "D", "text": "친구와 놀았습니다"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "여름에 베짱이는 무엇을 했나요?",
                "options": [
                    {"id": "A", "text": "일을 했습니다"},
                    {"id": "B", "text": "먹이를 모았습니다"},
                    {"id": "C", "text": "노래를 불렀습니다"},
                    {"id": "D", "text": "집을 지었습니다"}
                ],
                "correct_answer": "C",
                "question_type": "detail"
            },
            {
                "question_number": 3,
                "question_text": "겨울에 베짱이는 왜 개미의 집에 갔나요?",
                "options": [
                    {"id": "A", "text": "놀러 갔습니다"},
                    {"id": "B", "text": "먹을 것을 얻으러 갔습니다"},
                    {"id": "C", "text": "노래를 부르러 갔습니다"},
                    {"id": "D", "text": "집을 구경하러 갔습니다"}
                ],
                "correct_answer": "B",
                "question_type": "inference"
            },
            {
                "question_number": 4,
                "question_text": "이 이야기가 우리에게 주는 교훈은 무엇인가요?",
                "options": [
                    {"id": "A", "text": "노래를 잘 불러야 한다"},
                    {"id": "B", "text": "미리 준비하는 것이 중요하다"},
                    {"id": "C", "text": "친구와 나눠 먹어야 한다"},
                    {"id": "D", "text": "여름이 겨울보다 좋다"}
                ],
                "correct_answer": "B",
                "question_type": "main_idea"
            }
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "grade": 2,
        "title": "해님과 달님",
        "content": """옛날 어느 마을에 착한 엄마와 오누이가 살았습니다.

어느 날 엄마는 떡을 팔러 먼 마을에 갔습니다. 집으로 돌아오는 길에 호랑이를 만났습니다.

호랑이가 말했습니다. "떡 하나 주면 안 잡아먹지!" 엄마는 무서워서 떡을 하나 주었습니다.

호랑이는 계속 떡을 달라고 했습니다. 마침내 엄마는 호랑이에게 잡아먹혔습니다.

호랑이는 엄마의 옷을 입고 집으로 갔습니다. 오누이는 문을 열어주지 않았습니다.

"엄마 손을 보여주세요!" 오빠가 말했습니다. 호랑이의 털 많은 손을 본 오누이는 무서워서 나무 위로 올라갔습니다.

호랑이도 나무를 올라왔습니다. 오누이는 하늘에 빌었습니다. "하늘님, 우리를 살려주세요!"

하늘에서 새 동아줄이 내려왔습니다. 오누이는 동아줄을 타고 하늘로 올라갔습니다.

호랑이도 빌었지만, 썩은 동아줄이 내려왔습니다. 호랑이는 땅에 떨어졌습니다.

오누이는 하늘에서 해님과 달님이 되었습니다.
""",
        "word_count": 192,
        "sentence_count": 16,
        "category": "전래동화",
        "difficulty": "medium",
        "questions": [
            {
                "question_number": 1,
                "question_text": "엄마는 어디에 갔다 오는 길이었나요?",
                "options": [
                    {"id": "A", "text": "시장"},
                    {"id": "B", "text": "떡을 팔러 간 마을"},
                    {"id": "C", "text": "학교"},
                    {"id": "D", "text": "병원"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "오누이는 왜 나무 위로 올라갔나요?",
                "options": [
                    {"id": "A", "text": "놀기 위해서"},
                    {"id": "B", "text": "호랑이가 무서워서"},
                    {"id": "C", "text": "엄마를 기다리기 위해서"},
                    {"id": "D", "text": "달을 보기 위해서"}
                ],
                "correct_answer": "B",
                "question_type": "inference"
            },
            {
                "question_number": 3,
                "question_text": "오누이는 마지막에 무엇이 되었나요?",
                "options": [
                    {"id": "A", "text": "별님"},
                    {"id": "B", "text": "구름님"},
                    {"id": "C", "text": "해님과 달님"},
                    {"id": "D", "text": "새"}
                ],
                "correct_answer": "C",
                "question_type": "detail"
            },
            {
                "question_number": 4,
                "question_text": "호랑이에게는 어떤 동아줄이 내려왔나요?",
                "options": [
                    {"id": "A", "text": "새 동아줄"},
                    {"id": "B", "text": "썩은 동아줄"},
                    {"id": "C", "text": "금 동아줄"},
                    {"id": "D", "text": "동아줄이 안 내려왔습니다"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            }
        ]
    }
]


def seed_perception_data():
    """Seed the database with sample perception test data"""

    # Get DATABASE_URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("[ERROR] DATABASE_URL environment variable not found")
        return False

    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        cursor = conn.cursor()

        print("[*] Seeding Visual Perception Test data...")
        print()

        passages_created = 0
        questions_created = 0

        for passage_data in GRADE_2_PASSAGES:
            # Check if passage already exists
            cursor.execute(
                "SELECT id FROM perception_passages WHERE id = %s",
                (passage_data["id"],)
            )
            existing = cursor.fetchone()

            if existing:
                print(f"[SKIP] Passage '{passage_data['title']}' already exists")
                continue

            # Extract questions
            questions_data = passage_data.pop("questions")

            # Create passage
            cursor.execute(
                """
                INSERT INTO perception_passages
                (id, grade, title, content, word_count, sentence_count, category, difficulty)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    passage_data["id"],
                    passage_data["grade"],
                    passage_data["title"],
                    passage_data["content"],
                    passage_data["word_count"],
                    passage_data["sentence_count"],
                    passage_data.get("category"),
                    passage_data.get("difficulty")
                )
            )

            passages_created += 1
            print(f"[OK] Created passage: {passage_data['title']}")

            # Create questions
            for q_data in questions_data:
                cursor.execute(
                    """
                    INSERT INTO perception_questions
                    (passage_id, question_number, question_text, options, correct_answer, question_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        passage_data["id"],
                        q_data["question_number"],
                        q_data["question_text"],
                        json.dumps(q_data["options"]),
                        q_data["correct_answer"],
                        q_data.get("question_type")
                    )
                )

                questions_created += 1
                print(f"  [OK] Created question {q_data['question_number']}: {q_data['question_text'][:50]}...")

        # Commit transaction
        conn.commit()

        print()
        print("[OK] Seeding completed successfully!")
        print(f"[*] Total passages created: {passages_created}")
        print(f"[*] Total questions created: {questions_created}")

        return True

    except Exception as e:
        print(f"[ERROR] Error seeding data: {e}")
        if conn:
            conn.rollback()
        import traceback
        traceback.print_exc()
        return False

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    success = seed_perception_data()
    exit(0 if success else 1)
