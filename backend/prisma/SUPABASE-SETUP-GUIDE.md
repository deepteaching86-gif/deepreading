# Supabase Database Setup Guide

English Adaptive Test 시스템을 위한 Supabase 데이터베이스 설정 가이드입니다.

## 🚨 현재 상황

로컬 환경에서 Prisma의 `db push` 명령이 Supabase Connection Pooler에서 응답하지 않습니다.
이는 **pgbouncer(Connection Pooler)가 DDL(Data Definition Language) 작업을 지원하지 않기 때문**입니다.

## ✅ 해결 방법: Supabase Web Console에서 SQL 직접 실행

### 1단계: Supabase Dashboard 접속

1. 브라우저에서 Supabase Project 접속:
   ```
   https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj
   ```

2. **SQL Editor** 메뉴 클릭 (좌측 사이드바)

### 2단계: SQL 스크립트 실행

1. **New Query** 버튼 클릭

2. 아래 파일의 전체 내용을 복사:
   ```
   backend/prisma/create-english-test-tables.sql
   ```

3. SQL Editor에 붙여넣기

4. **RUN** 버튼 클릭 (또는 `Ctrl + Enter`)

### 3단계: 실행 결과 확인

성공하면 다음과 같은 메시지가 표시됩니다:

```
Success. No rows returned
```

**생성되는 테이블 확인** (Table Editor에서):
- ✅ `passages` - 독해 지문
- ✅ `items` - 문항 (IRT 파라미터, 품질 메트릭)
- ✅ `english_test_sessions` - 테스트 세션 (MST 상태, 최종 결과)
- ✅ `english_test_responses` - 학생 응답 기록

**생성되는 Enum 타입**:
- ✅ `ItemDomain` (grammar, vocabulary, reading)
- ✅ `TextType` (expository, argumentative, narrative, practical)
- ✅ `ItemStatus` (active, flagged, inactive)

**생성되는 인덱스** (8개):
- `idx_items_domain`
- `idx_items_status`
- `idx_items_stage_panel`
- `idx_items_exposure_rate`
- `idx_sessions_user_id`
- `idx_sessions_status`
- `idx_responses_session_id`
- `idx_responses_item_id`

## 🔄 다음 단계

SQL 스크립트가 성공적으로 실행되면:

### 1. 샘플 데이터 시딩

```bash
cd "c:\Users\owner\Downloads\LITERACY TEST PROJECT\backend"
npx ts-node prisma/seed-english-test.ts
```

**시드 데이터 내용**:
- 3개 Passage (Lexile 400L, 950L, 1280L)
- 13개 Grammar 문항 (MST Stage 1-3 분포)
- 14개 Vocabulary 문항 (VST 1k-14k + pseudoword)
- 13개 Reading 문항 (4가지 TextType 분포)
- **총 40개 문항**

### 2. FastAPI 서버 시작

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend 개발 서버 시작

```bash
cd frontend
npm run dev
```

### 4. End-to-End 테스트

1. 브라우저에서 접속: `http://localhost:3001`
2. English Test 시작
3. 40문항 완료 후 결과 확인:
   - 10-level proficiency
   - θ (ability estimate)
   - Lexile score
   - AR level
   - Vocabulary size

## 📋 스키마 주요 필드 설명

### `items` 테이블 (FR-002, FR-009 반영)

**Domain 균형 (FR-002)**:
- `domain`: grammar (32.5%), vocabulary (35%), reading (32.5%)
- `text_type`: expository, argumentative, narrative, practical

**IRT 3PL 파라미터**:
- `discrimination`: 변별도 (a)
- `difficulty`: 난이도 (b)
- `guessing`: 추측도 (c, default 0.25)

**품질 메트릭 (FR-009)**:
- `point_biserial`: 문항 변별도 지표
- `correct_rate`: 정답률
- `exposure_rate`: 노출률 (보안 관리)
- `status`: active, flagged, inactive

**MST 설정**:
- `stage`: 1 (Routing) → 2 (Low/Med/High) → 3 (9 subtracks)
- `panel`: routing, low, med, high, low_low, low_med, ...
- `form_id`: Form 구분 (최대 3개 Form)

### `english_test_sessions` 테이블 (FR-005 반영)

**MST 진행 상태**:
- `stage`: 현재 스테이지 (1-3)
- `panel`: 현재 패널
- `current_theta`: 실시간 능력 추정치
- `current_se`: 표준 오차

**최종 진단 결과 (FR-005)**:
- `final_theta`: 최종 능력 추정치
- `proficiency_level`: 10-level proficiency (1-10)
- `lexile_score`: Lexile 점수
- `ar_level`: AR 점수
- `vocabulary_size`: 추정 어휘 크기 (14k+ words)
- `vocabulary_bands`: 빈도대별 어휘 분포 (JSON)

**통계 정보**:
- `total_items`: 총 응답 문항 수
- `correct_count`: 정답 개수
- `accuracy_percentage`: 정답률

## 🎯 600개 문항 개발 계획

SQL 스크립트 실행 후, 본격적인 600개 문항 개발을 시작합니다:

**일정**: Week 3-10 (8주)
- Week 3-4: Grammar 200개
- Week 5-6: Vocabulary 200개
- Week 7-8: Reading 200개
- Week 9: Pilot Test (200-500명)
- Week 10: IRT Calibration (GIRTH)

**상세 계획**:
- [600-items-development-plan.md](.taskmaster/docs/600-items-development-plan.md)

## 🔧 문제 해결

### 테이블이 이미 존재하는 경우

SQL 스크립트에 `CREATE TABLE IF NOT EXISTS`가 포함되어 있어 안전하게 재실행 가능합니다.

### Enum 타입 충돌

스크립트에 `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` 처리가 되어 있습니다.

### 마이그레이션 히스토리 불일치

Prisma Migrate 대신 수동 SQL 실행을 사용하므로 마이그레이션 히스토리는 생성되지 않습니다.
향후 스키마 변경은 다음 방법 사용:

1. **Supabase SQL Editor** (권장)
2. **Prisma Studio** (데이터 조회/수정)
3. **직접 SQL 작성** (복잡한 마이그레이션)

## 📚 참고 자료

- [Prisma + Supabase 가이드](https://supabase.com/docs/guides/database/prisma)
- [Connection Pooling 제한사항](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)
- [IRT 3PL Model](https://en.wikipedia.org/wiki/Item_response_theory#Three-parameter_logistic_model)

---

**다음 액션**: Supabase SQL Editor에서 `create-english-test-tables.sql` 실행 → 시드 스크립트 실행 → 테스트!
