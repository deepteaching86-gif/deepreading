# 시지각 테스트 시스템 설계 문서 V2 (확장판)
**Visual Perception Test System Design Document V2**

작성일: 2025-11-11
버전: 2.0.0 (집중력 세분화 + 시선 분석 확장)
대상: 2학년 학생 계정

---

## 📋 주요 변경사항 (V2)

### ✨ 새로운 기능
1. **집중력 요소 10가지로 세분화** (기존 5가지 → 10가지)
2. **시선 분석 항목 15가지로 확장** (결과 화면 강화)
3. **학생 대시보드 통합** (문해력 테스트 옆 Vision Test 블럭)
4. **더 상세한 피드백** (강점/약점/개선 포인트)

---

## 📋 목차
1. [시스템 개요](#1-시스템-개요)
2. [기술 스택](#2-기술-스택)
3. [학생 대시보드 통합](#3-학생-대시보드-통합)
4. [집중력 계산 알고리즘 (10가지 요소)](#4-집중력-계산-알고리즘-10가지-요소)
5. [시선 분석 항목 (15가지)](#5-시선-분석-항목-15가지)
6. [결과 화면 설계](#6-결과-화면-설계)
7. [API 설계](#7-api-설계)
8. [데이터 모델](#8-데이터-모델)

---

## 1. 시스템 개요

### 1.1 프로젝트 목표
시선추적 기술을 활용하여 2학년 학생의 **시지각 능력**, **독해력**, **집중력**을 종합적으로 평가하는 시스템

### 1.2 핵심 특징
- ✅ **정밀 시선추적**: MediaPipe + OpenCV + 3D Head Pose 기반 고정밀 시선추적
- ✅ **학년별 맞춤 지문**: 2학년 수준의 독해 지문 제공
- ✅ **집중력 10가지 요소**: 세분화된 집중력 측정
- ✅ **시선 분석 15가지 항목**: 종합 시선 패턴 분석
- ✅ **이해도 평가**: 지문 읽기 후 이해도 문제 풀이
- ✅ **실시간 데이터 분석**: 읽기 패턴, 시선 이동, 집중도 분석

---

## 3. 학생 대시보드 통합

### 3.1 대시보드 레이아웃

```typescript
// Dashboard.tsx 구조
┌─────────────────────────────────────────────────────┐
│  학생 대시보드                                       │
│                                                      │
│  📚 학년별 문해력 테스트                             │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ 2학년 문해력 │  │ Vision Test  │ ← NEW!         │
│  │ 테스트       │  │ (시지각 평가) │                │
│  │              │  │              │                │
│  │ [시작하기]   │  │ [시작하기]   │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
│  📊 최근 테스트 결과                                 │
│  - 문해력 테스트 결과                                │
│  - Vision Test 결과                                 │
└─────────────────────────────────────────────────────┘
```

### 3.2 Vision Test 블럭 설계

```typescript
interface VisionTestCard {
  title: "Vision Test (시지각 평가)";
  subtitle: "독해력 & 집중력 종합 평가";
  icon: "👁️";
  template_code: "VISIONTEST-G2-V1";  // 2학년용
  badge: "NEW";
  features: [
    "✓ 시선추적 기반 읽기 분석",
    "✓ 집중력 10가지 지표 측정",
    "✓ 이해도 5문제 평가",
    "✓ 소요시간: 약 10분"
  ];
  disabled: false;
  onClick: () => navigate('/vision-test');
}
```

### 3.3 템플릿 코드 체계

```typescript
// Vision Test 템플릿 코드
const VISION_TEST_TEMPLATES = {
  // 2학년용
  "VISIONTEST-G2-V1": {
    grade: 2,
    version: 1,
    passages: [...],  // 2학년 지문 10개
    questions_per_passage: 5
  },

  // 향후 확장
  "VISIONTEST-G3-V1": { grade: 3, ... },
  "VISIONTEST-G4-V1": { grade: 4, ... }
};
```

---

## 4. 집중력 계산 알고리즘 (10가지 요소)

### 4.1 집중력 세부 지표 (10가지)

| # | 지표명 | 측정 내용 | 가중치 | 정상 범위 |
|---|--------|-----------|--------|-----------|
| 1 | **시선 고정 안정성** | 텍스트에 얼마나 안정적으로 고정되는지 | 12% | 80-95% |
| 2 | **읽기 패턴 규칙성** | 좌→우, 위→아래 순차 이동 | 10% | 85-100% |
| 3 | **역행 빈도** | 재읽기 횟수 (적을수록 집중) | 10% | 0-5회/분 |
| 4 | **화면 집중 유지율** | 텍스트 영역 내 시선 비율 | 10% | 90-100% |
| 5 | **읽기 속도 일관성** | 줄별 읽기 속도 편차 | 8% | CV < 0.3 |
| 6 | **눈 깜빡임 빈도** | 분당 깜빡임 횟수 (적정 범위) | 8% | 15-20회/분 |
| 7 | **고정 시간 분포** | 단어별 고정 시간 적정성 | 8% | 200-400ms |
| 8 | **수직 이탈 빈도** | 줄 이탈 횟수 (적을수록 집중) | 8% | 0-3회/분 |
| 9 | **수평 역행 패턴** | 같은 줄 내 역행 분석 | 8% | 0-2회/줄 |
| 10 | **주의력 지속 시간** | 연속 집중 지속 시간 | 18% | 120-180초 |

**총합**: 100%

### 4.2 각 지표별 계산 로직

#### 4.2.1 시선 고정 안정성 (Fixation Stability)
```python
def calculate_fixation_stability(gaze_data: List[GazePoint]) -> float:
    """
    시선이 텍스트에 얼마나 안정적으로 고정되는지 측정

    측정 방법:
    1. 연속 시선 포인트 간 거리 계산
    2. 평균 이동 거리 산출
    3. 정규화 (0-100px → 1.0-0.0)

    Returns:
        0.0 - 1.0 (1.0 = 매우 안정적)
    """
    distances = []
    for i in range(1, len(gaze_data)):
        dx = gaze_data[i].x - gaze_data[i-1].x
        dy = gaze_data[i].y - gaze_data[i-1].y
        distance = np.sqrt(dx**2 + dy**2)
        distances.append(distance)

    avg_movement = np.mean(distances)

    # 이동 거리가 적을수록 안정적
    # 0-50px = 1.0, 100px+ = 0.0
    stability = max(0, min(1, (100 - avg_movement) / 100))

    return stability
```

#### 4.2.2 읽기 패턴 규칙성 (Reading Pattern Consistency)
```python
def calculate_reading_pattern_score(gaze_data: List[GazePoint]) -> float:
    """
    정상적인 읽기 패턴(좌→우, 위→아래)을 따르는지 측정

    Returns:
        0.0 - 1.0 (1.0 = 매우 규칙적)
    """
    # 수평 이동 분석
    left_to_right_count = 0
    total_horizontal_moves = 0

    for i in range(1, len(gaze_data)):
        dx = gaze_data[i].x - gaze_data[i-1].x
        if abs(dx) > 10:  # 의미있는 수평 이동
            total_horizontal_moves += 1
            if dx > 0:  # 좌→우
                left_to_right_count += 1

    horizontal_score = (
        left_to_right_count / total_horizontal_moves
        if total_horizontal_moves > 0 else 0.5
    )

    # 수직 이동 분석
    top_to_bottom_count = 0
    total_vertical_moves = 0

    for i in range(1, len(gaze_data)):
        dy = gaze_data[i].y - gaze_data[i-1].y
        if abs(dy) > 20:  # 줄 바꿈
            total_vertical_moves += 1
            if dy > 0:  # 위→아래
                top_to_bottom_count += 1

    vertical_score = (
        top_to_bottom_count / total_vertical_moves
        if total_vertical_moves > 0 else 0.5
    )

    # 종합 점수
    pattern_score = horizontal_score * 0.6 + vertical_score * 0.4

    return pattern_score
```

#### 4.2.3 역행 빈도 (Regression Frequency)
```python
def calculate_regression_score(gaze_data: List[GazePoint]) -> float:
    """
    재읽기(역행) 횟수 측정

    Returns:
        0.0 - 1.0 (1.0 = 역행 거의 없음)
    """
    regression_count = 0

    for i in range(1, len(gaze_data)):
        dx = gaze_data[i].x - gaze_data[i-1].x
        dy = abs(gaze_data[i].y - gaze_data[i-1].y)

        # 같은 줄에서 왼쪽으로 큰 이동 = 역행
        if dx < -100 and dy < 30:
            regression_count += 1

    # 정규화 (0-20회 → 1.0-0.0)
    regression_score = max(0, 1 - (regression_count / 20))

    return regression_score
```

#### 4.2.4 화면 집중 유지율 (Focus Retention Rate)
```python
def calculate_focus_retention_score(
    gaze_data: List[GazePoint],
    text_bounds: Rect
) -> float:
    """
    텍스트 영역 내 시선 유지 비율

    Returns:
        0.0 - 1.0 (1.0 = 100% 화면 내)
    """
    in_bounds_count = sum(
        1 for point in gaze_data
        if (text_bounds.x <= point.x <= text_bounds.x + text_bounds.width
            and text_bounds.y <= point.y <= text_bounds.y + text_bounds.height)
    )

    focus_retention = in_bounds_count / len(gaze_data) if len(gaze_data) > 0 else 0

    return focus_retention
```

#### 4.2.5 읽기 속도 일관성 (Reading Speed Consistency)
```python
def calculate_speed_consistency_score(gaze_data: List[GazePoint]) -> float:
    """
    줄별 읽기 속도가 일정한지 측정

    Returns:
        0.0 - 1.0 (1.0 = 매우 일관적)
    """
    line_reading_times = []
    current_line_start = 0

    for i in range(1, len(gaze_data)):
        dy = abs(gaze_data[i].y - gaze_data[i-1].y)
        if dy > 30:  # 줄 바꿈 감지
            line_time = gaze_data[i].timestamp - gaze_data[current_line_start].timestamp
            line_reading_times.append(line_time)
            current_line_start = i

    if len(line_reading_times) < 2:
        return 0.5

    std_dev = np.std(line_reading_times)
    mean_time = np.mean(line_reading_times)

    # 변동 계수 (CV) → 일관성 점수
    cv = std_dev / mean_time if mean_time > 0 else 1
    consistency_score = max(0, 1 - cv)

    return consistency_score
```

#### 4.2.6 눈 깜빡임 빈도 (Blink Frequency) 🆕
```python
def calculate_blink_frequency_score(
    gaze_data: List[GazePoint],
    duration_seconds: float
) -> float:
    """
    눈 깜빡임 빈도 측정 (적정 범위: 15-20회/분)

    너무 적음 = 피로도 높음
    너무 많음 = 산만함

    Returns:
        0.0 - 1.0 (1.0 = 적정 빈도)
    """
    # 깜빡임 감지: confidence가 급격히 떨어지는 구간
    blink_count = 0

    for i in range(1, len(gaze_data)):
        if (gaze_data[i-1].confidence > 0.7 and
            gaze_data[i].confidence < 0.3):
            blink_count += 1

    # 분당 깜빡임 횟수
    blinks_per_minute = (blink_count / duration_seconds) * 60

    # 적정 범위: 15-20회/분
    if 15 <= blinks_per_minute <= 20:
        score = 1.0
    elif blinks_per_minute < 15:
        # 너무 적음 (피로도)
        score = max(0, blinks_per_minute / 15)
    else:
        # 너무 많음 (산만함)
        score = max(0, 1 - ((blinks_per_minute - 20) / 20))

    return score
```

#### 4.2.7 고정 시간 분포 (Fixation Duration Distribution) 🆕
```python
def calculate_fixation_duration_score(gaze_data: List[GazePoint]) -> float:
    """
    단어별 고정 시간이 적정한지 측정

    적정 범위: 200-400ms
    너무 짧음 = 대충 읽음
    너무 김 = 이해 어려움

    Returns:
        0.0 - 1.0 (1.0 = 적정 고정 시간)
    """
    fixations = []
    current_fixation_start = 0
    current_position = (gaze_data[0].x, gaze_data[0].y)

    for i in range(1, len(gaze_data)):
        dx = abs(gaze_data[i].x - current_position[0])
        dy = abs(gaze_data[i].y - current_position[1])

        # 큰 이동 = 새로운 고정 시작
        if dx > 50 or dy > 30:
            duration = gaze_data[i].timestamp - gaze_data[current_fixation_start].timestamp
            fixations.append(duration)
            current_fixation_start = i
            current_position = (gaze_data[i].x, gaze_data[i].y)

    # 적정 범위 비율 계산
    optimal_fixations = sum(
        1 for duration in fixations
        if 200 <= duration <= 400
    )

    score = optimal_fixations / len(fixations) if len(fixations) > 0 else 0.5

    return score
```

#### 4.2.8 수직 이탈 빈도 (Vertical Drift Frequency) 🆕
```python
def calculate_vertical_drift_score(gaze_data: List[GazePoint]) -> float:
    """
    줄을 이탈한 횟수 측정

    Returns:
        0.0 - 1.0 (1.0 = 줄 이탈 거의 없음)
    """
    drift_count = 0
    current_line_y = gaze_data[0].y

    for i in range(1, len(gaze_data)):
        dy = abs(gaze_data[i].y - current_line_y)

        # 줄 높이 초과 이동 (줄 바꿈 제외)
        if 15 < dy < 30:  # 작은 수직 이탈
            drift_count += 1
        elif dy > 30:  # 줄 바꿈
            current_line_y = gaze_data[i].y

    # 정규화 (0-30회 → 1.0-0.0)
    drift_score = max(0, 1 - (drift_count / 30))

    return drift_score
```

#### 4.2.9 수평 역행 패턴 (Horizontal Regression Pattern) 🆕
```python
def calculate_horizontal_regression_score(gaze_data: List[GazePoint]) -> float:
    """
    같은 줄 내에서 역행 패턴 분석

    Returns:
        0.0 - 1.0 (1.0 = 역행 거의 없음)
    """
    line_regressions = []
    current_line_data = []
    current_line_y = gaze_data[0].y

    for point in gaze_data:
        if abs(point.y - current_line_y) < 30:
            # 같은 줄
            current_line_data.append(point)
        else:
            # 새 줄 시작
            if len(current_line_data) > 1:
                # 현재 줄의 역행 횟수 계산
                regression_count = sum(
                    1 for i in range(1, len(current_line_data))
                    if current_line_data[i].x < current_line_data[i-1].x - 50
                )
                line_regressions.append(regression_count)

            current_line_data = [point]
            current_line_y = point.y

    # 평균 줄당 역행 횟수
    avg_regression_per_line = (
        np.mean(line_regressions) if len(line_regressions) > 0 else 0
    )

    # 0-2회/줄 = 정상
    score = max(0, 1 - (avg_regression_per_line / 2))

    return score
```

#### 4.2.10 주의력 지속 시간 (Sustained Attention Duration) 🆕
```python
def calculate_sustained_attention_score(gaze_data: List[GazePoint]) -> float:
    """
    연속으로 집중한 시간 측정

    적정 범위: 120-180초 (2-3분)

    Returns:
        0.0 - 1.0 (1.0 = 적정 지속 시간)
    """
    # 집중 상태 판정: 화면 내 + 규칙적 이동
    focused_segments = []
    current_segment_start = 0
    is_focused = True

    for i in range(1, len(gaze_data)):
        # 집중 이탈 조건
        dx = abs(gaze_data[i].x - gaze_data[i-1].x)
        dy = abs(gaze_data[i].y - gaze_data[i-1].y)

        # 너무 큰 이동 or 화면 밖 = 집중 이탈
        if dx > 200 or dy > 100 or gaze_data[i].confidence < 0.5:
            if is_focused:
                # 집중 구간 종료
                duration = gaze_data[i].timestamp - gaze_data[current_segment_start].timestamp
                focused_segments.append(duration)
                is_focused = False
        else:
            if not is_focused:
                # 새로운 집중 구간 시작
                current_segment_start = i
                is_focused = True

    # 가장 긴 집중 시간
    max_attention_duration = max(focused_segments) / 1000 if len(focused_segments) > 0 else 0  # ms → s

    # 적정 범위: 120-180초
    if 120 <= max_attention_duration <= 180:
        score = 1.0
    elif max_attention_duration < 120:
        score = max_attention_duration / 120
    else:
        score = max(0, 1 - ((max_attention_duration - 180) / 180))

    return score
```

### 4.3 통합 집중력 점수 계산

```python
def calculate_comprehensive_concentration_score(
    gaze_data: List[GazePoint],
    text_bounds: Rect,
    duration_seconds: float
) -> Dict[str, any]:
    """
    10가지 집중력 지표를 종합하여 최종 점수 산출

    Returns:
        {
            "scores": {
                "fixation_stability": 0.85,
                "reading_pattern": 0.92,
                "regression_frequency": 0.88,
                "focus_retention": 0.95,
                "speed_consistency": 0.78,
                "blink_frequency": 0.82,
                "fixation_duration": 0.87,
                "vertical_drift": 0.91,
                "horizontal_regression": 0.89,
                "sustained_attention": 0.93
            },
            "weighted_scores": { ... },
            "overall_concentration": 87.5,  // 0-100
            "grade": "B+",
            "interpretation": "양호"
        }
    """
    # 각 지표 계산
    scores = {
        "fixation_stability": calculate_fixation_stability(gaze_data),
        "reading_pattern": calculate_reading_pattern_score(gaze_data),
        "regression_frequency": calculate_regression_score(gaze_data),
        "focus_retention": calculate_focus_retention_score(gaze_data, text_bounds),
        "speed_consistency": calculate_speed_consistency_score(gaze_data),
        "blink_frequency": calculate_blink_frequency_score(gaze_data, duration_seconds),
        "fixation_duration": calculate_fixation_duration_score(gaze_data),
        "vertical_drift": calculate_vertical_drift_score(gaze_data),
        "horizontal_regression": calculate_horizontal_regression_score(gaze_data),
        "sustained_attention": calculate_sustained_attention_score(gaze_data)
    }

    # 가중치 적용
    weights = {
        "fixation_stability": 0.12,
        "reading_pattern": 0.10,
        "regression_frequency": 0.10,
        "focus_retention": 0.10,
        "speed_consistency": 0.08,
        "blink_frequency": 0.08,
        "fixation_duration": 0.08,
        "vertical_drift": 0.08,
        "horizontal_regression": 0.08,
        "sustained_attention": 0.18
    }

    # 가중 점수 계산
    weighted_scores = {
        key: scores[key] * weights[key]
        for key in scores.keys()
    }

    # 총합 계산
    overall = sum(weighted_scores.values()) * 100  # 0-100 스케일

    # 등급 부여
    if overall >= 90:
        grade = "A+"
        interpretation = "매우 우수"
    elif overall >= 85:
        grade = "A"
        interpretation = "우수"
    elif overall >= 80:
        grade = "B+"
        interpretation = "양호"
    elif overall >= 75:
        grade = "B"
        interpretation = "보통"
    elif overall >= 70:
        grade = "C+"
        interpretation = "노력 필요"
    else:
        grade = "C"
        interpretation = "많은 노력 필요"

    return {
        "scores": {k: round(v, 3) for k, v in scores.items()},
        "weighted_scores": {k: round(v, 4) for k, v in weighted_scores.items()},
        "overall_concentration": round(overall, 1),
        "grade": grade,
        "interpretation": interpretation
    }
```

---

## 5. 시선 분석 항목 (15가지)

### 5.1 읽기 행동 분석 (Reading Behavior)

| # | 분석 항목 | 측정 내용 | 의미 |
|---|----------|-----------|------|
| 1 | **평균 읽기 속도** | Words Per Minute (WPM) | 독해 속도 |
| 2 | **총 고정 횟수** | Total Fixation Count | 읽기 패턴 분석 |
| 3 | **평균 고정 시간** | Average Fixation Duration (ms) | 이해 깊이 |
| 4 | **도약 횟수** | Saccade Count | 눈 이동 빈도 |
| 5 | **평균 도약 거리** | Average Saccade Length (px) | 읽기 효율성 |

### 5.2 집중력 분석 (Concentration)

| # | 분석 항목 | 측정 내용 | 의미 |
|---|----------|-----------|------|
| 6 | **화면 내 시선 비율** | % of Gaze in Text Area | 주의력 |
| 7 | **역행 빈도** | Regression Count | 재읽기 정도 |
| 8 | **줄 이탈 횟수** | Line Drift Count | 정확성 |
| 9 | **최장 집중 시간** | Max Sustained Attention (s) | 지속력 |
| 10 | **산만함 지수** | Distraction Index | 집중 안정성 |

### 5.3 이해도 상관 분석 (Comprehension Correlation)

| # | 분석 항목 | 측정 내용 | 의미 |
|---|----------|-----------|------|
| 11 | **재읽기-정답률 상관** | Regression vs Accuracy | 신중함 |
| 12 | **고정시간-정답률 상관** | Fixation vs Accuracy | 이해 깊이 |
| 13 | **읽기속도-정답률 상관** | Speed vs Accuracy | 효율성 |

### 5.4 문제 풀이 패턴 (Question-Solving Pattern)

| # | 분석 항목 | 측정 내용 | 의미 |
|---|----------|-----------|------|
| 14 | **보기별 시선 분포** | Gaze Time per Option | 균형성 |
| 15 | **재확인 빈도** | Revisit Count | 신중함 |

### 5.5 각 항목별 계산 로직

#### 5.5.1 평균 읽기 속도 (WPM)
```python
def calculate_reading_speed_wpm(
    word_count: int,
    duration_seconds: float
) -> float:
    """
    Words Per Minute 계산

    Returns:
        WPM (예: 150.5)
    """
    wpm = (word_count / duration_seconds) * 60
    return round(wpm, 1)
```

#### 5.5.2 총 고정 횟수
```python
def count_fixations(gaze_data: List[GazePoint]) -> int:
    """
    고정(Fixation) 횟수 계산

    고정 정의: 50px 이내 범위에서 200ms 이상 머무름
    """
    fixations = 0
    i = 0

    while i < len(gaze_data):
        # 고정 시작점
        fixation_start = i
        fixation_x = gaze_data[i].x
        fixation_y = gaze_data[i].y

        # 고정 지속 확인
        j = i + 1
        while j < len(gaze_data):
            dx = abs(gaze_data[j].x - fixation_x)
            dy = abs(gaze_data[j].y - fixation_y)

            if dx > 50 or dy > 50:
                break
            j += 1

        # 고정 시간 확인
        duration = gaze_data[j-1].timestamp - gaze_data[fixation_start].timestamp
        if duration >= 200:  # 200ms 이상
            fixations += 1

        i = j

    return fixations
```

#### 5.5.3 평균 고정 시간
```python
def calculate_average_fixation_duration(gaze_data: List[GazePoint]) -> float:
    """
    평균 고정 시간 계산

    Returns:
        ms 단위 (예: 285.3)
    """
    fixation_durations = []
    i = 0

    while i < len(gaze_data):
        fixation_start = i
        fixation_x = gaze_data[i].x
        fixation_y = gaze_data[i].y

        j = i + 1
        while j < len(gaze_data):
            dx = abs(gaze_data[j].x - fixation_x)
            dy = abs(gaze_data[j].y - fixation_y)

            if dx > 50 or dy > 50:
                break
            j += 1

        duration = gaze_data[j-1].timestamp - gaze_data[fixation_start].timestamp
        if duration >= 200:
            fixation_durations.append(duration)

        i = j

    avg_duration = np.mean(fixation_durations) if len(fixation_durations) > 0 else 0
    return round(avg_duration, 1)
```

#### 5.5.4 도약 횟수 (Saccade Count)
```python
def count_saccades(gaze_data: List[GazePoint]) -> int:
    """
    도약(Saccade) 횟수 계산

    도약 정의: 고정 간 빠른 눈 이동 (50px 이상)
    """
    saccades = 0

    for i in range(1, len(gaze_data)):
        dx = abs(gaze_data[i].x - gaze_data[i-1].x)
        dy = abs(gaze_data[i].y - gaze_data[i-1].y)
        distance = np.sqrt(dx**2 + dy**2)

        if distance > 50:
            saccades += 1

    return saccades
```

#### 5.5.5 산만함 지수 (Distraction Index)
```python
def calculate_distraction_index(
    gaze_data: List[GazePoint],
    text_bounds: Rect
) -> float:
    """
    산만함 정도 측정

    측정 요소:
    1. 화면 밖 시선 비율
    2. 불규칙한 이동 빈도
    3. 갑작스러운 큰 이동

    Returns:
        0.0 - 1.0 (1.0 = 매우 산만함)
    """
    # 1. 화면 밖 비율
    out_of_bounds_count = sum(
        1 for point in gaze_data
        if not (text_bounds.x <= point.x <= text_bounds.x + text_bounds.width
                and text_bounds.y <= point.y <= text_bounds.y + text_bounds.height)
    )
    out_of_bounds_ratio = out_of_bounds_count / len(gaze_data)

    # 2. 불규칙한 큰 이동 (>300px)
    large_jumps = sum(
        1 for i in range(1, len(gaze_data))
        if np.sqrt(
            (gaze_data[i].x - gaze_data[i-1].x)**2 +
            (gaze_data[i].y - gaze_data[i-1].y)**2
        ) > 300
    )
    large_jump_ratio = large_jumps / len(gaze_data)

    # 3. 갑작스러운 방향 전환
    direction_changes = 0
    for i in range(2, len(gaze_data)):
        dx1 = gaze_data[i-1].x - gaze_data[i-2].x
        dy1 = gaze_data[i-1].y - gaze_data[i-2].y
        dx2 = gaze_data[i].x - gaze_data[i-1].x
        dy2 = gaze_data[i].y - gaze_data[i-1].y

        # 방향 벡터의 내적으로 방향 변화 감지
        dot_product = dx1 * dx2 + dy1 * dy2
        if dot_product < 0:  # 반대 방향
            direction_changes += 1

    direction_change_ratio = direction_changes / len(gaze_data)

    # 종합 산만함 지수
    distraction = (
        out_of_bounds_ratio * 0.4 +
        large_jump_ratio * 0.3 +
        direction_change_ratio * 0.3
    )

    return round(distraction, 3)
```

#### 5.5.6 재읽기-정답률 상관
```python
def calculate_regression_accuracy_correlation(
    regression_count: int,
    accuracy: float
) -> Dict[str, any]:
    """
    재읽기 횟수와 정답률 상관관계 분석

    Returns:
        {
            "correlation": "positive" | "negative" | "neutral",
            "interpretation": "신중하게 읽음" | "이해 어려움" | "보통"
        }
    """
    # 재읽기가 많고 정답률이 높음 = 신중함
    if regression_count > 10 and accuracy > 0.8:
        return {
            "correlation": "positive",
            "interpretation": "신중하게 읽고 높은 이해도"
        }
    # 재읽기가 많지만 정답률 낮음 = 이해 어려움
    elif regression_count > 10 and accuracy < 0.6:
        return {
            "correlation": "negative",
            "interpretation": "재읽기에도 불구하고 이해 어려움"
        }
    # 재읽기 적고 정답률 높음 = 효율적 읽기
    elif regression_count < 5 and accuracy > 0.8:
        return {
            "correlation": "positive",
            "interpretation": "효율적이고 정확한 읽기"
        }
    else:
        return {
            "correlation": "neutral",
            "interpretation": "보통 수준의 읽기 패턴"
        }
```

---

## 6. 결과 화면 설계

### 6.1 종합 결과 화면 (상세 버전)

```
┌─────────────────────────────────────────────────────┐
│  🎉 시지각 테스트 완료!                              │
│                                                      │
│  📊 종합 점수: 87.5점 (B+) - 양호                   │
│                                                      │
│  ═══════════════════════════════════════════════    │
│  📖 읽기 능력                                        │
│  ────────────────────────────────────────────────   │
│  읽기 속도:      152 WPM  ████████░░ 82점           │
│  고정 안정성:    0.85     ████████░░ 85점           │
│  패턴 규칙성:    0.92     █████████░ 92점           │
│                                                      │
│  ═══════════════════════════════════════════════    │
│  🎯 집중력 (10가지 지표)                             │
│  ────────────────────────────────────────────────   │
│  1. 시선 고정 안정성:    ████████░░  85%            │
│  2. 읽기 패턴 규칙성:    █████████░  92%            │
│  3. 역행 빈도:           ████████░░  88%            │
│  4. 화면 집중 유지율:    █████████░  95%            │
│  5. 읽기 속도 일관성:    ███████░░░  78%            │
│  6. 눈 깜빡임 빈도:      ████████░░  82%            │
│  7. 고정 시간 분포:      ████████░░  87%            │
│  8. 수직 이탈 빈도:      █████████░  91%            │
│  9. 수평 역행 패턴:      ████████░░  89%            │
│  10. 주의력 지속 시간:   █████████░  93%            │
│                                                      │
│  종합 집중력: 87.5점 (B+)                            │
│                                                      │
│  ═══════════════════════════════════════════════    │
│  💯 이해도 평가                                      │
│  ────────────────────────────────────────────────   │
│  정답률:         4/5 (80%)  ████████░░              │
│  평균 응답 시간: 35초                                │
│  재확인 횟수:    1.8회/문제 (적정)                  │
│                                                      │
│  ═══════════════════════════════════════════════    │
│  📈 시선 분석 (15가지 항목)                          │
│  ────────────────────────────────────────────────   │
│  [읽기 행동]                                         │
│  • 평균 읽기 속도:    152 WPM                       │
│  • 총 고정 횟수:      85회                          │
│  • 평균 고정 시간:    285ms                         │
│  • 도약 횟수:         68회                          │
│  • 평균 도약 거리:    120px                         │
│                                                      │
│  [집중력 분석]                                       │
│  • 화면 내 시선 비율: 95%                           │
│  • 역행 빈도:         12회 (적정)                   │
│  • 줄 이탈 횟수:      3회 (우수)                    │
│  • 최장 집중 시간:    145초 (적정)                  │
│  • 산만함 지수:       0.15 (낮음/좋음)              │
│                                                      │
│  [이해도 상관]                                       │
│  • 재읽기-정답률:     신중하게 읽고 높은 이해도     │
│  • 고정시간-정답률:   깊이 있는 이해                │
│  • 읽기속도-정답률:   효율적인 읽기                 │
│                                                      │
│  [문제 풀이 패턴]                                    │
│  • 보기별 시선 분포:  균형적 (표준편차 250ms)       │
│  • 재확인 빈도:       1.8회/문제 (신중함)           │
│                                                      │
│  ═══════════════════════════════════════════════    │
│  🌟 강점                                             │
│  ────────────────────────────────────────────────   │
│  ✓ 화면에 시선을 잘 유지했어요 (95%)                │
│  ✓ 읽기 패턴이 매우 규칙적이에요 (92%)              │
│  ✓ 한 번에 오래 집중할 수 있어요 (145초)            │
│  ✓ 문제를 신중하게 풀었어요                         │
│                                                      │
│  💡 개선 포인트                                      │
│  ────────────────────────────────────────────────   │
│  • 줄마다 읽기 속도를 조금 더 일정하게 유지해보세요 │
│  • 눈 깜빡임을 조금 더 자주 해서 눈의 피로를 줄이세요│
│                                                      │
│  📚 학습 추천                                        │
│  ────────────────────────────────────────────────   │
│  • 속도 향상 연습: 다양한 주제의 짧은 글 읽기       │
│  • 집중력 유지 훈련: 조금 더 긴 글 도전하기         │
│                                                      │
│  [상세 리포트 다운로드]  [다시 테스트]  [완료]     │
└─────────────────────────────────────────────────────┘
```

---

## 7. API 설계

### 7.1 결과 API 확장

```typescript
// GET /api/perception/results/{session_id}
Response: {
  session_id: string;
  student: {
    id: string;
    name: string;
    grade: number;
  };
  passage: {
    title: string;
    word_count: number;
  };

  // 읽기 능력
  reading_ability: {
    reading_speed_wpm: 152,
    fixation_stability: 0.85,
    pattern_consistency: 0.92,
    overall_score: 82
  };

  // 집중력 (10가지 지표)
  concentration: {
    scores: {
      fixation_stability: 0.85,
      reading_pattern: 0.92,
      regression_frequency: 0.88,
      focus_retention: 0.95,
      speed_consistency: 0.78,
      blink_frequency: 0.82,
      fixation_duration: 0.87,
      vertical_drift: 0.91,
      horizontal_regression: 0.89,
      sustained_attention: 0.93
    },
    overall_concentration: 87.5,
    grade: "B+",
    interpretation: "양호"
  };

  // 이해도 평가
  comprehension: {
    total_questions: 5,
    correct_answers: 4,
    accuracy: 0.80,
    average_response_time: 35000,  // ms
    revisit_per_question: 1.8
  };

  // 시선 분석 (15가지)
  gaze_analysis: {
    reading_behavior: {
      avg_reading_speed_wpm: 152,
      total_fixation_count: 85,
      avg_fixation_duration: 285,  // ms
      saccade_count: 68,
      avg_saccade_length: 120  // px
    },
    concentration_metrics: {
      in_text_ratio: 0.95,
      regression_count: 12,
      line_drift_count: 3,
      max_sustained_attention: 145,  // seconds
      distraction_index: 0.15
    },
    comprehension_correlation: {
      regression_accuracy: {
        correlation: "positive",
        interpretation: "신중하게 읽고 높은 이해도"
      },
      fixation_accuracy: {
        correlation: "positive",
        interpretation: "깊이 있는 이해"
      },
      speed_accuracy: {
        correlation: "positive",
        interpretation: "효율적인 읽기"
      }
    },
    question_solving: {
      option_gaze_distribution: {
        std_dev: 250,  // ms
        interpretation: "균형적"
      },
      revisit_frequency: 1.8,
      interpretation: "신중함"
    }
  };

  // 피드백
  feedback: {
    strengths: [
      "화면에 시선을 잘 유지했어요 (95%)",
      "읽기 패턴이 매우 규칙적이에요 (92%)",
      "한 번에 오래 집중할 수 있어요 (145초)",
      "문제를 신중하게 풀었어요"
    ],
    improvements: [
      "줄마다 읽기 속도를 조금 더 일정하게 유지해보세요",
      "눈 깜빡임을 조금 더 자주 해서 눈의 피로를 줄이세요"
    ],
    recommendations: [
      "속도 향상 연습: 다양한 주제의 짧은 글 읽기",
      "집중력 유지 훈련: 조금 더 긴 글 도전하기"
    ]
  };

  // 종합 점수
  overall_scores: {
    reading_ability: 82,
    concentration: 87.5,
    comprehension: 80,
    total: 83.2  // 가중 평균
  };
}
```

---

## 8. 데이터 모델 (Prisma 스키마 확장)

```prisma
// schema.prisma (확장)

model PerceptionResult {
  id                  String   @id @default(cuid())
  sessionId           String   @unique

  // 읽기 능력
  readingSpeedWpm     Float
  fixationStability   Float
  patternConsistency  Float
  readingAbilityScore Float

  // 집중력 10가지 지표
  concentrationScores Json     // { fixation_stability: 0.85, ... }
  concentrationGrade  String   // "A+", "B+", etc.
  concentrationScore  Float    // 0-100

  // 이해도
  totalQuestions      Int
  correctAnswers      Int
  comprehensionAccuracy Float
  avgResponseTime     Int      // ms
  revisitPerQuestion  Float

  // 시선 분석 15가지
  gazeAnalysis        Json     // { reading_behavior: {...}, ... }

  // 피드백
  strengths           String[] // 강점 목록
  improvements        String[] // 개선 포인트
  recommendations     String[] // 학습 추천

  // 종합 점수
  overallScores       Json     // { reading: 82, concentration: 87.5, ... }

  createdAt           DateTime @default(now())

  session             PerceptionSession @relation(fields: [sessionId], references: [id])

  @@map("perception_results")
}
```

---

**작성자**: Claude + User
**최종 수정**: 2025-11-11
**문서 버전**: 2.0.0
**상태**: ✅ 확장 설계 완료, 개발 준비 완료
