# 🚀 다음 단계 가이드

## 현재 상태

✅ **완료된 작업:**
- Supabase 프로젝트 연동 설정
- 백엔드 환경 구성 (`.env` 파일)
- 의존성 설치 완료 (659 패키지)
- MCP 서버 설치 (`@supabase/mcp-server-supabase`)
- 25개 테이블 스키마 정의
- Migration SQL 생성 (`migration.sql`)
- 백엔드 서버 코드 설정

⚠️ **해결 필요:**
- Supabase 데이터베이스 연결 실패 (`P1001` 오류)
- 데이터베이스 마이그레이션 미실행

---

## 🔍 문제 진단

### 데이터베이스 연결 오류
```
Can't reach database server at `db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432`
```

**원인:**
1. **Supabase 프로젝트 일시 중지 상태**: 무료 플랜에서 7일 미사용 시 자동 일시 중지
2. **네트워크/방화벽 문제**: 포트 5432 차단 가능성
3. **PostgreSQL 직접 연결 제한**: 일부 환경에서 직접 연결 제한

---

## ✅ Step 1: Supabase 프로젝트 활성화 확인

### 1-1. 프로젝트 상태 확인
1. **Supabase Dashboard 접속:**
   - https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj

2. **프로젝트 상태 확인:**
   - 좌측 상단에 프로젝트 상태 표시
   - **"Active"**: 정상 작동 중 ✅
   - **"Paused"**: 일시 중지 상태 ⏸️

3. **일시 중지 상태인 경우:**
   - **"Restore project"** 버튼 클릭
   - 복원 완료 (약 1-2분 소요)

---

## ✅ Step 2: SQL Editor에서 마이그레이션 실행

Prisma CLI가 직접 연결할 수 없으므로, **Supabase SQL Editor**를 사용합니다.

### 2-1. SQL Editor 접속
1. **SQL Editor 열기:**
   - https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql/new

2. **New query 버튼 클릭**

### 2-2. 마이그레이션 실행

**방법 A: 전체 스크립트 복사**
1. `backend/migration.sql` 파일 열기
2. 전체 내용 복사 (`Ctrl + A` → `Ctrl + C`)
3. SQL Editor에 붙여넣기 (`Ctrl + V`)
4. **Run** 버튼 클릭 (또는 `Ctrl + Enter`)

**방법 B: 파일 내용 확인**
```bash
# Windows PowerShell
Get-Content "backend\migration.sql" | Set-Clipboard

# 또는 파일 탐색기에서
# migration.sql 우클릭 → "연결 프로그램" → 메모장
```

### 2-3. 실행 확인
✅ **성공 메시지:**
```
Success. No rows returned
```

✅ **테이블 생성 확인:**
- 좌측 메뉴 → **Table Editor**
- 25개 테이블 확인:
  - users, students, teachers, parents
  - questions, assessments, responses
  - student_progress, ability_history
  - ... 등

---

## ✅ Step 3: 백엔드 서버 시작

### 3-1. 마이그레이션 완료 후 서버 시작

```bash
cd "C:\Users\owner\Downloads\LITERACY TEST PROJECT\backend"
npm run dev
```

### 3-2. 예상 출력
```
[INFO] ts-node-dev ver. 2.0.0
⚠️  Redis not available (cache disabled)
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
📦 Environment: development
🌐 API URL: http://localhost:3000/api/v1
```

### 3-3. Health Check 테스트

```bash
# 새 터미널에서 실행
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

---

## 🔧 문제 해결

### 문제 1: 프로젝트가 계속 Paused 상태

**해결책:** 무료 플랜의 제한사항입니다.
- 프로젝트 Restore 후 7일 내 다시 사용
- 또는 Pro 플랜으로 업그레이드 ($25/월)

### 문제 2: SQL 실행 시 "syntax error" 발생

**해결책:** migration.sql 파일이 완전히 복사되었는지 확인
```sql
-- 첫 줄이 다음으로 시작해야 함
CREATE TYPE "UserRole" AS ENUM ...

-- 마지막 줄이 다음으로 끝나야 함
CREATE UNIQUE INDEX ...
```

### 문제 3: 테이블이 이미 존재한다는 오류

**해결책:** 이미 마이그레이션이 실행된 경우입니다.
- Table Editor에서 25개 테이블 확인
- 문제 없으면 Step 3로 진행

### 문제 4: 서버는 시작되지만 DB 연결 실패

**해결책:** Connection Pooler 사용
1. Supabase Dashboard → Settings → Database
2. **Connection string** → **Connection pooling** 선택
3. URI 복사 (포트: `6543`)
4. `.env` 파일의 `DATABASE_URL` 업데이트:
```env
DATABASE_URL="postgresql://postgres.sxnjeqqvqbhueqbwsnpj:deepreading86@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

---

## 📋 마이그레이션 후 확인 사항

### Supabase Table Editor에서 확인

**사용자 관리 테이블 (6개):**
- [ ] `users` - 사용자 기본 정보
- [ ] `students` - 학생 프로필
- [ ] `teachers` - 교사 프로필
- [ ] `parents` - 학부모 정보
- [ ] `classes` - 클래스 정보
- [ ] `user_relationships` - 사용자 관계

**문제 은행 테이블 (5개):**
- [ ] `questions` - 문제 정보
- [ ] `question_passages` - 지문
- [ ] `question_options` - 선택지
- [ ] `question_tags` - 태그
- [ ] `curriculum_standards` - 교육과정 기준

**평가 시스템 테이블 (4개):**
- [ ] `assessments` - 평가 세션
- [ ] `assessment_questions` - 평가 문제
- [ ] `responses` - 학생 응답
- [ ] `scores` - 채점 결과

**학습 분석 테이블 (5개):**
- [ ] `student_progress` - 학습 진도
- [ ] `ability_history` - 능력치 이력
- [ ] `domain_statistics` - 영역별 통계
- [ ] `study_sessions` - 학습 세션
- [ ] `learning_recommendations` - 학습 추천

**시스템 관리 테이블 (5개):**
- [ ] `difficulty_calibrations` - 난이도 보정
- [ ] `assessment_analytics` - 평가 분석
- [ ] `class_statistics` - 클래스 통계
- [ ] `system_settings` - 시스템 설정
- [ ] `refresh_tokens` - JWT 토큰
- [ ] `audit_logs` - 감사 로그

---

## 🎯 다음 개발 작업

### Phase 1: 인증 API (우선순위 1)

```
backend/src/modules/auth/
├── auth.controller.ts   # POST /api/v1/auth/register
├── auth.service.ts      #      /api/v1/auth/login
├── auth.middleware.ts   #      /api/v1/auth/refresh
├── auth.dto.ts         #      /api/v1/auth/logout
└── auth.routes.ts
```

### Phase 2: 사용자 관리 API

```
backend/src/modules/users/
backend/src/modules/students/
backend/src/modules/teachers/
```

### Phase 3: 문제 은행 시스템

```
backend/src/modules/questions/
```

### Phase 4: 평가 엔진 (IRT)

```
backend/src/modules/assessments/
backend/src/algorithms/irt/
```

---

## 📚 참고 문서

### 생성된 가이드 문서
- [PROJECT_SETUP_COMPLETE.md](./PROJECT_SETUP_COMPLETE.md) - 전체 설정 완료 요약
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 상세 설정 가이드
- [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) - 마이그레이션 가이드
- [MCP_SETUP.md](./MCP_SETUP.md) - MCP 설정 가이드
- [backend/README.md](./backend/README.md) - API 문서

### Supabase 리소스
- Dashboard: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj
- SQL Editor: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql
- Table Editor: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/editor
- Settings: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/settings/general

---

## 💡 빠른 참조

### 환경 변수 (.env)
```env
DATABASE_URL="postgresql://postgres:deepreading86%40@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres?schema=public"
SUPABASE_URL="https://sxnjeqqvqbhueqbwsnpj.supabase.co"
SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
```

### 주요 명령어
```bash
# 개발 서버 시작
npm run dev

# Prisma Studio (GUI)
npm run prisma:studio

# 테스트
npm test

# 빌드
npm run build
```

---

## ✅ 체크리스트

완료되면 체크하세요:

1. [ ] Supabase 프로젝트 Active 상태 확인
2. [ ] SQL Editor에서 migration.sql 실행
3. [ ] Table Editor에서 25개 테이블 확인
4. [ ] 백엔드 서버 시작 성공
5. [ ] Health check API 테스트 성공
6. [ ] Personal Access Token 생성 (MCP용)
7. [ ] Claude Desktop MCP 설정 완료

---

**모든 준비가 완료되면 본격적인 API 개발을 시작할 수 있습니다!** 🚀

질문이나 문제가 있으면 위의 "문제 해결" 섹션을 참고하거나, 각 가이드 문서를 확인하세요.
