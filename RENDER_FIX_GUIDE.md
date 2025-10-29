# 🚨 Render 로그인 500 에러 긴급 수정 가이드

## 문제 원인
`JWT_SECRET` 환경 변수가 Render 대시보드에 설정되지 않아 로그인 시 500 에러 발생

---

## 🤖 **자동 해결 방법 (권장)** - Playwright 자동화

**더 빠르고 정확한 자동화 솔루션이 있습니다!**

👉 **[scripts/PLAYWRIGHT_GUIDE.md](scripts/PLAYWRIGHT_GUIDE.md)** 참조

```bash
# 1. 환경 변수 설정
set RENDER_EMAIL=your@email.com
set RENDER_PASSWORD=yourpassword

# 2. 자동화 스크립트 실행
npm run render:update-env
```

**자동으로 수행되는 작업**:
- ✅ Render 로그인
- ✅ 서비스 선택 (literacy-backend)
- ✅ DATABASE_URL 업데이트 (pgbouncer 파라미터 포함)
- ✅ JWT_SECRET 추가
- ✅ NODE_ENV 설정
- ✅ 배포 상태 확인

**예상 소요 시간**: 2-3분 (수동 방법: 5분+)

---

## 📋 수동 해결 방법 (대안)

자동화 스크립트를 사용할 수 없는 경우 아래 수동 방법을 사용하세요.

### ⚡ 긴급 해결 방법 (5분 소요)

### 1단계: Render 대시보드 접속
1. https://dashboard.render.com 접속
2. 로그인

### 2단계: Node.js 백엔드 서비스 선택
1. 좌측 메뉴에서 **"Web Services"** 클릭
2. **"literacy-backend"** (Node.js) 클릭

### 3단계: 환경 변수 확인
1. 좌측 메뉴에서 **"Environment"** 클릭
2. 환경 변수 목록에서 **JWT_SECRET** 찾기

### 4단계-A: JWT_SECRET이 없는 경우
1. **"Add Environment Variable"** 버튼 클릭
2. 다음 정보 입력:
   ```
   Key: JWT_SECRET
   Value: literacy-test-secret-key-2025-very-secure-and-long-enough-for-production
   ```
3. **"Save Changes"** 클릭
4. 서비스 자동 재배포 대기 (2-3분)

### 4단계-B: JWT_SECRET이 있지만 짧은 경우
1. 기존 JWT_SECRET 옆의 **"Edit"** 클릭
2. Value를 다음으로 변경:
   ```
   literacy-test-secret-key-2025-very-secure-and-long-enough-for-production
   ```
3. **"Save Changes"** 클릭
4. 서비스 자동 재배포 대기 (2-3분)

### 5단계: 배포 완료 확인
1. 상단의 **"Events"** 탭 클릭
2. "Deploy succeeded" 메시지 확인
3. 또는 **"Logs"** 탭에서 서버 시작 로그 확인

### 6단계: 로그인 테스트
1. 브라우저에서 프론트엔드 새로고침 (`Ctrl+F5`)
2. 로그인 시도:
   - Email: `test@test.com`
   - Password: `test123`
3. 대시보드로 정상 진입 확인

---

## 🔍 문제 진단 체크리스트

### 환경 변수 확인 사항
- ✅ `DATABASE_URL` 존재
- ✅ `SUPABASE_URL` 존재
- ✅ `SUPABASE_ANON_KEY` 존재
- ⚠️ `JWT_SECRET` 존재 여부 확인 필요 (최소 32자)
- ✅ `CORS_ORIGIN` = `https://playful-cocada-a89755.netlify.app`
- ✅ `NODE_ENV` = `production`

### JWT_SECRET 요구사항
- **최소 길이**: 32자 이상
- **권장 길이**: 64자 이상
- **형식**: 영문, 숫자, 특수문자 조합
- **예시**: `literacy-test-secret-key-2025-very-secure-and-long-enough-for-production` (72자)

---

## 📊 Render.yaml vs 대시보드 차이점

**중요**: `render.yaml` 파일의 변경사항은 **초기 생성 시에만** 적용됩니다!

### render.yaml 파일
- 서비스 최초 생성 시 사용
- Git에서 관리
- 이후 변경사항은 자동 적용 안 됨 ⚠️

### Render 대시보드
- 실제 환경 변수 관리
- 변경 즉시 적용됨
- 서비스 자동 재배포

**따라서**: render.yaml에 JWT_SECRET을 추가했지만, **대시보드에서 직접 추가해야 실제 적용됩니다!**

---

## 🧪 테스트 API 엔드포인트

### 건강 상태 체크 (서비스 정상 여부)
```bash
curl https://literacy-backend.onrender.com/health
```
**예상 응답**:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "v1"
}
```

### 로그인 테스트 (JWT_SECRET 확인)
```bash
curl -X POST https://literacy-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**성공 시 (JWT_SECRET 정상)**:
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

**실패 시 (JWT_SECRET 없음/짧음)**:
```json
{
  "success": false,
  "message": "로그인 중 오류가 발생했습니다."
}
```

---

## 🔒 보안 권장사항

### 프로덕션 환경 JWT_SECRET 생성
더 강력한 시크릿 키를 생성하려면:

```bash
# 64자 랜덤 시크릿 생성 (Linux/Mac)
openssl rand -base64 48

# 또는 Python
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### JWT_SECRET 관리
- ❌ Git에 커밋하지 마세요
- ❌ 프론트엔드에 노출하지 마세요
- ✅ Render 대시보드에서만 관리
- ✅ 주기적으로 변경 (권장: 6개월)

---

## 🆘 여전히 문제가 있다면

### 1. Render 로그 확인
1. Render 대시보드 → `literacy-backend` 서비스
2. **"Logs"** 탭 클릭
3. 최근 에러 로그 확인
4. "Login error", "JWT", "env" 키워드 검색

### 2. 환경 변수 전체 확인
필수 환경 변수 목록:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET` (최소 32자) ⚠️
- `CORS_ORIGIN`
- `NODE_ENV=production`

### 3. 서비스 수동 재배포
1. Render 대시보드 → `literacy-backend`
2. 우측 상단 **"Manual Deploy"** 클릭
3. **"Clear build cache & deploy"** 선택
4. 3-4분 대기

---

## ✅ 완료 체크리스트

- [ ] Render 대시보드 접속
- [ ] `literacy-backend` 서비스 선택
- [ ] Environment 탭에서 JWT_SECRET 확인/추가
- [ ] JWT_SECRET 값 = 최소 32자 이상
- [ ] Save Changes 클릭
- [ ] 배포 완료 대기 (2-3분)
- [ ] 브라우저 새로고침
- [ ] 로그인 테스트 성공
- [ ] 대시보드 접근 성공

---

**예상 소요 시간**: 5분
**난이도**: 쉬움
**필요 권한**: Render 대시보드 접근 권한
