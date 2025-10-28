# Backend 아키텍처 명확화 문서

## ⚠️ 중요: 두 개의 별도 백엔드가 있습니다!

### 1. Literacy Backend (Node.js) - 기존 프로젝트
```yaml
Render 서비스명: literacy-backend
Runtime: Node.js
URL: https://literacy-backend.onrender.com
프로젝트 폴더: [별도 프로젝트]
용도: 기존 Literacy 시스템
```

### 2. English Test Backend (Python) - 새 프로젝트
```yaml
Render 서비스명: literacy-english-test-backend
Runtime: Python3
URL: [생성 예정]
프로젝트 폴더: 현재 프로젝트의 backend/
용도: English Adaptive Test (IRT, MST)
Framework: FastAPI + Uvicorn
```

---

## 현재 프로젝트 구조 (English Adaptive Test)

```
LITERACY TEST PROJECT/
├── frontend/                          # React (Netlify)
│   ├── src/components/english-test/
│   └── URL: https://playful-cocada-a89755.netlify.app
│
├── backend/                           # Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── english_test/             # 영어 적응형 테스트 로직
│   │   │   ├── router.py
│   │   │   ├── admin_routes.py
│   │   │   ├── service_v2.py        # IRT 3PL, MST 알고리즘
│   │   │   └── database.py
│   │   └── ai/
│   │       └── router.py             # AI 문항 생성
│   ├── requirements.txt
│   └── generated_52_items.json       # 깨끗한 52개 문항
│
└── render.yaml                        # 두 개의 서비스 정의
    ├── literacy-backend              # Node.js (기존)
    └── literacy-english-test-backend # Python (새로 생성 필요)
```

---

## render.yaml 구성

```yaml
services:
  # 1. Literacy Backend (Node.js) - 건드리지 말 것!
  - name: literacy-backend
    runtime: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start

  # 2. English Test Backend (Python) - 이번에 배포할 서비스
  - name: literacy-english-test-backend
    runtime: python
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 배포 상태

### ❌ 잘못한 것
- `literacy-backend`를 Python으로 변경 → **Node.js로 되돌림** ✅

### ✅ 해야 할 것
1. `literacy-backend`를 Node.js로 복원 (완료)
2. Render 대시보드에서 새 서비스 생성: `literacy-english-test-backend` (수동 필요)
3. 새 서비스에 Python backend 연결
4. Admin API 테스트 및 DB 정리

---

## 다음 단계

### 즉시 해야 할 일
1. **Git 커밋 & 푸시** - render.yaml Node.js 복원
2. **Render 대시보드 접속**
3. **새 Web Service 생성**
   - Name: `literacy-english-test-backend`
   - Runtime: Python
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     - `DATABASE_URL`: Connection Pooler URL
     - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     - `CORS_ORIGIN`: Frontend URL

### 배포 후 테스트
```bash
# 새 Python 백엔드 health check
curl https://literacy-english-test-backend.onrender.com/health

# DB 정리 API 실행
curl -X POST https://literacy-english-test-backend.onrender.com/api/admin/english-test/cleanup-and-insert-clean-items
```

---

## 헷갈리지 않기 위한 체크리스트

- [ ] `literacy-backend` = **Node.js** (기존 프로젝트, 건드리지 말 것!)
- [ ] `literacy-english-test-backend` = **Python** (English Test, 새로 생성)
- [ ] 현재 프로젝트 `backend/` 폴더 = **Python FastAPI**
- [ ] render.yaml = **두 개의 서비스 모두 정의**
- [ ] Node.js 백엔드 코드는 **현재 프로젝트에 없음**
