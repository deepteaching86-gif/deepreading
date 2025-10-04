# 🔄 Supabase 클린 마이그레이션 가이드

## ⚠️ 오류 해결: "type already exists"

**오류 메시지:**
```
ERROR: 42710: type "UserRole" already exists
```

**원인:** Supabase에 이전 스키마의 테이블과 타입이 이미 존재합니다.

**해결:** 기존 테이블을 모두 삭제하고 새로 생성

---

## 🚀 3단계 클린 마이그레이션

### Step 1: 기존 테이블 및 타입 삭제

#### 1-1. Supabase SQL Editor 접속
https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new

#### 1-2. 삭제 SQL 복사

`backend/drop-all-tables.sql` 파일 열기

#### 1-3. SQL Editor에 붙여넣고 실행

**전체 SQL:**
```sql
-- ⚠️ WARNING: This will DELETE ALL tables and data!

-- Drop all tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS statistics CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS test_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS test_templates CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old tables (from previous schema)
DROP TABLE IF EXISTS ability_history CASCADE;
DROP TABLE IF EXISTS assessment_analytics CASCADE;
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS class_statistics CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS curriculum_standards CASCADE;
DROP TABLE IF EXISTS difficulty_calibrations CASCADE;
DROP TABLE IF EXISTS domain_statistics CASCADE;
DROP TABLE IF EXISTS learning_recommendations CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS question_passages CASCADE;
DROP TABLE IF EXISTS question_tags CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS user_relationships CASCADE;

-- Drop all ENUM types
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "QuestionCategory" CASCADE;
DROP TYPE IF EXISTS "QuestionType" CASCADE;
DROP TYPE IF EXISTS "Difficulty" CASCADE;
DROP TYPE IF EXISTS "SessionStatus" CASCADE;
DROP TYPE IF EXISTS "ReviewStatus" CASCADE;
DROP TYPE IF EXISTS "AssessmentType" CASCADE;
DROP TYPE IF EXISTS "AssessmentStatus" CASCADE;
DROP TYPE IF EXISTS "GradingMethod" CASCADE;
DROP TYPE IF EXISTS "RecommendationStatus" CASCADE;
```

#### 1-4. 실행 및 확인

**Run** 버튼 클릭

**예상 결과:**
```
Success. No rows returned.
```

---

### Step 2: UUID 확장 활성화 확인

```sql
-- UUID 생성 함수 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Run** 버튼 클릭

---

### Step 3: 새 스키마 적용

#### 3-1. migration-prd.sql 열기

`backend/migration-prd.sql` 파일

#### 3-2. 전체 내용 복사

전체 선택 (`Ctrl + A`) → 복사 (`Ctrl + C`)

#### 3-3. SQL Editor에 붙여넣고 실행

**Run** 버튼 클릭

**예상 결과:**
```
Success. No rows returned.
```

---

## ✅ 마이그레이션 확인

### 1. Table Editor에서 테이블 확인

https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/editor

**10개 테이블 확인:**
- ✅ users
- ✅ students
- ✅ test_templates
- ✅ questions
- ✅ test_sessions
- ✅ answers
- ✅ test_results
- ✅ statistics
- ✅ refresh_tokens
- ✅ audit_logs

### 2. SQL로 테이블 확인

```sql
-- 테이블 목록 조회
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**예상 결과:** 10개 테이블

### 3. 테이블 구조 확인

```sql
-- users 테이블 구조
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
```

---

## 🎯 마이그레이션 후 작업

### 1. 백엔드 연결 테스트

```bash
cd backend
npm run dev
```

**예상 출력:**
```
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
```

### 2. Health Check API 테스트

```bash
curl http://localhost:3000/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T...",
  "environment": "development",
  "version": "v1"
}
```

### 3. 테스트 데이터 삽입 (옵션)

```sql
-- UUID 생성 함수 테스트
SELECT uuid_generate_v4();

-- 테스트 관리자 계정
INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'admin@test.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF6q5Emi', -- "password"
    'admin',
    'Test Admin',
    NOW(),
    NOW()
);

-- 확인
SELECT id, email, role, name FROM users;
```

---

## 🐛 문제 해결

### 문제 1: DROP TABLE 권한 오류

**오류:**
```
ERROR: must be owner of table XXX
```

**해결:**
Supabase Dashboard에서 로그인한 계정이 프로젝트 소유자인지 확인

### 문제 2: CASCADE 경고

**경고:**
```
NOTICE: drop cascades to ...
```

**해결:**
정상입니다. CASCADE는 외래 키 관계를 자동으로 처리합니다.

### 문제 3: uuid_generate_v4() 함수 없음

**오류:**
```
ERROR: function uuid_generate_v4() does not exist
```

**해결:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 📋 빠른 체크리스트

마이그레이션 실행:
- [ ] Step 1: drop-all-tables.sql 실행
- [ ] Step 2: uuid-ossp 확장 확인
- [ ] Step 3: migration-prd.sql 실행
- [ ] Table Editor에서 10개 테이블 확인
- [ ] SQL로 테이블 구조 확인

백엔드 연결:
- [ ] npm run dev 실행
- [ ] Database connected 메시지 확인
- [ ] Health check API 테스트
- [ ] Prisma Studio 접속 테스트

다음 단계:
- [ ] Phase 1 개발 시작 (인증 시스템)
- [ ] API 엔드포인트 구현
- [ ] 프론트엔드 개발 준비

---

## 🚀 다음 개발 단계

마이그레이션 완료 후:

1. **[PRD_IMPLEMENTATION_GUIDE.md](./PRD_IMPLEMENTATION_GUIDE.md)**
   - Phase 1 Week 1: 인증 시스템 구현

2. **인증 API 개발**
   ```bash
   mkdir -p backend/src/modules/auth
   touch backend/src/modules/auth/{auth.controller.ts,auth.service.ts,auth.middleware.ts,auth.dto.ts,auth.routes.ts}
   ```

3. **API 엔드포인트**
   - `POST /api/v1/auth/register` - 회원가입
   - `POST /api/v1/auth/login` - 로그인
   - `POST /api/v1/auth/refresh` - 토큰 갱신
   - `POST /api/v1/auth/logout` - 로그아웃

---

**클린 마이그레이션 준비 완료!** 🎉

이제 3단계를 순서대로 실행하세요:
1. 기존 테이블 삭제 (drop-all-tables.sql)
2. UUID 확장 확인
3. 새 스키마 적용 (migration-prd.sql)
