# 🚀 Supabase 연동 가이드

Supabase를 사용하여 PostgreSQL 데이터베이스, 인증, 스토리지를 통합합니다.

## 📋 준비 사항

- Supabase 계정 (https://supabase.com)
- 프로젝트 생성 완료

## 1단계: Supabase 프로젝트 생성

### 1.1 프로젝트 생성

1. https://app.supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `literacy-assessment`
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: Free tier로 시작 가능

4. 프로젝트 생성 대기 (약 2분)

### 1.2 연결 정보 확인

프로젝트가 생성되면:

1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보 복사:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **anon public** key: `eyJhbG...`
   - **service_role** key: `eyJhbG...` (⚠️ 절대 클라이언트에 노출 금지)

3. **Database** → **Connection string** → **URI** 클릭
   - Connection string 복사: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

## 2단계: 환경 변수 설정

### 2.1 .env 파일 생성

```bash
cd backend
cp .env.example .env
```

### 2.2 .env 파일 수정

```env
# Database Configuration (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"

# Supabase Configuration
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT Configuration (중요!)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long-change-me"
```

⚠️ **중요**:
- `[YOUR-PASSWORD]`: Supabase 프로젝트 생성 시 설정한 데이터베이스 비밀번호
- `[YOUR-PROJECT-REF]`: 프로젝트 고유 ID (URL에서 확인 가능)

## 3단계: 데이터베이스 스키마 배포

### 3.1 의존성 설치

```bash
npm install
```

### 3.2 Prisma 클라이언트 생성

```bash
npm run prisma:generate
```

### 3.3 데이터베이스 마이그레이션

```bash
npm run prisma:migrate
```

마이그레이션 이름 입력 요청 시:
```
Enter a name for the new migration: › init
```

✅ 성공 시 메시지:
```
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250103_init/
      └─ migration.sql

Your database is now in sync with your schema.
```

### 3.4 Supabase 대시보드에서 확인

1. Supabase 대시보드 → **Table Editor**
2. 25개 테이블이 생성되었는지 확인:
   - users
   - students
   - teachers
   - questions
   - assessments
   - responses
   - scores
   - ... 등

## 4단계: Supabase Auth 설정 (선택사항)

우리는 자체 JWT 인증을 사용하지만, 나중에 Supabase Auth로 전환할 수 있습니다.

### 현재 구조
```
Backend API (Express + JWT) → Supabase PostgreSQL
```

### 향후 옵션
```
Frontend → Supabase Auth → Backend API → Supabase PostgreSQL
```

Supabase Auth를 사용하려면:

1. **Authentication** → **Providers** 설정
2. Email/Password 활성화
3. 소셜 로그인 설정 (Google, GitHub 등)

## 5단계: Storage 설정 (이미지 업로드용)

### 5.1 Storage Bucket 생성

1. Supabase 대시보드 → **Storage**
2. **Create a new bucket** 클릭
3. Bucket 정보:
   - **Name**: `question-images`
   - **Public bucket**: ✅ (문제 이미지는 공개)
4. **Create bucket**

### 5.2 추가 Buckets

```
- question-images (공개) - 문제 지문 이미지
- user-avatars (공개) - 프로필 이미지
- assessment-files (비공개) - 평가 관련 파일
```

### 5.3 Storage 정책 설정

**question-images** 버킷의 경우:

```sql
-- 읽기: 모든 사용자 허용
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'question-images' );

-- 쓰기: 인증된 사용자만
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-images'
  AND auth.role() = 'authenticated'
);
```

## 6단계: 개발 서버 실행

```bash
npm run dev
```

✅ 성공 시:
```
✅ Database connected successfully
✅ Supabase client initialized
🚀 Server running on port 3000
```

### 테스트

```bash
# 헬스 체크
curl http://localhost:3000/health

# 응답 예시
{
  "status": "ok",
  "timestamp": "2025-01-03T...",
  "environment": "development",
  "version": "v1"
}
```

## 7단계: Prisma Studio로 데이터 확인

```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 열림 → 테이블 데이터 확인 및 수정 가능

## 📊 Supabase 대시보드 활용

### 1. SQL Editor
직접 SQL 쿼리 실행:
```sql
-- 사용자 수 확인
SELECT COUNT(*) FROM users;

-- 학생 목록
SELECT * FROM students LIMIT 10;
```

### 2. Table Editor
GUI로 데이터 추가/수정/삭제

### 3. Database → Logs
실시간 쿼리 로그 확인

### 4. API Docs
자동 생성된 REST API 문서

## 🔒 보안 체크리스트

- [x] `.env` 파일을 `.gitignore`에 추가
- [x] `SERVICE_ROLE_KEY`는 서버에서만 사용
- [x] `ANON_KEY`만 클라이언트에 노출
- [x] Row Level Security (RLS) 설정 (선택사항)
- [x] 강력한 JWT_SECRET 사용

## 🐛 문제 해결

### 연결 오류
```
Error: P1001: Can't reach database server
```

**해결**:
1. DATABASE_URL 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 비밀번호에 특수문자가 있다면 URL 인코딩

### 마이그레이션 실패
```
Error: Migration failed to apply cleanly
```

**해결**:
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 문제가 있다면 리셋 (개발 환경에서만!)
npx prisma migrate reset

# 다시 마이그레이션
npm run prisma:migrate
```

### Prisma 스키마 변경 후
```bash
# 1. 스키마 변경
# 2. 마이그레이션 생성 및 적용
npm run prisma:migrate

# 3. Prisma Client 재생성
npm run prisma:generate
```

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Prisma + Supabase 가이드](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Storage API](https://supabase.com/docs/guides/storage)

## ✅ 다음 단계

Supabase 연동이 완료되었습니다! 이제:

1. ✅ 백엔드 API 구현 시작
2. ⏳ 인증 시스템 구현
3. ⏳ 문제 관리 API
4. ⏳ 평가 시스템 구현

프론트엔드에서 Supabase 클라이언트를 직접 사용할 수도 있고, 백엔드 API를 통해서만 접근하도록 할 수도 있습니다.
