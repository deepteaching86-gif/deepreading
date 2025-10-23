# 영어 능동형 무학년제 적응형 테스트 PRD (Product Requirements Document)

> **프로젝트**: 문해력 진단 평가 시스템 - 영어 능력 테스트 템플릿
> **버전**: 1.0.0
> **작성일**: 2025-01-20
> **문서 유형**: Product Requirements Document

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [기술 스택](#기술-스택)
4. [데이터베이스 설계](#데이터베이스-설계)
5. [핵심 기능 명세](#핵심-기능-명세)
6. [UI/UX 설계](#uiux-설계)
7. [개발 로드맵](#개발-로드맵)
8. [성능 요구사항](#성능-요구사항)
9. [보안 및 개인정보보호](#보안-및-개인정보보호)
10. [테스트 계획](#테스트-계획)

---

## 프로젝트 개요

### 1.1 비전 (Vision)

**"학년에 구애받지 않는 정확한 영어 능력 진단으로 모든 학생에게 맞춤형 학습 경로를 제공한다"**

### 1.2 목표 (Goals)

| 목표 | 측정 지표 | 목표치 |
|------|----------|--------|
| **정확한 능력 측정** | IRT SE(Standard Error) | ≤ 0.30 (95% 학생) |
| **효율적인 평가** | 평가 시간 | 20-30분 (40문항) |
| **무학년제 구현** | 10레벨 범위 | K-대학원 (AR 0.5~12.9) |
| **높은 사용자 만족도** | NPS(Net Promoter Score) | ≥ 50 |
| **문항 보안 유지** | 최대 노출률 | ≤ 30% per item |

### 1.3 핵심 가치 제안 (Value Proposition)

**학생에게**:
- ✅ **개인 맞춤형**: 실력에 딱 맞는 난이도로 40문항만 풀면 정확한 진단
- ✅ **시간 절약**: 300개 문항 풀 중 자동 선택으로 20-30분 완료
- ✅ **명확한 목표**: 10레벨 절대 기준 + Lexile/AR 지수로 목표 설정 가능
- ✅ **세밀한 피드백**: 문법/어휘/독해 도메인별 강약점 분석

**교사/부모에게**:
- ✅ **신뢰할 수 있는 결과**: IRT 기반 과학적 측정 (표준오차 ≤ 0.30)
- ✅ **학년 무관 배치**: 실력만으로 레벨 판단, 선입견 배제
- ✅ **국제 표준 연동**: Lexile Framework, AR 등급과 호환
- ✅ **구체적 어휘량**: "약 5,000단어 수준" 같은 명확한 정보

**운영자에게**:
- ✅ **문항 효율성**: 300개로 시작 → 600개로 확장 가능한 로드맵
- ✅ **보안 우수**: MST 패널 회전 + Randomesque로 문항 노출 최소화
- ✅ **유지보수 용이**: 분기별 IRT 재캘리브레이션으로 품질 유지

### 1.4 범위 (Scope)

#### ✅ **포함 사항 (In Scope)**

**Phase 1 (MVP - 3개월)**:
- [x] MST(Multistage Testing) 1→3→3 구조 구현
- [x] 문항 풀 300개 제작 (문법 100, 어휘 100, 독해 100)
- [x] IRT 3PL 모델 기반 능력치(θ) 추정
- [x] 10레벨 절대 기준 진단
- [x] Lexile/AR 추정 (ML 모델)
- [x] 어휘 사이즈 추정 (VST + 가짜어)
- [x] 도메인별 강약점 분석 (문법/어휘/독해)
- [x] 학생용 상세 리포트 UI

**Phase 2 (확장 - 6개월)**:
- [ ] 문항 풀 600개로 확장 (동형 6세트)
- [ ] 모바일 최적화 (반응형 디자인)
- [ ] 학급/학교 대시보드 (교사용)
- [ ] 학습 추천 시스템 (레벨별 도서/콘텐츠)

#### ❌ **제외 사항 (Out of Scope)**

- ❌ 말하기/쓰기 평가 (주관식 채점 필요)
- ❌ 실시간 협업 기능
- ❌ AI 튜터링 (별도 프로젝트)
- ❌ 다국어 지원 (영어 전용)

### 1.5 사용자 페르소나 (User Personas)

#### **페르소나 1: 초등 5학년 민지** 👧
- **배경**: 학원에서 중1 과정 선행학습 중, 자기 실력이 궁금함
- **목표**: 객관적 레벨 확인 → 적절한 원서 선택
- **Pain Point**: 학년 기준 테스트는 너무 쉬워서 변별력 없음
- **성공 시나리오**:
  - 테스트 결과 "Level 7 (AR 4.5~5.0, Lexile 850L)"
  - 추천 도서: *Charlotte's Web*, *Harry Potter 1* 등

#### **페르소나 2: 중2 영어 교사 김 선생님** 👨‍🏫
- **배경**: 학급 30명의 실력 편차 심함 (기초~고급)
- **목표**: 학생별 정확한 레벨 파악 → 수준별 수업 편성
- **Pain Point**: 학년별 지필고사는 중위권 학생 변별만 가능
- **성공 시나리오**:
  - 30명 전원 테스트 완료 (각 25분 소요)
  - 레벨 분포: Level 3 (2명), Level 4 (5명), ... Level 8 (3명)
  - 3개 그룹으로 수준별 수업 편성

#### **페르소나 3: 국제학교 전학 준비 중인 고1 지훈** 🎓
- **배경**: 미국 고등학교 지원 위해 영어 실력 증명 필요
- **목표**: Lexile 점수 확인 → SAT/TOEFL 준비 전략 수립
- **Pain Point**: 학교 내신은 A지만 국제 표준 점수 모름
- **성공 시나리오**:
  - 진단 결과 "Lexile 1050L (Grade 7-8 수준)"
  - Gap 분석: 문법(상), 어휘(중), 독해(중상)
  - 목표: 6개월 내 1200L 달성 → SAT 준비 시작

---

## 시스템 아키텍처

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Test UI    │  │ Report UI  │  │ Dashboard  │             │
│  │ (학생용)    │  │ (결과)      │  │ (교사용)    │             │
│  └────────────┘  └────────────┘  └────────────┘             │
└───────────────────────┬──────────────────────────────────────┘
                        │ REST API
                        ↓
┌──────────────────────────────────────────────────────────────┐
│              Backend API (Python FastAPI)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ MST Engine                                               │ │
│  │  ├─ Stage 1 Router (8 items)                            │ │
│  │  ├─ Stage 2 Router (16 items, 3 tracks)                 │ │
│  │  └─ Stage 3 Router (16 items, 9 subtracks)              │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ IRT Engine (GIRTH)                                       │ │
│  │  ├─ EAP θ Estimation                                    │ │
│  │  ├─ SE Calculation                                       │ │
│  │  └─ 3PL Model (a, b, c parameters)                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Diagnostic Engine                                        │ │
│  │  ├─ Lexile/AR ML Model (GradientBoosting)               │ │
│  │  ├─ Vocabulary Size Estimator (VST + Pseudo-words)      │ │
│  │  └─ Domain Analysis (Grammar/Vocab/Reading)              │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────────────────────┘
                        │ SQL
                        ↓
┌──────────────────────────────────────────────────────────────┐
│                 Database (Supabase PostgreSQL)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ items    │  │ passages │  │ sessions │  │responses │    │
│  │ (문항)    │  │ (지문)    │  │ (응시)    │  │ (응답)    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐                                 │
│  │mst_panels│  │students  │                                 │
│  │ (패널)    │  │ (학생)    │                                 │
│  └──────────┘  └──────────┘                                 │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 MST 구조 상세

```
┌───────────────────────────────────────────────────────────────┐
│               STAGE 1: 라우팅 모듈 (8문항, 5분)                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 목적: 학생을 Low/Med/High 트랙으로 분류                    │  │
│  │ 난이도: θ = -2.5 ~ +2.5 (전 범위 골고루)                   │  │
│  │ 구성: 문법 3, 어휘 3, 독해 2                               │  │
│  │ 추정: θ₁ (SE ≈ 0.8)                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ↓               ↓               ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Low Track   │  │ Med Track   │  │ High Track  │
│ (16문항)     │  │ (16문항)     │  │ (16문항)     │
│ θ: -2~0     │  │ θ: -1~+1    │  │ θ: 0~+2.5   │
│ 구성:        │  │ 구성:        │  │ 구성:        │
│ - 문법 5    │  │ - 문법 5    │  │ - 문법 5    │
│ - 어휘 6    │  │ - 어휘 6    │  │ - 어휘 6    │
│ - 독해 5    │  │ - 독해 5    │  │ - 독해 5    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ↓              ↓              ↓
    ┌────────┐     ┌────────┐     ┌────────┐
    │Low-Low │     │Med-Med │     │High-   │
    │        │ ... │        │ ... │High    │
    │(16문항)│     │(16문항)│     │(16문항)│
    └────────┘     └────────┘     └────────┘
         ↓              ↓              ↓
    ┌──────────────────────────────────────┐
    │ 최종 θ 추정 (SE ≤ 0.30)               │
    │ → 10레벨 변환                         │
    │ → Lexile/AR 추정                     │
    │ → 어휘 사이즈 추정                    │
    └──────────────────────────────────────┘
```

### 2.3 데이터 흐름 (Data Flow)

```
[학생]
  ↓ (1) 테스트 시작
[Frontend: Test UI]
  ↓ (2) POST /api/test/start
[Backend: MST Engine]
  ↓ (3) Stage 1 문항 8개 로드
  ↓ (4) DB에서 문항 조회 (동형 로테이션)
[Database: items, mst_panels]
  ↓ (5) 문항 데이터 반환
[Backend: MST Engine]
  ↓ (6) JSON 응답
[Frontend: Test UI]
  ↓ (7) 학생 응답 (8개)
  ↓ (8) POST /api/test/submit-stage1
[Backend: IRT Engine]
  ↓ (9) EAP θ₁ 추정
  ↓ (10) 라우팅 결정 (Low/Med/High)
  ↓ (11) Stage 2 문항 16개 로드 (선택된 트랙)
[Database]
  ↓ (12) 문항 반환
[Frontend]
  ↓ (13) 학생 응답 (16개)
  ↓ (14) POST /api/test/submit-stage2
[Backend: IRT Engine]
  ↓ (15) EAP θ₂ 추정
  ↓ (16) 라우팅 결정 (9개 subtrack 중 1개)
  ↓ (17) Stage 3 문항 16개 로드
[Database]
  ↓ (18) 문항 반환
[Frontend]
  ↓ (19) 학생 응답 (16개)
  ↓ (20) POST /api/test/complete
[Backend: Diagnostic Engine]
  ↓ (21) 최종 θ 추정 (SE 계산)
  ↓ (22) θ → 10레벨 변환
  ↓ (23) Lexile/AR ML 모델 예측
  ↓ (24) 어휘 사이즈 추정 (VST)
  ↓ (25) 도메인별 분석
[Database: test_sessions, responses]
  ↓ (26) 결과 저장
[Backend]
  ↓ (27) JSON 리포트 생성
[Frontend: Report UI]
  ↓ (28) 리포트 렌더링
[학생] (완료)
```

---

## 기술 스택

### 3.1 Frontend

| 기술 | 버전 | 용도 | 라이선스 |
|------|------|------|----------|
| **Next.js** | 14.x | React 프레임워크, SSR/SSG | MIT |
| **TypeScript** | 5.x | 타입 안정성 | Apache 2.0 |
| **Tailwind CSS** | 3.x | 스타일링 | MIT |
| **React Hook Form** | 7.x | 폼 관리 | MIT |
| **Recharts** | 2.x | 리포트 차트 (레이더, 막대) | MIT |
| **Framer Motion** | 10.x | 애니메이션 (문항 전환) | MIT |
| **Zustand** | 4.x | 상태 관리 (테스트 진행 상태) | MIT |

### 3.2 Backend (Python)

| 기술 | 버전 | 용도 | 라이선스 |
|------|------|------|----------|
| **FastAPI** | 0.109.x | REST API 서버 | MIT ✅ |
| **Uvicorn** | 0.27.x | ASGI 서버 | BSD-3 ✅ |
| **Pydantic** | 2.x | 데이터 검증 | MIT ✅ |
| **GIRTH** | 0.8.x | IRT 파라미터 추정 (3PL MML) | MIT ✅ |
| **NumPy** | 1.26.x | 수치 계산 | BSD ✅ |
| **SciPy** | 1.12.x | 통계 함수 (EAP, 적분) | BSD ✅ |
| **Pandas** | 2.2.x | 데이터 처리 | BSD ✅ |
| **scikit-learn** | 1.4.x | ML 모델 (GradientBoosting) | BSD ✅ |
| **Textstat** | 0.7.x | 가독성 지표 (Flesch-Kincaid) | MIT ✅ |
| **Wordfreq** | 3.0.x | 어휘 빈도 (Zipf scale) | Apache 2.0 + CC BY-SA 4.0 ✅ |
| **spaCy** | 3.7.x | NLP (문장 분리, POS tagging) | MIT ✅ |

### 3.3 Database

| 기술 | 용도 | 라이선스 |
|------|------|----------|
| **Supabase** | PostgreSQL 15.x 호스팅 | PostgreSQL (자유) |
| **pgvector** | 임베딩 저장 (향후 확장용) | PostgreSQL ✅ |

### 3.4 DevOps & Deployment

| 기술 | 용도 |
|------|------|
| **Netlify** | Frontend 배포 |
| **Render** | Backend 배포 (Python FastAPI) |
| **GitHub Actions** | CI/CD (자동 테스트, 배포) |
| **Docker** | 백엔드 컨테이너화 |

### 3.5 개발 도구

| 도구 | 용도 |
|------|------|
| **VSCode** | IDE |
| **Postman** | API 테스트 |
| **DBeaver** | DB 관리 |
| **Jupyter Notebook** | IRT 모델 실험, 데이터 분석 |

---

## 데이터베이스 설계

### 4.1 ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│   students      │
│─────────────────│
│ id (PK)         │───┐
│ email           │   │
│ name            │   │
│ grade_level     │   │
│ school          │   │
│ created_at      │   │
└─────────────────┘   │
                      │
                      │ 1:N
                      │
┌─────────────────┐   │
│ test_sessions   │   │
│─────────────────│   │
│ id (PK)         │   │
│ student_id (FK) │───┘
│ stage1_panel    │
│ stage2_panel    │
│ stage3_panel    │
│ route_path      │
│ theta_trace     │ (JSONB)
│ final_theta     │
│ final_se        │
│ diagnostic_level│
│ estimated_lexile│
│ estimated_ar    │
│ vocabulary_size │
│ grammar_score   │
│ vocabulary_score│
│ reading_score   │
│ started_at      │
│ completed_at    │
└────────┬────────┘
         │ 1:N
         │
┌────────┴────────┐
│   responses     │
│─────────────────│
│ id (PK)         │
│ session_id (FK) │───┐
│ item_id (FK)    │   │
│ stage           │   │
│ sequence_num    │   │
│ response        │   │
│ is_correct      │   │
│ response_time_ms│   │
│ theta_at_time   │   │
│ created_at      │   │
└─────────────────┘   │
                      │ N:1
                      │
┌─────────────────┐   │
│     items       │───┘
│─────────────────│
│ id (PK)         │
│ passage_id (FK) │───┐
│ stem            │   │
│ options         │ (JSONB)
│ correct_answer  │   │
│ discrimination  │ (a)
│ difficulty      │ (b)
│ guessing        │ (c)
│ domain          │
│ skill_tag       │
│ passage_type    │
│ stage           │
│ panel           │
│ form_id         │
│ slot_position   │
│ exposure_count  │
│ status          │
│ created_at      │
└─────────────────┘   │
                      │ N:1
                      │
┌─────────────────┐   │
│   passages      │───┘
│─────────────────│
│ id (PK)         │
│ text            │
│ word_count      │
│ mean_sentence_  │
│  length         │
│ mean_zipf       │
│ flesch_kincaid  │
│ estimated_lexile│
│ estimated_ar    │
│ passage_type    │
│ topic           │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  mst_panels     │
│─────────────────│
│ id (PK)         │
│ panel_key       │ (UNIQUE)
│ stage           │
│ track           │
│ form_id         │
│ item_ids        │ (INT[])
│ grammar_count   │
│ vocabulary_count│
│ reading_count   │
│ theta_min       │
│ theta_max       │
└─────────────────┘
```

### 4.2 스키마 상세 (PostgreSQL DDL)

```sql
-- 학생 테이블
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    grade_level INT CHECK (grade_level BETWEEN 1 AND 12),
    school VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_email ON students(email);

-- 지문 테이블
CREATE TABLE passages (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    word_count INT NOT NULL,

    -- 텍스트 특징 (Lexile/AR 추정용)
    mean_sentence_length FLOAT,
    mean_word_length FLOAT,
    mean_zipf FLOAT,  -- Wordfreq Zipf scale (1-7)
    low_freq_ratio FLOAT,  -- 저빈도 단어 비율
    flesch_kincaid FLOAT,
    dale_chall FLOAT,
    subordinate_ratio FLOAT,  -- 종속절 비율

    -- ML 모델 추정 결과
    estimated_lexile INT,
    estimated_ar FLOAT,

    -- 메타데이터
    passage_type VARCHAR(20) CHECK (passage_type IN ('Expository', 'Argumentative', 'Narrative', 'Practical')),
    topic VARCHAR(50),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_passages_type ON passages(passage_type);
CREATE INDEX idx_passages_lexile ON passages(estimated_lexile);

-- 문항 테이블
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    passage_id INT REFERENCES passages(id) ON DELETE SET NULL,
    stem TEXT NOT NULL,
    options JSONB NOT NULL,  -- ["A) ...", "B) ...", "C) ...", "D) ..."]
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

    -- IRT 3PL 파라미터 (GIRTH로 추정)
    discrimination FLOAT CHECK (discrimination > 0),  -- a (0.5 ~ 2.5)
    difficulty FLOAT CHECK (difficulty BETWEEN -3 AND 3),  -- b
    guessing FLOAT DEFAULT 0.25 CHECK (guessing BETWEEN 0 AND 0.5),  -- c

    -- 메타데이터
    domain VARCHAR(20) NOT NULL CHECK (domain IN ('Grammar', 'Vocabulary', 'Reading')),
    skill_tag VARCHAR(50),  -- 'Tenses', 'Synonyms', 'Main Idea' 등
    passage_type VARCHAR(20),  -- 독해 문항만 해당

    -- MST 배치
    stage INT NOT NULL CHECK (stage IN (1, 2, 3)),
    panel VARCHAR(30) NOT NULL,  -- 'stage1', 'stage2_Low', 'stage3_Med-High' 등
    form_id INT NOT NULL CHECK (form_id BETWEEN 0 AND 5),  -- 동형 세트 (0~5)
    slot_position INT NOT NULL CHECK (slot_position >= 1),  -- 패널 내 위치

    -- 노출 제어
    exposure_count INT DEFAULT 0,
    exposure_cap INT DEFAULT 1000,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'retired', 'flagged', 'pilot')),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_domain ON items(domain);
CREATE INDEX idx_items_stage_panel ON items(stage, panel);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_exposure ON items(exposure_count);

-- MST 패널 정의 테이블
CREATE TABLE mst_panels (
    id SERIAL PRIMARY KEY,
    panel_key VARCHAR(30) UNIQUE NOT NULL,  -- 'stage2_Low_form0'
    stage INT NOT NULL CHECK (stage IN (1, 2, 3)),
    track VARCHAR(10) CHECK (track IN ('Low', 'Med', 'High')),
    subtrack VARCHAR(20),  -- 'Low-Low', 'Low-Med', ... (Stage 3만 해당)
    form_id INT NOT NULL CHECK (form_id BETWEEN 0 AND 5),

    -- 패널 내 문항 ID 배열
    item_ids INT[] NOT NULL,

    -- 콘텐츠 균형 검증
    grammar_count INT NOT NULL,
    vocabulary_count INT NOT NULL,
    reading_count INT NOT NULL,

    -- 라우팅 조건
    theta_min FLOAT,
    theta_max FLOAT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mst_panels_key ON mst_panels(panel_key);
CREATE INDEX idx_mst_panels_stage ON mst_panels(stage);

-- 테스트 세션 테이블
CREATE TABLE test_sessions (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,

    -- MST 경로
    stage1_panel VARCHAR(30),
    stage2_panel VARCHAR(30),
    stage3_panel VARCHAR(30),
    route_path VARCHAR(100),  -- 'Low → Low-Med'

    -- θ 추정 이력
    theta_trace JSONB,  -- [{"stage": 1, "theta": 0.0, "se": 0.8}, ...]
    se_trace JSONB,

    -- 최종 결과
    final_theta FLOAT,
    final_se FLOAT,

    -- 리포트 데이터
    diagnostic_level INT CHECK (diagnostic_level BETWEEN 1 AND 10),
    estimated_lexile INT CHECK (estimated_lexile BETWEEN 0 AND 1700),
    estimated_ar FLOAT CHECK (estimated_ar BETWEEN 0 AND 12.9),
    vocabulary_size INT,
    vocab_confidence VARCHAR(10) CHECK (vocab_confidence IN ('High', 'Low')),

    -- 도메인별 분석 (0.0 ~ 1.0)
    grammar_score FLOAT CHECK (grammar_score BETWEEN 0 AND 1),
    vocabulary_score FLOAT CHECK (vocabulary_score BETWEEN 0 AND 1),
    reading_score FLOAT CHECK (reading_score BETWEEN 0 AND 1),

    -- 타임스탬프
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- 총 소요 시간 (초)
    total_duration_sec INT,

    CONSTRAINT chk_completion CHECK (
        (completed_at IS NULL AND final_theta IS NULL) OR
        (completed_at IS NOT NULL AND final_theta IS NOT NULL)
    )
);

CREATE INDEX idx_test_sessions_student ON test_sessions(student_id);
CREATE INDEX idx_test_sessions_completed ON test_sessions(completed_at);
CREATE INDEX idx_test_sessions_level ON test_sessions(diagnostic_level);

-- 응답 로그 테이블
CREATE TABLE responses (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES test_sessions(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id) ON DELETE SET NULL,
    stage INT NOT NULL CHECK (stage IN (1, 2, 3)),
    sequence_num INT NOT NULL CHECK (sequence_num BETWEEN 1 AND 40),

    response CHAR(1) CHECK (response IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    response_time_ms INT CHECK (response_time_ms >= 0),

    -- 추정값 (해당 시점)
    theta_at_time FLOAT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_responses_session ON responses(session_id);
CREATE INDEX idx_responses_item ON responses(item_id);
CREATE INDEX idx_responses_created ON responses(created_at);

-- 문항 캘리브레이션 이력 테이블
CREATE TABLE calibration_runs (
    id SERIAL PRIMARY KEY,
    run_date TIMESTAMP DEFAULT NOW(),
    method VARCHAR(20) NOT NULL,  -- '3PL-MML', '2PL-MCMC', '3PL-MCMC'
    sample_size INT NOT NULL,

    -- 적합도 지표
    log_likelihood FLOAT,
    aic FLOAT,  -- Akaike Information Criterion
    bic FLOAT,  -- Bayesian Information Criterion

    -- 변경사항
    items_updated INT DEFAULT 0,
    items_flagged INT DEFAULT 0,

    notes TEXT
);

CREATE INDEX idx_calibration_runs_date ON calibration_runs(run_date DESC);

-- 뷰: 문항 통계 요약
CREATE VIEW item_statistics AS
SELECT
    i.id,
    i.domain,
    i.stage,
    i.panel,
    i.exposure_count,
    i.status,
    COUNT(r.id) AS total_responses,
    AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) AS p_value,  -- 정답률
    CORR(
        CASE WHEN r.is_correct THEN 1 ELSE 0 END,
        ts.final_theta
    ) AS point_biserial  -- 문항-총점 상관
FROM items i
LEFT JOIN responses r ON i.id = r.item_id
LEFT JOIN test_sessions ts ON r.session_id = ts.id
WHERE ts.completed_at IS NOT NULL
GROUP BY i.id;

-- 뷰: 학생 테스트 이력
CREATE VIEW student_test_history AS
SELECT
    s.id AS student_id,
    s.name,
    s.email,
    ts.id AS session_id,
    ts.completed_at,
    ts.diagnostic_level,
    ts.estimated_lexile,
    ts.estimated_ar,
    ts.vocabulary_size,
    ts.final_theta,
    ts.final_se,
    ts.total_duration_sec / 60.0 AS duration_minutes
FROM students s
JOIN test_sessions ts ON s.id = ts.student_id
WHERE ts.completed_at IS NOT NULL
ORDER BY s.id, ts.completed_at DESC;
```

### 4.3 샘플 데이터 구조

#### **items 테이블 예시**

```json
{
  "id": 42,
  "passage_id": 15,
  "stem": "Which word best completes the sentence?\n\n\"The scientist's discovery was _____, changing our understanding of the universe.\"",
  "options": [
    "A) revolutionary",
    "B) ordinary",
    "C) temporary",
    "D) invisible"
  ],
  "correct_answer": "A",
  "discrimination": 1.25,
  "difficulty": 0.8,
  "guessing": 0.25,
  "domain": "Vocabulary",
  "skill_tag": "Academic Adjectives",
  "passage_type": null,
  "stage": 2,
  "panel": "stage2_Med",
  "form_id": 0,
  "slot_position": 7,
  "exposure_count": 234,
  "status": "active"
}
```

#### **mst_panels 테이블 예시**

```json
{
  "id": 5,
  "panel_key": "stage2_Low_form0",
  "stage": 2,
  "track": "Low",
  "subtrack": null,
  "form_id": 0,
  "item_ids": [12, 15, 23, 28, 31, 35, 42, 47, 51, 58, 62, 65, 71, 78, 83, 89],
  "grammar_count": 5,
  "vocabulary_count": 6,
  "reading_count": 5,
  "theta_min": -2.0,
  "theta_max": 0.0
}
```

#### **test_sessions 테이블 예시**

```json
{
  "id": 1523,
  "student_id": 87,
  "stage1_panel": "stage1_form1",
  "stage2_panel": "stage2_Med_form2",
  "stage3_panel": "stage3_Med-High_form0",
  "route_path": "Med → Med-High",
  "theta_trace": [
    {"stage": 1, "theta": 0.2, "se": 0.75},
    {"stage": 2, "theta": 0.5, "se": 0.45},
    {"stage": 3, "theta": 0.62, "se": 0.28}
  ],
  "final_theta": 0.62,
  "final_se": 0.28,
  "diagnostic_level": 7,
  "estimated_lexile": 950,
  "estimated_ar": 5.2,
  "vocabulary_size": 6200,
  "vocab_confidence": "High",
  "grammar_score": 0.75,
  "vocabulary_score": 0.68,
  "reading_score": 0.72,
  "started_at": "2025-01-20T10:30:00Z",
  "completed_at": "2025-01-20T10:55:32Z",
  "total_duration_sec": 1532
}
```

---

## 핵심 기능 명세

### 5.1 MST Engine (Multistage Testing)

#### 5.1.1 Stage 1: 라우팅 모듈

**요구사항**:
- [x] 8문항 고정 구성
- [x] 도메인 균형: 문법 3, 어휘 3, 독해 2
- [x] 난이도 범위: θ = -2.5 ~ +2.5 (전체 스펙트럼)
- [x] 동형 3세트 준비 (form 0, 1, 2)
- [x] EAP θ₁ 추정 후 Low/Med/High 트랙 분류

**분류 기준**:
```python
if theta1 < -0.5:
    track = 'Low'     # θ: -2.5 ~ -0.5
elif theta1 < 0.5:
    track = 'Med'     # θ: -0.5 ~ 0.5
else:
    track = 'High'    # θ: 0.5 ~ 2.5
```

**API 엔드포인트**:
```
POST /api/test/start
Request Body:
{
  "student_id": 87
}

Response:
{
  "session_id": 1523,
  "stage": 1,
  "items": [
    {
      "id": 5,
      "stem": "Choose the correct verb form...",
      "options": ["A) has", "B) have", "C) had", "D) having"],
      "domain": "Grammar",
      "passage": null
    },
    // ... 8개
  ]
}
```

#### 5.1.2 Stage 2: 트랙별 세부 평가

**요구사항**:
- [x] 16문항 고정 구성
- [x] 도메인 균형: 문법 5, 어휘 6, 독해 5
- [x] 3개 트랙 각각 3개 동형 (총 9개 패널)
- [x] 트랙별 난이도 범위:
  - Low: θ = -2.0 ~ 0.0
  - Med: θ = -1.0 ~ +1.0
  - High: θ = 0.0 ~ +2.5

**API 엔드포인트**:
```
POST /api/test/submit-stage1
Request Body:
{
  "session_id": 1523,
  "responses": [
    {"item_id": 5, "answer": "B", "response_time_ms": 12500},
    // ... 8개
  ]
}

Response:
{
  "theta1": 0.2,
  "se1": 0.75,
  "track": "Med",
  "stage": 2,
  "items": [
    // ... 16개 (Med 트랙)
  ]
}
```

#### 5.1.3 Stage 3: 정밀 진단

**요구사항**:
- [x] 16문항 고정 구성
- [x] 도메인 균형: 문법 5, 어휘 6, 독해 5
- [x] 9개 서브트랙 (각 트랙에서 3갈래 분기)
  - Low → Low-Low, Low-Med, Low-High
  - Med → Med-Low, Med-Med, Med-High
  - High → High-Low, High-Med, High-High
- [x] 각 서브트랙 3개 동형 (총 27개 패널)

**분류 기준 (예: Med 트랙)**:
```python
if theta2 < -0.25:
    subtrack = 'Med-Low'
elif theta2 < 0.25:
    subtrack = 'Med-Med'
else:
    subtrack = 'Med-High'
```

**API 엔드포인트**:
```
POST /api/test/submit-stage2
Request Body:
{
  "session_id": 1523,
  "responses": [
    {"item_id": 42, "answer": "A", "response_time_ms": 18200},
    // ... 16개
  ]
}

Response:
{
  "theta2": 0.5,
  "se2": 0.45,
  "subtrack": "Med-High",
  "stage": 3,
  "items": [
    // ... 16개 (Med-High 서브트랙)
  ]
}
```

#### 5.1.4 Randomesque 문항 선택

**요구사항**:
- [x] 각 슬롯에 2-3개 유사 난이도 문항 후보 준비
- [x] 실시간 무작위 선택으로 노출률 분산
- [x] 동일 학생 재응시 시 다른 문항 조합

**구현 예시**:
```python
# mst_panels 테이블에서 패널 로드
panel = get_panel('stage2_Med_form0')

# item_ids = [42, 45, 47, ...]는 각 슬롯의 대표 문항
# 실제로는 각 슬롯에 2-3개 후보 저장 (별도 테이블)
selected_items = []
for slot in panel['slots']:
    candidates = slot['candidate_item_ids']  # [42, 43, 44]
    # 난이도 차이 ± 0.2 이내
    chosen = random.choice(candidates)
    selected_items.append(chosen)

    # 노출 카운트 증가
    increment_exposure(chosen)
```

### 5.2 IRT Engine (3PL EAP Estimation)

#### 5.2.1 EAP θ 추정

**요구사항**:
- [x] 3PL 모델 사용 (a, b, c 파라미터)
- [x] EAP(Expected A Posteriori) 방식으로 θ 추정
- [x] Prior: N(0, 1) (표준정규분포)
- [x] Posterior: Bayes 정리 적용
- [x] SE(Standard Error) 계산

**3PL 모델 공식**:
```
P(X_i = 1 | θ) = c_i + (1 - c_i) / (1 + exp(-a_i * (θ - b_i)))

where:
  a_i: discrimination (변별도, 0.5 ~ 2.5)
  b_i: difficulty (난이도, -3 ~ +3)
  c_i: guessing (추측도, 보통 0.25)
```

**EAP 추정 공식**:
```
θ_EAP = E[θ | X] = ∫ θ * L(X | θ) * π(θ) dθ / ∫ L(X | θ) * π(θ) dθ

where:
  L(X | θ): Likelihood (문항 응답 패턴 기반)
  π(θ): Prior (N(0, 1))
```

**구현 (Python)**:
```python
from scipy.stats import norm
from scipy.integrate import quad
import numpy as np

def three_pl_probability(theta, a, b, c):
    """3PL 모델 정답 확률"""
    return c + (1 - c) / (1 + np.exp(-a * (theta - b)))

def eap_estimate(responses, items, prior_mean=0, prior_sd=1):
    """
    EAP θ 추정

    Args:
        responses: [1, 0, 1, 1, ...] (정답 여부)
        items: [{'a': 1.2, 'b': 0.5, 'c': 0.25}, ...]
        prior_mean: Prior 평균 (0)
        prior_sd: Prior 표준편차 (1)

    Returns:
        (theta, se)
    """
    def posterior_numerator(theta):
        # Prior: N(0, 1)
        prior = norm.pdf(theta, prior_mean, prior_sd)

        # Likelihood
        likelihood = 1.0
        for response, item in zip(responses, items):
            p = three_pl_probability(theta, item['a'], item['b'], item['c'])
            likelihood *= (p if response else (1 - p))

        return theta * likelihood * prior

    def posterior_denominator(theta):
        prior = norm.pdf(theta, prior_mean, prior_sd)
        likelihood = 1.0
        for response, item in zip(responses, items):
            p = three_pl_probability(theta, item['a'], item['b'], item['c'])
            likelihood *= (p if response else (1 - p))

        return likelihood * prior

    # Numerical integration (-4σ ~ +4σ)
    numerator, _ = quad(posterior_numerator, -4, 4, limit=100)
    denominator, _ = quad(posterior_denominator, -4, 4, limit=100)

    theta_eap = numerator / denominator if denominator != 0 else 0.0

    # SE 계산: Var[θ|X] = E[θ²|X] - (E[θ|X])²
    def posterior_second_moment(theta):
        prior = norm.pdf(theta, prior_mean, prior_sd)
        likelihood = 1.0
        for response, item in zip(responses, items):
            p = three_pl_probability(theta, item['a'], item['b'], item['c'])
            likelihood *= (p if response else (1 - p))
        return (theta ** 2) * likelihood * prior

    second_moment, _ = quad(posterior_second_moment, -4, 4, limit=100)
    variance = (second_moment / denominator) - (theta_eap ** 2)
    se = np.sqrt(variance) if variance > 0 else 0.3

    return theta_eap, se

# 사용 예시
items_data = [
    {'a': 1.5, 'b': -1.0, 'c': 0.25},
    {'a': 1.2, 'b': 0.5, 'c': 0.25},
    # ... 8개 (Stage 1)
]
student_responses = [1, 0, 1, 1, 0, 1, 0, 1]  # 8개

theta, se = eap_estimate(student_responses, items_data)
print(f"θ = {theta:.3f}, SE = {se:.3f}")
# Output: θ = 0.235, SE = 0.752
```

#### 5.2.2 IRT 파라미터 캘리브레이션 (GIRTH)

**요구사항**:
- [x] 파일럿 데이터 200-500명 수집
- [x] GIRTH 라이브러리로 3PL MML(Marginal Maximum Likelihood) 추정
- [x] 부적합 문항 플래그 (Point-biserial < 0.2)
- [x] 분기별 재캘리브레이션

**구현 (Python + GIRTH)**:
```python
from girth import threepl_mml
import numpy as np
import pandas as pd

# 파일럿 데이터: N명 학생 × M개 문항 (0/1 행렬)
# responses.shape = (200, 300)
responses = np.array([
    [1, 0, 1, 1, 0, ...],  # 학생 1
    [1, 1, 1, 0, 0, ...],  # 학생 2
    # ... 200명
])

# 3PL MML 추정
discrimination, difficulty, guessing = threepl_mml(responses)

# 결과 저장
calibration_results = []
for i, (a, b, c) in enumerate(zip(discrimination, difficulty, guessing)):
    # Point-biserial 계산 (문항-총점 상관)
    item_scores = responses[:, i]
    total_scores = responses.sum(axis=1)
    point_biserial = np.corrcoef(item_scores, total_scores)[0, 1]

    # 부적합 문항 플래그
    status = 'active'
    if point_biserial < 0.2:
        status = 'flagged'  # 변별력 부족
    elif a < 0.5 or a > 2.5:
        status = 'flagged'  # 변별도 범위 초과
    elif abs(b) > 3:
        status = 'flagged'  # 난이도 범위 초과

    calibration_results.append({
        'item_id': i + 1,
        'discrimination': float(a),
        'difficulty': float(b),
        'guessing': float(c),
        'point_biserial': float(point_biserial),
        'status': status
    })

# DataFrame으로 변환
df = pd.DataFrame(calibration_results)
print(df.head())

# DB 업데이트
for row in df.itertuples():
    update_item_parameters(
        item_id=row.item_id,
        a=row.discrimination,
        b=row.difficulty,
        c=row.guessing,
        status=row.status
    )

# 캘리브레이션 이력 저장
save_calibration_run({
    'method': '3PL-MML',
    'sample_size': responses.shape[0],
    'items_updated': len(df),
    'items_flagged': len(df[df.status == 'flagged']),
    'log_likelihood': calculate_log_likelihood(responses, df),
    'notes': 'Quarterly recalibration 2025 Q1'
})
```

**API 엔드포인트 (관리자용)**:
```
POST /api/admin/calibrate
Request Body:
{
  "pilot_data_file": "pilot_responses_202501.csv",
  "method": "3PL-MML"
}

Response:
{
  "calibration_run_id": 15,
  "items_updated": 300,
  "items_flagged": 12,
  "flagged_items": [23, 45, 67, ...],
  "log_likelihood": -45231.2,
  "aic": 90600.4,
  "bic": 91254.7
}
```

### 5.3 Diagnostic Engine

#### 5.3.1 10레벨 절대 기준 변환

**요구사항**:
- [x] θ → 10레벨 변환 (Bookmark 방식)
- [x] 각 레벨 절대 기준 설명
- [x] 레벨 컷 점수 설정 (전문가 패널)

**레벨 정의**:
```python
LEVEL_CUTS = {
    1: (-float('inf'), -2.5),  # 기초 1
    2: (-2.5, -2.0),           # 기초 2
    3: (-2.0, -1.5),           # 기초 3
    4: (-1.5, -1.0),           # 초급 1
    5: (-1.0, -0.5),           # 초급 2
    6: (-0.5, 0.0),            # 중급 1
    7: (0.0, 0.5),             # 중급 2
    8: (0.5, 1.0),             # 중상급
    9: (1.0, 1.5),             # 고급 1
    10: (1.5, float('inf'))    # 고급 2 (대학원)
}

LEVEL_DESCRIPTIONS = {
    1: "기초 단어(sight words)와 짧은 문장(3-5단어)을 이해할 수 있음. 주로 그림책 수준.",
    2: "일상적인 주제의 간단한 글(100-200단어)을 읽을 수 있음. 기본 현재/과거 시제 이해.",
    3: "친숙한 주제의 설명문을 대체로 이해함. 문장 구조가 다소 복잡해져도(종속절 1개) 파악 가능.",
    4: "다양한 주제의 글(300-500단어)을 읽고 주요 내용과 세부사항을 구분함. 주제 추론 가능.",
    5: "논리적 관계(인과, 비교)를 파악하며 중급 수준의 글을 독해함. 필자의 의도 이해 시작.",
    6: "복잡한 구조의 글(다단락, 500단어+)에서 함축적 의미와 추론을 할 수 있음. 문학적 표현 이해.",
    7: "학술적 텍스트(교과서, 논문 초록)를 읽고 비판적으로 분석함. 논증 구조 파악.",
    8: "전문적 내용의 글(전문 서적, 학술논문)을 깊이 이해하고 종합함. 복잡한 어휘와 구문 능숙하게 처리.",
    9: "고급 어휘(학술 전문용어)와 복잡한 문장 구조(다층 종속절)를 능숙하게 처리함. 미묘한 뉘앙스 파악.",
    10: "대학원 수준의 학술 텍스트를 완전히 이해함. 학문 분야별 전문 텍스트도 독해 가능."
}

def theta_to_level(theta):
    """θ를 10레벨로 변환"""
    for level, (low, high) in LEVEL_CUTS.items():
        if low <= theta < high:
            return level
    return 10  # θ ≥ 1.5
```

**API 응답 예시**:
```json
{
  "diagnostic_level": 7,
  "description": "학술적 텍스트(교과서, 논문 초록)를 읽고 비판적으로 분석함. 논증 구조 파악.",
  "theta": 0.32,
  "se": 0.28,
  "confidence_interval_95": [0.26, 0.38]
}
```

#### 5.3.2 Lexile/AR 추정 (ML 모델)

**요구사항**:
- [x] 지문 텍스트 특징 추출 (Textstat, Wordfreq, spaCy)
- [x] Gradient Boosting 회귀 모델 학습 (R² ≥ 0.85)
- [x] 공개 코퍼스에서 학습 데이터 수집 (500+ 텍스트)
- [x] Lexile ↔ AR 변환표 적용

**텍스트 특징 추출**:
```python
import textstat
from wordfreq import zipf_frequency
import spacy
import numpy as np

nlp = spacy.load('en_core_web_sm')

def extract_text_features(passage_text):
    """
    지문에서 Lexile/AR 예측에 필요한 특징 추출

    Returns:
        dict: 특징 벡터 (12개 feature)
    """
    doc = nlp(passage_text)
    words = [token.text for token in doc if token.is_alpha]
    sentences = list(doc.sents)

    # 문장 길이
    sentence_lengths = [len(list(sent)) for sent in sentences]
    mean_sentence_length = np.mean(sentence_lengths)
    max_sentence_length = np.max(sentence_lengths)

    # 단어 길이
    word_lengths = [len(w) for w in words]
    mean_word_length = np.mean(word_lengths)

    # 어휘 빈도 (Zipf scale: 1-7, 7=매우 흔함)
    zipf_scores = [zipf_frequency(w.lower(), 'en') for w in words]
    mean_zipf = np.mean(zipf_scores)
    low_freq_ratio = sum(1 for z in zipf_scores if z < 3.0) / len(words)

    # Type-Token Ratio (어휘 다양성)
    ttr = len(set(words)) / len(words)

    # 전통적 가독성 지표
    flesch_kincaid = textstat.flesch_kincaid_grade(passage_text)
    dale_chall = textstat.dale_chall_readability_score(passage_text)

    # 구문 복잡도
    subordinate_clauses = sum(1 for token in doc if token.dep_ == 'mark')
    subordinate_ratio = subordinate_clauses / len(words)

    # Passive voice 비율
    passive_count = sum(1 for sent in doc.sents
                       if any(token.dep_ == 'nsubjpass' for token in sent))
    passive_ratio = passive_count / len(sentences)

    return {
        'mean_sentence_length': mean_sentence_length,
        'max_sentence_length': max_sentence_length,
        'mean_word_length': mean_word_length,
        'mean_zipf': mean_zipf,
        'low_freq_ratio': low_freq_ratio,
        'ttr': ttr,
        'flesch_kincaid': flesch_kincaid,
        'dale_chall': dale_chall,
        'subordinate_ratio': subordinate_ratio,
        'passive_ratio': passive_ratio,
        'word_count': len(words),
        'sentence_count': len(sentences)
    }
```

**ML 모델 학습**:
```python
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, train_test_split
import pandas as pd

# 학습 데이터 로드 (공개 코퍼스 + Lexile 라벨)
# 예: CommonLit, Project Gutenberg, Newsela 등
training_data = pd.read_csv('lexile_training_corpus.csv')
# columns: ['text', 'lexile', 'source']

# 특징 추출
X_features = []
y_lexile = []

for idx, row in training_data.iterrows():
    features = extract_text_features(row['text'])
    X_features.append(list(features.values()))
    y_lexile.append(row['lexile'])

X = np.array(X_features)
y = np.array(y_lexile)

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Gradient Boosting 모델
lexile_model = GradientBoostingRegressor(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=5,
    min_samples_split=10,
    min_samples_leaf=4,
    subsample=0.8,
    random_state=42
)

lexile_model.fit(X_train, y_train)

# 교차검증 (R² ≥ 0.85 목표)
cv_scores = cross_val_score(
    lexile_model, X_train, y_train,
    cv=5, scoring='r2'
)
print(f"Lexile 모델 R²: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
# Output: Lexile 모델 R²: 0.872 ± 0.023

# Test set 성능
from sklearn.metrics import mean_absolute_error, r2_score

y_pred = lexile_model.predict(X_test)
print(f"Test R²: {r2_score(y_test, y_pred):.3f}")
print(f"Test MAE: {mean_absolute_error(y_test, y_pred):.1f}L")
# Output: Test R²: 0.865
# Output: Test MAE: 67.3L

# 모델 저장
import joblib
joblib.dump(lexile_model, 'models/lexile_estimator.pkl')
```

**Lexile ↔ AR 변환**:
```python
# 공개된 변환표 (출처: Arbordale Publishing, Renaissance Learning)
LEXILE_TO_AR_TABLE = {
    100: 0.5, 200: 1.5, 300: 2.0, 400: 2.5, 500: 3.0,
    600: 3.5, 700: 4.0, 800: 4.5, 900: 5.0, 1000: 5.5,
    1100: 6.0, 1200: 7.0, 1300: 8.0, 1400: 9.0, 1500: 10.0,
    1600: 11.0, 1700: 12.0
}

def lexile_to_ar(lexile):
    """Lexile 점수를 AR 등급으로 변환 (선형 보간)"""
    if lexile <= 100:
        return 0.5
    if lexile >= 1700:
        return 12.0

    # 선형 보간
    for lex_low, lex_high in zip(
        sorted(LEXILE_TO_AR_TABLE.keys())[:-1],
        sorted(LEXILE_TO_AR_TABLE.keys())[1:]
    ):
        if lex_low <= lexile < lex_high:
            ar_low = LEXILE_TO_AR_TABLE[lex_low]
            ar_high = LEXILE_TO_AR_TABLE[lex_high]
            ratio = (lexile - lex_low) / (lex_high - lex_low)
            return ar_low + ratio * (ar_high - ar_low)

    return 6.0  # fallback

# 사용 예시
estimated_lexile = lexile_model.predict([passage_features])[0]
estimated_ar = lexile_to_ar(estimated_lexile)

print(f"Estimated Lexile: {estimated_lexile:.0f}L")
print(f"Estimated AR: {estimated_ar:.1f}")
# Output: Estimated Lexile: 950L
# Output: Estimated AR: 5.2
```

**API 엔드포인트**:
```
POST /api/diagnostic/lexile-ar
Request Body:
{
  "passage_texts": [
    "First passage content...",
    "Second passage content...",
    // ... 학생이 읽은 독해 지문들
  ],
  "student_theta": 0.62
}

Response:
{
  "average_lexile": 950,
  "average_ar": 5.2,
  "passages": [
    {"text_id": 1, "lexile": 920, "ar": 5.0},
    {"text_id": 2, "lexile": 980, "ar": 5.4}
  ],
  "recommendation": "이 학생은 Lexile 950L 수준으로, 5학년 중반~6학년 초반 수준입니다."
}
```

#### 5.3.3 어휘 사이즈 추정 (VST + 가짜어)

**요구사항**:
- [x] Paul Nation VST(Vocabulary Size Test) 방식 적용
- [x] 빈도 밴드별 문항 구성 (1k, 2k, 4k, 6k, 8k, 10k, 14k)
- [x] 각 밴드 2문항씩 (총 14문항)
- [x] 가짜어(Pseudo-words) 3개 포함 (과대응답 감지)
- [x] IRT 보정 적용

**빈도 밴드 정의**:
```python
# BNC/COCA 기준 빈도 밴드
FREQUENCY_BANDS = {
    '1k': (0, 1000),       # 가장 흔한 1,000단어
    '2k': (1000, 2000),
    '4k': (2000, 4000),
    '6k': (4000, 6000),
    '8k': (6000, 8000),
    '10k': (8000, 10000),
    '14k': (10000, 14000)  # 학술/전문 어휘
}
```

**문항 예시**:
```json
{
  "item_id": 250,
  "stem": "What does 'revolutionary' mean?",
  "options": [
    "A) causing a big change",
    "B) moving in circles",
    "C) very old",
    "D) I don't know this word"
  ],
  "correct_answer": "A",
  "domain": "Vocabulary",
  "word": "revolutionary",
  "frequency_band": "4k",
  "is_pseudo": false
}

{
  "item_id": 267,
  "stem": "What does 'blinsary' mean?",
  "options": [
    "A) shining brightly",
    "B) making a loud noise",
    "C) moving slowly",
    "D) I don't know this word"
  ],
  "correct_answer": "D",
  "domain": "Vocabulary",
  "word": "blinsary",
  "frequency_band": null,
  "is_pseudo": true  // 가짜어!
}
```

**어휘량 추정 알고리즘**:
```python
def estimate_vocabulary_size(responses, items):
    """
    Paul Nation VST 방식 + IRT 보정

    Args:
        responses: [(item_id, is_correct), ...]
        items: [{word, band, is_pseudo, difficulty}, ...]

    Returns:
        {
            'total': int,  # 총 어휘량
            'confidence': str,  # 'High' or 'Low'
            'by_band': dict,  # 밴드별 추정치
            'pseudo_alarm_rate': float  # 가짜어 오탐률
        }
    """
    # 1. 가짜어 체크 (과대응답 페널티)
    pseudo_items = [item for item in items if item.get('is_pseudo')]
    pseudo_responses = [
        r for r, item in zip(responses, items)
        if item.get('is_pseudo')
    ]
    pseudo_correct = sum(pseudo_responses)

    if pseudo_correct >= 2:
        # 과대응답자 → 신뢰도 낮춤
        confidence = 'Low'
        penalty = 0.7  # 30% 페널티
    elif pseudo_correct == 1:
        confidence = 'Medium'
        penalty = 0.9
    else:
        confidence = 'High'
        penalty = 1.0

    # 2. 밴드별 정답률
    band_scores = {}
    for band_name, (start, end) in FREQUENCY_BANDS.items():
        band_items = [
            item for item in items
            if item.get('band') == band_name and not item.get('is_pseudo')
        ]
        band_responses = [
            r for r, item in zip(responses, items)
            if item in band_items
        ]

        if band_responses:
            # 단순 정답률
            correct_rate = sum(band_responses) / len(band_responses)

            # IRT 보정 (난이도 고려)
            mean_difficulty = np.mean([item['difficulty'] for item in band_items])
            # 어려운 문항일수록 실제 어휘량은 더 높게 추정
            irt_correction = 1.0 + (mean_difficulty * 0.1)

            band_size = end - start
            band_scores[band_name] = correct_rate * band_size * irt_correction
        else:
            band_scores[band_name] = 0

    # 3. 총 어휘량 추정
    total_vocab = sum(band_scores.values()) * penalty

    return {
        'total': int(total_vocab),
        'confidence': confidence,
        'by_band': band_scores,
        'pseudo_alarm_rate': pseudo_correct / len(pseudo_items) if pseudo_items else 0
    }

# 사용 예시
vocab_items_data = [
    {'word': 'book', 'band': '1k', 'is_pseudo': False, 'difficulty': -2.0},
    {'word': 'democracy', 'band': '4k', 'is_pseudo': False, 'difficulty': 0.5},
    # ... 14개 (진짜 단어)
    {'word': 'blinsary', 'band': None, 'is_pseudo': True, 'difficulty': 0.0},
    # ... 3개 (가짜어)
]
student_vocab_responses = [1, 1, 1, 0, 1, ..., 0, 0, 0]  # 17개

vocab_result = estimate_vocabulary_size(student_vocab_responses, vocab_items_data)
print(vocab_result)
# Output:
# {
#   'total': 6200,
#   'confidence': 'High',
#   'by_band': {
#     '1k': 980, '2k': 920, '4k': 1580, '6k': 1200,
#     '8k': 800, '10k': 520, '14k': 200
#   },
#   'pseudo_alarm_rate': 0.0
# }
```

**API 응답 예시**:
```json
{
  "vocabulary_size": 6200,
  "confidence": "High",
  "by_band": {
    "1k": 980,
    "2k": 920,
    "4k": 1580,
    "6k": 1200,
    "8k": 800,
    "10k": 520,
    "14k": 200
  },
  "interpretation": "이 학생은 약 6,200단어를 알고 있을 것으로 추정됩니다. 이는 중학교 2-3학년 수준입니다.",
  "pseudo_alarm_rate": 0.0,
  "warning": null
}
```

#### 5.3.4 도메인별 강약점 분석

**요구사항**:
- [x] 문법(Grammar) / 어휘(Vocabulary) / 독해(Reading) 정답률 계산
- [x] 각 도메인별 θ 추정 (분리)
- [x] 레이더 차트용 데이터 제공

**구현**:
```python
def analyze_domain_performance(responses, items):
    """
    도메인별 강약점 분석

    Returns:
        {
            'grammar': {'score': 0.75, 'theta': 0.3, 'se': 0.35},
            'vocabulary': {'score': 0.68, 'theta': 0.1, 'se': 0.38},
            'reading': {'score': 0.72, 'theta': 0.25, 'se': 0.36}
        }
    """
    domains = ['Grammar', 'Vocabulary', 'Reading']
    results = {}

    for domain in domains:
        # 해당 도메인 문항만 필터링
        domain_items = [item for item in items if item['domain'] == domain]
        domain_responses = [
            r for r, item in zip(responses, items)
            if item['domain'] == domain
        ]

        # 정답률
        score = sum(domain_responses) / len(domain_responses) if domain_responses else 0

        # 도메인별 θ 추정 (EAP)
        theta, se = eap_estimate(domain_responses, domain_items)

        results[domain.lower()] = {
            'score': round(score, 2),
            'theta': round(theta, 2),
            'se': round(se, 2),
            'item_count': len(domain_responses)
        }

    return results

# 사용 예시
domain_analysis = analyze_domain_performance(all_responses, all_items)
print(domain_analysis)
# Output:
# {
#   'grammar': {'score': 0.75, 'theta': 0.30, 'se': 0.35, 'item_count': 13},
#   'vocabulary': {'score': 0.68, 'theta': 0.10, 'se': 0.38, 'item_count': 14},
#   'reading': {'score': 0.72, 'theta': 0.25, 'se': 0.36, 'item_count': 13}
# }
```

**API 응답 예시**:
```json
{
  "domains": {
    "grammar": {
      "score": 0.75,
      "theta": 0.30,
      "se": 0.35,
      "level": "중급 2",
      "strength": "상",
      "feedback": "문법 실력이 우수합니다. 시제와 태 변환을 정확하게 이해하고 있습니다."
    },
    "vocabulary": {
      "score": 0.68,
      "theta": 0.10,
      "se": 0.38,
      "level": "중급 1",
      "strength": "중",
      "feedback": "어휘력은 중급 수준입니다. 학술 어휘(4k-6k 밴드) 학습을 권장합니다."
    },
    "reading": {
      "score": 0.72,
      "theta": 0.25,
      "se": 0.36,
      "level": "중급 2",
      "strength": "중상",
      "feedback": "독해력이 양호합니다. 논증문과 설명문의 구조 파악에 강점이 있습니다."
    }
  },
  "overall_strength": "문법 > 독해 > 어휘",
  "recommendation": "어휘력 향상에 집중하면 전체 실력이 빠르게 향상될 것입니다."
}
```

---

## UI/UX 설계

### 6.1 사용자 플로우 (User Flow)

```
[학생 로그인]
    ↓
[테스트 선택: "영어 능력 진단"]
    ↓
[안내 화면]
  - 총 40문항, 약 20-30분 소요
  - 각 단계마다 난이도가 조정됨
  - 중간 저장 불가, 한 번에 완료 필요
  - [테스트 시작] 버튼
    ↓
[Stage 1: 8문항]
  - Progress: 1/40 ~ 8/40
  - 문항 표시 (1문항씩)
  - 4지선다 + [다음] 버튼
  - 응답 시간 자동 기록
    ↓ (8문항 완료)
[로딩 화면]
  - "당신의 실력을 분석 중입니다..."
  - θ₁ 추정 + 트랙 결정 (1초)
    ↓
[Stage 2: 16문항]
  - Progress: 9/40 ~ 24/40
  - 선택된 트랙(Low/Med/High)에 맞는 문항
  - 동일한 UI
    ↓ (16문항 완료)
[로딩 화면]
  - "거의 다 왔습니다..."
  - θ₂ 추정 + 서브트랙 결정 (1초)
    ↓
[Stage 3: 16문항]
  - Progress: 25/40 ~ 40/40
  - 선택된 서브트랙에 맞는 문항
  - 동일한 UI
    ↓ (40문항 완료)
[최종 분석 화면]
  - "분석 중입니다... 잠시만 기다려주세요"
  - θ 최종 추정, Lexile/AR 예측, 어휘량 추정 (2-3초)
    ↓
[리포트 화면]
  - 10레벨 + 설명
  - Lexile/AR 점수
  - 어휘 사이즈
  - 도메인별 레이더 차트
  - [PDF 다운로드] [다시 보기] 버튼
```

### 6.2 화면 설계 (Wireframes)

#### 6.2.1 안내 화면 (Intro Screen)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] 영어 능력 진단 테스트                              │
│                                                          │
│  📋 테스트 안내                                           │
│                                                          │
│  ✅ 총 40문항 (약 20-30분 소요)                           │
│  ✅ 3단계로 구성 (각 단계마다 난이도 자동 조정)              │
│  ✅ 문법, 어휘, 독해 통합 평가                             │
│  ✅ 10레벨 + Lexile/AR 점수 제공                          │
│                                                          │
│  ⚠️ 주의사항                                             │
│  - 중간 저장 불가, 한 번에 완료 필요                       │
│  - 각 문항당 제한 시간 없음 (충분히 생각하세요)             │
│  - 모르는 문제도 추측하여 답변 권장                        │
│                                                          │
│                    [테스트 시작하기]                      │
│                    [나중에 하기]                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 6.2.2 문항 화면 (Item Screen)

```
┌─────────────────────────────────────────────────────────┐
│  Progress: ████████░░░░░░░░░░░░░░░░░░  8/40 (20%)      │
│                                                          │
│  Question 8                                              │
│                                                          │
│  [지문 영역 - 독해 문항인 경우만 표시]                      │
│  ┌────────────────────────────────────────────────┐     │
│  │ The Industrial Revolution marked a turning     │     │
│  │ point in human history. New machines and       │     │
│  │ factories transformed the way people lived     │     │
│  │ and worked...                                  │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  What is the main idea of this passage?                 │
│                                                          │
│  ○ A) Machines are dangerous to workers                │
│  ○ B) The Industrial Revolution changed society        │
│  ○ C) Factories were built in cities                   │
│  ○ D) People preferred traditional methods             │
│                                                          │
│                                        [이전] [다음]     │
│                                                          │
│  Time elapsed: 00:35                                     │
└─────────────────────────────────────────────────────────┘
```

#### 6.2.3 로딩 화면 (Stage Transition)

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                        🔄                                │
│                                                          │
│              당신의 실력을 분석 중입니다...                 │
│                                                          │
│                   ●●●○○○○○                              │
│                                                          │
│         잠시만 기다려주세요. 다음 단계를 준비하고 있습니다.   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 6.2.4 리포트 화면 (Report Screen)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] 영어 능력 진단 결과                    [PDF 저장]  │
│                                                          │
│  학생: 김민지                  응시일: 2025-01-20         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 📊 종합 레벨                                      │   │
│  │                                                   │   │
│  │          ⭐ Level 7 (중급 2)                      │   │
│  │                                                   │   │
│  │  학술적 텍스트(교과서, 논문 초록)를 읽고          │   │
│  │  비판적으로 분석할 수 있습니다.                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────┬─────────────┐                          │
│  │ Lexile      │ AR 등급     │                          │
│  │ 950L        │ 5.2         │                          │
│  │             │             │                          │
│  │ (Grade 5-6) │ (5학년 수준) │                          │
│  └─────────────┴─────────────┘                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 📚 추정 어휘량: 약 6,200단어                      │   │
│  │                                                   │   │
│  │ ████████████░░░░ 1k (980/1000)                    │   │
│  │ █████���█████░░░░░ 2k (920/1000)                    │   │
│  │ ████████░░░░░░░░ 4k (1580/2000)                   │   │
│  │ ██████░░░░░░░░░░ 6k (1200/2000)                   │   │
│  │ ████░░░░░░░░░░░░ 8k (800/2000)                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 📈 도메인별 분석                                  │   │
│  │                                                   │   │
│  │             문법                                  │   │
│  │              ⭐                                   │   │
│  │            ⭐   ⭐                                │   │
│  │          ⭐       ⭐                              │   │
│  │   어휘  ⭐           ⭐  독해                      │   │
│  │          ⭐       ⭐                              │   │
│  │            ⭐   ⭐                                │   │
│  │              ⭐                                   │   │
│  │                                                   │   │
│  │  - 문법: 75% (상) - θ = 0.30                     │   │
│  │  - 어휘: 68% (중) - θ = 0.10                     │   │
│  │  - 독해: 72% (중상) - θ = 0.25                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  💡 맞춤 학습 추천                                       │
│  ────────────────────────────────────────────────────   │
│  1. 어휘력 향상에 집중하세요 (현재 약점 영역)             │
│     - 추천 도서: Charlotte's Web, Harry Potter 1      │
│     - 4k-6k 밴드 단어 학습 (학술 어휘)                  │
│                                                          │
│  2. 독해 연습 (Lexile 950L 수준)                        │
│     - 설명문/논증문 구조 분석 연습                       │
│                                                          │
│                 [다시 테스트하기] [완료]                  │
└─────────────────────────────────────────────────────────┘
```

### 6.3 컴포넌트 설계 (Component Hierarchy)

```
<EnglishAdaptiveTest>
  ├─ <TestIntro>
  │   ├─ <InfoCard>
  │   └─ <StartButton>
  │
  ├─ <TestSession>
  │   ├─ <ProgressBar current={8} total={40} />
  │   ├─ <StageIndicator stage={1} />
  │   ├─ <ItemDisplay>
  │   │   ├─ <Passage text={...} /> (독해 문항만)
  │   │   ├─ <QuestionStem stem={...} />
  │   │   └─ <OptionList options={[...]} onSelect={...} />
  │   ├─ <NavigationButtons>
  │   └─ <Timer />
  │
  ├─ <StageTransitionLoading>
  │   ├─ <Spinner />
  │   └─ <Message text="분석 중..." />
  │
  └─ <ReportScreen>
      ├─ <LevelCard level={7} description={...} />
      ├─ <LexileARCard lexile={950} ar={5.2} />
      ├─ <VocabularyCard size={6200} byBand={...} />
      ├─ <DomainRadarChart data={...} />
      ├─ <RecommendationCard />
      └─ <ActionButtons>
          ├─ <DownloadPDFButton />
          └─ <RetakeButton />
```

### 6.4 반응형 디자인 (Responsive Design)

**Breakpoints**:
- **Desktop**: ≥ 1024px (주 타겟)
- **Tablet**: 768px ~ 1023px
- **Mobile**: < 768px (Phase 2)

**Desktop Layout**:
```
[Header (60px)]
[Content Area (calc(100vh - 120px))]
  - Max width: 900px
  - Center aligned
  - Padding: 40px
[Footer (60px)]
```

**Mobile Layout (Phase 2)**:
```
[Header (50px)]
[Content Area (calc(100vh - 100px))]
  - Full width
  - Padding: 20px
[Footer (50px)]
```

---

## 개발 로드맵

### 7.1 Phase 1: MVP (3개월)

#### **Week 1-2: 설계 확정 및 환경 구축**

**Backend**:
- [x] DB 스키마 생성 (Supabase PostgreSQL)
- [x] FastAPI 프로젝트 초기화
- [x] GIRTH, NumPy, SciPy 등 설치
- [x] `/api/health` 엔드포인트 테스트

**Frontend**:
- [x] Next.js 14 프로젝트 생성
- [x] Tailwind CSS 설정
- [x] 컴포넌트 디렉토리 구조 생성

**문서화**:
- [x] MST 블루프린트 작성 (엑셀)
  - Stage 1: 8문항 배치 계획
  - Stage 2: 48문항 (Low/Med/High × 16)
  - Stage 3: 132문항 (9 subtracks × 약 15)

#### **Week 3-6: 문항 제작 (300개)**

**지문 수집/작성**:
- [x] 50개 지문 (유형별 균형)
  - Expository: 15개
  - Argumentative: 10개
  - Narrative: 15개
  - Practical: 10개
- [x] Word count: 100-500단어
- [x] Textstat으로 Flesch-Kincaid 확인

**문항 작성**:
- [x] 문법 100개
  - Tenses: 30개
  - Subject-Verb Agreement: 20개
  - Active/Passive Voice: 15개
  - Modal Verbs: 15개
  - Conditionals: 10개
  - Others: 10개
- [x] 어휘 100개
  - 빈도 밴드별 (1k~14k) 균형
  - VST 방식 14개 (각 밴드 2개)
  - 가짜어 3개
  - 일반 어휘 83개
- [x] 독해 100개
  - Main Idea: 25개
  - Supporting Details: 25개
  - Inference: 25개
  - Author's Purpose: 15개
  - Vocabulary in Context: 10개

**문항 메타데이터**:
- [x] 각 문항에 `stage`, `panel`, `form_id`, `slot_position` 배정
- [x] 초기 난이도 추정 (전문가 판단 또는 Rasch 모델)

#### **Week 7-10: 파일럿 테스트**

**고정형 폼 제작**:
- [x] 3개 동형 폼 (각 40문항)
- [x] 도메인 균형 검증

**데이터 수집**:
- [x] 200-500명 학생 모집
- [x] 온라인 설문 또는 학교 협력

**IRT 캘리브레이션**:
- [x] GIRTH로 3PL MML 추정
- [x] 부적합 문항 플래그 (Point-biserial < 0.2)
- [x] 문항 교체/수정 (10-20%)

#### **Week 11-12: MST 시스템 구축**

**Backend API**:
```python
# fastapi_app/routers/mst.py

@router.post("/test/start")
async def start_test(student_id: int):
    # Stage 1 문항 8개 로드 (동형 로테이션)
    form_id = student_id % 3
    items = load_stage1_items(form_id)

    # 세션 생성
    session = create_test_session(student_id, stage=1)

    return {
        "session_id": session.id,
        "stage": 1,
        "items": items
    }

@router.post("/test/submit-stage1")
async def submit_stage1(session_id: int, responses: List[Response]):
    # θ₁ 추정
    theta1, se1 = estimate_theta_eap(responses)

    # 라우팅 결정
    track = route_stage1(theta1)  # Low/Med/High

    # Stage 2 문항 로드
    form_id = get_session(session_id).student_id % 3
    items = load_stage2_items(track, form_id)

    # 세션 업데이트
    update_session(session_id, {
        'theta_trace': [{'stage': 1, 'theta': theta1, 'se': se1}],
        'stage2_panel': f'stage2_{track}_form{form_id}'
    })

    return {
        "theta1": theta1,
        "se1": se1,
        "track": track,
        "stage": 2,
        "items": items
    }

# ... submit-stage2, complete 엔드포인트 동일 패턴
```

**노출 제어**:
- [x] Randomesque 로직 구현
- [x] `exposure_count` 증가
- [x] `exposure_cap` 초과 시 `status='retired'`

#### **Week 13-14: Lexile/AR 추정 모델**

**학습 데이터 수집**:
- [x] CommonLit, Newsela 등에서 500+ 텍스트
- [x] Lexile 라벨 확보 (공개 데이터셋)

**모델 학습**:
- [x] Textstat, Wordfreq, spaCy로 특징 추출
- [x] Gradient Boosting 학습 (R² ≥ 0.85)
- [x] 모델 저장 (`models/lexile_estimator.pkl`)

**Lexile ↔ AR 변환**:
- [x] 변환표 구현 (선형 보간)

#### **Week 15-16: 리포트 시스템**

**Backend**:
```python
@router.post("/test/complete")
async def complete_test(session_id: int, responses: List[Response]):
    # 최종 θ 추정
    all_responses = get_all_responses(session_id)
    all_items = get_all_items(session_id)
    final_theta, final_se = estimate_theta_eap(all_responses, all_items)

    # 10레벨 변환
    level = theta_to_level(final_theta)

    # Lexile/AR 예측
    passages = get_reading_passages(session_id)
    avg_lexile = predict_lexile(passages)
    avg_ar = lexile_to_ar(avg_lexile)

    # 어휘 사이즈
    vocab_items = get_vocabulary_items(session_id)
    vocab_responses = get_vocabulary_responses(session_id)
    vocab_result = estimate_vocabulary_size(vocab_responses, vocab_items)

    # 도메인별 분석
    domain_analysis = analyze_domain_performance(all_responses, all_items)

    # 세션 업데이트
    update_session(session_id, {
        'final_theta': final_theta,
        'final_se': final_se,
        'diagnostic_level': level,
        'estimated_lexile': avg_lexile,
        'estimated_ar': avg_ar,
        'vocabulary_size': vocab_result['total'],
        'vocab_confidence': vocab_result['confidence'],
        'grammar_score': domain_analysis['grammar']['score'],
        'vocabulary_score': domain_analysis['vocabulary']['score'],
        'reading_score': domain_analysis['reading']['score'],
        'completed_at': datetime.now()
    })

    return {
        "level": level,
        "description": LEVEL_DESCRIPTIONS[level],
        "lexile": avg_lexile,
        "ar": avg_ar,
        "vocabulary_size": vocab_result['total'],
        "domains": domain_analysis
    }
```

**Frontend (Next.js)**:
- [x] `<ReportScreen>` 컴포넌트
- [x] Recharts로 레이더 차트
- [x] PDF 다운로드 (react-pdf)

#### **Week 17-18: 베타 테스트**

**테스트 실시**:
- [x] 100명 학생 MST 실시
- [x] SE 분포 확인 (목표: ≥ 95%가 SE ≤ 0.30)
- [x] 노출률 모니터링 (최대 노출 ≤ 30%)

**피드백 수집**:
- [x] 사용자 경험 설문
- [x] UI/UX 개선
- [x] 버그 수정

### 7.2 Phase 2: 확장 (6개월)

#### **Month 4-5: 문항 풀 확장 (600개)**

- [ ] 각 패널 동형 6세트로 확장
- [ ] 문항 300개 추가 제작
- [ ] 재캘리브레이션 (GIRTH)

#### **Month 6-7: 교사용 대시보드**

- [ ] 학급 관리 기능
- [ ] 학생별 진단 결과 조회
- [ ] 학급 평균/분포 차트
- [ ] 엑셀 다운로드

#### **Month 8-9: 학습 추천 시스템**

- [ ] 레벨별 추천 도서 DB 구축
- [ ] Open Library API 연동
- [ ] Lexile 기반 필터링

#### **Month 10-12: 모바일 최적화**

- [ ] 반응형 디자인 개선
- [ ] 터치 UI 최적화
- [ ] Progressive Web App (PWA)

---

## 성능 요구사항

### 8.1 응답 시간 (Response Time)

| 엔드포인트 | 목표 | 최대 허용 |
|-----------|------|----------|
| `POST /test/start` | < 500ms | 1s |
| `POST /test/submit-stage1` | < 1s | 2s |
| `POST /test/submit-stage2` | < 1s | 2s |
| `POST /test/complete` | < 3s | 5s |
| `GET /report/{session_id}` | < 200ms | 500ms |

**최적화 전략**:
- [x] DB 인덱스 활용 (items, sessions)
- [x] EAP 적분 캐싱 (Quadrature points 미리 계산)
- [x] ML 모델 메모리 로드 (서버 시작 시)

### 8.2 동시 접속 (Concurrency)

| 지표 | 목표 |
|------|------|
| 동시 테스트 세션 | 100명 |
| 초당 요청 처리 (RPS) | 50 req/s |
| DB 커넥션 풀 | 20 connections |

**스케일링 계획**:
- **Horizontal Scaling**: Render에서 인스턴스 추가
- **DB Optimization**: Supabase Connection Pooler 사용
- **Caching**: Redis (Phase 2)

### 8.3 정확도 (Accuracy)

| 지표 | 목표 |
|------|------|
| IRT SE | ≤ 0.30 (95% 학생) |
| Lexile 모델 R² | ≥ 0.85 |
| Lexile 모델 MAE | < 70L |
| 어휘 사이즈 신뢰도 | High (80% 학생) |

**검증 방법**:
- 파일럿 데이터로 SE 분포 확인
- Test set으로 Lexile 모델 평가
- 가짜어 오탐률 모니터링 (< 10%)

---

## 보안 및 개인정보보호

### 9.1 데이터 보호

**암호화**:
- [x] HTTPS only (Netlify/Render 자동)
- [x] DB 암호화 (Supabase 기본 제공)
- [x] 비밀번호 해싱 (bcrypt, salt rounds=12)

**접근 제어**:
- [x] JWT 토큰 인증 (만료 24시간)
- [x] Role-based Access Control (학생/교사/관리자)
- [x] 세션별 student_id 검증

### 9.2 개인정보 처리

**수집 정보**:
- 필수: 이메일, 이름
- 선택: 학년, 학교

**보관 기간**:
- 테스트 결과: 2년
- 응답 로그: 1년 (통계 목적)
- 비활성 계정: 6개월 후 삭제 안내

**GDPR/개인정보보호법 준수**:
- [x] 개인정보 처리방침 명시
- [x] 데이터 삭제 요청 기능 (`DELETE /api/user/{id}`)
- [x] 데이터 다운로드 기능 (JSON)

### 9.3 문항 보안

**노출 제어**:
- [x] Randomesque 로직 (슬롯당 2-3개 후보)
- [x] 동형 로테이션 (3개 → 6개 폼)
- [x] `exposure_cap` 초과 시 문항 은퇴
- [x] 재응시 간격 제한 (2주)

**문항 유출 방지**:
- [x] API 응답에 `correct_answer` 제외 (테스트 중)
- [x] 완료 후에만 정오답 공개
- [x] 관리자 전용 엔드포인트 분리

---

## 테스트 계획

### 10.1 단위 테스트 (Unit Tests)

**Backend (Pytest)**:
```python
# tests/test_irt.py

def test_eap_estimate():
    """EAP θ 추정 정확도 테스트"""
    # Given: 알려진 θ=0.5인 학생의 이론적 응답 패턴
    items = [
        {'a': 1.0, 'b': 0.0, 'c': 0.25},
        {'a': 1.5, 'b': 0.5, 'c': 0.25},
        # ... 8개
    ]
    # θ=0.5일 때 기대 정답률로 응답 생성
    responses = generate_responses(theta=0.5, items=items)

    # When: EAP 추정
    estimated_theta, se = eap_estimate(responses, items)

    # Then: ±0.1 오차 내
    assert abs(estimated_theta - 0.5) < 0.1
    assert se < 0.8  # Stage 1 수준

def test_route_stage1():
    """Stage 1 라우팅 로직 테스트"""
    assert route_stage1(-0.6) == 'Low'
    assert route_stage1(0.0) == 'Med'
    assert route_stage1(0.8) == 'High'

# tests/test_lexile.py

def test_lexile_model():
    """Lexile 모델 예측 테스트"""
    # Given: 알려진 Lexile 점수의 텍스트
    passage = "Sample passage with known Lexile 800L..."

    # When: 특징 추출 + 예측
    features = extract_text_features(passage)
    predicted_lexile = lexile_model.predict([features])[0]

    # Then: ±100L 오차 내
    assert abs(predicted_lexile - 800) < 100
```

**Frontend (Jest + React Testing Library)**:
```typescript
// __tests__/ItemDisplay.test.tsx

test('renders item with 4 options', () => {
  const item = {
    stem: 'What is 2+2?',
    options: ['A) 3', 'B) 4', 'C) 5', 'D) 6']
  };

  render(<ItemDisplay item={item} onSelect={jest.fn()} />);

  expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  expect(screen.getByText('A) 3')).toBeInTheDocument();
  // ... 4개 옵션 모두 확인
});

test('calls onSelect when option clicked', () => {
  const mockOnSelect = jest.fn();
  render(<ItemDisplay item={mockItem} onSelect={mockOnSelect} />);

  fireEvent.click(screen.getByText('B) 4'));

  expect(mockOnSelect).toHaveBeenCalledWith('B');
});
```

### 10.2 통합 테스트 (Integration Tests)

**시나리오: 전체 MST 플로우**:
```python
# tests/integration/test_mst_flow.py

async def test_full_mst_flow():
    """전체 MST 플로우 통합 테스트"""
    client = TestClient(app)

    # 1. 테스트 시작
    response = client.post('/api/test/start', json={'student_id': 999})
    assert response.status_code == 200
    data = response.json()
    session_id = data['session_id']
    stage1_items = data['items']
    assert len(stage1_items) == 8

    # 2. Stage 1 제출 (중간 난이도 응답 패턴)
    stage1_responses = [
        {'item_id': item['id'], 'answer': 'A', 'response_time_ms': 10000}
        for item in stage1_items[:5]  # 5개 맞음
    ] + [
        {'item_id': item['id'], 'answer': 'Z', 'response_time_ms': 10000}
        for item in stage1_items[5:]  # 3개 틀림
    ]

    response = client.post('/api/test/submit-stage1', json={
        'session_id': session_id,
        'responses': stage1_responses
    })
    assert response.status_code == 200
    data = response.json()
    assert data['track'] == 'Med'  # 5/8 → θ ≈ 0.0 → Med
    stage2_items = data['items']
    assert len(stage2_items) == 16

    # 3. Stage 2 제출 (유사 패턴)
    # ... (생략)

    # 4. Stage 3 제출
    # ... (생략)

    # 5. 완료 + 리포트 확인
    response = client.post('/api/test/complete', json={
        'session_id': session_id,
        'responses': stage3_responses
    })
    assert response.status_code == 200
    report = response.json()

    assert 1 <= report['level'] <= 10
    assert 0 <= report['lexile'] <= 1700
    assert 0.5 <= report['ar'] <= 12.9
    assert report['vocabulary_size'] > 0
    assert 'grammar' in report['domains']
```

### 10.3 성능 테스트 (Performance Tests)

**Locust (부하 테스트)**:
```python
# tests/performance/locustfile.py

from locust import HttpUser, task, between

class TestUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """테스트 시작"""
        response = self.client.post('/api/test/start', json={
            'student_id': self.environment.runner.user_count
        })
        self.session_id = response.json()['session_id']

    @task
    def submit_stage1(self):
        """Stage 1 제출"""
        # ... (응답 생성)
        with self.client.post('/api/test/submit-stage1', json={...},
                               catch_response=True) as response:
            if response.elapsed.total_seconds() > 2:
                response.failure('Stage 1 took > 2s')

    # ... submit_stage2, complete

# 실행:
# locust -f locustfile.py --users 100 --spawn-rate 10 --host https://api.example.com
```

**목표**:
- 100명 동시 접속 시 평균 응답 시간 < 1s
- P95 응답 시간 < 2s

### 10.4 사용자 수용 테스트 (UAT)

**베타 테스트 체크리스트**:
- [ ] 100명 학생 실제 테스트 완료
- [ ] SE ≥ 95%가 ≤ 0.30 확인
- [ ] 노출률 최대 30% 미만 확인
- [ ] UI/UX 설문 NPS ≥ 50
- [ ] 크리티컬 버그 0건

---

## 부록 (Appendix)

### A. 용어 정리 (Glossary)

| 용어 | 설명 |
|------|------|
| **MST** | Multistage Testing, 다단계 적응형 검사 |
| **IRT** | Item Response Theory, 문항반응이론 |
| **3PL** | 3-Parameter Logistic Model (a, b, c) |
| **EAP** | Expected A Posteriori, 사후기댓값 추정 |
| **SE** | Standard Error, 표준오차 (측정 정확도) |
| **θ (theta)** | 능력치 파라미터 (Ability parameter) |
| **Lexile** | MetaMetrics의 텍스트 난이도 지수 (0-1700L) |
| **AR** | Accelerated Reader, Renaissance Learning의 학년 수준 지수 (K-12) |
| **VST** | Vocabulary Size Test, Paul Nation의 어휘량 측정 방식 |
| **Randomesque** | 준무작위 문항 선택 (노출 제어 기법) |
| **Bookmark** | IRT θ를 절대 기준 레벨로 변환하는 방법 |

### B. 참고 문헌 (References)

**IRT & MST**:
1. Hambleton, R. K., & Swaminathan, H. (1985). *Item Response Theory: Principles and Applications*. Springer.
2. Yan, D., von Davier, A. A., & Lewis, C. (2014). *Computerized Multistage Testing: Theory and Applications*. CRC Press.

**Lexile & Readability**:
3. Stenner, A. J., et al. (2006). "The Lexile Framework for Reading." MetaMetrics.
4. Dale, E., & Chall, J. S. (1948). "A Formula for Predicting Readability." *Educational Research Bulletin*.

**Vocabulary Size**:
5. Nation, I. S. P., & Beglar, D. (2007). "A vocabulary size test." *The Language Teacher*, 31(7), 9-13.
6. Schmitt, N., et al. (2001). "Developing and exploring the behaviour of two new versions of the Vocabulary Levels Test." *Language Testing*, 18(1), 55-88.

**Python Libraries**:
7. GIRTH: https://github.com/eribean/girth
8. Textstat: https://github.com/shivam5992/textstat
9. Wordfreq: https://github.com/rspeer/wordfreq

### C. 데이터 소스 (Data Sources)

**문항 제작 참고**:
- Cambridge English Corpus
- TOEFL/TOEIC 공개 샘플
- CommonLit (https://www.commonlit.org/)
- Project Gutenberg (공개 도메인 텍스트)

**Lexile 학습 데이터**:
- CommonLit + Lexile labels
- Newsela corpus
- Find a Book (Lexile DB)

**어휘 빈도**:
- BNC/COCA word lists (Mark Davies)
- Google Books Ngrams

---

**문서 버전**: 1.0.0
**최종 수정**: 2025-01-20
**작성자**: 개발팀 + Claude Code
**승인**: (검토 대기)
