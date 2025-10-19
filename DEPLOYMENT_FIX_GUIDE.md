# 배포 문제 해결 가이드

## 📊 현재 상황 (2025-10-19)

### ✅ 완료된 작업
1. **Gaze Replay System 구현 완료**
   - GazeReplayViewer 컴포넌트 생성
   - VisionTestReport에 통합
   - 로컬 빌드 성공 (frontend, backend 모두)
   - GitHub 푸시 완료 (commit: 694aae4c)

2. **Backend 빌드**
   - 로컬에서 `npm run build` 성공
   - TypeScript 컴파일 ✅
   - Prisma Client 생성 ✅

### ❌ 배포 문제

#### 1. Netlify 배포 실패
**에러**: `JSONHTTPError: Not Found 404`

**원인**:
- 현재 링크된 사이트 ID (`b1ce6181-d158-42e0-b07f-d19353e0fa70`)가 계정의 사이트 목록에 존재하지 않음
- `playful-cocada-a89755` 사이트가 삭제되었거나 다른 계정으로 이동된 것으로 보임

**해결 방법**:

**옵션 A: Netlify Dashboard에서 GitHub 연동 (권장)**

1. https://app.netlify.com 접속
2. "Add new site" → "Import an existing project" 클릭
3. GitHub 선택 → `deepteaching86-gif/deepreading` 저장소 선택
4. 빌드 설정:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```
5. 환경 변수 설정:
   ```
   NODE_VERSION=20
   VITE_API_URL=https://literacy-backend.onrender.com
   ```
6. "Deploy site" 클릭

**옵션 B: CLI로 새 사이트 생성**

```bash
cd frontend
npx netlify sites:create --name deepreading-literacy
npx netlify link --id [새-사이트-ID]
npx netlify deploy --prod
```

#### 2. Render 배포 상태 불명확

**현재 상황**:
- 최근 커밋 (694aae4c)이 푸시됨
- Render는 GitHub webhook으로 자동 배포되어야 함
- 이전 배포들이 실패했었음 (RENDER_BUILD_LOG_GUIDE.md 참조)

**확인 필요**:
1. https://dashboard.render.com → `literacy-backend` 서비스
2. Events 탭에서 최신 배포 상태 확인:
   - 🟡 "Build in Progress" → 대기 중
   - 🟢 "Deploy live" → 성공!
   - 🔴 "Build failed" → 빌드 로그 확인 필요

**만약 배포가 자동으로 시작되지 않았다면**:
1. Render Dashboard → `literacy-backend` → Settings
2. "Auto-Deploy" 설정 확인 (Yes로 되어 있어야 함)
3. 수동 재배포: "Manual Deploy" → "Deploy latest commit" 클릭

---

## 🎯 즉시 확인해야 할 사항

### 1️⃣ Netlify 사이트 상태
- [ ] app.netlify.com에서 `deepreading` 관련 사이트가 있는지 확인
- [ ] 없다면 위의 옵션 A로 새로 생성

### 2️⃣ Render 배포 상태
- [ ] dashboard.render.com에서 최신 배포 확인
- [ ] 성공했으면 ✅, 실패했으면 빌드 로그 복사

### 3️⃣ 배포 URL 확인
**Frontend (Netlify)**:
- 새 사이트 생성 시: `https://[사이트-이름].netlify.app`

**Backend (Render)**:
- 현재 URL: `https://literacy-backend.onrender.com`
- Health Check: `https://literacy-backend.onrender.com/health`

---

## 🔧 빠른 해결 단계

### Step 1: Netlify GitHub 연동 (5분)
1. app.netlify.com 접속
2. "Import from Git" 클릭
3. 저장소 선택 및 설정
4. 환경 변수 입력
5. 배포 시작

### Step 2: Render 배포 확인 (2분)
1. dashboard.render.com 접속
2. Events 탭 확인
3. 필요시 수동 재배포

### Step 3: 배포 검증 (3분)
1. Frontend URL 접속 → 로그인 페이지 확인
2. Backend Health Check → `{"status":"ok"}` 확인
3. Vision TEST 시작 → 에러 없는지 확인

---

## 📝 배포 후 업데이트할 파일

배포 성공 후 다음 파일들 업데이트:

1. **DEPLOYMENT_STATUS.md**
   ```markdown
   ## ✅ 배포 완료 (2025-10-19)

   - Frontend: https://[새-사이트-이름].netlify.app
   - Backend: https://literacy-backend.onrender.com
   - Commit: 694aae4c
   ```

2. **netlify.toml** (필요시)
   ```toml
   [build]
     base = "frontend"
     command = "npm run build"
     publish = "dist"

   [build.environment]
     NODE_VERSION = "20"
     VITE_API_URL = "https://literacy-backend.onrender.com"
   ```

---

## 🚨 문제 발생 시

### Netlify 빌드 실패
→ Netlify Dashboard → Site → Deploys → 실패한 배포 클릭 → 로그 복사

### Render 빌드 실패
→ Render Dashboard → literacy-backend → Events → 실패한 배포 → Logs 복사

### 런타임 에러
→ Browser F12 → Console/Network 탭 → 에러 복사
