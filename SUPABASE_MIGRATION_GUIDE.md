# 🗄️ Supabase 데이터베이스 마이그레이션 가이드

로컬 환경에서 Supabase 데이터베이스에 직접 연결이 안 되는 경우, Supabase Dashboard의 SQL Editor를 사용하여 스키마를 생성할 수 있습니다.

## 📋 준비 완료 항목

✅ `.env` 파일 생성 완료
✅ Supabase 프로젝트 연동 완료
✅ `migration.sql` 생성 완료 (25개 테이블 정의)

## 🚀 방법 1: Supabase SQL Editor 사용 (권장)

### Step 1: SQL Editor 열기

1. Supabase Dashboard 접속: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New query** 버튼 클릭

### Step 2: SQL 스크립트 복사

`backend/migration.sql` 파일의 내용을 모두 복사합니다.

```bash
# Windows에서 파일 내용 복사
type "C:\Users\owner\Downloads\LITERACY TEST PROJECT\backend\migration.sql" | clip
```

### Step 3: SQL 실행

1. SQL Editor에 복사한 내용 붙여넣기
2. 우측 하단의 **Run** 버튼 클릭 (또는 `Ctrl + Enter`)
3. ✅ 성공 메시지 확인:
   ```
   Success. No rows returned
   ```

### Step 4: 테이블 확인

1. 좌측 메뉴에서 **Table Editor** 클릭
2. 25개 테이블이 생성되었는지 확인:
   - ✅ users
   - ✅ students
   - ✅ teachers
   - ✅ parents
   - ✅ classes
   - ✅ user_relationships
   - ✅ questions
   - ✅ question_passages
   - ✅ question_options
   - ✅ question_tags
   - ✅ curriculum_standards
   - ✅ assessments
   - ✅ assessment_questions
   - ✅ responses
   - ✅ scores
   - ✅ student_progress
   - ✅ ability_history
   - ✅ domain_statistics
   - ✅ study_sessions
   - ✅ learning_recommendations
   - ✅ difficulty_calibrations
   - ✅ assessment_analytics
   - ✅ class_statistics
   - ✅ system_settings
   - ✅ refresh_tokens
   - ✅ audit_logs

---

## 🔧 방법 2: IPv6 비활성화 후 로컬에서 마이그레이션

일부 네트워크 환경에서는 IPv6 문제로 Prisma가 Supabase에 연결하지 못할 수 있습니다.

### Option A: Connection Pooler 사용

Supabase는 Connection Pooler URL을 제공합니다:

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** 섹션에서 **Connection pooling** 선택
3. URI 복사 (포트: `6543`)
4. `.env` 파일 업데이트:

```env
DATABASE_URL="postgresql://postgres.sxnjeqqvqbhueqbwsnpj:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

5. 다시 마이그레이션 실행:
```bash
cd backend
npm run prisma:migrate
```

### Option B: 로컬 PostgreSQL 터널 사용

```bash
# SSH 터널 생성 (Windows에서는 PuTTY 사용)
ssh -L 5432:db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432 user@jumphost
```

---

## ✅ 마이그레이션 완료 후

### 1. Prisma 클라이언트 동기화

로컬 Prisma가 Supabase 스키마와 동기화되었는지 확인:

```bash
cd backend
npx prisma db pull
npx prisma generate
```

### 2. 백엔드 서버 실행

```bash
npm run dev
```

✅ 성공 메시지:
```
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
```

### 3. 테스트 요청

```bash
curl http://localhost:3000/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T...",
  "environment": "development",
  "version": "v1"
}
```

---

## 📊 생성된 데이터베이스 구조

### 사용자 관리 (6개 테이블)
- `users` - 기본 사용자 정보
- `students` - 학생 프로필 및 능력치
- `teachers` - 교사 프로필 및 권한
- `parents` - 학부모 정보
- `classes` - 클래스/반 정보
- `user_relationships` - 사용자 간 관계 (학부모-학생)

### 문제 은행 (5개 테이블)
- `questions` - 문제 정보 및 IRT 파라미터
- `question_passages` - 지문 정보
- `question_options` - 객관식 선택지
- `question_tags` - 문제 태그/분류
- `curriculum_standards` - 교육과정 기준

### 평가 시스템 (4개 테이블)
- `assessments` - 평가 세션
- `assessment_questions` - 평가에 포함된 문제
- `responses` - 학생 응답
- `scores` - 채점 결과

### 학습 분석 (5개 테이블)
- `student_progress` - 영역별 학습 진도
- `ability_history` - 능력치 변화 이력
- `domain_statistics` - 영역별 통계
- `study_sessions` - 학습 세션 기록
- `learning_recommendations` - AI 학습 추천

### 시스템 관리 (5개 테이블)
- `difficulty_calibrations` - 문제 난이도 보정
- `assessment_analytics` - 평가 분석
- `class_statistics` - 클래스 통계
- `system_settings` - 시스템 설정
- `refresh_tokens` - JWT 리프레시 토큰
- `audit_logs` - 감사 로그

---

## 🐛 문제 해결

### SQL 실행 시 에러

**에러:** `relation "users" already exists`
- 이미 테이블이 생성되어 있습니다.
- Table Editor에서 확인하세요.

**에러:** `syntax error at or near...`
- SQL 스크립트 복사 시 일부 누락되었을 수 있습니다.
- `migration.sql` 파일 전체를 다시 복사하세요.

### Connection Pooler 사용 시

Connection Pooler를 사용할 때는 Prisma 마이그레이션 명령이 제한될 수 있습니다.
이 경우 방법 1 (SQL Editor 사용)을 권장합니다.

---

## 🔗 다음 단계

1. ✅ 데이터베이스 스키마 생성 완료
2. 📝 백엔드 API 구현 시작
3. 🧪 단위 테스트 작성
4. 🎨 프론트엔드 개발 시작

---

## 📚 참고 자료

- [Supabase SQL Editor 문서](https://supabase.com/docs/guides/database/overview#the-sql-editor)
- [Prisma 마이그레이션 가이드](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [프로젝트 SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**마이그레이션 성공!** 🎉

데이터베이스가 준비되었습니다. 이제 백엔드 API를 구현할 수 있습니다.
