# 600개 영어 적응형 테스트 문항 구조 설계

## 전체 구조 (600 Items)

```
총 600개 아이템
├─ 문법 (Grammar): 200개
├─ 어휘 (Vocabulary): 200개
└─ 독해 (Reading): 200개 + 100개 지문
```

## MST 3-Stage 구조

### Stage 1: Routing (총 150개, 각 도메인 50개)
- **목적**: 초기 능력치 추정 (θ)
- **난이도 분포**: Easy 40%, Medium 40%, Hard 20%
- **문항 수**: 각 세션당 8개 선택

**난이도 범위:**
- Easy: θ = -2.0 ~ -0.5 (20개)
- Medium: θ = -0.5 ~ 0.5 (20개)
- Hard: θ = 0.5 ~ 2.0 (10개)

### Stage 2: Panel Selection (총 225개, 각 도메인 75개)
- **목적**: 능력치 범위 좁히기
- **패널 구조**: Low (25개), Medium (25개), High (25개)
- **문항 수**: 각 세션당 16개 선택

**Panel별 난이도:**
- Low Panel: θ = -2.5 ~ -0.5
- Medium Panel: θ = -0.5 ~ 1.0
- High Panel: θ = 0.5 ~ 2.5

### Stage 3: Subtrack Precision (총 225개, 각 도메인 75개)
- **목적**: 정밀한 능력치 측정
- **Subtrack 구조**: 6개 세부 트랙 (각 12-13개)
- **문항 수**: 각 세션당 16개 선택

**Subtrack 구조:**
1. Low-Low: θ = -2.5 ~ -1.5 (12개)
2. Low-High: θ = -1.5 ~ -0.5 (13개)
3. Med-Low: θ = -0.5 ~ 0.0 (12개)
4. Med-High: θ = 0.0 ~ 1.0 (13개)
5. High-Med: θ = 0.5 ~ 1.5 (12개)
6. High-High: θ = 1.5 ~ 2.5 (13개)

---

## 도메인별 상세 설계

### 1. 문법 (Grammar) - 200개

#### 스킬 분포 (균등 분배)
- Present Simple/Continuous (30개)
- Past Simple/Perfect (30개)
- Future Forms (25개)
- Modal Verbs (25개)
- Conditionals (20개)
- Passive Voice (20개)
- Relative Clauses (20개)
- Reported Speech (15개)
- Articles & Prepositions (15개)

#### 난이도 분포
- Easy (θ < -0.5): 60개
- Medium (-0.5 ≤ θ ≤ 1.0): 80개
- Hard (θ > 1.0): 60개

#### IRT 파라미터 범위
- discrimination (a): 0.8 ~ 2.0
- difficulty (b): -2.5 ~ 2.5
- guessing (c): 0.20 ~ 0.25

---

### 2. 어휘 (Vocabulary) - 200개

#### VST (Vocabulary Size Test) 주파수 밴드
- 1K Band (30개): θ = -2.5 ~ -1.5
- 2K Band (30개): θ = -1.5 ~ -0.5
- 3K Band (25개): θ = -0.5 ~ 0.0
- 4K Band (25개): θ = 0.0 ~ 0.5
- 6K Band (25개): θ = 0.5 ~ 1.0
- 8K Band (20개): θ = 1.0 ~ 1.5
- 10K Band (20개): θ = 1.5 ~ 2.0
- 14K+ Band (15개): θ = 2.0 ~ 2.5
- Pseudowords (10개): 추측 탐지용

#### 문항 유형
- Definition Match (50%)
- Synonym/Antonym (30%)
- Context Usage (20%)

#### IRT 파라미터 범위
- discrimination (a): 1.0 ~ 2.2
- difficulty (b): -2.5 ~ 2.5
- guessing (c): 0.25 (4지선다 이론값)

---

### 3. 독해 (Reading) - 200개 문항 + 100개 지문

#### 지문 분포 (100개 passages)
**Lexile 범위별:**
- 200-400L (Elementary): 15개 지문, 2-3문항/지문 = 30-45개
- 400-600L (Late Elementary): 15개 지문, 2-3문항/지문 = 30-45개
- 600-800L (Middle School): 20개 지문, 2-3문항/지문 = 40-60개
- 800-1000L (High School): 20개 지문, 2-3문항/지문 = 40-60개
- 1000-1200L (College): 15개 지문, 2-3문항/지문 = 30-45개
- 1200L+ (Advanced): 15개 지문, 2-3문항/지문 = 30-45개

**장르 분포:**
- Informational (40개): 과학, 역사, 사회
- Literary (30개): 단편, 시, 에세이
- Argumentative (30개): 의견, 비평, 분석

#### 스킬 분포
- Main Idea (40개)
- Detail/Inference (50개)
- Vocabulary in Context (40개)
- Author's Purpose (30개)
- Text Structure (20개)
- Critical Analysis (20개)

#### 난이도 분포
- Easy (θ < 0.0): 60개
- Medium (0.0 ≤ θ ≤ 1.5): 80개
- Hard (θ > 1.5): 60개

#### IRT 파라미터 범위
- discrimination (a): 0.9 ~ 2.0
- difficulty (b): -2.5 ~ 2.5
- guessing (c): 0.20 ~ 0.25

---

## IRT 파라미터 할당 전략

### Discrimination (a) - 변별도
```
높은 변별도 (a > 1.5): 명확한 정답/오답 구분
중간 변별도 (1.0 ≤ a ≤ 1.5): 일반적인 문항
낮은 변별도 (a < 1.0): 모호하거나 추측 가능한 문항
```

### Difficulty (b) - 난이도
```
θ 범위를 -2.5 ~ 2.5로 커버
- 각 0.2 단위로 최소 4-5개 문항 배치
- 정규분포 형태로 중간 난이도에 집중
```

### Guessing (c) - 추측 파라미터
```
4지선다: 이론적 최소 0.25
실제 할당:
- 명확한 오답 제거 가능: c = 0.20
- 일반적인 문항: c = 0.25
- 오답 유사성 높음: c = 0.30 (독해 일부)
```

---

## 노출도 제어 전략

### 600개 문항 시 노출도 계산
```
최대 노출 횟수: 3회/문항
예상 학생 수: 200명
예상 테스트 횟수: 600회

40문항/테스트 × 600회 = 24,000 문항 노출
24,000 ÷ 600문항 = 평균 40회 노출/문항

→ 3회 제한 시: 600문항 × 3회 = 1,800회 테스트 가능
→ 학생당 3회 재테스트 가능
```

### 노출도 밸런싱
- 각 Stage/Panel별 균등 분배
- 도메인별 균등 분배
- 난이도별 균등 분배

---

## 생성 우선순위

### Phase 1: Core Items (300개) - 우선 생성
1. Grammar Stage 1: 50개 ✓
2. Vocabulary Stage 1: 50개 ✓
3. Reading Stage 1: 50개 + 25개 지문 ✓
4. 각 도메인 Stage 2: 225개 (75×3)

### Phase 2: Precision Items (300개)
5. 각 도메인 Stage 3: 225개 (75×3)
6. Reading 추가 지문: 75개

---

## 품질 보증 체크리스트

### 문항별 검증
- [ ] 정답이 명확한가?
- [ ] 오답이 그럴듯한가?
- [ ] 문법적으로 정확한가?
- [ ] 난이도가 적절한가?
- [ ] IRT 파라미터가 합리적인가?

### 전체 검증
- [ ] 도메인 분포 균형 (33.3% ± 2%)
- [ ] 난이도 분포 정규성
- [ ] Stage별 문항 수 충분
- [ ] Panel별 문항 수 충분
- [ ] 스킬 분포 균형

---

## 예상 작업 시간

- Phase 1 (300개): 4-6시간
- Phase 2 (300개): 4-6시간
- SQL 생성 및 테스트: 2시간
- **총 예상 시간: 10-14시간**

생성 시작일: 2025-01-24
예상 완료일: 2025-01-25
