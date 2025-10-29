# Playwright Automation Guide - Render 환경 변수 자동 업데이트

## 🎯 목적

Render 대시보드에서 환경 변수를 수동으로 업데이트하는 대신, Playwright를 사용하여 자동화합니다.

## 📋 사전 준비

### 1. Playwright 설치

```bash
npm install -D @playwright/test playwright
npm install -D tsx
```

### 2. Render 계정 정보 준비

`.env.local` 파일을 프로젝트 루트에 생성:

```bash
RENDER_EMAIL=your-render-email@example.com
RENDER_PASSWORD=your-render-password
```

**⚠️ 중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

## 🚀 실행 방법

### Windows

```bash
# 환경 변수 설정 후 실행
set RENDER_EMAIL=your@email.com
set RENDER_PASSWORD=yourpassword
npx tsx scripts/update-render-env.ts
```

### Linux/Mac

```bash
# 환경 변수 설정 후 실행
export RENDER_EMAIL=your@email.com
export RENDER_PASSWORD=yourpassword
npx tsx scripts/update-render-env.ts
```

### 또는 .env.local 사용

```bash
# .env.local 파일에 아래 내용 저장
RENDER_EMAIL=your@email.com
RENDER_PASSWORD=yourpassword

# 실행
npx dotenv -e .env.local -- npx tsx scripts/update-render-env.ts
```

## 📊 자동화 단계

스크립트가 자동으로 다음 작업을 수행합니다:

1. ✅ Render 로그인
2. ✅ `literacy-backend` 서비스 선택
3. ✅ Environment 탭 열기
4. ✅ 다음 환경 변수 업데이트/추가:
   - `DATABASE_URL` (pgbouncer 파라미터 포함)
   - `JWT_SECRET` (32자 이상)
   - `NODE_ENV=production`
5. ✅ 변경사항 저장
6. ✅ 배포 상태 확인

## 🎬 실행 화면

- **Headless Mode**: 브라우저 창이 보이지 않음 (빠름)
- **Visual Mode**: 브라우저 창에서 진행 상황 확인 가능 (기본값)

스크립트의 `headless` 옵션을 수정하여 모드 변경:

```typescript
const browser = await chromium.launch({
  headless: true,  // true로 변경하면 백그라운드 실행
  slowMo: 500
});
```

## ⏱️ 예상 소요 시간

- 스크립트 실행: **2-3분**
- Render 자동 재배포: **2-3분**
- **총 예상 시간**: **5-6분**

## ✅ 실행 후 확인 사항

### 1. Render 대시보드 확인

```
https://dashboard.render.com/web/[service-id]/events
```

"Deploy succeeded" 메시지 확인

### 2. 환경 변수 확인

Render → literacy-backend → Environment 탭에서:

- ✅ DATABASE_URL에 `?pgbouncer=true` 포함 확인
- ✅ JWT_SECRET 존재 확인 (최소 32자)
- ✅ NODE_ENV=production 확인

### 3. 로그인 테스트

```bash
curl -X POST https://literacy-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**예상 응답**:
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": { ... },
    "token": "eyJhbGci..."
  }
}
```

### 4. 프론트엔드 테스트

```
https://playful-cocada-a89755.netlify.app
```

로그인:
- Email: `test@test.com`
- Password: `test123`

## 🚨 문제 해결

### 에러: "RENDER_EMAIL and RENDER_PASSWORD are required"

**해결**: 환경 변수가 설정되지 않았습니다.

```bash
# Windows
set RENDER_EMAIL=your@email.com
set RENDER_PASSWORD=yourpassword

# Linux/Mac
export RENDER_EMAIL=your@email.com
export RENDER_PASSWORD=yourpassword
```

### 에러: "Timeout waiting for selector"

**원인**: Render UI가 변경되었거나 네트워크가 느립니다.

**해결**:
1. 스크립트의 `timeout` 값 증가
2. 수동으로 Render 대시보드 확인
3. 스크린샷 확인: `render-error-screenshot.png`

### 브라우저가 열리지 않음

**해결**: Playwright 브라우저 설치

```bash
npx playwright install chromium
```

### 로그인 실패

**원인**: 2FA(Two-Factor Authentication)가 활성화된 경우

**해결**:
1. Render 계정에서 2FA 비활성화 (임시)
2. 또는 수동으로 로그인 후 스크립트 실행

## 🔒 보안 권장사항

1. ❌ `.env.local` 파일을 Git에 커밋하지 마세요
2. ❌ 스크립트에 비밀번호를 하드코딩하지 마세요
3. ✅ 작업 완료 후 환경 변수 삭제:
   ```bash
   # Windows
   set RENDER_EMAIL=
   set RENDER_PASSWORD=

   # Linux/Mac
   unset RENDER_EMAIL
   unset RENDER_PASSWORD
   ```
4. ✅ 프로덕션 환경에서는 API 토큰 사용 권장

## 📝 스크립트 커스터마이징

### 다른 서비스 업데이트

`update-render-env.ts` 파일에서 수정:

```typescript
const SERVICE_NAME = 'your-service-name';  // 변경

const ENV_VARS = {
  YOUR_KEY: 'your-value',  // 추가/수정
};
```

### 타임아웃 조정

```typescript
await page.waitForTimeout(1000);  // 밀리초 단위
```

### Headless 모드 변경

```typescript
const browser = await chromium.launch({
  headless: true,  // false로 변경하면 브라우저 창이 보임
  slowMo: 500     // 액션 속도 조절 (밀리초)
});
```

## 🎯 다음 단계

1. ✅ 스크립트 실행
2. ✅ Render 재배포 대기 (2-3분)
3. ✅ 로그인 테스트
4. ✅ 대시보드 접근 확인

---

**예상 총 소요 시간**: 5-6분
**난이도**: 쉬움 (자동화)
**필요 권한**: Render 계정 로그인 권한
