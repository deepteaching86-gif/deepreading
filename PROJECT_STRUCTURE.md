# Literacy Test Project - 프로젝트 구조 문서

## 개요
- **프로젝트명**: English Adaptive Testing System (LITERACY TEST)
- **목적**: IRT 기반 영어 능력 적응형 평가 시스템

## 아키텍처 구성

### 1. Frontend (Netlify)
- **위치**: `frontend/`
- **기술 스택**: React + TypeScript + Vite
- **배포**: Netlify
- **URL**: https://playful-cocada-a89755.netlify.app
- **주요 기능**:
  - English Adaptive Test UI
  - Real-time ability visualization (θ, difficulty)
  - Item source distinction (manual vs AI-generated)

### 2. Backend (Render - Python3)
- **위치**: `backend/`
- **기술 스택**: Python3 + FastAPI + PostgreSQL
- **런타임**: **Python** (NOT Node.js!)
- **배포**: Render
- **URL**: https://literacy-backend.onrender.com
- **주요 기능**:
  - Adaptive Test Engine (IRT 3PL Model)
  - MST (Multi-Stage Testing) Logic
  - Item Selection & Routing Algorithm
  - Response Evaluation & Ability Estimation
  - Admin API (database management, item generation)

### 3. Database
- **Provider**: Supabase
- **Type**: PostgreSQL
- **Connection**: Connection Pooler for Render deployment
- **주요 테이블**:
  - `items`: 문항 정보 (IRT parameters: a, b, c)
  - `passages`: 지문 정보
  - `sessions`: 테스트 세션
  - `responses`: 응답 기록

## 중요: Backend Runtime 혼동 주의!

### ✅ 현재 구성 (2025년 10월 현재)
```yaml
Backend 디렉토리: backend/
Runtime: Python3
Framework: FastAPI + Uvicorn
Deployment: Render (python runtime)
Entry Point: backend/app/main.py
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### ❌ 과거 잘못된 구성 (수정됨)
```yaml
# render.yaml에 Node.js로 잘못 설정되어 있었음 (현재 수정 완료)
# 이로 인해 Python 코드가 작동하지 않았음
```

## 파일 구조

```
LITERACY TEST PROJECT/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── english-test/
│   │   │       └── EnglishTestScreen.tsx  # 메인 테스트 UI
│   │   ├── api/
│   │   │   └── englishTestApi.ts         # Backend API 호출
│   │   └── hooks/
│   │       └── useEnglishTest.ts         # 테스트 상태 관리
│   └── package.json
│
├── backend/                  # Python FastAPI 백엔드
│   ├── app/
│   │   ├── main.py                       # FastAPI 애플리케이션 진입점
│   │   ├── english_test/
│   │   │   ├── router.py                 # 테스트 API 라우터
│   │   │   ├── admin_routes.py           # 관리자 API 라우터
│   │   │   ├── service_v2.py             # 테스트 로직 (IRT, MST)
│   │   │   └── database.py               # DB 연결
│   │   └── ai/
│   │       └── router.py                 # AI 문항 생성 API
│   ├── requirements.txt                   # Python 의존성
│   ├── generated_52_items.json           # 수동 생성 52개 깨끗한 문항
│   └── cleanup_and_insert_clean_items.py # DB 정리 스크립트
│
└── render.yaml               # Render 배포 설정 (Python runtime)
```

## API 엔드포인트

### Public API
- `POST /api/english-test/start-session` - 테스트 세션 시작
- `POST /api/english-test/submit-response` - 응답 제출
- `GET /api/english-test/session-result/{session_id}` - 결과 조회

### Admin API
- `POST /api/admin/english-test/cleanup-and-insert-clean-items` - DB 정리 및 초기화
- `POST /api/admin/ai/generate-items` - AI 문항 생성

### Health Check
- `GET /health` - 백엔드 상태 확인

## 배포 프로세스

### Frontend (Netlify)
1. GitHub push → `main` branch
2. Netlify 자동 배포
3. Build command: `cd frontend && npm run build`
4. Publish directory: `frontend/dist`

### Backend (Render)
1. GitHub push → `main` branch
2. Render 자동 배포 (Python runtime)
3. Build command: `cd backend && pip install -r requirements.txt`
4. Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. 배포 시간: 약 3-5분 (Python runtime 전환시 더 오래 걸림)

## 환경 변수

### Backend (Render)
```bash
DATABASE_URL=postgresql://...  # Supabase Connection Pooler URL
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CORS_ORIGIN=https://playful-cocada-a89755.netlify.app
```

### Frontend (Netlify)
```bash
VITE_API_URL=https://literacy-backend.onrender.com
```

## 주요 기능

### 1. Adaptive Testing (적응형 검사)
- **IRT 3PL Model**: Item Response Theory with 3 parameters
  - `a` (discrimination): 변별도
  - `b` (difficulty): 난이도
  - `c` (guessing): 추측도
- **MST (Multi-Stage Testing)**: 3단계 적응형 라우팅
  - Stage 1: Routing (난이도 중간 문항)
  - Stage 2: Panel 선택 (low, medium, high)
  - Stage 3: Subtrack (세부 난이도 조정)

### 2. Item Source Tracking (문항 출처 구분)
- `manual`: 수동으로 작성된 검증된 문항
- `ai_generated`: AI로 생성된 문항
- UI에 배지로 시각적 구분 표시

### 3. Real-time Visualization (실시간 시각화)
- 현재 능력 추정치 (θ)
- 표준 오차 (SE)
- 문항 난이도 (b)
- 난이도 비교 지표 (📈 📉 ➡️)

## 트러블슈팅

### Backend 404 Error
**문제**: Admin API 호출 시 404 에러
**원인**: render.yaml에 Node.js runtime으로 잘못 설정됨
**해결**: Python runtime으로 수정 (commit 06fd38a8)

### Database Connection Error (Local)
**문제**: 로컬에서 DB 연결 불가
**원인**: Supabase Direct URL 사용 시 네트워크 제한
**해결**: Connection Pooler URL 사용

### 502 Bad Gateway (Render)
**문제**: 배포 직후 502 에러
**원인**: 배포가 아직 완료되지 않음
**해결**: 3-5분 대기 후 재시도

### Admin API 404 After Python Runtime Fix
**문제**: Python runtime으로 변경 후에도 Admin API 404 에러
**원인**: Render 자동 배포 트리거 실패 (GitHub webhook 문제 또는 수동 배포 설정)
**해결 방법**:
1. Render 대시보드에서 수동 배포 트리거 (Manual Deploy)
2. 또는 빈 커밋으로 재배포 강제: `git commit --allow-empty -m "Trigger Render deploy" && git push`

## 최근 수정 사항

### 2025-10-29
1. ✅ Python runtime으로 render.yaml 수정
2. ✅ generated_52_items.json Git에 추가
3. ✅ Admin API endpoint 추가 (cleanup-and-insert-clean-items)
4. ✅ Item source tracking 기능 추가 (manual vs AI)
5. ✅ Real-time difficulty visualization 추가

## 다음 단계

1. ⏳ Render Python 배포 완료 대기
2. ⏳ DB 정리 API 실행 (나쁜 600개 문항 삭제, 깨끗한 52개 삽입)
3. ⏳ 22번 문제 먹통 버그 테스트
4. ⏳ 추가 고품질 문항 생성 (의미적 맥락, 난이도, 문법 검토)
