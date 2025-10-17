# 🚀 배포 가이드

## 배포 아키텍처

```
┌─────────────────────────────────────────────┐
│  사용자 (브라우저)                           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Netlify (프론트엔드)                        │
│  - Next.js 15 / React 18                   │
│  - 정적 사이트 호스팅                        │
│  - CDN 글로벌 배포                          │
│  - 자동 HTTPS                               │
└────────────────┬────────────────────────────┘
                 │
                 │ API 요청
                 ▼
┌─────────────────────────────────────────────┐
│  Vercel (백엔드 API)                        │
│  - Express.js + TypeScript                 │
│  - Serverless Functions                    │
│  - 자동 스케일링                             │
└────────────────┬────────────────────────────┘
                 │
                 │ Database
                 ▼
┌─────────────────────────────────────────────┐
│  Supabase (데이터베이스)                     │
│  - PostgreSQL 16                           │
│  - 실시간 동기화                             │
│  - 인증 서비스                              │
│  - 스토리지                                 │
└─────────────────────────────────────────────┘
```

---

## 📦 Part 1: 백엔드 배포 (Vercel)

### 1-1. Vercel 계정 설정

1. **Vercel 회원가입:**
   - https://vercel.com/signup
   - GitHub 계정으로 로그인 권장

2. **Vercel CLI 설치 (옵션):**
   ```bash
   npm install -g vercel
   vercel login
   ```

### 1-2. 백엔드 빌드 준비

```bash
cd backend

# 의존성 설치
npm install

# Prisma 클라이언트 생성
npm run prisma:generate

# TypeScript 빌드
npm run build
```

**빌드 결과 확인:**
```bash
ls dist/
# server.js, app.js, config/, modules/ 등이 있어야 함
```

### 1-3. Vercel 프로젝트 생성

**방법 A: Vercel Dashboard (권장)**

1. **New Project 클릭:**
   - https://vercel.com/new

2. **Git Repository 연결:**
   - GitHub 저장소 선택
   - Root Directory: `backend` 입력
   - Framework Preset: `Other` 선택

3. **Build & Development Settings:**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables 추가:**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:password@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres
   SUPABASE_URL=https://sxnjeqqvqbhueqbwsnpj.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=your-production-jwt-secret-min-32-chars
   CORS_ORIGIN=https://playful-cocada-a89755.netlify.app
   ```

5. **Deploy 클릭**

**방법 B: Vercel CLI**

```bash
cd backend

# Vercel 프로젝트 생성
vercel

# 프로덕션 배포
vercel --prod
```

### 1-4. 배포 URL 확인

✅ 배포 완료 후 URL 복사:
```
https://literacy-assessment-api.vercel.app
```

### 1-5. API 테스트

```bash
# Health check
curl https://literacy-assessment-api.vercel.app/health

# 예상 응답
{
  "status": "ok",
  "timestamp": "2025-10-03T...",
  "environment": "production",
  "version": "v1"
}
```

---

## 🎨 Part 2: 프론트엔드 배포 (Netlify)

### 2-1. 프론트엔드 프로젝트 생성 (예정)

**Next.js 15 프로젝트 초기화:**
```bash
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
```

**디자인 시스템 적용:**
```css
/* globals.css - Tailwind v4 */
@theme {
  --color-primary-50: oklch(0.975 0.01 286);
  --color-primary-100: oklch(0.95 0.02 286);
  /* ... (이전에 제공한 Tailwind 설정) */
}
```

### 2-2. Netlify 계정 설정

1. **Netlify 회원가입:**
   - https://app.netlify.com/signup
   - GitHub 계정으로 로그인 권장

2. **Netlify CLI 설치 (옵션):**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

### 2-3. Netlify 프로젝트 생성

**방법 A: Netlify Dashboard (권장)**

1. **New site from Git 클릭:**
   - https://app.netlify.com/start

2. **Git Repository 연결:**
   - GitHub 저장소 선택
   - Base directory: `frontend` 입력

3. **Build settings:**
   ```
   Build command: npm run build
   Publish directory: dist (또는 .next)
   ```

4. **Environment Variables 추가:**
   ```env
   NODE_VERSION=20
   VITE_API_URL=https://literacy-assessment-api.vercel.app
   VITE_SUPABASE_URL=https://sxnjeqqvqbhueqbwsnpj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Deploy site 클릭**

**방법 B: Netlify CLI**

```bash
cd frontend

# Netlify 프로젝트 생성
netlify init

# 프로덕션 배포
netlify deploy --prod
```

### 2-4. 커스텀 도메인 설정 (옵션)

1. **Netlify Dashboard → Domain settings**
2. **Add custom domain 클릭**
3. **도메인 연결 (예: literacy-assessment.com)**

---

## 🔐 Part 3: 환경 변수 설정

### 3-1. Vercel 환경 변수

**Production:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres?pgbouncer=true
SUPABASE_URL=https://sxnjeqqvqbhueqbwsnpj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=production-secret-min-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://playful-cocada-a89755.netlify.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
APP_URL=https://literacy-assessment-api.vercel.app
FRONTEND_URL=https://playful-cocada-a89755.netlify.app
```

**Preview/Development:**
```env
NODE_ENV=development
# ... (동일하지만 다른 URL)
```

### 3-2. Netlify 환경 변수

```env
NODE_VERSION=20
VITE_API_URL=https://literacy-assessment-api.vercel.app
VITE_SUPABASE_URL=https://sxnjeqqvqbhueqbwsnpj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3-3. 환경 변수 보안 체크리스트

- [ ] `JWT_SECRET` 프로덕션용으로 재생성 (32자 이상)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 절대 프론트엔드에 노출 금지
- [ ] `DATABASE_URL` 비밀번호 URL 인코딩 확인
- [ ] `CORS_ORIGIN` 프론트엔드 도메인으로 정확히 설정
- [ ] `.env` 파일 Git에 커밋되지 않도록 확인 (`.gitignore`)

---

## 🔄 Part 4: CI/CD 자동 배포

### 4-1. Git Workflow

```bash
# 개발 브랜치
git checkout -b feature/auth-system

# 작업 후 커밋
git add .
git commit -m "feat: Add authentication system"

# GitHub에 푸시
git push origin feature/auth-system

# Pull Request 생성
# → Vercel/Netlify가 자동으로 Preview 배포 생성
```

### 4-2. 자동 배포 플로우

**Pull Request 생성 시:**
```
1. GitHub → PR 생성
2. Vercel → Preview 배포 생성 (backend)
3. Netlify → Preview 배포 생성 (frontend)
4. 자동 테스트 실행
5. Preview URL로 확인
```

**Main 브랜치 머지 시:**
```
1. GitHub → Main 브랜치 업데이트
2. Vercel → Production 재배포 (backend)
3. Netlify → Production 재배포 (frontend)
4. 자동 캐시 무효화
```

### 4-3. GitHub Actions (옵션)

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
```

---

## 📊 Part 5: 모니터링 및 로깅

### 5-1. Vercel 모니터링

**Analytics 활성화:**
1. Vercel Dashboard → Analytics
2. 요청 수, 응답 시간, 에러율 모니터링
3. 알림 설정

**로그 확인:**
```bash
# Vercel CLI로 실시간 로그
vercel logs literacy-assessment-api --follow
```

### 5-2. Supabase 모니터링

**Database 모니터링:**
1. Supabase Dashboard → Database → Statistics
2. 쿼리 성능, 연결 수 확인
3. Slow Query 분석

### 5-3. 에러 추적 (Sentry 추천)

```bash
npm install @sentry/node @sentry/tracing
```

**설정 (backend/src/config/sentry.ts):**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## 🚨 Part 6: 문제 해결

### 문제 1: Vercel 빌드 실패

**증상:** `Error: Cannot find module '@prisma/client'`

**해결:**
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && tsc",
    "vercel-build": "prisma generate && npm run build"
  }
}
```

### 문제 2: CORS 에러

**증상:** 프론트엔드에서 API 호출 시 CORS 에러

**해결:**
```typescript
// backend/src/app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### 문제 3: 데이터베이스 연결 실패

**증상:** Vercel에서 Supabase 연결 실패

**해결:** Connection Pooler 사용
```env
DATABASE_URL="postgresql://postgres.sxnjeqqvqbhueqbwsnpj:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 문제 4: 환경 변수 미적용

**해결:**
1. Vercel/Netlify Dashboard에서 환경 변수 재확인
2. 재배포 트리거: `vercel --prod` 또는 Git 푸시

---

## 📋 배포 체크리스트

### 백엔드 (Vercel)
- [ ] GitHub 저장소 연결
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 완료
- [ ] `vercel.json` 설정 확인
- [ ] 빌드 성공 확인
- [ ] Health check API 테스트
- [ ] CORS 설정 확인
- [ ] Supabase 연결 확인

### 프론트엔드 (Netlify)
- [ ] GitHub 저장소 연결
- [ ] Netlify 프로젝트 생성
- [ ] 환경 변수 설정 완료
- [ ] `netlify.toml` 설정 확인
- [ ] 빌드 성공 확인
- [ ] API 연동 테스트
- [ ] 리디렉션 규칙 확인

### 보안
- [ ] JWT Secret 프로덕션용 생성
- [ ] Service Role Key 백엔드에만 사용
- [ ] HTTPS 강제 활성화
- [ ] CORS 엄격하게 설정
- [ ] Rate Limiting 활성화

### 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Netlify Analytics 활성화
- [ ] Supabase 모니터링 설정
- [ ] 에러 추적 도구 연동 (Sentry)

---

## 🎯 배포 완료 후

### 최종 URL 구조

**프론트엔드 (Netlify):**
```
https://playful-cocada-a89755.netlify.app
```

**백엔드 (Vercel):**
```
https://literacy-assessment-api.vercel.app
```

**API 엔드포인트:**
```
POST   https://literacy-assessment-api.vercel.app/api/v1/auth/register
POST   https://literacy-assessment-api.vercel.app/api/v1/auth/login
GET    https://literacy-assessment-api.vercel.app/api/v1/students
POST   https://literacy-assessment-api.vercel.app/api/v1/assessments
...
```

### 성능 최적화

1. **Vercel Edge Functions** (선택사항)
   - 자주 호출되는 API를 Edge로 이동
   - 전 세계 CDN에서 실행

2. **Netlify CDN 캐싱**
   - 정적 에셋 자동 캐싱
   - 이미지 최적화 활성화

3. **Supabase Connection Pooling**
   - 데이터베이스 연결 풀링 활성화
   - 동시 연결 수 제한 설정

---

## 📚 참고 링크

- **Vercel 문서**: https://vercel.com/docs
- **Netlify 문서**: https://docs.netlify.com
- **Supabase 배포**: https://supabase.com/docs/guides/hosting/overview
- **Next.js 배포**: https://nextjs.org/docs/deployment

---

**배포 준비 완료!** 🚀

이제 로컬에서 개발한 프로젝트를 Vercel (백엔드) + Netlify (프론트엔드) + Supabase (DB)로 배포할 수 있습니다!
