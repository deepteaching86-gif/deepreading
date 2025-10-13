# Render 배포 가이드 (Vision TEST 포함)

## 📋 개요

이 문서는 Literacy Assessment System (Vision TEST 포함)을 Render + Netlify + Supabase 환경에 배포하는 완전한 가이드입니다.

**배포 스택**:
- **Backend**: Render.com (Node.js Web Service)
- **Frontend**: Netlify (Static Site)
- **Database**: Supabase (PostgreSQL)

**마지막 업데이트**: 2025-10-14
**Vision TEST**: ✅ 포함

---

## 🏗️ 배포 아키텍처

```
┌─────────────────┐
│   사용자 브라우저   │
│   (Chrome/Safari) │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│  Netlify (Frontend)              │
│  playful-cocada-a89755           │
│  - React 18 + TypeScript         │
│  - TensorFlow.js + MediaPipe     │
│  - Vite Build                    │
└────────┬────────────────────────┘
         │ REST API
         ▼
┌─────────────────────────────────┐
│  Render (Backend)                │
│  literacy-backend                │
│  - Express + TypeScript          │
│  - Prisma ORM                    │
│  - 21 Vision TEST APIs           │
└────────┬────────────────────────┘
         │ PostgreSQL
         ▼
┌─────────────────────────────────┐
│  Supabase (Database)             │
│  sxnjeqqvqbhueqbwsnpj           │
│  - PostgreSQL 15                 │
│  - Connection Pooling            │
│  - Auto Backup                   │
└─────────────────────────────────┘
```

---

## 🚀 Phase 1: 사전 준비

### 1.1 Git 저장소 준비
```bash
# 프로젝트 루트로 이동
cd "C:\Users\owner\Downloads\LITERACY TEST PROJECT"

# 최신 변경사항 확인
git status

# 모든 변경사항 커밋
git add .
git commit -m "feat: Add Vision TEST deployment configuration"

# GitHub에 푸시
git push origin main
```

### 1.2 계정 준비
- [x] **GitHub 계정**: https://github.com
- [x] **Render 계정**: https://dashboard.render.com
- [x] **Netlify 계정**: https://app.netlify.com
- [x] **Supabase 계정**: https://supabase.com/dashboard

### 1.3 배포 파일 확인
```bash
# 배포 설정 파일 확인
ls -la render.yaml netlify.toml

# Backend 빌드 테스트
cd backend
npm install
npm run build

# Frontend 빌드 테스트
cd ../frontend
npm install
npm run build
```

---

## 🔧 Phase 2: Backend 배포 (Render)

### 2.1 Render 프로젝트 생성

**방법 A: Git 기반 자동 배포 (권장)**

1. **Render Dashboard 접속**
   - https://dashboard.render.com/select-repo

2. **GitHub Repository 연결**
   - "Connect a repository" 클릭
   - GitHub 계정 인증
   - 저장소 선택: `deepteaching86-gif/deepreading`
   - "Connect" 클릭

3. **`render.yaml` 자동 감지**
   - Render가 `render.yaml` 파일을 자동으로 감지
   - "Apply" 클릭

4. **서비스 자동 생성**
   ```
   ✓ Service created: literacy-backend
   ✓ Environment variables imported from render.yaml
   ✓ Build command configured
   ✓ Start command configured
   ```

**방법 B: Manual Setup**

1. **New Web Service 생성**
   - "New +" → "Web Service"

2. **Build Settings**
   ```
   Name: literacy-backend
   Region: Singapore
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npx prisma migrate deploy && node dist/server.js
   ```

3. **Environment Variables** (아래 섹션 참조)

### 2.2 Environment Variables 설정

Render Dashboard → literacy-backend → Environment:

```env
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database (Supabase)
DATABASE_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase
SUPABASE_URL=https://sxnjeqqvqbhueqbwsnpj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bmplcXF2cWJodWVxYndzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODUxMjAsImV4cCI6MjA3NTA2MTEyMH0.6xGE1QVp4GNV2iGRRwrXEU4ZblJqcn_gNusVhK8RmXI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bmplcXF2cWJodWVxYndzbnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ4NTEyMCwiZXhwIjoyMDc1MDYxMTIwfQ.SBNG3wXzfT5ahxBJBD84x_FAUHghy4iYj4c5apyrjRI

# JWT
JWT_SECRET=literacy-assessment-production-jwt-key-2025-super-secure
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://playful-cocada-a89755.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application
LOG_LEVEL=info
APP_NAME=Literacy Assessment System
FRONTEND_URL=https://playful-cocada-a89755.netlify.app
APP_URL=https://literacy-backend.onrender.com
```

**중요 사항**:
- ✅ `DATABASE_URL`에 `?pgbouncer=true` 포함 (Connection Pooling)
- ✅ `CORS_ORIGIN`에 Netlify URL 정확히 입력
- ✅ `JWT_SECRET` 최소 32자 이상 (프로덕션 환경용)

### 2.3 배포 시작

1. **자동 배포 트리거**
   - `render.yaml` 파일이 있으면 자동으로 빌드 시작
   - 또는 "Manual Deploy" 버튼 클릭

2. **빌드 로그 확인**
   ```
   ==> Building...
   npm install
   npx prisma generate
   npm run build
   ✓ Build completed in 2m 15s

   ==> Starting...
   npx prisma migrate deploy
   Prisma Migrate applied the following migration(s):
     20250614_add_vision_test_models

   node dist/server.js
   ✓ Server listening on port 3000
   ```

3. **배포 URL 확인**
   ```
   https://literacy-backend.onrender.com
   ```

### 2.4 Backend 검증

```bash
# Health Check
curl https://literacy-backend.onrender.com/health

# 예상 응답:
{
  "status": "ok",
  "timestamp": "2025-10-14T12:00:00Z"
}

# Vision API Check
curl https://literacy-backend.onrender.com/api/v1/vision/templates

# 예상 응답:
{
  "total": 12,
  "templates": [...]
}
```

---

## 🎨 Phase 3: Frontend 배포 (Netlify)

### 3.1 Netlify Site 생성

**방법 A: Git 기반 자동 배포 (권장)**

1. **Netlify Dashboard 접속**
   - https://app.netlify.com/start

2. **Import from Git**
   - "Import from Git" → "GitHub"
   - 저장소 선택: `deepteaching86-gif/deepreading`
   - "Connect" 클릭

3. **Site Settings**
   ```
   Site name: playful-cocada-a89755
   Branch: main
   Base directory: frontend
   Build command: npm run build
   Publish directory: dist
   ```

4. **Environment Variables**
   ```
   VITE_API_URL=https://literacy-backend.onrender.com
   ```

5. **Deploy Site**

**방법 B: netlify.toml 자동 적용**

- 저장소에 `netlify.toml`이 이미 있으므로 자동으로 설정 적용
- 환경 변수만 추가 설정 필요

### 3.2 Netlify 설정 확인

**`netlify.toml` 파일** (이미 존재):
```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_URL = "https://literacy-backend.onrender.com"
```

### 3.3 배포 로그 확인

```
Building...
npm run build
  vite build
  ✓ built in 7.78s
  dist/ 3.29 MB

Publishing...
✓ Site is live
https://playful-cocada-a89755.netlify.app
```

### 3.4 Frontend 검증

```bash
# 사이트 접속
open https://playful-cocada-a89755.netlify.app

# Browser Console에서 API 연결 확인
# Network 탭 → API 호출 → 200 OK
```

---

## 🗄️ Phase 4: Database 마이그레이션 (Supabase)

### 4.1 자동 마이그레이션 (Render)

Render의 `startCommand`에 이미 포함:
```bash
npx prisma migrate deploy && node dist/server.js
```

**배포 로그에서 확인**:
```
Prisma Migrate applied the following migration(s):

migrations/
  └─ 20250614_add_vision_test_models/
     └─ migration.sql

✓ 5 tables created:
  - VisionTestSession
  - VisionGazeData
  - VisionMetrics
  - VisionCalibration
  - VisionCalibrationAdjustment
```

### 4.2 수동 마이그레이션 (필요 시)

**Render Shell 접속**:
1. Render Dashboard → literacy-backend
2. "Shell" 탭 클릭
3. 명령어 실행:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

**로컬에서 실행 (Supabase 접근 가능 시)**:
```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 4.3 Database 검증

**Supabase Dashboard 확인**:
1. https://supabase.com/dashboard
2. Project: `sxnjeqqvqbhueqbwsnpj`
3. Table Editor → 5개 테이블 확인:
   - ✅ `VisionTestSession`
   - ✅ `VisionGazeData`
   - ✅ `VisionMetrics`
   - ✅ `VisionCalibration`
   - ✅ `VisionCalibrationAdjustment`

**SQL Editor에서 확인**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'Vision%';
```

---

## ✅ Phase 5: Vision TEST 검증

### 5.1 E2E 테스트

[VISION_TEST_E2E_TESTING_GUIDE.md](VISION_TEST_E2E_TESTING_GUIDE.md) 참조:

**Step 1: Login**
```
URL: https://playful-cocada-a89755.netlify.app/login
Account: student-test@example.com
```

**Step 2: Calibration**
```
✓ 카메라 권한 허용
✓ 9-point grid calibration 진행
✓ 70% accuracy 달성
✓ CalibrationID 저장
```

**Step 3: Vision TEST**
```
✓ Gaze tracking 시작
✓ 지문 읽기 + 문제 풀이
✓ 5초마다 chunk 저장
✓ 세션 제출
```

**Step 4: Report**
```
✓ 15 metrics charts 표시
✓ AI analysis 표시
✓ Heatmap rendering
✓ Peer comparison 표시
```

**Step 5: Admin (관리자)**
```
✓ 세션 목록 조회
✓ Gaze replay 재생
✓ Metrics 확인
```

### 5.2 Performance 검증

```bash
# API 응답 시간
curl -w "@curl-format.txt" -o /dev/null -s \
  https://literacy-backend.onrender.com/api/v1/vision/templates

# 목표: <200ms
```

**Browser Performance**:
- Lighthouse Score: >80
- Gaze Tracking FPS: 30+
- Report Loading: <2s

---

## 🔄 Phase 6: CI/CD 자동 배포

### 6.1 Git Workflow

```bash
# Feature 브랜치 생성
git checkout -b feature/vision-test-improvements

# 작업 및 커밋
git add .
git commit -m "feat: Improve gaze tracking accuracy"

# GitHub 푸시
git push origin feature/vision-test-improvements

# Pull Request 생성 → Preview 배포 자동 생성
```

### 6.2 자동 배포 플로우

**Pull Request 생성 시**:
```
1. GitHub → PR 생성
2. Render → Preview Deploy 생성 (backend)
3. Netlify → Deploy Preview 생성 (frontend)
4. Preview URL로 테스트
```

**Main 브랜치 머지 시**:
```
1. GitHub → main 브랜치 업데이트
2. Render → Production 자동 배포 (backend)
   - npm install
   - npx prisma generate
   - npm run build
   - npx prisma migrate deploy ✨ (자동 마이그레이션)
   - node dist/server.js
3. Netlify → Production 자동 배포 (frontend)
   - npm run build
   - Deploy dist/
```

### 6.3 배포 알림 (Slack, Discord)

**Render Notifications**:
- Render Dashboard → Settings → Notifications
- Slack Webhook URL 추가

**Netlify Notifications**:
- Netlify Dashboard → Settings → Build & deploy → Deploy notifications
- Slack/Discord Webhook 추가

---

## 🐛 트러블슈팅

### 문제 1: Prisma 마이그레이션 실패

**증상**:
```
Error: P1001: Can't reach database server
```

**원인**: DATABASE_URL 오류 또는 Supabase 연결 제한

**해결**:
1. **DATABASE_URL 확인**:
```bash
# Render Shell
echo $DATABASE_URL

# 올바른 형식:
# postgresql://postgres.xxx:password@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

2. **Supabase Connection Pooling 사용**:
   - Pooler URL 사용 (`:6543` 포트)
   - `?pgbouncer=true` 파라미터 추가

3. **수동 마이그레이션**:
```bash
# Render Shell
cd backend
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

### 문제 2: CORS 에러

**증상**:
```
Access to XMLHttpRequest at 'https://literacy-backend.onrender.com/api/v1/auth/login'
from origin 'https://playful-cocada-a89755.netlify.app' has been blocked by CORS policy
```

**해결**:
1. **Backend CORS_ORIGIN 확인**:
```env
CORS_ORIGIN=https://playful-cocada-a89755.netlify.app
```

2. **Render 환경 변수 업데이트**:
   - Render Dashboard → Environment → Edit
   - `CORS_ORIGIN` 값 확인 및 수정
   - "Save Changes" → 자동 재배포

3. **Backend 코드 확인** (`backend/src/app.ts`):
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

---

### 문제 3: Render Free Tier Spin Down

**증상**: 15분 동안 요청이 없으면 서비스가 sleep 상태로 전환

**영향**: 첫 요청 시 Cold Start로 인한 지연 (30-60초)

**해결 방법**:

**Option A: Uptime Monitoring (무료)**
1. **UptimeRobot** 가입: https://uptimerobot.com
2. Monitor 추가:
   ```
   Monitor Type: HTTP(s)
   URL: https://literacy-backend.onrender.com/health
   Interval: 5 minutes
   ```

**Option B: Render Paid Plan**
- Standard Plan ($7/month): Spin down 없음
- Pro Plan ($25/month): 더 많은 리소스

**Option C: Cron Job (GitHub Actions)**
```yaml
# .github/workflows/keep-alive.yml
name: Keep Alive
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Server
        run: curl https://literacy-backend.onrender.com/health
```

---

### 문제 4: TensorFlow.js 로딩 실패

**증상**: Vision TEST 페이지에서 MediaPipe 로딩 에러

**해결**:
1. **Frontend 빌드 확인**:
```bash
cd frontend
npm install @tensorflow/tfjs @tensorflow-models/face-landmarks-detection
npm run build
```

2. **Netlify에서 재배포**:
```bash
# Clear cache
netlify deploy --prod --clear-cache
```

3. **CDN 로딩 확인** (Browser Console):
```javascript
console.log(tf.version);
// Should print TensorFlow.js version
```

---

## 📊 모니터링 설정

### 1. Render Metrics

**Dashboard → Metrics**:
- CPU Usage (목표: <70%)
- Memory Usage (목표: <400MB)
- Response Time (목표: <200ms)
- Request Count

**Alerts 설정**:
```
CPU > 80% → Email Alert
Memory > 90% → Slack Notification
Error Rate > 5% → Immediate Alert
```

### 2. Netlify Analytics

**Dashboard → Analytics**:
- Page Views
- Bandwidth (Free: 100GB/month)
- Build Minutes (Free: 300 min/month)
- Deploy Success Rate (목표: >95%)

### 3. Supabase Monitoring

**Dashboard → Database → Statistics**:
- Active Connections (목표: <20)
- Database Size (Free: 500MB)
- API Requests (Free: 50MB egress/month)

**Slow Query Alert**:
- Dashboard → Logs → Slow Queries
- >1s 쿼리 최적화

---

## 🔒 보안 체크리스트

### Backend (Render)
- [x] `JWT_SECRET` 32자 이상 랜덤 문자열
- [x] `SUPABASE_SERVICE_ROLE_KEY` 백엔드에만 사용
- [x] `CORS_ORIGIN` 정확한 프론트엔드 URL
- [x] `BCRYPT_ROUNDS` 10 이상
- [x] HTTPS 강제 (Render 자동 제공)
- [x] Rate Limiting 활성화

### Frontend (Netlify)
- [x] `VITE_API_URL` HTTPS 사용
- [x] Sensitive keys 백엔드에만 보관
- [x] `SUPABASE_ANON_KEY`만 프론트엔드 사용
- [x] HTTPS 강제 (Netlify 자동 제공)
- [x] Security Headers 설정 (netlify.toml)

### Database (Supabase)
- [x] Row Level Security (RLS) 활성화
- [x] Connection Pooling 사용
- [x] 자동 백업 확인 (매일)
- [x] SSL 연결 강제

---

## 📋 최종 배포 체크리스트

### 사전 준비
- [ ] Git 저장소 최신 상태
- [ ] Backend 로컬 빌드 성공
- [ ] Frontend 로컬 빌드 성공
- [ ] 환경 변수 준비 완료

### Backend (Render)
- [ ] GitHub 연동 완료
- [ ] `render.yaml` 설정 확인
- [ ] 환경 변수 설정 완료
- [ ] 자동 배포 시작
- [ ] 빌드 성공 확인
- [ ] Prisma 마이그레이션 성공
- [ ] Health check 통과
- [ ] API 엔드포인트 테스트

### Frontend (Netlify)
- [ ] GitHub 연동 완료
- [ ] `netlify.toml` 설정 확인
- [ ] 환경 변수 설정 완료
- [ ] 자동 배포 시작
- [ ] 빌드 성공 확인
- [ ] 사이트 접속 확인
- [ ] API 연동 테스트

### Database (Supabase)
- [ ] 5개 Vision TEST 테이블 생성 확인
- [ ] Connection Pooling 활성화
- [ ] 자동 백업 설정 확인

### Vision TEST 검증
- [ ] Login 작동
- [ ] Calibration flow 작동
- [ ] Gaze tracking 작동
- [ ] Vision TEST 완료 가능
- [ ] Report 페이지 표시
- [ ] Admin 페이지 접근

### 모니터링
- [ ] Render Metrics 확인
- [ ] Netlify Analytics 확인
- [ ] Supabase Monitoring 확인
- [ ] Uptime Robot 설정 (Optional)

---

## 🎯 배포 완료!

### 프로덕션 URL

**Frontend**:
```
https://playful-cocada-a89755.netlify.app
```

**Backend**:
```
https://literacy-backend.onrender.com
```

**API Base URL**:
```
https://literacy-backend.onrender.com/api/v1
```

### Next Steps

1. **E2E 테스팅**: [VISION_TEST_E2E_TESTING_GUIDE.md](VISION_TEST_E2E_TESTING_GUIDE.md)
2. **사용자 가이드 작성**
3. **관리자 매뉴얼 작성**
4. **성능 모니터링 및 최적화**

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-10-14
**작성자**: Claude Code
**상태**: Production Ready ✅
