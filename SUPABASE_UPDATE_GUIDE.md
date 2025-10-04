# 🔄 Supabase 데이터베이스 업데이트 가이드

## 현재 상태

### ✅ 완료된 작업
- 로컬에서 새로운 PRD 기반 스키마 생성 (10개 테이블)
- `migration-prd.sql` 파일 생성
- Prisma 클라이언트 생성

### ⚠️ 미완료 작업
- **Supabase 데이터베이스는 아직 업데이트되지 않았습니다!**
- 기존 테이블이 있다면 충돌이 발생할 수 있습니다.

---

## 🚨 중요: 기존 데이터 확인

### Option 1: 기존 데이터가 없는 경우 (권장)
새로운 PRD 스키마를 바로 적용하세요.

### Option 2: 기존 데이터가 있는 경우
1. 데이터 백업 필요
2. 기존 테이블 삭제 또는 마이그레이션 전략 수립

---

## 📋 Supabase 업데이트 방법

### 방법 1: 완전 새로 시작 (Clean Install) - 권장

이 방법은 기존 테이블을 모두 삭제하고 새로 시작합니다.

#### Step 1: 기존 테이블 삭제 (옵션)

1. **Supabase SQL Editor 접속:**
   - https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new

2. **기존 테이블 확인:**
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. **기존 테이블 삭제 (⚠️ 데이터 손실!):**
   ```sql
   -- 경고: 이 쿼리는 모든 public 스키마의 테이블을 삭제합니다!
   DO $$
   DECLARE
       r RECORD;
   BEGIN
       FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
       LOOP
           EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
       END LOOP;
   END $$;
   ```

#### Step 2: 새 스키마 적용

1. **migration-prd.sql 열기:**
   ```bash
   # 파일 위치
   backend/migration-prd.sql
   ```

2. **파일 내용 복사:**
   - 전체 내용 선택 (`Ctrl + A`)
   - 복사 (`Ctrl + C`)

3. **Supabase SQL Editor에 붙여넣기:**
   - SQL Editor에 붙여넣기 (`Ctrl + V`)
   - **Run** 버튼 클릭 또는 `Ctrl + Enter`

4. **결과 확인:**
   ```
   Success. No rows returned
   ```

#### Step 3: 테이블 생성 확인

1. **Table Editor 접속:**
   - https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/editor

2. **10개 테이블 확인:**
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

---

### 방법 2: 기존 데이터 유지하면서 마이그레이션

#### Step 1: 데이터 백업

```sql
-- 기존 users 테이블 백업
CREATE TABLE users_backup AS SELECT * FROM users;

-- 기존 students 테이블 백업
CREATE TABLE students_backup AS SELECT * FROM students;

-- ... 필요한 테이블 모두 백업
```

#### Step 2: 선택적 마이그레이션

```sql
-- 새 테이블만 생성 (기존과 충돌 없는 것)
-- migration-prd.sql에서 필요한 부분만 선택적으로 실행
```

#### Step 3: 데이터 이관

```sql
-- 백업 데이터를 새 테이블로 이관
INSERT INTO users (id, email, ...)
SELECT id, email, ...
FROM users_backup;
```

⚠️ **주의**: 이 방법은 복잡하고 수동 작업이 많이 필요합니다.

---

## 🚀 추천 방법: Clean Install

**개발 초기 단계이고 테스트 데이터만 있다면 Clean Install을 권장합니다.**

### 실행 순서:

1. **기존 테이블 삭제** (위의 DROP TABLE 쿼리 실행)
2. **migration-prd.sql 실행** (SQL Editor에서)
3. **테이블 생성 확인** (Table Editor에서)
4. **백엔드 연결 테스트**

---

## ✅ 업데이트 완료 확인

### 1. SQL로 테이블 확인

```sql
-- 테이블 목록
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 예상 결과: 10개 테이블
-- answers
-- audit_logs
-- questions
-- refresh_tokens
-- statistics
-- students
-- test_results
-- test_sessions
-- test_templates
-- users
```

### 2. 테이블 구조 확인

```sql
-- users 테이블 구조
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### 3. 백엔드 연결 테스트

```bash
cd backend
npm run dev
```

예상 출력:
```
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
```

---

## 🐛 문제 해결

### 문제 1: "relation already exists" 오류

**원인**: 테이블이 이미 존재합니다.

**해결**:
1. 기존 테이블 삭제 (DROP TABLE)
2. 또는 `IF NOT EXISTS` 추가

### 문제 2: Foreign Key 제약 위반

**원인**: 외래 키 관계가 복잡합니다.

**해결**:
```sql
-- 모든 외래 키 제약 조건 비활성화
SET session_replication_role = replica;

-- 테이블 삭제

-- 외래 키 제약 조건 재활성화
SET session_replication_role = DEFAULT;
```

### 문제 3: UUID 생성 함수 없음

**원인**: uuid-ossp 확장이 활성화되지 않았습니다.

**해결**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 📊 마이그레이션 후 초기 데이터

### 1. 관리자 계정 생성

```sql
-- 관리자 계정 (비밀번호는 bcrypt로 해싱해야 함)
INSERT INTO users (id, email, password_hash, role, name, phone)
VALUES (
  uuid_generate_v4(),
  'admin@literacy.com',
  '$2b$12$...', -- bcrypt 해시
  'admin',
  'System Admin',
  '010-0000-0000'
);
```

### 2. 테스트 학생 생성

```sql
-- 학생 계정
INSERT INTO users (id, email, password_hash, role, name)
VALUES (
  uuid_generate_v4(),
  'student1@test.com',
  '$2b$12$...',
  'student',
  '김철수'
);

-- 학생 상세 정보
INSERT INTO students (id, user_id, student_code, grade, school_name)
SELECT
  uuid_generate_v4(),
  id,
  'STD001',
  5,
  '서울초등학교'
FROM users
WHERE email = 'student1@test.com';
```

### 3. 테스트 진단지 템플릿

```sql
INSERT INTO test_templates (
  id, template_code, grade, title, total_questions, time_limit
)
VALUES (
  uuid_generate_v4(),
  'LT-G5-V1',
  5,
  '초등 5학년 문해력 진단 평가',
  30,
  40
);
```

---

## 🎯 다음 단계

마이그레이션 완료 후:

1. **백엔드 서버 실행 테스트**
   ```bash
   cd backend
   npm run dev
   curl http://localhost:3000/health
   ```

2. **Phase 1 개발 시작**
   - [PRD_IMPLEMENTATION_GUIDE.md](./PRD_IMPLEMENTATION_GUIDE.md) 참고
   - Week 1: 인증 시스템 구현

3. **API 개발**
   - 회원가입 API
   - 로그인 API
   - 학생 관리 API

---

## 📋 체크리스트

마이그레이션 전:
- [ ] 기존 데이터 백업 (필요시)
- [ ] Supabase 프로젝트 활성화 상태 확인
- [ ] migration-prd.sql 파일 준비

마이그레이션:
- [ ] 기존 테이블 삭제 (Clean Install)
- [ ] migration-prd.sql 실행
- [ ] 10개 테이블 생성 확인
- [ ] 테이블 구조 검증

마이그레이션 후:
- [ ] 백엔드 연결 테스트
- [ ] 초기 데이터 입력 (관리자 계정 등)
- [ ] API 개발 시작

---

**Supabase 업데이트 준비 완료!** 🚀

이제 SQL Editor에서 `migration-prd.sql`을 실행하세요.
