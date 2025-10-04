# 🚀 Supabase 마이그레이션 실행 가이드

## 현재 상황
- ❌ 오류: `ERROR: 42710: type "UserRole" already exists`
- 원인: Supabase에 이전 스키마(25개 테이블)가 남아있음
- 해결: 기존 테이블 삭제 → 새 스키마 적용

---

## ✅ 3단계 마이그레이션 실행

### Step 1: Supabase SQL Editor 접속
https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new

### Step 2: 기존 테이블 삭제

**파일 열기:** `backend/drop-all-tables.sql`

**전체 내용 복사 (Ctrl + A → Ctrl + C)**

**SQL Editor에 붙여넣고 Run 버튼 클릭**

예상 결과:
```
Success. No rows returned.
```

### Step 3: UUID 확장 확인

SQL Editor에서 실행:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

예상 결과:
```
Success. No rows returned.
```

### Step 4: 새 스키마 적용

**파일 열기:** `backend/migration-prd.sql`

**전체 내용 복사 (Ctrl + A → Ctrl + C)**

**SQL Editor에 붙여넣고 Run 버튼 클릭**

예상 결과:
```
Success. No rows returned.
```

---

## ✅ 마이그레이션 확인

### 1. Table Editor 확인
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
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

예상: 10개 테이블

### 3. 백엔드 연결 테스트

백엔드 디렉토리에서:
```bash
npm run dev
```

예상 출력:
```
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
```

### 4. API 테스트

새 터미널에서:
```bash
curl http://localhost:3000/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T...",
  "environment": "development",
  "version": "v1"
}
```

---

## 🐛 문제 해결

### 문제: DROP TABLE 권한 오류
```
ERROR: must be owner of table XXX
```
**해결:** Supabase Dashboard에 프로젝트 소유자 계정으로 로그인 확인

### 문제: uuid_generate_v4() 함수 없음
```
ERROR: function uuid_generate_v4() does not exist
```
**해결:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 문제: 데이터베이스 연결 실패
**확인 사항:**
1. `.env` 파일의 `DATABASE_URL` 확인
2. Supabase 프로젝트가 활성 상태인지 확인
3. 비밀번호에 특수문자가 있으면 URL 인코딩 필요 (`@` → `%40`)

---

## 📋 빠른 체크리스트

마이그레이션:
- [ ] Step 1: Supabase SQL Editor 접속
- [ ] Step 2: drop-all-tables.sql 실행
- [ ] Step 3: UUID 확장 확인
- [ ] Step 4: migration-prd.sql 실행
- [ ] Table Editor에서 10개 테이블 확인

백엔드 테스트:
- [ ] npm run dev 실행
- [ ] Database connected 메시지 확인
- [ ] Health check API 테스트

---

## 🎯 다음 단계

마이그레이션 완료 후:

1. **PRD_IMPLEMENTATION_GUIDE.md 참고**
   - Phase 1 Week 1: 인증 시스템 구현

2. **인증 API 개발**
   ```bash
   mkdir -p src/modules/auth
   touch src/modules/auth/{auth.controller.ts,auth.service.ts,auth.middleware.ts,auth.dto.ts,auth.routes.ts}
   ```

3. **API 엔드포인트**
   - `POST /api/v1/auth/register` - 회원가입
   - `POST /api/v1/auth/login` - 로그인
   - `POST /api/v1/auth/refresh` - 토큰 갱신
   - `POST /api/v1/auth/logout` - 로그아웃

---

**마이그레이션 준비 완료!** 🎉

위 4단계를 순서대로 실행하세요.
