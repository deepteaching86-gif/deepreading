# 600개 문항 개발 계획
**목표**: 영어 능동형 테스트용 고품질 문항 600개 개발
**기간**: Week 3-10 (8주)
**버전**: 1.0

---

## 📊 문항 구성 개요

### 전체 문항 풀 (600개)
```
문법 (Grammar):           200문항 (33.3%)
어휘 (Vocabulary):        200문항 (33.3%)
독해 (Reading):           200문항 (33.4%)
─────────────────────────────────────
총계:                     600문항 (100%)
```

### 학생당 40문항 구성 (FR-002 도메인 균형)
```
문법 (Grammar):            13문항 (32.5%)
어휘 (Vocabulary):         14문항 (35.0%)
  - VST 어휘 측정용:       14문항
  - 빈도 밴드별 샘플링:    11문항 (1k~14k)
  - 가짜어(Pseudoword):     3문항
독해 (Reading):            13문항 (32.5%)
  - 설명문 (Expository):    3-4문항
  - 논증문 (Argumentative):   3문항
  - 서사문 (Narrative):       3문항
  - 실용문 (Practical):       3문항
─────────────────────────────────────
총계:                      40문항 (100%)
```

---

## 🎯 MST 구조별 문항 배분 (600개 → 40개)

### MST 패널 구조
```
Stage 1: Routing (8문항)
  ├── 문법: 3문항
  ├── 어휘: 3문항
  └── 독해: 2문항

Stage 2: 3개 패널 (각 16문항)
  ├── Low Panel (16문항)
  │   ├── 문법: 5문항
  │   ├── 어휘: 6문항
  │   └── 독해: 5문항
  ├── Medium Panel (16문항)
  │   ├── 문법: 5문항
  │   ├── 어휘: 5문항
  │   └── 독해: 6문항
  └── High Panel (16문항)
      ├── 문법: 5문항
      ├── 어휘: 5문항
      └── 독해: 6문항

Stage 3: 9개 서브트랙 (각 16문항)
  ├── L1, L2, L3 (각 16문항)
  ├── M1, M2, M3 (각 16문항)
  └── H1, H2, H3 (각 16문항)
```

### 총 문항 수 계산
```
Routing:         1 × 8  =   8문항
Stage 2 Panels:  3 × 16 =  48문항
Stage 3 Tracks:  9 × 16 = 144문항
─────────────────────────────────────
총 고유 문항:             200문항

폼 로테이션 (3개 폼):  200 × 3 = 600문항
```

---

## 📝 문항 개발 일정 (8주)

### Week 3-4: 문법 문항 개발 (200개)

**Week 3 (100개)**
- **기초 문법** (Stage 1 Routing + Stage 2 Low):
  - 현재시제/과거시제 (20문항)
  - 인칭대명사 (15문항)
  - Be동사/조동사 (15문항)
  - 단수/복수 (10문항)
  - 기본 전치사 (15문항)
  - 의문문/부정문 (15문항)
  - 기타 (10문항)

**Week 4 (100개)**
- **중급 문법** (Stage 2 Medium + Stage 3 M1-M3):
  - 완료시제 (20문항)
  - 수동태 (20문항)
  - 관계대명사 (20문항)
  - 가정법 (15문항)
  - 부정사/동명사 (15문항)
  - 기타 (10문항)

- **고급 문법** (Stage 2 High + Stage 3 H1-H3):
  - 복합 관계사 (15문항)
  - 도치 구문 (15문항)
  - 분사 구문 (20문항)
  - 강조/생략 (20문항)
  - 접속사 고급 (20문항)
  - 기타 (10문항)

### Week 5-6: 어휘 문항 개발 (200개)

**Week 5 (100개)**
- **빈도 밴드 1k-4k** (Stage 1 + Stage 2 Low-Medium):
  - 1k 밴드: 20문항 (일상 기본 단어)
  - 2k 밴드: 25문항 (초급 확장 어휘)
  - 4k 밴드: 30문항 (중급 기초 어휘)
  - 가짜어 (Pseudoword): 25문항 (과대응답 감지)

**Week 6 (100개)**
- **빈도 밴드 6k-14k** (Stage 2 High + Stage 3):
  - 6k 밴드: 30문항 (중급 어휘)
  - 8k 밴드: 30문항 (중상급 어휘)
  - 10k 밴드: 20문항 (고급 어휘)
  - 14k 밴드: 20문항 (학술 어휘)

**VST 형식 예시**:
```
Question: "The doctor gave her an injection."
Options:
  A. medicine given by needle  ✓
  B. a kind of surgery
  C. verbal advice
  D. prescription paper
```

### Week 7-8: 독해 문항 개발 (200개)

**Week 7 (100개) - 설명문 & 논증문**
- **설명문 (Expository)**: 50문항
  - 과학 (15문항): 자연현상, 기술
  - 역사 (15문항): 사건, 인물
  - 사회 (15문항): 문화, 제도
  - 기타 (5문항)

- **논증문 (Argumentative)**: 50문항
  - 환경 문제 (15문항)
  - 교육 정책 (15문항)
  - 기술 윤리 (10문항)
  - 사회 이슈 (10문항)

**Week 8 (100개) - 서사문 & 실용문**
- **서사문 (Narrative)**: 50문항
  - 단편 소설 발췌 (20문항)
  - 전기/자서전 (15문항)
  - 역사 이야기 (10문항)
  - 우화/설화 (5문항)

- **실용문 (Practical)**: 50문항
  - 광고/안내문 (15문항)
  - 이메일/편지 (15문항)
  - 매뉴얼/설명서 (10문항)
  - 뉴스 기사 (10문항)

**독해 문항 유형**:
- Main Idea (주제 파악): 30%
- Inference (추론): 25%
- Detail (세부 정보): 20%
- Vocabulary in Context (문맥 어휘): 15%
- Author's Purpose (저자 의도): 10%

---

## 🎨 문항 개발 가이드라인

### 1. 문법 문항 작성 원칙

**구조**:
```
Stem: "She _____ to school every day."
Options:
  A. go
  B. goes      ✓
  C. going
  D. gone
```

**체크리스트**:
- [ ] 목표 문법 포인트가 명확함
- [ ] 오답 선택지가 전형적인 오류 반영
- [ ] 맥락이 자연스러움
- [ ] 모호성 없음

### 2. 어휘 문항 작성 원칙

**Nation VST 형식 준수**:
```
Target Word: "abandon"
Stem: "They had to abandon the ship."
Options:
  A. leave it    ✓
  B. repair it
  C. sell it
  D. paint it
```

**체크리스트**:
- [ ] 빈도 밴드 확인 (Wordfreq 라이브러리)
- [ ] 맥락 문장이 단어 의미를 충분히 지원
- [ ] 오답이 유사 의미장(semantic field)에서 선택
- [ ] L1 간섭 최소화

### 3. 독해 문항 작성 원칙

**지문 길이**:
- Low Panel: 50-100 단어
- Medium Panel: 100-200 단어
- High Panel: 200-400 단어

**Lexile 범위**:
- Low Panel: 200L-600L
- Medium Panel: 600L-1000L
- High Panel: 1000L-1400L

**체크리스트**:
- [ ] 지문이 특정 연령/문화에 편향되지 않음
- [ ] 문항이 지문 내용에만 의존 (배경지식 불필요)
- [ ] 정답이 명확하게 지지됨
- [ ] 오답이 함정성 있으나 논리적으로 배제 가능

---

## 🔬 Pilot Test & Calibration (Week 9-10)

### Week 9: Pilot Test 실시

**목표**: 600개 문항 중 200개 샘플링하여 실제 학생 테스트

**참가자**:
- 학생 수: 200-500명
- 학년: 초4 ~ 중3 (광범위 표집)
- 지역: 전국 단위 (도시/농촌 균형)

**데이터 수집**:
- 각 학생당 40문항 응시
- 응답 시간 기록
- 총 8,000~20,000개 응답 수집

**품질 관리**:
- 중복 응시 방지 (학생 ID 체크)
- 불성실 응답 필터링 (시간 < 5초/문항)

### Week 10: IRT Calibration

**도구**: GIRTH 라이브러리 (Python)

**Process**:
1. 응답 행렬 생성 (N×M, N명 학생, M개 문항)
2. 3PL 모델 적합 (MML 추정)
3. 파라미터 추출 (a, b, c)
4. 모델 적합도 검증 (χ² test, RMSEA)
5. 부적합 문항 플래깅

**Python 코드 스니펫**:
```python
from girth import twopl_mml, create_synthetic_irt_dichotomous

# 응답 행렬 (500명 × 200문항)
responses = np.loadtxt('pilot_responses.csv', delimiter=',')

# 3PL 추정
discrimination, difficulty = twopl_mml(responses)

# 결과 저장
items_df['discrimination'] = discrimination
items_df['difficulty'] = difficulty
items_df.to_csv('calibrated_items.csv')
```

**품질 기준** (FR-009):
- Point-biserial > 0.2
- 노출률 < 40%
- 정답률 10%-95% 범위
- 부적합 문항 → `status='flagged'`

---

## 📊 문항 데이터베이스 구조

### Items 테이블 필드
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    passage_id INT REFERENCES passages(id),

    -- Content
    stem TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer CHAR(1),

    -- Classification
    domain VARCHAR(20),  -- 'grammar', 'vocabulary', 'reading'
    text_type VARCHAR(20),  -- 'expository', 'argumentative', etc.
    skill_tag VARCHAR(100),

    -- IRT Parameters
    discrimination FLOAT,  -- a
    difficulty FLOAT,      -- b
    guessing FLOAT DEFAULT 0.25,  -- c

    -- MST Config
    stage INT,
    panel VARCHAR(20),
    form_id INT,

    -- Quality Metrics
    exposure_count INT DEFAULT 0,
    exposure_rate FLOAT,
    point_biserial FLOAT,
    correct_rate FLOAT,
    status VARCHAR(20) DEFAULT 'active',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    calibrated_at TIMESTAMP
);
```

---

## 🎯 개발 체크리스트

### Phase 1: 문항 작성 (Week 3-8)
- [ ] 문법 200개 완료
  - [ ] 기초 100개
  - [ ] 중급 50개
  - [ ] 고급 50개
- [ ] 어휘 200개 완료
  - [ ] 1k-4k 밴드 75개
  - [ ] 6k-14k 밴드 100개
  - [ ] 가짜어 25개
- [ ] 독해 200개 완료
  - [ ] 설명문 50개
  - [ ] 논증문 50개
  - [ ] 서사문 50개
  - [ ] 실용문 50개

### Phase 2: 검수 (Week 8)
- [ ] 도메인 전문가 리뷰 (교사 3명)
- [ ] 원어민 교정 (Native speaker 1명)
- [ ] 편향성 검토 (성별, 문화, 지역)
- [ ] 형식 일관성 체크

### Phase 3: Pilot Test (Week 9)
- [ ] 참가자 모집 (200-500명)
- [ ] 테스트 플랫폼 준비
- [ ] 데이터 수집 및 정제

### Phase 4: Calibration (Week 10)
- [ ] GIRTH 라이브러리 설치
- [ ] IRT 파라미터 추정
- [ ] 품질 메트릭 계산
- [ ] DB 업데이트

---

## 🔧 도구 및 리소스

### 개발 도구
- **어휘 빈도 데이터**: Wordfreq (Python)
- **텍스트 복잡도**: Textstat (Flesch-Kincaid, Lexile)
- **문법 체커**: Grammarly, ProWritingAid
- **협업**: Google Sheets (문항 작성), GitHub (버전 관리)

### 참고 자료
- **문법**: Cambridge Grammar in Use
- **어휘**: Nation's VST, Academic Word List
- **독해**: NewsELA, CommonLit (CC BY-NC-SA)
- **IRT**: Baker & Kim (2017), "Item Response Theory"

---

## 💰 예산 추정

| 항목 | 수량 | 단가 | 합계 |
|------|------|------|------|
| 문항 작성 (교사 3명 × 8주) | 24인주 | 50만원 | 1,200만원 |
| 원어민 검수 | 600문항 | 5,000원 | 300만원 |
| Pilot Test 참가비 | 500명 | 10,000원 | 500만원 |
| 도구 라이선스 (Grammarly 등) | - | - | 50만원 |
| **총계** | | | **2,050만원** |

---

**다음 문서**: `item-development-templates.md` (문항 작성 양식)
