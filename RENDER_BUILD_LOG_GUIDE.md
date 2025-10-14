# Render 빌드 로그 확인 가이드

## 🚨 현재 상황

Render API 확인 결과: **최근 5개 배포가 모두 실패**
- 가장 최근: 2025-10-14 23:49 (수동 재배포)
- 상태: `build_failed`

**필요한 정보**: 빌드 로그 (빌드가 왜 실패했는지)

---

## 📍 Render Dashboard에서 빌드 로그 찾는 방법

### 1단계: Render Dashboard 접속
https://dashboard.render.com

### 2단계: 서비스 선택
- 왼쪽 메뉴에서 `literacy-backend` 클릭

### 3단계: 실패한 배포 확인
화면 최상단에 빨간색 경고가 보일 것입니다:
```
❌ Deploy Failed
Oct 14 at 11:49 PM (수동 재배포)
```

### 4단계: 빌드 로그 보기

**방법 A: Events 탭에서**
1. "Events" 탭 클릭
2. 가장 최근 "Deploy failed" 이벤트 클릭
3. "View Logs" 버튼 클릭

**방법 B: 직접 Logs 탭**
1. "Logs" 탭 클릭 (상단 탭 메뉴)
2. 드롭다운에서 "Build" 선택 (기본값은 "Logs"일 수 있음)
3. 가장 최근 실패한 빌드 선택

---

## 🔍 빌드 로그에서 찾아야 할 내용

빌드 로그는 다음과 같은 형식일 것입니다:

```
==> Cloning from https://github.com/deepteaching86-gif/deepreading...
==> Checking out commit 048875eb...
==> Running 'cd backend && npm install && npx prisma generate && npm run build'

npm WARN ...
npm install 완료

Prisma schema loaded from prisma/schema.prisma
Generated Prisma Client (5.22.0)

> literacy-assessment-backend@1.0.0 build
> tsc && prisma generate

❌ 여기서 에러 발생!
```

**복사해야 할 부분**:
1. ❌ **에러 메시지 전체** (빨간색으로 표시된 부분)
2. ⚠️ **에러 직전 10-20줄** (컨텍스트)
3. 📍 **에러가 발생한 단계** (npm install? prisma generate? tsc?)

---

## 📋 예상 가능한 에러 패턴

### 패턴 1: TypeScript 컴파일 에러
```
src/controllers/vision/calibration.controller.ts:253:29
Error: Property 'visionCalibration' does not exist on type 'PrismaClient'
```
→ Prisma Client가 재생성되지 않은 것

### 패턴 2: Prisma Generate 에러
```
Error: Schema parsing failed
  --> schema.prisma:XXX
```
→ schema.prisma 문법 오류

### 패턴 3: npm install 에러
```
npm ERR! code ENOENT
npm ERR! Could not resolve dependency
```
→ package.json 문제

### 패턴 4: 환경 변수 에러
```
Error: Environment variable not found: DATABASE_URL
```
→ Render 환경 변수 설정 문제

---

## 💡 빠른 해결 방법

### 만약 로그를 찾기 어렵다면:

**대안 1: 로컬에서 빌드 테스트**
```bash
cd backend
npm install
npx prisma generate
npm run build
```
로컬에서 에러가 나면 → 동일한 에러가 Render에서도 발생

**대안 2: 최근 성공한 배포로 롤백**
Render Dashboard → Events → 마지막 성공한 배포 → "Redeploy"

---

## 🎯 제게 제공해주실 정보

Render Dashboard → Logs → Build 탭에서:

1. **전체 빌드 로그 복사** (너무 길면 마지막 50-100줄)
2. 특히 다음 키워드가 있는 부분:
   - `Error:`
   - `failed`
   - `npm ERR!`
   - `❌`
   - 빌드가 중단된 지점

**또는**:

스크린샷을 찍어서 공유해주셔도 됩니다!
