# English Adaptive Test - Implementation Log
**작성일**: 2025-01-22
**상태**: Phase 1 기반 구조 완료

---

## 📋 구현 완료 항목

### 1. Database Schema (Prisma)
**파일**: `backend/prisma/schema.prisma`

#### 추가된 모델 (7개)

1. **Passage** - 독해 지문
   - 텍스트 복잡도 지표 (Lexile, AR, Flesch-Kincaid)
   - 장르 및 주제 분류

2. **Item** - 테스트 문항 (IRT 3PL)
   - IRT 파라미터: discrimination (a), difficulty (b), guessing (c)
   - MST 구조: stage, panel, formId
   - 노출 제어: exposureCount

3. **VocabularyItem** - 어휘 문항 (VST)
   - 빈도 밴드 (1k, 2k, 4k, 6k, 8k, 10k, 14k)
   - 가짜 단어 플래그 (isPseudo)
   - IRT 파라미터

4. **EnglishTestSession** - 테스트 세션
   - MST 라우팅 결과 (stage1Theta, stage2Panel, stage3Panel)
   - 최종 결과 (finalTheta, standardError, proficiencyLevel)
   - Lexile/AR 점수, 어휘 크기

5. **EnglishItemResponse** - 문항 응답
   - 정오답, 응답 시간
   - 실시간 θ 추정값 (thetaEstimate, seEstimate)

6. **VocabularyResponse** - 어휘 응답

7. **LexileCalibrationData** - Lexile ML 모델 훈련 데이터
   - 12개 텍스트 특징 (mean_sentence_length, flesch_kincaid 등)
   - 타겟 변수 (lexileScore, arLevel)

#### Enum 타입
- `MSTStage`: routing, stage2, stage3
- `MSTPanel`: routing, low, medium, high, L1-L3, M1-M3, H1-H3
- `EnglishTestStatus`: in_progress, completed, abandoned

---

### 2. IRT 3PL EAP Estimation Engine (Python)
**파일**: `backend/app/english_test/irt_engine.py`

#### 핵심 기능

**3PL 확률 함수**
```python
P(θ) = c + (1-c) / (1 + exp(-a(θ-b)))
```

**EAP 추정**
```python
θ_EAP = ∫ θ × L(θ|R) × π(θ) dθ / ∫ L(θ|R) × π(θ) dθ
SE = sqrt(∫ (θ - θ_EAP)² × L(θ|R) × π(θ) dθ / ∫ L(θ|R) × π(θ) dθ)
```

**Fisher Information 계산**
- 문항 선택에 사용
- Maximum Fisher Information 기준

**Randomesque 노출 제어**
- 상위 5개 문항 중 노출 횟수 가중치로 랜덤 선택
- 가중치 = 1 / (exposure_count + 1)

**MST 라우팅 로직**
- Stage 1 → 2: θ < -0.5 (Low), -0.5 ≤ θ < 0.5 (Medium), θ ≥ 0.5 (High)
- Stage 2 → 3: 패널별 세부 분기 (L1-L3, M1-M3, H1-H3)

**숙련도 변환**
- θ → 10단계 숙련도 레벨
- 1-2: Below Basic, 3-4: Basic, 5-6: Proficient, 7-8: Advanced, 9-10: Superior

#### 메서드
- `three_pl_probability(θ, a, b, c)`: 3PL 확률 계산
- `likelihood(θ, responses, items)`: 우도 계산
- `eap_estimate(responses, items)`: EAP 추정 + SE
- `fisher_information(θ, items)`: Fisher 정보량 계산
- `select_next_item(θ, candidates)`: 다음 문항 선택
- `ability_to_proficiency_level(θ)`: 숙련도 변환
- `route_to_stage2_panel(θ)`: Stage 2 라우팅
- `route_to_stage3_panel(θ, panel)`: Stage 3 라우팅

---

### 3. FastAPI Backend Structure

#### Router (`backend/app/english_test/router.py`)

**API Endpoints**:
- `POST /api/english-test/start` - 세션 시작
- `POST /api/english-test/submit-response` - 응답 제출
- `GET /api/english-test/session/{id}` - 세션 상태 조회
- `POST /api/english-test/finalize` - 테스트 완료 처리
- `GET /api/english-test/health` - 헬스 체크

**Request/Response Models**:
- StartTestRequest/Response
- SubmitResponseRequest/Response
- SessionStatusResponse
- FinalizeTestRequest/Response

#### Service Layer (`backend/app/english_test/service.py`)

**핵심 비즈니스 로직**:
- `start_session(user_id)`: 세션 생성 + 첫 문항 선택
- `submit_response(session_id, item_id, answer)`: 응답 처리 + θ 업데이트
- `get_session_status(session_id)`: 세션 진행 상황 조회
- `finalize_session(session_id)`: 최종 결과 생성

**MST 구성**:
- Stage 1: 8문항 (Routing)
- Stage 2: 16문항 (Panel)
- Stage 3: 16문항 (Subtrack)
- 총 40문항

**Lexile/AR 추정**:
- 현재: 선형 보간 (Placeholder)
- 향후: Gradient Boosting ML 모델 통합 예정

---

### 4. Frontend React Components

#### 시작 화면 (`frontend/src/components/english-test/EnglishTestIntro.tsx`)
- 테스트 개요 및 안내사항
- 총 문항 수, 소요 시간, 평가 영역, 결과 정보
- 시작 버튼 및 로딩 상태 처리
- Framer Motion 애니메이션

#### 테스트 화면 (`frontend/src/components/english-test/EnglishTestScreen.tsx`)
- 진행률 표시 (Progress Bar)
- 지문 표시 (접기/펼치기 기능)
- 4지 선택 문항 (A, B, C, D)
- 응답 시간 측정
- 문항 번호 및 단계 정보 표시
- 애니메이션 전환 효과

#### 결과 화면 (`frontend/src/components/english-test/EnglishTestReport.tsx`)
- 10단계 숙련도 레벨 시각화
- θ 점수 및 표준 오차
- 정답률, Lexile, AR Level, 어휘 크기
- 어휘 밴드별 분석 차트
- 수준별 학습 제안
- 결과 인쇄 기능

**컬러 테마**:
- Level 1-2: Red (기초 단계)
- Level 3-4: Orange (초급)
- Level 5-6: Yellow (중급)
- Level 7-8: Green (중상급)
- Level 9-10: Blue (고급)

---

## 🔄 다음 단계 (Phase 1 완성)

### 데이터베이스
- [ ] Prisma 마이그레이션 완료 확인
- [ ] Prisma Client 재생성
- [ ] 테스트 데이터 시딩

### 백엔드
- [ ] Service Layer에 실제 DB 쿼리 통합 (Prisma)
- [ ] 문항 선택 로직 DB 연동
- [ ] Python 패키지 설치 (numpy, scipy)
- [ ] FastAPI 라우터를 main.py에 등록

### 프론트엔드
- [ ] React Hook 작성 (useEnglishTest)
- [ ] API 클라이언트 함수 작성
- [ ] 페이지 라우팅 설정
- [ ] 로딩 스피너 컴포넌트

### ML 모델 (Phase 2)
- [ ] Lexile/AR 예측 모델 훈련 데이터 수집
- [ ] Gradient Boosting 모델 훈련 (scikit-learn)
- [ ] 모델 서빙 API 엔드포인트
- [ ] 어휘 크기 추정 알고리즘 구현

### 문항 개발 (Week 3-6)
- [ ] 문법 문항 100개 (Grammar)
- [ ] 어휘 문항 100개 (Vocabulary)
- [ ] 독해 문항 100개 (Reading Comprehension)
- [ ] Pilot Test (200-500명)
- [ ] GIRTH 라이브러리로 IRT 파라미터 캘리브레이션

---

## 📊 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **IRT Engine**: NumPy, SciPy
- **ML (예정)**: scikit-learn (Gradient Boosting)

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **HTTP Client**: Axios / Fetch API

### DevOps
- **Backend Hosting**: (TBD - Vercel/Render/Railway)
- **Database**: Supabase PostgreSQL
- **Frontend Hosting**: Netlify

---

## 🎯 MST 구조 (1→3→3)

```
┌─────────────────────┐
│   Stage 1: Routing  │
│      (8 items)      │
│    θ_1 estimate     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │   Routing   │
    │  θ < -0.5?  │
    │ -0.5~0.5?   │
    │  θ ≥ 0.5?   │
    └──────┬──────┘
           │
  ┌────────┼────────┐
  │        │        │
┌─▼─┐   ┌─▼──┐  ┌─▼──┐
│Low│   │Med │  │High│
│(16)│   │(16)│  │(16)│
└─┬─┘   └─┬──┘  └─┬──┘
  │       │       │
  ├─┬─┬─  ├─┬─┬─  ├─┬─┬─
  │ │ │   │ │ │   │ │ │
 L1 L2 L3 M1 M2 M3 H1 H2 H3
(16)(16)(16)(16)(16)(16)(16)(16)(16)
```

**총 문항**: 8 (Stage 1) + 16 (Stage 2) + 16 (Stage 3) = **40문항**

---

## 📝 참고 문서

- PRD: `.taskmaster/docs/english-adaptive-test-prd.md`
- IRT Engine: `backend/app/english_test/irt_engine.py`
- DB Schema: `backend/prisma/schema.prisma`
- API Router: `backend/app/english_test/router.py`

---

## ✅ 품질 체크리스트

- [x] IRT 3PL 수식 검증 완료
- [x] EAP 추정 알고리즘 구현
- [x] MST 라우팅 로직 구현
- [x] Fisher Information 문항 선택
- [x] Randomesque 노출 제어
- [x] Database Schema 설계
- [x] API Endpoint 설계
- [x] React Component UI/UX
- [ ] 실제 DB 연동 테스트
- [ ] End-to-End 플로우 테스트
- [ ] 성능 최적화 (쿼리, 캐싱)
- [ ] 보안 검증 (SQL Injection, XSS)

---

**다음 작업 우선순위**:
1. Prisma 마이그레이션 완료 및 Client 재생성
2. Service Layer DB 쿼리 통합
3. React Hook 및 API 클라이언트 작성
4. 테스트 문항 샘플 생성 (최소 40개)
5. End-to-End 테스트 및 디버깅
