"""
Sample Data for Visual Perception Test (Grades 1-6)
====================================================

Provides seed passages with comprehension questions.
Uses deterministic UUIDs to prevent duplicate inserts.
"""

import asyncio
import uuid
from copy import deepcopy

# Deterministic passage IDs (stable across imports)
_PASSAGE_IDS = {
    "g1_rabbit":   "d0a1b2c3-0001-4000-8001-000000000001",
    "g2_turtle":   "d0a1b2c3-0002-4000-8002-000000000002",
    "g2_ant":      "d0a1b2c3-0002-4000-8002-000000000003",
    "g2_sunmoon":  "d0a1b2c3-0002-4000-8002-000000000004",
    "g3_woodcut":  "d0a1b2c3-0003-4000-8003-000000000005",
    "g4_hangeul":  "d0a1b2c3-0004-4000-8004-000000000006",
    "g5_water":    "d0a1b2c3-0005-4000-8005-000000000007",
    "g6_universe": "d0a1b2c3-0006-4000-8006-000000000008",
}

ALL_PASSAGES = [
    # ===== Grade 1 =====
    {
        "id": _PASSAGE_IDS["g1_rabbit"],
        "grade": 1,
        "title": "아기 토끼의 하루",
        "content": """아기 토끼가 아침에 일어났습니다.

"좋은 아침!" 아기 토끼가 말했습니다. 밖에 해가 밝게 빛났습니다.

아기 토끼는 당근을 먹었습니다. 당근은 맛있었습니다.

아기 토끼는 밖으로 나갔습니다. 풀밭에서 친구 다람쥐를 만났습니다.

"같이 놀자!" 다람쥐가 말했습니다.

둘은 풀밭에서 뛰어놀았습니다. 나비도 날아왔습니다.

해가 지기 시작했습니다. "이제 집에 가야 해." 아기 토끼가 말했습니다.

아기 토끼는 집에 돌아와서 엄마에게 안겼습니다. "오늘 정말 재미있었어!"
""",
        "word_count": 98,
        "sentence_count": 12,
        "category": "생활",
        "difficulty": "easy",
        "questions": [
            {
                "question_number": 1,
                "question_text": "아기 토끼는 아침에 무엇을 먹었나요?",
                "options": [
                    {"id": "A", "text": "당근"},
                    {"id": "B", "text": "사과"},
                    {"id": "C", "text": "빵"},
                    {"id": "D", "text": "우유"}
                ],
                "correct_answer": "A",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "아기 토끼는 밖에서 누구를 만났나요?",
                "options": [
                    {"id": "A", "text": "강아지"},
                    {"id": "B", "text": "다람쥐"},
                    {"id": "C", "text": "고양이"},
                    {"id": "D", "text": "새"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 3,
                "question_text": "아기 토끼는 왜 집에 갔나요?",
                "options": [
                    {"id": "A", "text": "배가 고파서"},
                    {"id": "B", "text": "비가 와서"},
                    {"id": "C", "text": "해가 져서"},
                    {"id": "D", "text": "친구가 가서"}
                ],
                "correct_answer": "C",
                "question_type": "inference"
            },
            {
                "question_number": 4,
                "question_text": "아기 토끼의 하루는 어땠나요?",
                "options": [
                    {"id": "A", "text": "슬펐습니다"},
                    {"id": "B", "text": "재미있었습니다"},
                    {"id": "C", "text": "무서웠습니다"},
                    {"id": "D", "text": "지루했습니다"}
                ],
                "correct_answer": "B",
                "question_type": "main_idea"
            }
        ]
    },

    # ===== Grade 2 =====
    {
        "id": _PASSAGE_IDS["g2_turtle"],
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
        "id": _PASSAGE_IDS["g2_ant"],
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

    # ===== Grade 3 =====
    {
        "id": _PASSAGE_IDS["g3_woodcut"],
        "grade": 3,
        "title": "금도끼 은도끼",
        "content": """옛날에 나무꾼이 살았습니다. 나무꾼은 매일 산에 가서 나무를 했습니다. 어느 날, 나무를 하다가 도끼가 연못에 빠졌습니다.

나무꾼은 슬퍼서 울었습니다. 그때 연못에서 산신령이 나타났습니다.

산신령은 금도끼를 들고 물었습니다. "이것이 네 도끼냐?" 나무꾼은 고개를 저었습니다. "아닙니다."

산신령은 다시 은도끼를 들고 물었습니다. "그럼 이것이 네 도끼냐?" 나무꾼은 또 고개를 저었습니다. "그것도 아닙니다."

산신령은 마지막으로 쇠도끼를 들었습니다. "이것이 네 도끼냐?" 나무꾼은 기뻐하며 대답했습니다. "네, 그것이 제 도끼입니다!"

산신령은 정직한 나무꾼에게 금도끼, 은도끼, 쇠도끼를 모두 주었습니다. "정직한 사람에게는 복이 옵니다."

이웃의 욕심쟁이도 일부러 도끼를 빠뜨렸습니다. 산신령이 금도끼를 보여주자 "네, 제 도끼입니다!"라고 거짓말했습니다. 산신령은 아무것도 주지 않고 사라졌습니다.
""",
        "word_count": 205,
        "sentence_count": 18,
        "category": "전래동화",
        "difficulty": "medium",
        "questions": [
            {
                "question_number": 1,
                "question_text": "나무꾼의 도끼는 어디에 빠졌나요?",
                "options": [
                    {"id": "A", "text": "강"},
                    {"id": "B", "text": "연못"},
                    {"id": "C", "text": "바다"},
                    {"id": "D", "text": "우물"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "나무꾼은 왜 금도끼와 은도끼를 받았나요?",
                "options": [
                    {"id": "A", "text": "힘이 세서"},
                    {"id": "B", "text": "부자여서"},
                    {"id": "C", "text": "정직해서"},
                    {"id": "D", "text": "나이가 많아서"}
                ],
                "correct_answer": "C",
                "question_type": "inference"
            },
            {
                "question_number": 3,
                "question_text": "욕심쟁이는 왜 도끼를 못 받았나요?",
                "options": [
                    {"id": "A", "text": "거짓말을 해서"},
                    {"id": "B", "text": "도끼가 없어서"},
                    {"id": "C", "text": "산신령을 못 만나서"},
                    {"id": "D", "text": "늦게 와서"}
                ],
                "correct_answer": "A",
                "question_type": "inference"
            },
            {
                "question_number": 4,
                "question_text": "이 이야기의 교훈은 무엇인가요?",
                "options": [
                    {"id": "A", "text": "도끼를 잘 관리해야 한다"},
                    {"id": "B", "text": "정직하게 살아야 한다"},
                    {"id": "C", "text": "산에 혼자 가면 안 된다"},
                    {"id": "D", "text": "금이 가장 좋다"}
                ],
                "correct_answer": "B",
                "question_type": "main_idea"
            }
        ]
    },

    # ===== Grade 4 =====
    {
        "id": _PASSAGE_IDS["g4_hangeul"],
        "grade": 4,
        "title": "한글의 탄생",
        "content": """세종대왕은 조선의 네 번째 임금이었습니다. 세종대왕은 백성들이 글을 읽고 쓰지 못하는 것을 안타깝게 여겼습니다.

그 당시에는 한자를 사용했습니다. 한자는 매우 어려워서 일반 백성들은 배우기 힘들었습니다. 양반이나 관리들만 글을 읽고 쓸 수 있었습니다.

세종대왕은 백성들도 쉽게 배울 수 있는 글자를 만들기로 결심했습니다. 학자들과 함께 오랜 연구 끝에 1443년에 훈민정음을 만들었습니다.

훈민정음은 "백성을 가르치는 바른 소리"라는 뜻입니다. 자음 17자와 모음 11자, 모두 28자로 이루어졌습니다. 입술, 혀, 이, 목구멍의 모양을 본떠서 만들었기 때문에 매우 과학적입니다.

세종대왕 덕분에 오늘날 우리는 한글을 사용하여 자유롭게 생각을 표현할 수 있습니다. 한글은 세계에서 가장 과학적인 문자 중 하나로 인정받고 있습니다.
""",
        "word_count": 210,
        "sentence_count": 13,
        "category": "역사",
        "difficulty": "medium",
        "questions": [
            {
                "question_number": 1,
                "question_text": "세종대왕이 한글을 만든 이유는 무엇인가요?",
                "options": [
                    {"id": "A", "text": "한자가 예쁘지 않아서"},
                    {"id": "B", "text": "백성들이 글을 읽고 쓰지 못해서"},
                    {"id": "C", "text": "다른 나라에 자랑하려고"},
                    {"id": "D", "text": "학자들이 부탁해서"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "훈민정음은 모두 몇 자인가요?",
                "options": [
                    {"id": "A", "text": "24자"},
                    {"id": "B", "text": "26자"},
                    {"id": "C", "text": "28자"},
                    {"id": "D", "text": "30자"}
                ],
                "correct_answer": "C",
                "question_type": "detail"
            },
            {
                "question_number": 3,
                "question_text": "한글이 과학적이라고 하는 이유는 무엇인가요?",
                "options": [
                    {"id": "A", "text": "컴퓨터로 만들어서"},
                    {"id": "B", "text": "발음 기관의 모양을 본떠 만들어서"},
                    {"id": "C", "text": "숫자처럼 생겨서"},
                    {"id": "D", "text": "외국에서 가져와서"}
                ],
                "correct_answer": "B",
                "question_type": "inference"
            },
            {
                "question_number": 4,
                "question_text": "'훈민정음'의 뜻은 무엇인가요?",
                "options": [
                    {"id": "A", "text": "아름다운 글자"},
                    {"id": "B", "text": "왕이 만든 글자"},
                    {"id": "C", "text": "백성을 가르치는 바른 소리"},
                    {"id": "D", "text": "쉬운 문자"}
                ],
                "correct_answer": "C",
                "question_type": "detail"
            }
        ]
    },

    # ===== Grade 5 =====
    {
        "id": _PASSAGE_IDS["g5_water"],
        "grade": 5,
        "title": "물의 순환",
        "content": """지구의 물은 끊임없이 순환합니다. 바다, 호수, 강의 물이 태양열에 의해 증발하여 수증기가 됩니다. 수증기는 하늘로 올라가면서 점차 온도가 낮아집니다.

차가운 공기를 만난 수증기는 작은 물방울이나 얼음 알갱이로 변합니다. 이것이 모여서 구름이 됩니다. 구름 속의 물방울이 점점 커지면 비나 눈이 되어 땅으로 떨어집니다. 이것을 강수라고 합니다.

땅에 떨어진 물의 일부는 땅속으로 스며들어 지하수가 됩니다. 나머지는 시내와 개울을 이루며 강으로 흘러갑니다. 강물은 다시 바다로 흘러들어갑니다.

이러한 물의 순환은 지구의 기후를 조절하고 생물이 살 수 있는 환경을 만들어줍니다. 만약 물의 순환이 멈추면 식물은 말라 죽고, 동물과 사람도 살 수 없게 됩니다.

물의 순환 과정에서 물의 총량은 변하지 않습니다. 우리가 마시는 물은 수억 년 전 공룡이 마셨던 물과 같은 물일 수도 있습니다.
""",
        "word_count": 245,
        "sentence_count": 15,
        "category": "과학",
        "difficulty": "medium",
        "questions": [
            {
                "question_number": 1,
                "question_text": "수증기가 하늘에서 물방울로 변하는 이유는 무엇인가요?",
                "options": [
                    {"id": "A", "text": "태양이 비춰서"},
                    {"id": "B", "text": "온도가 낮아져서"},
                    {"id": "C", "text": "바람이 불어서"},
                    {"id": "D", "text": "구름이 흔들려서"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "'강수'란 무엇인가요?",
                "options": [
                    {"id": "A", "text": "물이 증발하는 것"},
                    {"id": "B", "text": "비나 눈이 땅에 떨어지는 것"},
                    {"id": "C", "text": "강물이 흐르는 것"},
                    {"id": "D", "text": "물이 땅속에 스며드는 것"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 3,
                "question_text": "물의 순환이 중요한 이유는 무엇인가요?",
                "options": [
                    {"id": "A", "text": "물이 깨끗해지니까"},
                    {"id": "B", "text": "기후를 조절하고 생물이 살 수 있게 해주니까"},
                    {"id": "C", "text": "강이 예뻐지니까"},
                    {"id": "D", "text": "바다가 넓어지니까"}
                ],
                "correct_answer": "B",
                "question_type": "inference"
            },
            {
                "question_number": 4,
                "question_text": "이 글의 중심 내용은 무엇인가요?",
                "options": [
                    {"id": "A", "text": "바다는 넓다"},
                    {"id": "B", "text": "비가 오는 이유"},
                    {"id": "C", "text": "물이 지구에서 끊임없이 순환한다"},
                    {"id": "D", "text": "공룡 시대의 물"}
                ],
                "correct_answer": "C",
                "question_type": "main_idea"
            }
        ]
    },

    # ===== Grade 6 =====
    {
        "id": _PASSAGE_IDS["g6_universe"],
        "grade": 6,
        "title": "우주의 크기",
        "content": """우주는 상상할 수 없을 만큼 넓습니다. 우리가 살고 있는 지구는 태양계의 한 행성에 불과합니다. 태양계에는 지구를 포함하여 8개의 행성이 있습니다.

태양에서 가장 가까운 별인 프록시마 센타우리까지의 거리는 약 4.24광년입니다. 광년은 빛이 1년 동안 이동하는 거리로, 약 9조 4600억 킬로미터에 해당합니다. 즉, 빛의 속도로 가도 4년이 넘게 걸리는 거리입니다.

우리 은하에는 약 2000억 개의 별이 있습니다. 그리고 관측 가능한 우주에는 이러한 은하가 약 2조 개 이상 존재하는 것으로 추정됩니다.

과학자들은 우주가 약 138억 년 전 빅뱅이라는 대폭발로 시작되었다고 말합니다. 빅뱅 이후 우주는 계속 팽창하고 있으며, 그 속도는 점점 빨라지고 있습니다.

인류는 아직 우주의 극히 일부만 탐사했습니다. 우주에 대해 아는 것보다 모르는 것이 훨씬 많습니다. 이것이 바로 우주 탐사가 계속되어야 하는 이유입니다.
""",
        "word_count": 260,
        "sentence_count": 14,
        "category": "과학",
        "difficulty": "hard",
        "questions": [
            {
                "question_number": 1,
                "question_text": "태양에서 가장 가까운 별까지 빛의 속도로 얼마나 걸리나요?",
                "options": [
                    {"id": "A", "text": "약 1년"},
                    {"id": "B", "text": "약 4년"},
                    {"id": "C", "text": "약 10년"},
                    {"id": "D", "text": "약 100년"}
                ],
                "correct_answer": "B",
                "question_type": "detail"
            },
            {
                "question_number": 2,
                "question_text": "'광년'은 무엇을 측정하는 단위인가요?",
                "options": [
                    {"id": "A", "text": "시간"},
                    {"id": "B", "text": "무게"},
                    {"id": "C", "text": "거리"},
                    {"id": "D", "text": "밝기"}
                ],
                "correct_answer": "C",
                "question_type": "detail"
            },
            {
                "question_number": 3,
                "question_text": "빅뱅 이후 우주는 어떻게 되고 있나요?",
                "options": [
                    {"id": "A", "text": "줄어들고 있다"},
                    {"id": "B", "text": "멈추어 있다"},
                    {"id": "C", "text": "점점 빠르게 팽창하고 있다"},
                    {"id": "D", "text": "회전하고 있다"}
                ],
                "correct_answer": "C",
                "question_type": "detail"
            },
            {
                "question_number": 4,
                "question_text": "글쓴이가 우주 탐사가 계속되어야 한다고 말하는 이유는 무엇인가요?",
                "options": [
                    {"id": "A", "text": "우주가 위험하니까"},
                    {"id": "B", "text": "아는 것보다 모르는 것이 훨씬 많으니까"},
                    {"id": "C", "text": "별이 예쁘니까"},
                    {"id": "D", "text": "다른 행성에 살아야 하니까"}
                ],
                "correct_answer": "B",
                "question_type": "inference"
            }
        ]
    },
]


def get_seed_passages():
    """Return a deep copy of all seed passages (safe for mutation)"""
    return deepcopy(ALL_PASSAGES)


# Legacy support: keep the old variable name
GRADE_2_PASSAGES = [p for p in ALL_PASSAGES if p["grade"] == 2]


async def seed_perception_data():
    """Seed the database with sample perception test data (Prisma-based)"""
    try:
        from prisma import Prisma
    except ImportError:
        print("Prisma not available, use psycopg2 seed script instead")
        return

    db = Prisma()
    await db.connect()

    try:
        print("Seeding Visual Perception Test data...")

        for passage_data in get_seed_passages():
            existing = await db.perceptionpassage.find_unique(
                where={"id": passage_data["id"]}
            )

            if existing:
                print(f"  Passage '{passage_data['title']}' already exists, skipping...")
                continue

            questions_data = passage_data.pop("questions")

            await db.perceptionpassage.create(
                data={
                    "id": passage_data["id"],
                    "grade": passage_data["grade"],
                    "title": passage_data["title"],
                    "content": passage_data["content"],
                    "wordCount": passage_data["word_count"],
                    "sentenceCount": passage_data["sentence_count"],
                    "category": passage_data.get("category"),
                    "difficulty": passage_data.get("difficulty"),
                }
            )
            print(f"  Created passage: {passage_data['title']} (grade {passage_data['grade']})")

            for q_data in questions_data:
                await db.perceptionquestion.create(
                    data={
                        "passageId": passage_data["id"],
                        "questionNumber": q_data["question_number"],
                        "questionText": q_data["question_text"],
                        "options": q_data["options"],
                        "correctAnswer": q_data["correct_answer"],
                        "questionType": q_data.get("question_type"),
                    }
                )

        print("Seeding completed!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        raise

    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_perception_data())
