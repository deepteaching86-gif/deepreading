# 시지각 테스트 시스템 설계 문서
**Visual Perception Test System Design Document**

작성일: 2025-11-11
버전: 1.0.0
대상: 2학년 학생 계정

---

## 📋 목차
1. [시스템 개요](#1-시스템-개요)
2. [기술 스택](#2-기술-스택)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [핵심 기능 설계](#4-핵심-기능-설계)
5. [집중력 계산 알고리즘](#5-집중력-계산-알고리즘)
6. [API 설계](#6-api-설계)
7. [데이터 모델](#7-데이터-모델)
8. [UI/UX 설계](#8-uiux-설계)
9. [개발 로드맵](#9-개발-로드맵)

---

## 1. 시스템 개요

### 1.1 프로젝트 목표
시선추적 기술을 활용하여 2학년 학생의 **시지각 능력**, **독해력**, **집중력**을 종합적으로 평가하는 시스템

### 1.2 핵심 특징
- ✅ **정밀 시선추적**: MediaPipe + OpenCV + 3D Head Pose 기반 고정밀 시선추적
- ✅ **학년별 맞춤 지문**: 2학년 수준의 독해 지문 제공
- ✅ **집중력 측정**: 시선 데이터 기반 집중력 점수 계산
- ✅ **이해도 평가**: 지문 읽기 후 이해도 문제 풀이
- ✅ **실시간 데이터 분석**: 읽기 패턴, 시선 이동, 집중도 분석

### 1.3 테스트 플로우
```
1. 시작 → 카메라 권한 요청
2. 9-Point Calibration (2분)
3. 지문 읽기 (2-3분)
   ↓ 시선 추적 중
4. 지문 사라짐 (Fade out)
5. 이해도 문제 풀이 (5문제, 3-5분)
   ↓ 시선 추적 중
6. 결과 분석 및 피드백
7. 완료
```

---

## 2. 기술 스택

### 2.1 백엔드 (Python - FastAPI)
**기존 Vision Test 기술 활용**

| 기술 | 용도 | 버전 |
|------|------|------|
| **MediaPipe** | Face Mesh (468-point) + Iris Tracking | latest |
| **OpenCV** | Hough Circle Transform (동공 검출) | 4.10.0+ |
| **NumPy** | 3D 헤드 포즈 계산 | latest |
| **FastAPI** | REST API + WebSocket | latest |
| **PostgreSQL** | 시선 데이터 저장 | 16 |
| **Prisma** | ORM (기존 English Test DB 연동) | latest |

**핵심 모듈**:
```python
backend/app/vision/
├── tracker.py              # VisionTracker (JEO 방식)
├── pupil_detector.py       # OrloskyPupilDetector
├── head_pose.py            # HeadPoseEstimator
├── calibration.py          # CalibrationCorrector
└── websocket.py            # WebSocket 실시간 통신
```

### 2.2 프론트엔드 (React + TypeScript)
| 기술 | 용도 | 버전 |
|------|------|------|
| **React** | UI 컴포넌트 | 18.x |
| **TypeScript** | 타입 안전성 | latest |
| **Vite** | 빌드 도구 | latest |
| **Tailwind CSS** | 스타일링 | latest |
| **WebSocket** | 실시간 시선 데이터 수신 | native |

### 2.3 시선추적 알고리즘 (JEO 방식)
```
1. MediaPipe Face Mesh (468-point landmarks)
2. Iris Tracking (refine_landmarks=True)
3. OrloskyPupilDetector (Hough Circle Transform)
4. 3D Head Pose Estimation (Pitch, Yaw, Roll)
5. 3D Gaze Ray Computation
6. Screen Coordinate Projection
7. Calibration Correction
```

**정확도**: ±22px (좌우), ±30px (상하)
**FPS**: 29-30 fps (안정적)

---

## 3. 시스템 아키텍처

### 3.1 전체 시스템 구조
```
┌─────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)           │
│  ┌──────────────────────────────────────────┐   │
│  │  VisualPerceptionTest.tsx                │   │
│  │  - 지문 읽기 화면                         │   │
│  │  - 문제 풀이 화면                         │   │
│  │  - 실시간 시선 데이터 수신                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↕ WebSocket (실시간 시선 데이터)
                      ↕ REST API (세션 관리, 결과 저장)
┌─────────────────────────────────────────────────┐
│         Backend (Python FastAPI)                │
│  ┌──────────────────────────────────────────┐   │
│  │  app/perception/                         │   │
│  │  ├── router.py      (API 엔드포인트)     │   │
│  │  ├── service.py     (비즈니스 로직)      │   │
│  │  ├── models.py      (데이터 모델)        │   │
│  │  └── analyzer.py    (집중력 분석)        │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  app/vision/  (기존 Vision Test 활용)   │   │
│  │  ├── tracker.py     (시선 추적 엔진)     │   │
│  │  ├── calibration.py (캘리브레이션)       │   │
│  │  └── websocket.py   (WebSocket 핸들러)   │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         Database (PostgreSQL + Supabase)        │
│  ┌──────────────────────────────────────────┐   │
│  │  - perception_sessions (세션 정보)       │   │
│  │  - perception_passages (학년별 지문)     │   │
│  │  - perception_questions (이해도 문제)    │   │
│  │  - perception_gaze_data (시선 데이터)    │   │
│  │  - perception_results (결과 분석)        │   │
│  │  - perception_concentration (집중력)     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름
```
[학생] → [카메라] → [프론트엔드]
                         ↓ WebSocket (30fps)
                    [Python 백엔드]
                         ↓
                  [Vision Tracker]
                  - MediaPipe Face Mesh
                  - Pupil Detection
                  - 3D Gaze Ray
                         ↓
                  [실시간 시선 좌표]
                         ↓
                  [DB 저장 + 분석]
                  - 읽기 패턴 분석
                  - 집중력 계산
                  - 이해도 평가
                         ↓
                    [결과 리포트]
```

---

## 4. 핵심 기능 설계

### 4.1 지문 읽기 Phase

#### 4.1.1 학년별 지문 선택
```python
# 2학년 수준 지문 기준
{
  "grade": 2,
  "difficulty": "medium",
  "word_count": 200-300,
  "reading_time": 2-3분,
  "topics": [
    "동물", "자연", "가족", "학교생활",
    "계절", "우정", "일상생활"
  ],
  "vocabulary_level": "초등 2학년 교육과정 기준"
}
```

#### 4.1.2 지문 화면 설계
```typescript
interface ReadingPhase {
  passage: {
    title: string;
    content: string;  // 단락별 <p> 태그
    grade: number;
    difficulty: string;
  };
  display: {
    fontSize: 24;      // 2학년 적정 크기
    lineHeight: 1.8;   // 읽기 편의성
    letterSpacing: 1;  // 자간
    fontFamily: "Noto Sans KR";
  };
  tracking: {
    enabled: true;
    fps: 30;
    saveInterval: 100ms;  // 시선 데이터 저장 주기
  };
}
```

#### 4.1.3 실시간 시선 추적
```typescript
// 지문 읽는 동안 추적 데이터
interface ReadingGazeData {
  timestamp: number;
  gazeX: number;
  gazeY: number;
  confidence: number;
  lineNumber: number;      // 읽고 있는 줄 번호
  wordIndex: number;       // 읽고 있는 단어 인덱스
  regressionCount: number; // 역행 횟수 (재읽기)
  fixationDuration: number;// 고정 시간 (ms)
}
```

### 4.2 지문 사라짐 Phase
```typescript
interface FadeOutPhase {
  duration: 2000ms;        // 2초 Fade out
  effect: "opacity 0-100%";
  message: "잠시 후 문제가 나옵니다...";
  preparation: {
    showQuestions: true;
    questionCount: 5;
  };
}
```

### 4.3 문제 풀이 Phase

#### 4.3.1 문제 유형
```python
question_types = [
  "주제 파악",      # 1문제
  "세부 내용 이해", # 2문제
  "추론 및 예측",   # 1문제
  "어휘 이해",      # 1문제
]
```

#### 4.3.2 문제 화면 설계
```typescript
interface QuestionPhase {
  question: {
    id: string;
    type: string;
    text: string;
    options: [
      { id: 1, text: string },
      { id: 2, text: string },
      { id: 3, text: string },
      { id: 4, text: string }
    ];
  };
  display: {
    layout: "vertical";
    showProgress: true;  // "1/5"
    timeLimit: null;     // 무제한
  };
  tracking: {
    enabled: true;
    trackOptionViewing: true;  // 보기별 시선 시간
    trackThinkingTime: true;   // 고민 시간
  };
}
```

#### 4.3.3 문제 풀이 시선 데이터
```typescript
interface QuestionGazeData {
  questionId: string;
  optionViewTimes: {
    option1: number;  // ms
    option2: number;
    option3: number;
    option4: number;
  };
  revisitCount: number;     // 문제 재확인 횟수
  thinkingTime: number;     // 총 고민 시간
  decisionTime: number;     // 답 선택까지 시간
  confidence: number;       // 확신도 (추정)
}
```

---

## 5. 집중력 계산 알고리즘

### 5.1 집중력 지표 (Concentration Metrics)

#### 5.1.1 시선 고정도 (Fixation Stability)
```python
def calculate_fixation_stability(gaze_data: List[GazePoint]) -> float:
    """
    시선이 얼마나 안정적으로 텍스트에 머물렀는지 측정

    Returns:
        0.0 - 1.0 (1.0 = 매우 집중)
    """
    # 1. 연속된 시선 포인트 간 거리 계산
    distances = []
    for i in range(1, len(gaze_data)):
        dx = gaze_data[i].x - gaze_data[i-1].x
        dy = gaze_data[i].y - gaze_data[i-1].y
        distance = sqrt(dx**2 + dy**2)
        distances.append(distance)

    # 2. 평균 이동 거리
    avg_movement = np.mean(distances)

    # 3. 정규화 (0-100px → 0.0-1.0 역순)
    # 이동이 적을수록 집중도 높음
    stability = max(0, 1 - (avg_movement / 100))

    return stability
```

#### 5.1.2 읽기 패턴 규칙성 (Reading Pattern Consistency)
```python
def calculate_reading_pattern_score(gaze_data: List[GazePoint]) -> float:
    """
    정상적인 읽기 패턴을 따르는지 측정
    (왼쪽 → 오른쪽, 위 → 아래 순차적 이동)

    Returns:
        0.0 - 1.0 (1.0 = 매우 규칙적)
    """
    # 1. 수평 이동 방향 분석 (좌→우 비율)
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

    # 2. 수직 이동 방향 분석 (위→아래 비율)
    top_to_bottom_count = 0
    total_vertical_moves = 0

    for i in range(1, len(gaze_data)):
        dy = gaze_data[i].y - gaze_data[i-1].y
        if abs(dy) > 20:  # 줄 바꿈 감지
            total_vertical_moves += 1
            if dy > 0:  # 위→아래
                top_to_bottom_count += 1

    vertical_score = (
        top_to_bottom_count / total_vertical_moves
        if total_vertical_moves > 0 else 0.5
    )

    # 3. 종합 점수 (가중 평균)
    pattern_score = (
        horizontal_score * 0.6 +  # 수평 이동 60%
        vertical_score * 0.4      # 수직 이동 40%
    )

    return pattern_score
```

#### 5.1.3 역행 빈도 (Regression Frequency)
```python
def calculate_regression_score(gaze_data: List[GazePoint]) -> float:
    """
    재읽기(역행) 횟수 측정 - 적을수록 집중도 높음

    Returns:
        0.0 - 1.0 (1.0 = 역행 거의 없음)
    """
    # 1. 역행 감지 (오른쪽→왼쪽 큰 이동)
    regression_count = 0
    for i in range(1, len(gaze_data)):
        dx = gaze_data[i].x - gaze_data[i-1].x
        dy = abs(gaze_data[i].y - gaze_data[i-1].y)

        # 같은 줄에서 왼쪽으로 큰 이동 = 역행
        if dx < -100 and dy < 30:
            regression_count += 1

    # 2. 정규화 (0-20회 역행 → 1.0-0.0)
    regression_score = max(0, 1 - (regression_count / 20))

    return regression_score
```

#### 5.1.4 화면 이탈 빈도 (Off-Screen Rate)
```python
def calculate_focus_retention_score(
    gaze_data: List[GazePoint],
    screen_bounds: Rect
) -> float:
    """
    화면 내 텍스트 영역에 시선이 머문 비율

    Returns:
        0.0 - 1.0 (1.0 = 100% 화면 내)
    """
    # 1. 화면 내 시선 포인트 비율
    in_bounds_count = sum(
        1 for point in gaze_data
        if (screen_bounds.x <= point.x <= screen_bounds.x + screen_bounds.width
            and screen_bounds.y <= point.y <= screen_bounds.y + screen_bounds.height)
    )

    focus_retention = in_bounds_count / len(gaze_data)

    return focus_retention
```

#### 5.1.5 속도 일관성 (Reading Speed Consistency)
```python
def calculate_speed_consistency_score(gaze_data: List[GazePoint]) -> float:
    """
    읽기 속도가 일정한지 측정 (너무 빠르거나 느리지 않게)

    Returns:
        0.0 - 1.0 (1.0 = 매우 일관적)
    """
    # 1. 각 줄별 읽기 속도 계산
    line_reading_times = []
    current_line_start = 0

    for i in range(1, len(gaze_data)):
        dy = abs(gaze_data[i].y - gaze_data[i-1].y)
        if dy > 30:  # 줄 바꿈 감지
            line_time = gaze_data[i].timestamp - gaze_data[current_line_start].timestamp
            line_reading_times.append(line_time)
            current_line_start = i

    # 2. 표준편차 계산 (낮을수록 일관적)
    if len(line_reading_times) < 2:
        return 0.5

    std_dev = np.std(line_reading_times)
    mean_time = np.mean(line_reading_times)

    # 3. 변동 계수 (CV) → 일관성 점수
    cv = std_dev / mean_time if mean_time > 0 else 1
    consistency_score = max(0, 1 - cv)

    return consistency_score
```

### 5.2 통합 집중력 점수 (Overall Concentration Score)
```python
def calculate_concentration_score(
    gaze_data: List[GazePoint],
    screen_bounds: Rect
) -> Dict[str, float]:
    """
    모든 지표를 종합하여 최종 집중력 점수 계산

    Returns:
        {
            "fixation_stability": 0.0-1.0,
            "reading_pattern": 0.0-1.0,
            "regression_score": 0.0-1.0,
            "focus_retention": 0.0-1.0,
            "speed_consistency": 0.0-1.0,
            "overall_concentration": 0.0-100.0
        }
    """
    # 개별 지표 계산
    fixation = calculate_fixation_stability(gaze_data)
    pattern = calculate_reading_pattern_score(gaze_data)
    regression = calculate_regression_score(gaze_data)
    retention = calculate_focus_retention_score(gaze_data, screen_bounds)
    consistency = calculate_speed_consistency_score(gaze_data)

    # 가중 평균 (중요도별)
    overall = (
        fixation * 0.25 +      # 시선 고정도 25%
        pattern * 0.20 +       # 읽기 패턴 20%
        regression * 0.20 +    # 역행 빈도 20%
        retention * 0.20 +     # 화면 집중도 20%
        consistency * 0.15     # 속도 일관성 15%
    )

    # 0-100 스케일로 변환
    overall_score = overall * 100

    return {
        "fixation_stability": round(fixation, 3),
        "reading_pattern": round(pattern, 3),
        "regression_score": round(regression, 3),
        "focus_retention": round(retention, 3),
        "speed_consistency": round(consistency, 3),
        "overall_concentration": round(overall_score, 1)
    }
```

### 5.3 문제 풀이 집중력 (Question-Solving Concentration)
```python
def calculate_question_concentration(
    question_gaze_data: QuestionGazeData
) -> float:
    """
    문제 풀이 시 집중력 측정

    Returns:
        0.0 - 1.0 (1.0 = 매우 집중)
    """
    # 1. 보기 균형 점수 (모든 보기를 골고루 봤는지)
    option_times = [
        question_gaze_data.optionViewTimes.option1,
        question_gaze_data.optionViewTimes.option2,
        question_gaze_data.optionViewTimes.option3,
        question_gaze_data.optionViewTimes.option4
    ]

    # 표준편차가 낮을수록 균형 있게 봤음
    std_dev = np.std(option_times)
    mean_time = np.mean(option_times)
    balance_score = max(0, 1 - (std_dev / (mean_time + 1)))

    # 2. 고민 시간 적정성 (너무 빠르거나 느리지 않게)
    # 2학년 기준: 30초 - 120초 적정
    thinking_time = question_gaze_data.thinkingTime / 1000  # ms → s
    if 30 <= thinking_time <= 120:
        time_score = 1.0
    elif thinking_time < 30:
        time_score = thinking_time / 30
    else:
        time_score = max(0, 1 - ((thinking_time - 120) / 120))

    # 3. 재확인 점수 (적절한 재확인 = 신중함)
    # 1-2회 재확인 = 이상적
    revisit_score = 1.0 if 1 <= question_gaze_data.revisitCount <= 2 else 0.5

    # 종합 점수
    concentration = (
        balance_score * 0.4 +
        time_score * 0.4 +
        revisit_score * 0.2
    )

    return concentration
```

---

## 6. API 설계

### 6.1 REST API 엔드포인트

#### 6.1.1 세션 관리
```typescript
// POST /api/perception/sessions
// 시지각 테스트 세션 시작
Request: {
  student_id: string;
  grade: number;  // 2
}

Response: {
  session_id: string;
  passage: {
    id: string;
    title: string;
    content: string;
    grade: number;
    difficulty: string;
  };
  ws_url: string;  // WebSocket URL
}
```

```typescript
// GET /api/perception/passages?grade=2
// 학년별 지문 목록 조회
Response: {
  passages: [
    {
      id: string;
      title: string;
      preview: string;  // 첫 100자
      grade: number;
      difficulty: string;
      word_count: number;
    }
  ]
}
```

#### 6.1.2 캘리브레이션
```typescript
// POST /api/perception/calibration
// 캘리브레이션 결과 저장
Request: {
  session_id: string;
  calibration_points: [
    { x: number, y: number, accuracy: number }
  ];
  overall_accuracy: number;
}

Response: {
  success: boolean;
  accuracy: number;
}
```

#### 6.1.3 지문 읽기 데이터
```typescript
// POST /api/perception/reading-data
// 지문 읽기 시선 데이터 저장 (배치 저장)
Request: {
  session_id: string;
  passage_id: string;
  gaze_data: [
    {
      timestamp: number;
      x: number;
      y: number;
      confidence: number;
      line_number: number;
      word_index: number;
    }
  ];
  reading_duration: number;  // ms
}

Response: {
  success: boolean;
  data_points_saved: number;
}
```

#### 6.1.4 문제 관리
```typescript
// GET /api/perception/questions?passage_id={id}
// 지문에 대한 이해도 문제 조회
Response: {
  questions: [
    {
      id: string;
      passage_id: string;
      type: string;  // "주제 파악", "세부 내용", etc.
      text: string;
      options: [
        { id: number, text: string }
      ];
      correct_answer: number;  // (클라이언트에 전송 X)
    }
  ]
}
```

```typescript
// POST /api/perception/answers
// 문제 답변 제출
Request: {
  session_id: string;
  question_id: string;
  selected_answer: number;
  gaze_data: QuestionGazeData;
  time_taken: number;  // ms
}

Response: {
  is_correct: boolean;
  correct_answer: number;
}
```

#### 6.1.5 결과 조회
```typescript
// GET /api/perception/results/{session_id}
// 테스트 결과 조회
Response: {
  session_id: string;
  student_id: string;
  passage: {
    title: string;
    grade: number;
  };
  reading_analysis: {
    total_time: number;  // ms
    average_reading_speed: number;  // wpm
    fixation_count: number;
    regression_count: number;
    concentration_score: ConcentrationMetrics;
  };
  comprehension_analysis: {
    total_questions: number;
    correct_answers: number;
    accuracy: number;  // %
    average_time_per_question: number;  // ms
    question_concentration: number;  // 0-1
  };
  overall_score: {
    reading_ability: number;  // 0-100
    comprehension: number;    // 0-100
    concentration: number;    // 0-100
    total: number;            // 0-100
  };
}
```

### 6.2 WebSocket 프로토콜
```typescript
// WebSocket: /ws/perception/{session_id}

// Client → Server (Frame 전송)
{
  type: "frame";
  session_id: string;
  image: string;  // base64
  screen_width: number;
  screen_height: number;
  timestamp: number;
}

// Server → Client (시선 데이터)
{
  type: "gaze";
  session_id: string;
  gaze: {
    x: number;
    y: number;
    confidence: number;
    timestamp: number;
  };
  head_pose: {
    pitch: number;
    yaw: number;
    roll: number;
  };
}

// Server → Client (에러)
{
  type: "error";
  message: string;
  code: string;
}
```

---

## 7. 데이터 모델

### 7.1 데이터베이스 스키마 (PostgreSQL + Prisma)

```prisma
// schema.prisma

// 시지각 테스트 세션
model PerceptionSession {
  id                String   @id @default(cuid())
  studentId         String
  grade             Int
  passageId         String
  status            String   @default("active")  // active, completed, failed
  calibrationAccuracy Float?
  createdAt         DateTime @default(now())
  completedAt       DateTime?

  passage           PerceptionPassage @relation(fields: [passageId], references: [id])
  gazeData          PerceptionGazeData[]
  results           PerceptionResult?

  @@map("perception_sessions")
}

// 학년별 지문
model PerceptionPassage {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  grade       Int
  difficulty  String   // easy, medium, hard
  wordCount   Int
  topics      String[]
  createdAt   DateTime @default(now())

  sessions    PerceptionSession[]
  questions   PerceptionQuestion[]

  @@map("perception_passages")
}

// 이해도 문제
model PerceptionQuestion {
  id         String   @id @default(cuid())
  passageId  String
  type       String   // "주제 파악", "세부 내용", etc.
  text       String   @db.Text
  options    Json     // [{ id: 1, text: "..." }]
  correctAnswer Int
  order      Int

  passage    PerceptionPassage @relation(fields: [passageId], references: [id])
  answers    PerceptionAnswer[]

  @@map("perception_questions")
}

// 시선 데이터 (Time-series)
model PerceptionGazeData {
  id          String   @id @default(cuid())
  sessionId   String
  phase       String   // "reading" | "question"
  timestamp   BigInt   // ms
  gazeX       Float
  gazeY       Float
  confidence  Float
  lineNumber  Int?
  wordIndex   Int?
  questionId  String?

  session     PerceptionSession @relation(fields: [sessionId], references: [id])

  @@map("perception_gaze_data")
  @@index([sessionId, timestamp])
}

// 문제 답변
model PerceptionAnswer {
  id              String   @id @default(cuid())
  sessionId       String
  questionId      String
  selectedAnswer  Int
  isCorrect       Boolean
  timeTaken       Int      // ms
  gazeMetrics     Json     // QuestionGazeData

  question        PerceptionQuestion @relation(fields: [questionId], references: [id])

  @@map("perception_answers")
}

// 결과 분석
model PerceptionResult {
  id                  String   @id @default(cuid())
  sessionId           String   @unique

  // 읽기 분석
  totalReadingTime    Int      // ms
  averageReadingSpeed Float    // wpm
  fixationCount       Int
  regressionCount     Int
  concentrationScore  Json     // ConcentrationMetrics

  // 이해도 분석
  totalQuestions      Int
  correctAnswers      Int
  comprehensionAccuracy Float  // %
  avgTimePerQuestion  Int      // ms
  questionConcentration Float

  // 종합 점수
  readingAbility      Float    // 0-100
  comprehension       Float    // 0-100
  concentration       Float    // 0-100
  totalScore          Float    // 0-100

  createdAt           DateTime @default(now())

  session             PerceptionSession @relation(fields: [sessionId], references: [id])

  @@map("perception_results")
}
```

---

## 8. UI/UX 설계

### 8.1 화면 구성

#### 8.1.1 시작 화면
```
┌─────────────────────────────────────────┐
│   시지각 테스트                          │
│   2학년 독해력 & 집중력 평가             │
│                                          │
│   📚 준비사항:                           │
│   • 웹캠 활성화                          │
│   • 밝은 환경                            │
│   • 화면에서 50-70cm 거리                │
│                                          │
│   ⏱️ 소요 시간: 약 10분                  │
│                                          │
│   [시작하기]  [취소]                     │
└─────────────────────────────────────────┘
```

#### 8.1.2 캘리브레이션 화면
```
┌─────────────────────────────────────────┐
│   캘리브레이션 (1/9)                     │
│                                          │
│                                          │
│              🎯                          │  ← 순차적으로 9개 포인트
│                                          │
│                                          │
│   화면의 빨간 점을 차례로 바라보세요     │
└─────────────────────────────────────────┘
```

#### 8.1.3 지문 읽기 화면
```
┌─────────────────────────────────────────┐
│   [카메라 피드 - 작은 미리보기]          │  ← 우측 상단 작게
│                                          │
│   동물의 겨울나기                        │
│                                          │
│   겨울이 되면 동물들은 추운 날씨를       │
│   견디기 위해 다양한 방법을 사용합니다.  │
│   곰은 겨울잠을 자고, 철새는 따뜻한      │
│   남쪽으로 날아갑니다...                 │
│                                          │  ← 시선 추적 중 (보이지 않음)
│   [읽기 완료] 버튼 (2분 후 활성화)       │
└─────────────────────────────────────────┘
```

#### 8.1.4 문제 풀이 화면
```
┌─────────────────────────────────────────┐
│   문제 1/5                               │
│                                          │
│   이 글의 주제는 무엇인가요?             │
│                                          │
│   ○ 1. 동물의 먹이                       │
│   ○ 2. 동물의 겨울나기                   │  ← 시선 추적 중
│   ○ 3. 동물의 집                         │
│   ○ 4. 동물의 새끼                       │
│                                          │
│   [다음]                                 │
└─────────────────────────────────────────┘
```

#### 8.1.5 결과 화면
```
┌─────────────────────────────────────────┐
│   테스트 완료!                           │
│                                          │
│   📊 종합 점수: 85점                     │
│                                          │
│   읽기 능력:    ████████░░ 82점          │
│   이해도:       █████████░ 90점          │
│   집중력:       ████████░░ 83점          │
│                                          │
│   🎯 강점:                               │
│   • 글을 꼼꼼히 읽었어요                 │
│   • 문제를 신중하게 풀었어요             │
│                                          │
│   💡 개선 포인트:                        │
│   • 읽기 속도를 조금 높여보세요          │
│                                          │
│   [상세 결과 보기]  [완료]               │
└─────────────────────────────────────────┘
```

### 8.2 반응형 디자인
- **Desktop**: 1920x1080 최적화 (주 타겟)
- **Tablet**: 1024x768 이상 지원
- **Mobile**: 미지원 (카메라 거리 및 정확도 문제)

### 8.3 접근성
- **색상 대비**: WCAG AA 준수 (4.5:1 이상)
- **폰트 크기**: 24px (2학년 읽기 적정)
- **키보드 탐색**: Tab + Enter 지원
- **화면 읽기 프로그램**: ARIA 레이블 적용

---

## 9. 개발 로드맵

### Phase 1: 백엔드 API 개발 (2주)
- [x] ~~Vision Test 기술 스택 분석~~
- [ ] `app/perception/` 모듈 생성
- [ ] REST API 엔드포인트 구현
- [ ] WebSocket 핸들러 구현
- [ ] 집중력 계산 알고리즘 구현
- [ ] 데이터베이스 마이그레이션
- [ ] 2학년 지문 & 문제 데이터 준비 (10개 세트)

### Phase 2: 프론트엔드 UI 개발 (2주)
- [ ] `VisualPerceptionTest.tsx` 페이지 생성
- [ ] 캘리브레이션 컴포넌트 재사용
- [ ] 지문 읽기 화면 구현
- [ ] 문제 풀이 화면 구현
- [ ] 결과 화면 구현
- [ ] WebSocket 실시간 시선 데이터 통합
- [ ] 반응형 디자인 적용

### Phase 3: 통합 테스트 (1주)
- [ ] E2E 테스트 시나리오 작성
- [ ] 집중력 알고리즘 검증
- [ ] 성능 최적화 (FPS 30 유지)
- [ ] 버그 수정
- [ ] 사용자 피드백 반영

### Phase 4: 배포 & 운영 (1주)
- [ ] Render.com 배포 (Python 백엔드)
- [ ] Netlify 배포 (프론트엔드)
- [ ] 모니터링 설정
- [ ] 문서화 완료
- [ ] Production 런칭

**총 예상 기간**: 6주

---

## 10. 참고 자료

### 기술 문서
- [MediaPipe Face Mesh](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md)
- [OpenCV Python](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)
- [FastAPI WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)
- [Prisma ORM](https://www.prisma.io/docs/)

### 학술 자료
- Eye Tracking in Reading Research
- Concentration Metrics in Educational Assessment
- Visual Perception in Elementary Education

### 기존 프로젝트 파일
- `backend/app/vision/tracker.py` - JEO 시선추적 엔진
- `backend/app/english_test/` - English Literacy Test 통합 참고
- `frontend/src/pages/test/VisionTest.tsx` - Vision Test UI 참고

---

**작성자**: Claude + User
**최종 수정**: 2025-11-11
**문서 버전**: 1.0.0
**상태**: ✅ 설계 완료, 개발 준비 완료
