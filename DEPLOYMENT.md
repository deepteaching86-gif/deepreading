# 배포 가이드

## 개요

- **프론트엔드**: Netlify (React + Vite)
- **백엔드**: Render (FastAPI + Python)
- **데이터베이스**: Supabase (PostgreSQL)

---

## 1. 백엔드 배포 (Render)

### 1.1 Render 계정 및 서비스 생성

1. [Render](https://render.com) 접속 및 로그인
2. **New → Web Service** 클릭
3. GitHub 저장소 연결 또는 수동 배포 선택

### 1.2 서비스 설정

#### 기본 설정
- **Name**: `literacy-test-backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Branch**: `main`
- **Root Directory**: `backend`

#### 환경 변수 (Environment Variables)

Render 대시보드에서 다음 환경 변수를 설정하세요:

```
DATABASE_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres

DIRECT_URL=postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres

FRONTEND_URL=https://literacy-test.netlify.app
```

**참고**: 프론트엔드 URL은 Netlify 배포 후 실제 URL로 업데이트하세요.

### 1.3 배포 확인

배포 완료 후 다음 엔드포인트로 확인:
- Health Check: `https://your-app.onrender.com/health`
- API Docs: `https://your-app.onrender.com/docs`

---

## 2. 프론트엔드 배포 (Netlify)

### 2.1 Netlify 계정 및 사이트 생성

1. [Netlify](https://www.netlify.com) 접속 및 로그인
2. **Add new site → Import an existing project** 클릭
3. GitHub 저장소 연결

### 2.2 빌드 설정

#### 기본 설정
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

#### 환경 변수 (Environment Variables)

Netlify 대시보드 → Site settings → Environment variables에서 설정:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

**중요**: Render 백엔드 배포 완료 후 실제 URL로 업데이트하세요!

### 2.3 배포 확인

배포 완료 후 Netlify에서 제공하는 URL로 접속하여 확인합니다.

---

## 3. 배포 순서

### 권장 순서:

1. **백엔드 먼저 배포 (Render)**
   - Render에서 백엔드 서비스 생성
   - 환경 변수 설정
   - 배포 완료 및 URL 확인

2. **백엔드 URL을 프론트엔드에 설정**
   - Netlify 환경 변수 `VITE_API_URL`에 Render URL 입력
   - Render 환경 변수 `FRONTEND_URL`에 예상 Netlify URL 입력

3. **프론트엔드 배포 (Netlify)**
   - Netlify에서 사이트 생성
   - 환경 변수 설정
   - 배포 완료

4. **CORS 설정 최종 확인**
   - Render에서 `FRONTEND_URL` 환경 변수를 실제 Netlify URL로 업데이트
   - Render 서비스 재배포

---

## 4. 자동 배포 설정

### GitHub Actions (선택사항)

프로젝트 루트에 `.github/workflows/deploy.yml` 파일을 생성하여 자동 배포 설정 가능:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        run: |
          curl -X POST ${{ secrets.NETLIFY_DEPLOY_HOOK }}
```

---

## 5. 배포 후 확인 사항

### 백엔드 (Render)
- [ ] `/health` 엔드포인트 응답 확인
- [ ] `/docs` Swagger UI 접속 가능
- [ ] 데이터베이스 연결 정상 동작
- [ ] CORS 설정 정상 동작

### 프론트엔드 (Netlify)
- [ ] 사이트 로딩 정상
- [ ] 백엔드 API 호출 정상
- [ ] 영어 적응형 테스트 시작 가능
- [ ] 로그인/로그아웃 정상 동작

---

## 6. 문제 해결

### CORS 오류 발생 시
1. Render에서 `FRONTEND_URL` 환경 변수 확인
2. 백엔드 `app/main.py`의 CORS 설정 확인
3. Render 서비스 재배포

### 데이터베이스 연결 오류
1. Supabase 프로젝트 상태 확인
2. `DATABASE_URL` 환경 변수 정확성 확인
3. Supabase 방화벽 설정 확인 (Render IP 허용)

### 빌드 실패 시
- **백엔드**: `requirements.txt` 패키지 버전 확인
- **프론트엔드**: `package.json` 의존성 확인, Node 버전 확인

---

## 7. 유용한 명령어

### 로컬 빌드 테스트

#### 백엔드
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 프론트엔드
```bash
cd frontend
npm install
npm run build
npm run preview
```

---

## 8. 모니터링

### Render
- Render 대시보드에서 로그 실시간 확인 가능
- 메트릭스 (CPU, 메모리 사용량) 모니터링

### Netlify
- Netlify 대시보드에서 배포 로그 확인
- Analytics로 트래픽 모니터링

---

## 문의사항

배포 관련 문제가 있으시면 GitHub Issues에 등록해주세요.
