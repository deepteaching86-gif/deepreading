# 🌱 데이터베이스 Seed 가이드

## 개요

초등 1학년 문해력 진단 평가 문항(20개)을 데이터베이스에 입력하는 가이드입니다.

---

## ✅ 사전 준비

### 1. Supabase 마이그레이션 완료 확인

이미 완료했다면 건너뛰세요. 아직 안했다면:

1. **Supabase SQL Editor 접속**
   https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new

2. **기존 테이블 삭제**
   `backend/drop-all-tables.sql` 실행

3. **UUID 확장 활성화**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

4. **새 스키마 적용**
   `backend/migration-prd.sql` 실행 (unique constraint 포함)

5. **확인**
   Table Editor에서 10개 테이블 확인

---

## 📦 Seed 데이터 구조

### 파일 구조
```
backend/
├── prisma/
│   ├── schema.prisma           # DB 스키마 (unique constraint 추가됨)
│   ├── seed.ts                 # Seed 실행 스크립트
│   └── seeds/
│       └── data/
│           └── grade1.ts       # 초1 문항 데이터 (20문항)
└── src/
    └── types/
        └── seed.types.ts       # TypeScript 타입 정의
```

### 초등 1학년 데이터
- **TestTemplate**: 1개
  - 코드: `ELEM1-V1`
  - 학년: 1
  - 문항 수: 20
  - 시간: 20분

- **Questions**: 20개
  - 어휘력: 7문항 (1-7번)
  - 독해력: 6문항 (8-13번)
  - 문법/어법: 4문항 (14-17번)
  - 추론/사고력: 3문항 (18-20번)

---

## 🚀 Seed 실행 방법

### 방법 1: npm script 사용 (추천)

```bash
cd backend
npm run prisma:seed
```

### 방법 2: 직접 실행

```bash
cd backend
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

---

## 📊 실행 결과 예시

```
🌱 Starting database seeding...

📝 Seeding Test Templates...
   ✅ 초등 1학년 문해력 진단 평가 (ELEM1-V1)

📚 Seeding Questions...
   📝 5/20 questions created...
   📝 10/20 questions created...
   📝 15/20 questions created...
   📝 20/20 questions created...
   ✅ 20 questions created for Grade 1

📊 Seeding Summary:
   ✅ Test Templates: 1
   ✅ Questions: 20
   ✅ Grade Coverage: 1학년

🎉 Database seeding completed successfully!
```

---

## ✅ 데이터 확인

### 1. Supabase Table Editor에서 확인

**URL**: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/editor

#### test_templates 테이블
```sql
SELECT * FROM test_templates;
```

예상 결과:
| template_code | grade | title | total_questions | time_limit |
|---------------|-------|-------|-----------------|------------|
| ELEM1-V1      | 1     | 초등 1학년 문해력 진단 평가 | 20 | 20 |

#### questions 테이블
```sql
SELECT
  question_number,
  category,
  question_type,
  difficulty,
  points
FROM questions
WHERE template_id = (SELECT id FROM test_templates WHERE template_code = 'ELEM1-V1')
ORDER BY question_number;
```

예상 결과: 20개 문항

**영역별 분포 확인**:
```sql
SELECT
  category,
  COUNT(*) as count
FROM questions
WHERE template_id = (SELECT id FROM test_templates WHERE template_code = 'ELEM1-V1')
GROUP BY category;
```

예상 결과:
| category | count |
|----------|-------|
| vocabulary | 7 |
| reading | 6 |
| grammar | 4 |
| reasoning | 3 |

**난이도별 분포 확인**:
```sql
SELECT
  difficulty,
  COUNT(*) as count
FROM questions
WHERE template_id = (SELECT id FROM test_templates WHERE template_code = 'ELEM1-V1')
GROUP BY difficulty;
```

예상 결과:
| difficulty | count |
|------------|-------|
| easy | 14 |
| medium | 4 |
| hard | 2 |

### 2. Prisma Studio에서 확인

```bash
cd backend
npm run prisma:studio
```

브라우저가 열리면:
1. **test_templates** 테이블 클릭
2. **questions** 테이블 클릭
3. 데이터 확인

---

## 🔄 Seed 재실행

Seed는 `upsert`를 사용하므로 여러 번 실행해도 안전합니다.

```bash
npm run prisma:seed
```

- 이미 있는 데이터는 건너뜀
- 새로운 데이터만 추가됨
- 중복 방지 (templateCode, templateId+questionNumber)

---

## 🐛 문제 해결

### 문제 1: "Can't reach database server"
```
Error: P1001: Can't reach database server
```

**해결**:
1. `.env` 파일의 `DATABASE_URL` 확인
2. Supabase 프로젝트가 활성 상태인지 확인
3. 네트워크 연결 확인

### 문제 2: "Unique constraint failed"
```
Error: Unique constraint failed on the fields: (templateCode)
```

**원인**: 이미 데이터가 존재함

**해결**: 정상입니다. Seed는 기존 데이터를 건너뜁니다.

### 문제 3: "Cannot find module"
```
Error: Cannot find module '@/types/seed.types'
```

**해결**:
```bash
npm install
npm run prisma:generate
```

### 문제 4: "Type 'Json' is not assignable"
```
Type 'QuestionOption[]' is not assignable to type 'InputJsonValue'
```

**해결**: 이미 `JSON.stringify()`로 처리되어 있습니다. seed.ts 확인

---

## 📁 샘플 문항 예시

### 문항 1 (어휘력 - 선택형)
```json
{
  "questionNumber": 1,
  "category": "vocabulary",
  "questionType": "choice",
  "questionText": "다음 중 '크다'의 반대말은 무엇인가요?",
  "options": [
    { "id": 1, "text": "높다" },
    { "id": 2, "text": "작다" },
    { "id": 3, "text": "길다" },
    { "id": 4, "text": "넓다" }
  ],
  "correctAnswer": "2",
  "points": 1,
  "difficulty": "easy"
}
```

### 문항 8 (독해력 - 선택형)
```json
{
  "questionNumber": 8,
  "category": "reading",
  "questionType": "choice",
  "questionText": "다음 글을 읽고, 민수가 어디로 갔는지 고르세요.",
  "passage": "오늘은 토요일입니다. 민수는 엄마와 함께 시장에 갔습니다...",
  "options": [
    { "id": 1, "text": "학교" },
    { "id": 2, "text": "시장" },
    { "id": 3, "text": "공원" },
    { "id": 4, "text": "병원" }
  ],
  "correctAnswer": "2",
  "points": 1,
  "difficulty": "easy"
}
```

### 문항 20 (추론 - 서술형)
```json
{
  "questionNumber": 20,
  "category": "reasoning",
  "questionType": "essay",
  "questionText": "다음 그림을 보고, 어떤 일이 일어났는지 한 문장으로 쓰세요...",
  "correctAnswer": "채점 기준: (1) 그림의 상황을 정확히 설명 (2) 주어와 서술어가 있는 완전한 문장 (3) 10자 이상",
  "points": 2,
  "difficulty": "hard"
}
```

---

## 🎯 다음 단계

1. **백엔드 서버 시작**
   ```bash
   npm run dev
   ```

2. **API로 문항 조회 테스트**
   ```bash
   curl http://localhost:3000/api/v1/templates
   curl http://localhost:3000/api/v1/templates/ELEM1-V1/questions
   ```

3. **나머지 학년 문항 작성**
   - 초등 2학년 (25문항, 25분)
   - 초등 3학년 (30문항, 30분)
   - ...
   - 중등 3학년 (40문항, 50분)

---

## 📚 참고 자료

- **문항 상세**: [GRADE_1_COMPLETE.md](questions/GRADE_1_COMPLETE.md)
- **전체 계획**: [QUESTION_DESIGN_PLAN.md](QUESTION_DESIGN_PLAN.md)
- **Prisma Docs**: https://www.prisma.io/docs/guides/database/seed-database

---

**준비 완료! Seed를 실행하세요** 🚀

```bash
cd backend
npm run prisma:seed
```
