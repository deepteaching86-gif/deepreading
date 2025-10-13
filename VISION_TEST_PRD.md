# VISION TEST 템플릿 개발 PRD
## Product Requirements Document

**버전**: 1.0
**최종 수정일**: 2025-01-14
**대상 학년**: 초등학교 2학년 (향후 확장 가능)
**프로젝트명**: 시선 추적 기반 문해력 진단 시스템

---

## 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [백엔드 API 설계](#5-백엔드-api-설계)
6. [프론트엔드 구조](#6-프론트엔드-구조)
7. [핵심 기능 명세](#7-핵심-기능-명세)
8. [사용자 플로우](#8-사용자-플로우)
9. [관리자 기능](#9-관리자-기능)
10. [성능 요구사항](#10-성능-요구사항)
11. [보안 및 개인정보](#11-보안-및-개인정보)
12. [개발 로드맵](#12-개발-로드맵)

---

## 1. 개요

### 1.1 목적
기존 문해력 테스트에 시선 추적(Eye-Tracking) 기술을 통합하여 학생들의 읽기 과정을 실시간으로 분석하고, 읽기 능력에 대한 심층적인 진단을 제공한다.

### 1.2 핵심 가치
- **정량적 읽기 분석**: 시선 도약폭, 응시 시간, 역행 비율 등 15개 메트릭 측정
- **시각화**: 시선 경로 재생, 히트맵, 3D 시선 흐름
- **AI 분석**: 읽기 전략 분석, 개인 맞춤 진단 및 학습 처방
- **비교 분석**: 시계열 비교, 학생 간 비교

### 1.3 범위
- **Phase 1**: 초등 2학년용 VISION TEST 템플릿 구현
- **Phase 2**: 다른 학년 확장 및 고급 기능 추가
- **Phase 3**: 실시간 학습 개입 및 AI 고도화

### 1.4 제외 사항
- 전용 하드웨어는 사용하지 않음 (웹캠/태블릿 카메라만 사용)
- 별도 앱 개발하지 않음 (기존 웹에 통합)

---

## 2. 기술 스택

### 2.1 프론트엔드
```typescript
{
  "framework": "React 18 + TypeScript",
  "styling": "Tailwind CSS (디자인 시스템 적용)",
  "eyeTracking": "TensorFlow.js + MediaPipe Face Mesh",
  "visualization": {
    "2D": "HTML5 Canvas API",
    "charts": "Chart.js",
    "3D": "Three.js (React Three Fiber)"
  },
  "state": "React Context API + useState/useReducer",
  "routing": "React Router v6"
}
```

### 2.2 백엔드
```typescript
{
  "runtime": "Node.js 20 + Express",
  "language": "TypeScript",
  "database": "PostgreSQL (Prisma ORM)",
  "fileStorage": "Local filesystem (향후 S3 확장 가능)",
  "auth": "JWT + bcrypt"
}
```

### 2.3 인프라
```yaml
hosting: "Render (기존 환경 유지)"
database: "Supabase PostgreSQL"
cdn: "Render CDN"
monitoring: "Render 기본 모니터링"
```

---

## 3. 시스템 아키텍처

### 3.1 전체 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                      클라이언트 (브라우저)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ React UI      │  │ TensorFlow.js│  │ MediaPipe    │     │
│  │ Components    │  │ + Face Mesh  │  │ (시선 추적)   │     │
│  └───────────────┘  └──────────────┘  └──────────────┘     │
│         │                   │                  │             │
│         └───────────────────┴──────────────────┘             │
│                             │                                │
│                    ┌────────▼────────┐                       │
│                    │  Gaze Processor │                       │
│                    │  (시선 데이터    │                       │
│                    │   실시간 처리)   │                       │
│                    └────────┬────────┘                       │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │ HTTPS
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                      백엔드 서버 (Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              REST API Endpoints                      │    │
│  │  /api/v1/vision/...                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │           비즈니스 로직 레이어                         │    │
│  │  - Calibration Manager                              │    │
│  │  - Gaze Data Analyzer                               │    │
│  │  - Metrics Calculator (15개 메트릭)                  │    │
│  │  - AI Analysis Engine                               │    │
│  └──────┬──────────────────────────────────────────────┘    │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │           데이터 접근 레이어 (Prisma)                 │    │
│  └──────┬──────────────────────────────────────────────┘    │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                   PostgreSQL Database                          │
│  - TestTemplate (vision 타입 추가)                             │
│  - VisionTestSession (시선 추적 세션)                          │
│  - VisionGazeData (원본 시선 데이터)                           │
│  - VisionMetrics (계산된 15개 메트릭)                          │
│  - VisionCalibration (캘리브레이션 데이터)                     │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 데이터 흐름

#### 테스트 진행 시
```
1. 학생 로그인 → 2. Vision 템플릿 선택
       ↓
3. 환경 체크 (카메라, 조명, 거리)
       ↓
4. 캘리브레이션 (9포인트, 정확도 >70%)
       ↓
5. 읽기 지문 제시 + 실시간 시선 추적
       ↓
6. 문제 풀이 (지문 토글 옵션)
       ↓
7. 시선 데이터 + 답안 제출
       ↓
8. 백엔드: 메트릭 계산 + AI 분석
       ↓
9. 결과 리포트 생성 (시각화 포함)
```

#### 관리자 리포트 조회 시
```
1. 관리자 로그인 → 2. Vision Analytics 선택
       ↓
3. 학생/세션 선택
       ↓
4. 백엔드: 저장된 시선 데이터 + 메트릭 조회
       ↓
5. 시선 경로 재생 + 시각화 렌더링
       ↓
6. 수동 보정 (필요시)
       ↓
7. 보정된 데이터 재계산 및 저장
```

---

## 4. 데이터베이스 설계

### 4.1 스키마 확장

```prisma
// ===================================
// 기존 모델 확장
// ===================================

model TestTemplate {
  id                String   @id @default(cuid())
  code              String   @unique        // 예: "VISION_G2_001"
  title             String
  grade             Int
  category          String
  description       String?

  // Vision 템플릿 여부
  templateType      String   @default("standard")  // "standard" | "vision"
  visionConfig      Json?    // Vision 전용 설정

  questions         Question[]
  testSessions      TestSession[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([templateType])
}

// VisionConfig 구조 (JSON)
interface VisionConfig {
  enableEyeTracking: boolean;
  targetGrade: number;
  calibrationPoints: number;           // 기본 9개
  passages: Array<{
    id: string;
    text: string;
    fontSize: number;                  // 학년별 조정
    lineHeight: number;
    difficulty: number;
    expectedWPM: number;
    showPassageWithQuestions: boolean; // 지문-문제 토글
  }>;
  expectedMetrics: {
    saccade: [number, number];
    fixation: [number, number];
    regression: number;
    wpm: [number, number];
  };
}

// ===================================
// 새로운 Vision 전용 모델
// ===================================

// 1. Vision 테스트 세션
model VisionTestSession {
  id                String   @id @default(cuid())
  sessionId         String   @unique       // TestSession과 1:1 연결
  session           TestSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  // 환경 체크 데이터
  environmentCheck  Json     // { cameraOk, lightingOk, distanceOk, faceDetected }

  // 캘리브레이션 데이터
  calibrationId     String?
  calibration       VisionCalibration? @relation(fields: [calibrationId], references: [id])
  calibrationScore  Float?   // 캘리브레이션 정확도 (0-100)

  // 시선 추적 원본 데이터 (별도 테이블 참조)
  gazeData          VisionGazeData[]

  // 계산된 메트릭 (별도 테이블 참조)
  metrics           VisionMetrics?

  // 분석 결과
  aiAnalysis        Json?    // AI 분석 결과
  readingStrategy   String?  // "detailed" | "scanning" | "skimming" | "mixed"

  // 시각화 데이터
  heatmapData       Json?    // 히트맵 생성용 데이터
  attentionZones    Json?    // 주의력 영역 분석

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([sessionId])
}

// 2. 시선 데이터 (대용량)
model VisionGazeData {
  id                String   @id @default(cuid())
  visionSessionId   String
  visionSession     VisionTestSession @relation(fields: [visionSessionId], references: [id], onDelete: Cascade)

  // 시선 좌표 (배열로 저장)
  gazePoints        Json     // [{ timestamp, x, y, confidence, type }, ...]

  // 메타 정보
  passageId         String   // 어느 지문의 시선 데이터인지
  startTime         DateTime
  endTime           DateTime
  totalPoints       Int      // 데이터 포인트 개수

  createdAt         DateTime @default(now())

  @@index([visionSessionId])
  @@index([passageId])
}

// GazePoint 구조 (JSON 배열 내부)
interface GazePoint {
  timestamp: number;          // 밀리초
  x: number;                  // 픽셀 좌표
  y: number;                  // 픽셀 좌표
  confidence: number;         // 0-1
  type: 'fixation' | 'saccade' | 'blink';
  duration?: number;          // 응시 시간 (fixation인 경우)
}

// 3. 계산된 메트릭 (15개)
model VisionMetrics {
  id                String   @id @default(cuid())
  visionSessionId   String   @unique
  visionSession     VisionTestSession @relation(fields: [visionSessionId], references: [id], onDelete: Cascade)

  // A. 시선 이동 패턴 (6개)
  // A1. 시선 도약폭
  averageSaccade    Float
  saccadeVariability Float
  forwardSaccadeLength Float
  regressionSaccadeLength Float
  optimalSaccadeRate Float

  // A2. 시선 도약 속도
  averageVelocity   Float
  peakVelocity      Float

  // A3. 시선 정착률
  optimalLandingRate Float
  refixationRate    Float

  // A4. 줄 추적 정확도
  returnSweepAccuracy Float
  lineSkipRate      Float

  // A5. 시선 안정성
  blinkRate         Float
  attentionScore    Float
  fatigueIndicator  Float

  // A6. 시선 경로 효율성
  scanPathEfficiency Float
  sequentialReadingRate Float

  // B. 응시 행동 (4개)
  // B1. 응시 시간 분포
  averageFixation   Float
  fixationsPerWord  Float

  // B2. 응시 밀도
  fixationsPerLine  Float
  readingCoverageScore Float

  // B3. 응시 순서 패턴
  regressionRate    Float
  regressionQualityScore Float

  // B4. 응시 클러스터링
  vocabularyGapScore Float

  // C. 읽기 속도 및 리듬 (3개)
  // C1. 읽기 속도
  wordsPerMinute    Float
  comprehensionAdjustedWPM Float
  speedConsistencyScore Float

  // C2. 읽기 리듬
  rhythmRegularity  Float
  fluencyScore      Float

  // C3. 읽기 지구력
  speedDecayRate    Float
  staminaScore      Float

  // D. 이해 및 인지 처리 (2개)
  // D1. 이해도 연계
  gazeComprehensionCorrelation Float
  readingEfficiencyScore Float

  // D2. 인지 부하
  cognitiveLoadIndex Float
  mentalFatigueScore Float

  // 종합 점수
  overallEyeTrackingScore Float  // 0-100

  // 진단 플래그
  diagnosisFlags    Json     // { slowReader, poorComprehension, attention, ... }

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// 4. 캘리브레이션 데이터
model VisionCalibration {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // 캘리브레이션 포인트 (9개)
  calibrationPoints Json     // [{ id, x, y, gazeX, gazeY, error }, ...]

  // 정확도
  overallAccuracy   Float    // 0-100
  averageError      Float    // 픽셀 단위

  // 보정 파라미터
  transformMatrix   Json     // 좌표 변환 행렬

  // 환경 정보
  deviceInfo        Json     // { browser, screen, camera }

  // 유효성
  isValid           Boolean  @default(true)
  expiresAt         DateTime // 7일 후 만료

  // 관계
  visionSessions    VisionTestSession[]

  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([isValid, expiresAt])
}

// CalibrationPoint 구조 (JSON 배열 내부)
interface CalibrationPoint {
  id: number;                 // 1-9
  x: number;                  // 화면 좌표 (목표)
  y: number;
  gazeX: number;              // 실제 시선 좌표
  gazeY: number;
  error: number;              // 픽셀 단위 오차
  attempts: number;           // 재시도 횟수
}

// 5. 수동 보정 기록
model VisionCalibrationAdjustment {
  id                String   @id @default(cuid())
  visionSessionId   String
  adminId           String
  admin             User     @relation(fields: [adminId], references: [id])

  // 보정 전 데이터
  originalMetrics   Json

  // 보정 파라미터
  adjustments       Json     // { horizontalOffset, verticalOffset, scale, rotation }

  // 보정 후 데이터
  adjustedMetrics   Json

  // 개선도
  improvementScore  Float    // 보정으로 인한 개선 정도

  createdAt         DateTime @default(now())

  @@index([visionSessionId])
  @@index([adminId])
}
```

### 4.2 데이터 관계도

```
User
 │
 ├── TestSession
 │    │
 │    └── VisionTestSession (1:1)
 │         │
 │         ├── VisionCalibration (N:1)
 │         ├── VisionGazeData (1:N)
 │         └── VisionMetrics (1:1)
 │
 └── VisionCalibration (1:N)

TestTemplate
 │
 └── TestSession
      │
      └── VisionTestSession
```

---

## 5. 백엔드 API 설계

### 5.1 API 엔드포인트 구조

```
/api/v1/vision/
├── calibration/
│   ├── POST   /check-environment
│   ├── POST   /start
│   ├── POST   /record-point
│   ├── POST   /validate
│   └── GET    /history/:userId
├── session/
│   ├── POST   /start
│   ├── POST   /save-gaze-data
│   ├── POST   /submit
│   └── GET    /:sessionId
├── metrics/
│   ├── POST   /calculate
│   └── GET    /:sessionId
├── analysis/
│   ├── POST   /ai-analyze
│   └── GET    /:sessionId/report
├── admin/
│   ├── GET    /sessions
│   ├── GET    /session/:id/gaze-replay
│   ├── POST   /session/:id/adjust-calibration
│   └── GET    /comparison
└── templates/
    ├── GET    /
    ├── POST   /
    ├── PUT    /:id
    └── DELETE /:id
```

### 5.2 상세 API 명세

#### 5.2.1 캘리브레이션 API

**POST /api/v1/vision/calibration/check-environment**
```typescript
// 환경 체크 (카메라, 조명, 거리)
Request: {
  userId: string;
  videoDeviceId: string;
}

Response: {
  success: boolean;
  checks: {
    cameraAccess: boolean;
    lightingLevel: number;        // 0-100
    faceDetected: boolean;
    eyesDetected: boolean;
    distanceEstimate: number;     // cm
    recommendations: string[];
  };
}
```

**POST /api/v1/vision/calibration/start**
```typescript
// 캘리브레이션 세션 시작
Request: {
  userId: string;
  deviceInfo: {
    browser: string;
    screenWidth: number;
    screenHeight: number;
    cameraResolution: string;
  };
}

Response: {
  success: boolean;
  calibrationId: string;
  points: Array<{ id: number; x: number; y: number }>;
}
```

**POST /api/v1/vision/calibration/record-point**
```typescript
// 캘리브레이션 포인트 기록
Request: {
  calibrationId: string;
  pointId: number;              // 1-9
  gazeData: Array<{
    timestamp: number;
    x: number;
    y: number;
    confidence: number;
  }>;
}

Response: {
  success: boolean;
  pointAccuracy: number;
  averageGaze: { x: number; y: number };
  error: number;                // 픽셀 단위
}
```

**POST /api/v1/vision/calibration/validate**
```typescript
// 캘리브레이션 검증 및 완료
Request: {
  calibrationId: string;
}

Response: {
  success: boolean;
  overallAccuracy: number;      // 0-100
  averageError: number;         // 픽셀
  transformMatrix: number[][];
  isValid: boolean;
  recommendations?: string[];   // 정확도 낮을 때 재캘리 권장
}
```

#### 5.2.2 세션 API

**POST /api/v1/vision/session/start**
```typescript
// Vision 테스트 세션 시작
Request: {
  userId: string;
  templateId: string;
  calibrationId: string;
}

Response: {
  success: boolean;
  sessionId: string;
  visionSessionId: string;
  template: {
    passages: Array<{
      id: string;
      text: string;
      fontSize: number;
      showWithQuestions: boolean;
    }>;
    questions: Question[];
  };
}
```

**POST /api/v1/vision/session/save-gaze-data**
```typescript
// 실시간 시선 데이터 저장 (청크 단위)
Request: {
  visionSessionId: string;
  passageId: string;
  gazePoints: Array<{
    timestamp: number;
    x: number;
    y: number;
    confidence: number;
    type: 'fixation' | 'saccade' | 'blink';
    duration?: number;
  }>;
}

Response: {
  success: boolean;
  saved: number;                // 저장된 포인트 개수
}
```

**POST /api/v1/vision/session/submit**
```typescript
// 테스트 제출 (답안 + 최종 시선 데이터)
Request: {
  visionSessionId: string;
  answers: Array<{
    questionId: string;
    answer: string;
    timeTaken: number;
  }>;
  finalGazeData?: GazePoint[];  // 마지막 청크
}

Response: {
  success: boolean;
  resultId: string;
  processingStatus: 'queued' | 'processing' | 'completed';
}
```

#### 5.2.3 메트릭 API

**POST /api/v1/vision/metrics/calculate**
```typescript
// 15개 메트릭 계산 (백그라운드 작업)
Request: {
  visionSessionId: string;
  textBounds: {               // 텍스트 영역 정보
    passages: Array<{
      id: string;
      bounds: { x: number; y: number; width: number; height: number };
      lines: Array<{ y: number; height: number }>;
      words: Array<{ x: number; y: number; width: number; height: number; text: string }>;
    }>;
  };
}

Response: {
  success: boolean;
  metricsId: string;
  metrics: VisionMetrics;     // 15개 메트릭 전체
}
```

#### 5.2.4 분석 API

**POST /api/v1/vision/analysis/ai-analyze**
```typescript
// AI 읽기 전략 분석
Request: {
  visionSessionId: string;
}

Response: {
  success: boolean;
  analysis: {
    strategyType: 'detailed' | 'scanning' | 'skimming' | 'mixed';
    effectiveness: {
      timeEfficiency: number;
      comprehensionQuality: number;
      strategyMatch: number;
    };
    recommendations: Array<{
      strategy: string;
      reason: string;
      expectedImprovement: number;
    }>;
    strengths: string[];
    weaknesses: string[];
  };
}
```

**GET /api/v1/vision/analysis/:sessionId/report**
```typescript
// 종합 리포트 조회
Response: {
  success: boolean;
  report: {
    student: StudentInfo;
    test: TestInfo;
    overall: {
      eyeTrackingScore: number;
      comprehensionScore: number;
      gradeLevel: number;
    };
    metrics: VisionMetrics;
    analysis: AIAnalysis;
    visualizations: {
      heatmapUrl: string;
      gazePathData: GazePoint[];
      attentionZones: AttentionZone[];
    };
  };
}
```

#### 5.2.5 관리자 API

**GET /api/v1/vision/admin/sessions**
```typescript
// Vision 세션 목록 조회 (필터링)
Query: {
  grade?: number;
  startDate?: string;
  endDate?: string;
  studentId?: string;
}

Response: {
  success: boolean;
  sessions: Array<{
    id: string;
    studentName: string;
    grade: number;
    templateCode: string;
    completedAt: string;
    eyeTrackingScore: number;
    comprehensionScore: number;
  }>;
  total: number;
}
```

**GET /api/v1/vision/admin/session/:id/gaze-replay**
```typescript
// 시선 경로 재생용 데이터
Response: {
  success: boolean;
  replayData: {
    passage: {
      text: string;
      bounds: TextBounds;
    };
    gazePoints: GazePoint[];
    events: Array<{             // 주요 이벤트
      timestamp: number;
      type: 'regression' | 'long_fixation' | 'line_skip' | 'off_page';
      severity: 'low' | 'medium' | 'high';
      location: { x: number; y: number };
    }>;
    duration: number;
    fps: number;
  };
}
```

**POST /api/v1/vision/admin/session/:id/adjust-calibration**
```typescript
// 수동 보정 적용
Request: {
  adjustments: {
    horizontalOffset: number;
    verticalOffset: number;
    horizontalScale: number;
    verticalScale: number;
    rotation: number;
  };
  adminId: string;
}

Response: {
  success: boolean;
  adjustedMetrics: VisionMetrics;
  improvementScore: number;
}
```

#### 5.2.6 템플릿 관리 API

**GET /api/v1/vision/templates**
```typescript
// Vision 템플릿 목록
Query: {
  grade?: number;
}

Response: {
  success: boolean;
  templates: Array<{
    id: string;
    code: string;
    title: string;
    grade: number;
    visionConfig: VisionConfig;
  }>;
}
```

**POST /api/v1/vision/templates**
```typescript
// Vision 템플릿 생성
Request: {
  code: string;
  title: string;
  grade: number;
  visionConfig: VisionConfig;
  passages: Array<{
    text: string;
    showWithQuestions: boolean;
  }>;
  questions: Array<QuestionData>;
}

Response: {
  success: boolean;
  templateId: string;
}
```

---

## 6. 프론트엔드 구조

### 6.1 디렉토리 구조

```
frontend/src/
├── pages/
│   ├── student/
│   │   ├── VisionTest/
│   │   │   ├── EnvironmentCheck.tsx
│   │   │   ├── Calibration.tsx
│   │   │   ├── ReadingTest.tsx
│   │   │   ├── Questions.tsx
│   │   │   └── VisionResult.tsx
│   │   └── VisionTestContainer.tsx
│   └── admin/
│       ├── VisionAnalytics.tsx
│       ├── VisionReplay.tsx
│       ├── VisionCalibrationAdjust.tsx
│       ├── VisionComparison.tsx
│       └── VisionTemplateManagement.tsx
├── components/
│   ├── vision/
│   │   ├── EyeTracker/
│   │   │   ├── FaceMeshLoader.tsx
│   │   │   ├── GazeCalculator.ts
│   │   │   └── GazeVisualizer.tsx
│   │   ├── Calibration/
│   │   │   ├── CalibrationGrid.tsx
│   │   │   ├── CalibrationPoint.tsx
│   │   │   └── AccuracyIndicator.tsx
│   │   ├── Replay/
│   │   │   ├── GazeReplayPlayer.tsx
│   │   │   ├── GazePathCanvas.tsx
│   │   │   ├── HeatmapLayer.tsx
│   │   │   └── TimelineControl.tsx
│   │   ├── Visualization/
│   │   │   ├── AttentionHeatmap.tsx
│   │   │   ├── GazePath3D.tsx
│   │   │   └── MetricsChart.tsx
│   │   └── Analysis/
│   │       ├── StrategyAnalysis.tsx
│   │       ├── ComparisonView.tsx
│   │       └── AICommentary.tsx
│   └── shared/
│       └── (기존 공통 컴포넌트)
├── hooks/
│   ├── useEyeTracking.ts
│   ├── useCalibration.ts
│   ├── useGazeRecorder.ts
│   └── useVisionMetrics.ts
├── services/
│   ├── visionApi.ts
│   ├── gazeProcessor.ts
│   └── metricsCalculator.ts
├── types/
│   └── vision.ts
└── utils/
    ├── gazeUtils.ts
    └── visualizationUtils.ts
```

### 6.2 핵심 TypeScript 타입 정의

```typescript
// types/vision.ts

// 시선 데이터 포인트
export interface GazePoint {
  timestamp: number;
  x: number;
  y: number;
  confidence: number;
  type: 'fixation' | 'saccade' | 'blink';
  duration?: number;
}

// 캘리브레이션 포인트
export interface CalibrationPoint {
  id: number;
  x: number;
  y: number;
  gazeX?: number;
  gazeY?: number;
  error?: number;
  status: 'pending' | 'recording' | 'complete';
}

// Vision 템플릿 설정
export interface VisionConfig {
  enableEyeTracking: boolean;
  targetGrade: number;
  calibrationPoints: number;
  passages: VisionPassage[];
  expectedMetrics: {
    saccade: [number, number];
    fixation: [number, number];
    regression: number;
    wpm: [number, number];
  };
}

// 읽기 지문
export interface VisionPassage {
  id: string;
  text: string;
  fontSize: number;
  lineHeight: number;
  difficulty: number;
  expectedWPM: number;
  showPassageWithQuestions: boolean;  // 지문-문제 토글
}

// 텍스트 영역 정보
export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  lines: Array<{
    y: number;
    height: number;
  }>;
  words: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }>;
}

// 15개 메트릭
export interface VisionMetrics {
  // A. 시선 이동 패턴
  averageSaccade: number;
  saccadeVariability: number;
  averageVelocity: number;
  optimalLandingRate: number;
  returnSweepAccuracy: number;
  blinkRate: number;
  scanPathEfficiency: number;

  // B. 응시 행동
  averageFixation: number;
  fixationsPerWord: number;
  fixationsPerLine: number;
  regressionRate: number;
  vocabularyGapScore: number;

  // C. 읽기 속도 및 리듬
  wordsPerMinute: number;
  comprehensionAdjustedWPM: number;
  rhythmRegularity: number;
  staminaScore: number;

  // D. 이해 및 인지 처리
  gazeComprehensionCorrelation: number;
  cognitiveLoadIndex: number;

  // 종합
  overallEyeTrackingScore: number;
}

// AI 분석 결과
export interface AIAnalysis {
  strategyType: 'detailed' | 'scanning' | 'skimming' | 'mixed';
  effectiveness: {
    timeEfficiency: number;
    comprehensionQuality: number;
    strategyMatch: number;
  };
  recommendations: Array<{
    strategy: string;
    reason: string;
    expectedImprovement: number;
  }>;
  strengths: string[];
  weaknesses: string[];
}

// 재생용 데이터
export interface GazeReplayData {
  passage: {
    text: string;
    bounds: TextBounds;
  };
  gazePoints: GazePoint[];
  events: Array<{
    timestamp: number;
    type: 'regression' | 'long_fixation' | 'line_skip' | 'off_page';
    severity: 'low' | 'medium' | 'high';
    location: { x: number; y: number };
  }>;
  duration: number;
  fps: number;
}
```

---

## 7. 핵심 기능 명세

### 7.1 환경 체크 (Environment Check)

**목적**: 시선 추적에 적합한 환경인지 검증

**체크 항목**:
1. 카메라 접근 권한
2. 얼굴 감지 성공 여부
3. 눈동자 감지 성공 여부
4. 조명 수준 (너무 어둡거나 밝지 않은지)
5. 화면-눈 거리 추정 (30-50cm 권장)

**UI 요소**:
- 실시간 비디오 피드백
- 체크리스트 (✅/❌)
- 경고 메시지 및 권장사항
- "테스트 시작" 버튼 (모든 체크 통과 시 활성화)

**기술 구현**:
```typescript
// MediaPipe Face Mesh로 얼굴 랜드마크 감지
const faceMesh = new FaceMesh({
  refineLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// 환경 체크 로직
async function checkEnvironment() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement('video');
  video.srcObject = stream;

  faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // 눈동자 랜드마크 확인 (468-478: 좌안, 473-478: 우안)
      const leftEye = landmarks.slice(468, 478);
      const rightEye = landmarks.slice(473, 478);

      const checks = {
        faceDetected: true,
        eyesDetected: leftEye.length > 0 && rightEye.length > 0,
        distance: estimateDistance(landmarks),
        lighting: estimateLighting(video)
      };

      return checks;
    }
  });
}
```

---

### 7.2 캘리브레이션 (Calibration)

**목적**: 개인별 시선 추적 정확도 향상을 위한 보정

**프로세스**:
1. 9포인트 그리드 표시 (3x3)
2. 각 포인트에 순차적으로 시선 고정 (2초)
3. 시선 데이터 수집 및 오차 계산
4. 전체 정확도 평가 (목표: >70%)
5. 정확도 미달 시 재캘리브레이션 권장

**UI 요소**:
- 3x3 그리드
- 현재 활성 포인트 강조 (펄스 애니메이션)
- 진행률 표시 (1/9, 2/9, ...)
- 포인트별 정확도 피드백
- 전체 정확도 게이지

**정확도 계산**:
```typescript
function calculateCalibrationAccuracy(
  targetPoint: { x: number; y: number },
  gazePoints: Array<{ x: number; y: number }>
): number {
  // 평균 시선 위치
  const avgGaze = {
    x: gazePoints.reduce((sum, p) => sum + p.x, 0) / gazePoints.length,
    y: gazePoints.reduce((sum, p) => sum + p.y, 0) / gazePoints.length
  };

  // 유클리드 거리 (픽셀)
  const error = Math.sqrt(
    Math.pow(targetPoint.x - avgGaze.x, 2) +
    Math.pow(targetPoint.y - avgGaze.y, 2)
  );

  // 정확도 점수 (100 - 오차 비율)
  // 오차 0px = 100점, 오차 200px = 0점
  const accuracy = Math.max(0, 100 - (error / 200) * 100);

  return accuracy;
}
```

**변환 행렬 계산**:
```typescript
// 최소자승법으로 좌표 변환 행렬 계산
function calculateTransformMatrix(
  calibrationPoints: CalibrationPoint[]
): number[][] {
  // Affine transformation matrix
  // [x'] = [a b c] [x]
  // [y']   [d e f] [y]
  //                [1]

  // 최소자승법 (Least Squares) 적용
  // ...구현 생략 (수학 라이브러리 사용 권장)

  return transformMatrix;
}
```

---

### 7.3 실시간 시선 추적 (Real-time Gaze Tracking)

**목적**: 읽기 중 시선 데이터 실시간 수집

**데이터 수집**:
- 샘플링 레이트: 30-60 FPS
- 데이터 포인트: timestamp, x, y, confidence
- 분류: fixation(응시), saccade(도약), blink(깜빡임)

**청크 단위 저장**:
```typescript
// 5초마다 또는 1000개 포인트마다 서버에 전송
const CHUNK_SIZE = 1000;
const CHUNK_INTERVAL = 5000; // 5초

let gazeBuffer: GazePoint[] = [];

function recordGazePoint(point: GazePoint) {
  gazeBuffer.push(point);

  if (gazeBuffer.length >= CHUNK_SIZE) {
    sendGazeChunk();
  }
}

async function sendGazeChunk() {
  if (gazeBuffer.length === 0) return;

  await fetch('/api/v1/vision/session/save-gaze-data', {
    method: 'POST',
    body: JSON.stringify({
      visionSessionId: currentSessionId,
      passageId: currentPassageId,
      gazePoints: gazeBuffer
    })
  });

  gazeBuffer = [];
}
```

**시선 분류 알고리즘**:
```typescript
function classifyGazeType(
  currentPoint: { x: number; y: number; timestamp: number },
  previousPoint: { x: number; y: number; timestamp: number }
): 'fixation' | 'saccade' | 'blink' {
  const distance = calculateDistance(currentPoint, previousPoint);
  const timeDiff = currentPoint.timestamp - previousPoint.timestamp;
  const velocity = distance / timeDiff; // px/ms

  // 깜빡임 감지 (confidence 급격히 하락)
  if (currentPoint.confidence < 0.3) {
    return 'blink';
  }

  // 도약 감지 (빠른 이동)
  if (velocity > 0.5) { // 0.5px/ms 이상
    return 'saccade';
  }

  // 응시 (느린 이동 또는 정지)
  return 'fixation';
}
```

---

### 7.4 지문-문제 토글 기능

**목적**: 읽기 전략 평가 (지문 참조 vs 기억 의존)

**구현**:
```typescript
interface VisionPassage {
  showPassageWithQuestions: boolean; // 관리자가 설정
}

// 학생 화면 렌더링 로직
function renderTestScreen(passage: VisionPassage, questions: Question[]) {
  if (passage.showPassageWithQuestions) {
    // 기본 모드: 지문과 문제 동시 표시
    return (
      <div className="grid grid-cols-2 gap-6">
        <PassagePanel text={passage.text} />
        <QuestionPanel questions={questions} />
      </div>
    );
  } else {
    // 토글 모드: 지문 → 버튼 → 문제 (지문 숨김)
    return currentScreen === 'passage' ? (
      <div>
        <PassagePanel text={passage.text} />
        <Button onClick={() => setCurrentScreen('questions')}>
          문제 풀기
        </Button>
      </div>
    ) : (
      <QuestionPanel questions={questions} />
    );
  }
}
```

**관리자 설정 UI**:
```tsx
<ToggleSwitch
  label="읽기 지문을 문제와 함께 표시"
  checked={showPassageWithQuestions}
  onChange={setShowPassageWithQuestions}
  description="OFF: 지문 읽기 → 문제 풀기 (기억력 평가)"
/>
```

---

### 7.5 시선 경로 재생 (Gaze Replay)

**기능**:
- 실제 읽기 과정 재현
- 재생 속도 조절 (0.25x ~ 10x)
- 시선 경로 색상 코딩
- 응시 원 크기 비례
- 타임라인 시크
- 이벤트 마커 (역행, 이탈 등)

**Canvas 렌더링**:
```typescript
function renderGazeReplay(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  gazeData: GazePoint[],
  textBounds: TextBounds
) {
  // 1. 텍스트 레이어 (배경)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawText(ctx, textBounds);

  // 2. 현재 시간까지의 시선 경로
  const visiblePoints = gazeData.filter(p => p.timestamp <= currentTime);

  // 3. 시선 경로 선 그리기
  for (let i = 1; i < visiblePoints.length; i++) {
    const from = visiblePoints[i - 1];
    const to = visiblePoints[i];

    // 시선 유형에 따라 색상 결정
    const color = getPathColor(from, to, textBounds);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  // 4. 응시 원 그리기
  const fixations = visiblePoints.filter(p => p.type === 'fixation');
  fixations.forEach(fixation => {
    const radius = calculateCircleRadius(fixation.duration);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(fixation.x, fixation.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // 5. 현재 시선 위치 (펄스 효과)
  const currentPoint = visiblePoints[visiblePoints.length - 1];
  if (currentPoint) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.beginPath();
    ctx.arc(currentPoint.x, currentPoint.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getPathColor(
  from: GazePoint,
  to: GazePoint,
  textBounds: TextBounds
): string {
  const type = classifyGaze(from, to, textBounds);

  const colors = {
    normal: '#10b981',           // 초록색
    regression: '#f59e0b',       // 주황색
    longRegression: '#ef4444',   // 빨간색
    offPage: '#9ca3af',          // 회색
    lineSkip: '#ec4899'          // 분홍색
  };

  return colors[type] || colors.normal;
}
```

---

### 7.6 수동 보정 UI (Manual Calibration Adjustment)

**기능**:
- 시선 데이터 좌우/상하 이동
- 가로/세로 스케일 조정
- 회전 조정
- 실시간 미리보기
- AI 자동 보정 제안

**UI 구조**:
```tsx
<CalibrationAdjustmentPanel>
  {/* 분할 화면 */}
  <div className="grid grid-cols-2 gap-6">
    {/* 원본 */}
    <PreviewCanvas
      title="보정 전"
      gazeData={originalGazeData}
      textBounds={textBounds}
    />

    {/* 보정 후 */}
    <PreviewCanvas
      title="보정 후"
      gazeData={adjustedGazeData}
      textBounds={textBounds}
    />
  </div>

  {/* 조정 컨트롤 */}
  <div className="space-y-4">
    <Slider
      label="좌우 이동"
      value={horizontalOffset}
      onChange={setHorizontalOffset}
      min={-200}
      max={200}
      unit="px"
    />

    <Slider
      label="상하 이동"
      value={verticalOffset}
      onChange={setVerticalOffset}
      min={-200}
      max={200}
      unit="px"
    />

    <Slider
      label="가로 스케일"
      value={horizontalScale}
      onChange={setHorizontalScale}
      min={0.5}
      max={2.0}
      step={0.01}
    />

    <Button onClick={runAutoCalibration}>
      🤖 AI 자동 보정
    </Button>
  </div>

  {/* 정확도 통계 */}
  <AccuracyStats
    onTextRate={calculateOnTextRate(adjustedGazeData)}
    lineAlignment={calculateLineAlignment(adjustedGazeData)}
  />
</CalibrationAdjustmentPanel>
```

**자동 보정 알고리즘**:
```typescript
async function runAutoCalibration(
  gazeData: GazePoint[],
  textBounds: TextBounds
): Promise<Adjustments> {
  // 목적 함수: 텍스트 영역 내 시선 비율 최대화
  function objective(adjustments: Adjustments): number {
    const adjusted = gazeData.map(p => applyAdjustments(p, adjustments));
    const onTextRate = calculateOnTextRate(adjusted, textBounds);
    return -onTextRate; // 최소화 알고리즘이므로 음수화
  }

  // Nelder-Mead 최적화
  const result = await nelderMead(objective, {
    initialGuess: { horizontalOffset: 0, verticalOffset: 0, scale: 1, rotation: 0 },
    maxIterations: 1000
  });

  return result.bestSolution;
}
```

---

### 7.7 주의력 히트맵 (Attention Heatmap)

**기능**:
- 가우시안 블러 히트맵
- 주의를 끈 단어 Top 10
- 영역별 주의력 분포

**구현**:
```typescript
function generateHeatmap(
  gazeData: GazePoint[],
  canvasWidth: number,
  canvasHeight: number
): ImageData {
  // 1. 빈 히트맵 생성
  const heatmap = new Float32Array(canvasWidth * canvasHeight);

  // 2. 각 응시 지점에 가우시안 분포 적용
  gazeData
    .filter(p => p.type === 'fixation')
    .forEach(fixation => {
      const radius = 30; // 영향 반경
      const intensity = fixation.duration / 100; // 응시 시간에 비례

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > radius) continue;

          const x = Math.round(fixation.x + dx);
          const y = Math.round(fixation.y + dy);
          if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;

          // 가우시안 함수
          const gaussian = Math.exp(-(distance * distance) / (2 * (radius / 3) * (radius / 3)));
          const index = y * canvasWidth + x;
          heatmap[index] += intensity * gaussian;
        }
      }
    });

  // 3. 정규화 및 색상 매핑
  const maxValue = Math.max(...heatmap);
  const imageData = new ImageData(canvasWidth, canvasHeight);

  for (let i = 0; i < heatmap.length; i++) {
    const normalized = heatmap[i] / maxValue;
    const color = getHeatmapColor(normalized);

    imageData.data[i * 4 + 0] = color.r;
    imageData.data[i * 4 + 1] = color.g;
    imageData.data[i * 4 + 2] = color.b;
    imageData.data[i * 4 + 3] = Math.round(normalized * 255 * 0.6); // 투명도
  }

  return imageData;
}

function getHeatmapColor(value: number): { r: number; g: number; b: number } {
  // 파란색 → 노란색 → 빨간색
  if (value < 0.5) {
    // 파란색 → 노란색
    const t = value * 2;
    return {
      r: Math.round(59 + (251 - 59) * t),
      g: Math.round(130 + (191 - 130) * t),
      b: Math.round(246 - 246 * t)
    };
  } else {
    // 노란색 → 빨간색
    const t = (value - 0.5) * 2;
    return {
      r: Math.round(251 - (251 - 239) * t),
      g: Math.round(191 - (191 - 68) * t),
      b: Math.round(0 + (68 - 0) * t)
    };
  }
}
```

---

### 7.8 비교 분석 (Comparison Analysis)

**시계열 비교**:
```tsx
<TimeSeriesComparison studentId={selectedStudentId}>
  {/* 타임라인 */}
  <Timeline>
    {sessions.map(session => (
      <SessionCard
        key={session.id}
        date={session.date}
        metrics={session.metrics}
        onClick={() => selectSession(session)}
        isSelected={selectedSessions.includes(session.id)}
      />
    ))}
  </Timeline>

  {/* 선택된 세션 나란히 재생 */}
  {selectedSessions.length === 2 && (
    <SideBySidePlayer
      leftSession={selectedSessions[0]}
      rightSession={selectedSessions[1]}
      synchronized={true}
    />
  )}

  {/* 변화 그래프 */}
  <ProgressChart
    metrics={['wpm', 'regressionRate', 'comprehensionScore']}
    sessions={allSessions}
  />
</TimeSeriesComparison>
```

**학생 간 비교**:
```tsx
<PeerComparison>
  <StudentSelector
    students={classStudents}
    maxSelect={4}
    selected={selectedStudents}
  />

  {/* 4분할 화면 */}
  <div className="grid grid-cols-2 gap-4">
    {selectedStudents.map(student => (
      <div key={student.id} className="space-y-2">
        <h3 className="font-semibold">{student.name}</h3>
        <GazeReplayPlayer session={student.latestSession} />
      </div>
    ))}
  </div>

  {/* 비교 레이더 차트 */}
  <RadarChart
    students={selectedStudents}
    metrics={['speed', 'accuracy', 'efficiency', 'comprehension']}
  />
</PeerComparison>
```

---

### 7.9 AI 읽기 전략 분석

**분석 항목**:
1. 전략 분류: detailed / scanning / skimming / mixed
2. 효과성 평가: 시간 효율성, 이해도 품질, 적합도
3. 개인 맞춤 추천

**분석 로직**:
```typescript
function analyzeReadingStrategy(
  gazeData: GazePoint[],
  textBounds: TextBounds,
  comprehensionScore: number
): AIAnalysis {
  // 1. 읽기 패턴 특징 추출
  const features = {
    coverageRate: calculateCoverageRate(gazeData, textBounds),
    fixationsPerWord: calculateFixationsPerWord(gazeData, textBounds),
    regressionRate: calculateRegressionRate(gazeData),
    readingSpeed: calculateWPM(gazeData, textBounds),
    strategicSkips: detectStrategicSkips(gazeData, textBounds)
  };

  // 2. 전략 분류
  let strategyType: string;
  if (features.coverageRate > 0.9 && features.fixationsPerWord > 1.2) {
    strategyType = 'detailed'; // 정독
  } else if (features.coverageRate < 0.7 && features.readingSpeed > 200) {
    strategyType = 'skimming'; // 훑어읽기
  } else if (features.strategicSkips > 0.2) {
    strategyType = 'scanning'; // 스캐닝
  } else {
    strategyType = 'mixed'; // 혼합
  }

  // 3. 효과성 평가
  const effectiveness = {
    timeEfficiency: (features.readingSpeed / expectedWPM) * 100,
    comprehensionQuality: comprehensionScore,
    strategyMatch: evaluateStrategyMatch(strategyType, textDifficulty)
  };

  // 4. 추천 생성
  const recommendations = generateRecommendations(strategyType, effectiveness);

  return {
    strategyType,
    effectiveness,
    recommendations,
    strengths: identifyStrengths(features),
    weaknesses: identifyWeaknesses(features)
  };
}
```

---

## 8. 사용자 플로우

### 8.1 학생 플로우

```
1. 로그인
   ↓
2. 테스트 목록에서 "VISION_G2_001" 선택
   ↓
3. 테스트 안내 및 주의사항 확인
   ↓
4. [환경 체크]
   - 카메라 권한 허용
   - 얼굴/눈 감지 확인
   - 조명 및 거리 체크
   - ✅ 모든 체크 통과
   ↓
5. [캘리브레이션]
   - 9포인트 순차 응시
   - 각 포인트 2초씩
   - 정확도 평가 (>70%)
   - ❌ 미달 시 재캘리 / ✅ 통과 시 다음 단계
   ↓
6. [읽기 테스트]
   - 지문 제시 (실시간 시선 추적 시작)
   - 자연스럽게 읽기
   - 5초마다 시선 데이터 자동 저장
   ↓
7. [문제 풀이]
   Case A: 지문과 함께 표시 (기본)
     - 지문 | 문제 나란히
   Case B: 지문 먼저, 문제 따로 (토글)
     - 지문 읽기 → "문제 풀기" 버튼 → 문제만 표시
   ↓
8. [제출]
   - 답안 + 최종 시선 데이터 전송
   - 백엔드: 메트릭 계산 + AI 분석 (비동기)
   ↓
9. [결과 확인]
   - 종합 점수 (시선 + 이해도)
   - 시선 경로 시각화
   - AI 진단 및 학습 처방
   - (관리자만 전체 재생 기능 접근 가능)
```

### 8.2 관리자 플로우

```
1. 관리자 로그인
   ↓
2. "Vision Analytics" 메뉴 선택
   ↓
3. [세션 목록 조회]
   - 필터: 학년, 날짜, 학생
   - 정렬: 날짜, 점수
   ↓
4. 특정 세션 선택
   ↓
5. [종합 리포트]
   - 학생 정보
   - 15개 메트릭
   - AI 분석 결과
   ↓
6. [시선 경로 재생] 버튼 클릭
   ↓
7. [재생 화면]
   - 텍스트 + 시선 오버레이
   - 재생 컨트롤 (속도, 시크)
   - 레이어 토글 (경로, 원, 히트맵)
   - 필터 (정상/역행/이탈)
   ↓
8. (필요 시) [수동 보정]
   - "보정하기" 버튼
   - 좌우/상하/스케일/회전 조정
   - AI 자동 보정 실행
   - 적용 및 재계산
   ↓
9. (선택) [비교 분석]
   - 시계열 비교: 같은 학생의 진전도
   - 학생 간 비교: 최대 4명 동시
   ↓
10. [리포트 다운로드/공유]
    - PDF 다운로드
    - 학부모 이메일 전송
```

---

## 9. 관리자 기능

### 9.1 Vision 템플릿 관리

**생성**:
```tsx
<VisionTemplateForm>
  <Input label="템플릿 코드" value={code} placeholder="VISION_G2_001" />
  <Input label="제목" value={title} />
  <Select label="학년" value={grade} options={[1,2,3,4,5,6]} />

  {/* 읽기 지문 추가 */}
  <PassageEditor>
    <Textarea
      label="지문 내용"
      value={passage.text}
      rows={10}
    />
    <Slider
      label="글자 크기"
      value={passage.fontSize}
      min={16}
      max={32}
      unit="px"
    />
    <ToggleSwitch
      label="문제 풀 때 지문 함께 표시"
      checked={passage.showWithQuestions}
    />
  </PassageEditor>

  {/* 문제 추가 (기존 문항 관리와 동일) */}
  <QuestionList questions={questions} />

  {/* 예상 메트릭 설정 (학년별 벤치마크) */}
  <ExpectedMetrics>
    <RangeInput label="시선 도약폭 (px)" min={40} max={80} />
    <RangeInput label="응시 시간 (ms)" min={250} max={400} />
    <Input label="역행 비율 (%)" value={15} />
    <RangeInput label="읽기 속도 (WPM)" min={60} max={100} />
  </ExpectedMetrics>

  <Button type="submit">템플릿 생성</Button>
</VisionTemplateForm>
```

### 9.2 Vision Analytics 대시보드

**통계 카드**:
```tsx
<DashboardLayout>
  <StatsGrid>
    <StatCard
      title="전체 Vision 테스트 수"
      value={totalSessions}
      icon={<EyeIcon />}
    />
    <StatCard
      title="평균 시선 추적 점수"
      value={`${avgEyeTrackingScore.toFixed(1)}`}
      trend={+3.2}
    />
    <StatCard
      title="평균 이해도 점수"
      value={`${avgComprehensionScore.toFixed(1)}`}
      trend={+5.1}
    />
    <StatCard
      title="평균 읽기 속도"
      value={`${avgWPM.toFixed(0)} WPM`}
      trend={+8}
    />
  </StatsGrid>

  {/* 학년별 비교 차트 */}
  <BarChart
    title="학년별 평균 메트릭"
    data={gradeComparisonData}
    xAxis="grade"
    yAxis={['eyeTrackingScore', 'comprehensionScore', 'wpm']}
  />

  {/* 최근 세션 테이블 */}
  <SessionTable sessions={recentSessions} />
</DashboardLayout>
```

---

## 10. 성능 요구사항

### 10.1 프론트엔드 성능

| 항목 | 목표 | 측정 방법 |
|------|------|-----------|
| **초기 로딩 시간** | < 3초 | Lighthouse |
| **TensorFlow.js 모델 로딩** | < 2초 | Performance API |
| **MediaPipe 초기화** | < 1초 | Performance API |
| **시선 추적 FPS** | 30-60 FPS | 실시간 측정 |
| **재생 렌더링 FPS** | 60 FPS | RequestAnimationFrame |
| **캘리브레이션 시간** | < 60초 | User Experience |
| **메모리 사용량** | < 500MB | Chrome DevTools |

### 10.2 백엔드 성능

| 항목 | 목표 | 측정 방법 |
|------|------|-----------|
| **API 응답 시간** | < 200ms | APM |
| **시선 데이터 저장** | < 100ms | Database Query |
| **메트릭 계산** | < 5초 | Background Job |
| **AI 분석** | < 10초 | Background Job |
| **재생 데이터 조회** | < 500ms | Database Query |
| **동시 접속** | 100명 | Load Testing |

### 10.3 데이터베이스 성능

| 항목 | 목표 | 최적화 방법 |
|------|------|-------------|
| **시선 데이터 저장** | < 50ms | Batch Insert, Index |
| **메트릭 조회** | < 100ms | Index, Caching |
| **재생 데이터 조회** | < 200ms | Index, Pagination |
| **통계 쿼리** | < 500ms | Materialized View |

---

## 11. 보안 및 개인정보

### 11.1 데이터 보호

**시선 데이터 처리 원칙**:
1. **얼굴 영상 미저장**: 실시간 처리만, 영상 파일 저장 금지
2. **좌표 데이터만 저장**: (x, y, timestamp, confidence)만 저장
3. **암호화 전송**: HTTPS 필수
4. **접근 제한**: 본인과 관리자만 조회 가능
5. **데이터 보관 기간**: 3년 (법적 요구사항 준수)

**동의 프로세스**:
```tsx
<ConsentModal>
  <h2>시선 추적 테스트 동의</h2>
  <p>
    본 테스트는 카메라를 사용하여 시선을 추적합니다.
    수집되는 데이터는 다음과 같습니다:
  </p>
  <ul>
    <li>✅ 시선 좌표 (x, y)</li>
    <li>✅ 응시 시간</li>
    <li>❌ 얼굴 영상 (저장하지 않음)</li>
  </ul>
  <Checkbox
    label="개인정보 수집 및 이용에 동의합니다"
    checked={consentGiven}
    onChange={setConsentGiven}
    required
  />
  <Button disabled={!consentGiven}>동의하고 시작하기</Button>
</ConsentModal>
```

### 11.2 학부모 동의

**미성년자 보호**:
- 초등학생 대상이므로 학부모 동의 필수
- 회원가입 시 학부모 연락처 수집
- Vision 테스트 최초 실행 시 학부모에게 SMS/이메일 동의 요청

---

## 12. 개발 로드맵

### Phase 1: MVP (8주)

**Week 1-2: 기반 구축**
- ✅ 디자인 시스템 적용
- ✅ 데이터베이스 스키마 구현
- ✅ TensorFlow.js + MediaPipe 통합
- ✅ 기본 시선 추적 동작 검증

**Week 3-4: 캘리브레이션**
- ✅ 환경 체크 UI
- ✅ 9포인트 캘리브레이션
- ✅ 정확도 평가 알고리즘
- ✅ 백엔드 API 구현

**Week 5-6: 테스트 진행**
- ✅ 읽기 지문 화면
- ✅ 실시간 시선 추적
- ✅ 청크 단위 데이터 저장
- ✅ 문제 풀이 (토글 기능 포함)

**Week 7: 메트릭 계산**
- ✅ 15개 메트릭 계산 로직
- ✅ 백엔드 분석 엔진
- ✅ 결과 리포트 생성

**Week 8: 테스트 & 버그 수정**
- ✅ 통합 테스트
- ✅ 성능 최적화
- ✅ 버그 수정

### Phase 2: 시각화 (6주)

**Week 9-10: 재생 기능**
- ✅ 시선 경로 재생 UI
- ✅ Canvas 렌더링
- ✅ 재생 컨트롤
- ✅ 색상 코딩 및 응시 원

**Week 11-12: 수동 보정**
- ✅ 보정 UI
- ✅ 실시간 미리보기
- ✅ AI 자동 보정 알고리즘

**Week 13-14: 고급 시각화**
- ✅ 주의력 히트맵
- ✅ 비교 분석 (시계열, 학생 간)
- ✅ AI 읽기 전략 분석

### Phase 3: 확장 (4주)

**Week 15: 관리자 기능**
- ✅ Vision Analytics 대시보드
- ✅ 템플릿 관리 UI
- ✅ 통계 및 리포트

**Week 16: 학부모 기능**
- ✅ 간소화된 리포트
- ✅ 이메일 전송
- ✅ PDF 다운로드

**Week 17-18: 다른 학년 확장**
- ✅ 3학년, 4학년 템플릿
- ✅ 학년별 벤치마크 조정
- ✅ 최종 테스트 및 배포

---

## 13. 성공 지표 (KPI)

### 13.1 기술적 성공

| 지표 | 목표 | 측정 주기 |
|------|------|-----------|
| **캘리브레이션 성공률** | > 85% | 주간 |
| **시선 추적 정확도** | > 70% | 세션별 |
| **시스템 가동률** | > 99% | 월간 |
| **평균 응답 시간** | < 200ms | 실시간 |
| **오류 발생률** | < 1% | 일간 |

### 13.2 사용자 경험

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **테스트 완료율** | > 90% | Analytics |
| **재캘리브레이션 비율** | < 20% | Database |
| **사용자 만족도** | > 4.0/5.0 | 설문조사 |
| **관리자 리포트 조회율** | > 70% | Analytics |

### 13.3 교육적 성과

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **진단 정확도** | > 80% | 전문가 평가 |
| **개선도 추적 가능성** | 100% | 시계열 비교 |
| **학부모 이해도** | > 75% | 설문조사 |

---

## 14. 리스크 및 대응 방안

### 14.1 기술적 리스크

| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|-----------|
| **정확도 부족** | 높음 | 중간 | 캘리브레이션 강화, AI 보정 |
| **성능 저하** | 중간 | 낮음 | 코드 최적화, 청크 크기 조정 |
| **브라우저 호환성** | 중간 | 낮음 | 폴리필, 대체 방안 제공 |
| **대용량 데이터** | 중간 | 중간 | 압축, 아카이빙 전략 |

### 14.2 사용자 리스크

| 리스크 | 영향 | 확률 | 대응 방안 |
|--------|------|------|-----------|
| **환경 불일치** | 높음 | 높음 | 상세한 안내, 환경 체크 강화 |
| **집중 시간 부족** | 중간 | 중간 | 짧은 지문, 게임화 |
| **카메라 거부** | 낮음 | 낮음 | 일반 테스트 대체 제공 |

---

**문서 끝**
