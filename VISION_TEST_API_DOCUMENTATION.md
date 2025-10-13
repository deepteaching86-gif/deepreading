# Vision TEST API 문서

## 📖 개요

Vision TEST API는 실시간 시선 추적(Eye Tracking) 기반 독해 능력 평가 시스템을 위한 RESTful API입니다.

**Base URL**: `https://api.example.com/api/v1/vision`
**인증**: JWT Bearer Token
**버전**: v1.0
**마지막 업데이트**: 2025-10-14

---

## 🔐 인증

모든 API 요청은 JWT 토큰을 통한 인증이 필요합니다.

```http
Authorization: Bearer <your-jwt-token>
```

**토큰 획득**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**응답**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "student@example.com",
    "role": "student"
  }
}
```

---

## 📂 API 엔드포인트

### 1. Calibration APIs (캘리브레이션)

#### 1.1 환경 체크
디바이스 호환성 및 카메라 권한을 확인합니다.

```http
POST /calibration/check-environment
```

**Request Body**:
```json
{
  "userId": "user-123",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "screen": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

**Response** (200 OK):
```json
{
  "compatible": true,
  "hasCamera": true,
  "hasMediaPipe": true,
  "recommendations": [
    "조명을 밝게 해주세요",
    "얼굴을 화면 중앙에 위치시켜주세요"
  ]
}
```

---

#### 1.2 캘리브레이션 시작
새로운 캘리브레이션 세션을 시작합니다.

```http
POST /calibration/start
```

**Request Body**:
```json
{
  "userId": "user-123",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "screenWidth": 1920,
    "screenHeight": 1080
  }
}
```

**Response** (201 Created):
```json
{
  "calibrationId": "cal-456",
  "userId": "user-123",
  "expiresAt": "2025-10-21T12:00:00Z",
  "calibrationPoints": [
    { "id": 1, "x": 0.1, "y": 0.1 },
    { "id": 2, "x": 0.5, "y": 0.1 },
    { "id": 3, "x": 0.9, "y": 0.1 },
    { "id": 4, "x": 0.1, "y": 0.5 },
    { "id": 5, "x": 0.5, "y": 0.5 },
    { "id": 6, "x": 0.9, "y": 0.5 },
    { "id": 7, "x": 0.1, "y": 0.9 },
    { "id": 8, "x": 0.5, "y": 0.9 },
    { "id": 9, "x": 0.9, "y": 0.9 }
  ]
}
```

---

#### 1.3 포인트 기록
각 캘리브레이션 포인트에 대한 시선 데이터를 기록합니다.

```http
POST /calibration/record-point
```

**Request Body**:
```json
{
  "calibrationId": "cal-456",
  "pointId": 1,
  "gazePoints": [
    {
      "timestamp": 1697000000000,
      "x": 0.102,
      "y": 0.098,
      "confidence": 0.95
    },
    {
      "timestamp": 1697000033000,
      "x": 0.105,
      "y": 0.101,
      "confidence": 0.93
    }
    // ... ~90 points (3초 × 30fps)
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "pointId": 1,
  "recordedPoints": 90,
  "averageConfidence": 0.92,
  "nextPointId": 2
}
```

---

#### 1.4 캘리브레이션 검증
9개 포인트 기록 완료 후 정확도를 검증합니다.

```http
POST /calibration/validate
```

**Request Body**:
```json
{
  "calibrationId": "cal-456"
}
```

**Response** (200 OK) - 성공:
```json
{
  "success": true,
  "calibrationId": "cal-456",
  "overallAccuracy": 0.85,
  "pointAccuracies": [
    { "pointId": 1, "accuracy": 0.90, "error": 15.5 },
    { "pointId": 2, "accuracy": 0.88, "error": 18.2 },
    // ... 9 points
  ],
  "calibrationMatrix": {
    "a": 1920.5, "b": 0.12, "c": -15.3,
    "d": 0.08, "e": 1080.3, "f": -10.8
  },
  "expiresAt": "2025-10-21T12:00:00Z"
}
```

**Response** (400 Bad Request) - 실패:
```json
{
  "success": false,
  "overallAccuracy": 0.62,
  "message": "Calibration accuracy below 70% threshold",
  "recommendations": [
    "머리 움직임을 최소화해주세요",
    "각 포인트를 정확히 응시해주세요"
  ]
}
```

---

#### 1.5 활성 캘리브레이션 조회
사용자의 활성 캘리브레이션을 조회합니다 (7일 이내).

```http
GET /calibration/active/:userId
```

**Response** (200 OK):
```json
{
  "calibrationId": "cal-456",
  "userId": "user-123",
  "overallAccuracy": 0.85,
  "calibrationMatrix": {
    "a": 1920.5, "b": 0.12, "c": -15.3,
    "d": 0.08, "e": 1080.3, "f": -10.8
  },
  "createdAt": "2025-10-14T12:00:00Z",
  "expiresAt": "2025-10-21T12:00:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "message": "No active calibration found. Please calibrate."
}
```

---

### 2. Session Management APIs (세션 관리)

#### 2.1 Vision 세션 시작
Vision TEST 세션을 시작합니다.

```http
POST /session/start
```

**Request Body**:
```json
{
  "sessionId": "session-789",
  "calibrationId": "cal-456"
}
```

**Response** (201 Created):
```json
{
  "visionSessionId": "vision-101",
  "sessionId": "session-789",
  "calibrationId": "cal-456",
  "calibrationScore": 0.85,
  "visionConfig": {
    "enableEyeTracking": true,
    "targetGrade": 2,
    "calibrationPoints": 9,
    "passages": [
      {
        "passageId": "p1",
        "text": "어느 날 토끼가 숲 속에서 놀고 있었어요...",
        "wordCount": 150,
        "estimatedReadingTime": 60
      }
    ],
    "showPassageWithQuestions": false,
    "expectedMetrics": {
      "wordsPerMinute": 120,
      "fixationsPerWord": 1.2,
      "regressionRate": 10
    }
  },
  "startedAt": "2025-10-14T12:30:00Z"
}
```

---

#### 2.2 Gaze 데이터 저장
실시간으로 수집된 gaze 데이터를 청크 단위로 저장합니다.

```http
POST /session/save-gaze-data
```

**Request Body**:
```json
{
  "visionSessionId": "vision-101",
  "gazeChunk": {
    "passageId": "p1",
    "gazePoints": [
      {
        "timestamp": 1697000000000,
        "x": 0.512,
        "y": 0.342,
        "confidence": 0.95,
        "type": "fixation"
      },
      {
        "timestamp": 1697000033000,
        "x": 0.548,
        "y": 0.338,
        "confidence": 0.93,
        "type": "saccade"
      }
      // ... ~150 points (5초 × 30fps)
    ],
    "startTime": 1697000000000,
    "endTime": 1697005000000
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "saved": true,
  "gazeDataId": "gaze-202",
  "totalPoints": 150,
  "chunkNumber": 1
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid gaze data: too many blinks or low confidence points",
  "validPoints": 45,
  "totalPoints": 150
}
```

---

#### 2.3 세션 제출
Vision TEST를 완료하고 세션을 제출합니다.

```http
POST /session/submit
```

**Request Body**:
```json
{
  "visionSessionId": "vision-101",
  "finalGazeData": {
    "passageId": "p3",
    "gazePoints": [
      // ... 마지막 청크 (제출 전까지의 데이터)
    ],
    "startTime": 1697020000000,
    "endTime": 1697025000000
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "visionSessionId": "vision-101",
  "totalGazePoints": 4500,
  "totalDuration": 180,
  "status": "completed",
  "nextStep": "metrics_calculation"
}
```

---

#### 2.4 세션 조회
Vision TEST 세션 정보를 조회합니다.

```http
GET /session/:sessionId
```

**Response** (200 OK):
```json
{
  "visionSessionId": "vision-101",
  "sessionId": "session-789",
  "status": "completed",
  "calibrationScore": 0.85,
  "totalGazePoints": 4500,
  "totalDuration": 180,
  "createdAt": "2025-10-14T12:30:00Z",
  "submittedAt": "2025-10-14T12:33:00Z"
}
```

---

### 3. Metrics APIs (메트릭 계산)

#### 3.1 메트릭 계산
15개 핵심 메트릭을 계산합니다.

```http
POST /metrics/calculate
```

**Request Body**:
```json
{
  "visionSessionId": "vision-101",
  "correctAnswers": 8,
  "totalQuestions": 10
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "metricsId": "metrics-303",
  "metrics": {
    "averageSaccadeAmplitude": 125.5,
    "saccadeVariability": 25.3,
    "averageSaccadeVelocity": 450.2,
    "optimalLandingRate": 75.8,
    "returnSweepAccuracy": 82.3,
    "scanPathEfficiency": 0.78,
    "averageFixationDuration": 245.2,
    "fixationsPerWord": 1.35,
    "regressionRate": 12.5,
    "vocabularyGapScore": 35.2,
    "wordsPerMinute": 118.5,
    "rhythmRegularity": 0.82,
    "staminaScore": 85.3,
    "gazeComprehensionCorrelation": 0.75,
    "cognitiveLoadIndex": 42.8,
    "overallEyeTrackingScore": 78.5
  }
}
```

---

#### 3.2 메트릭 조회
계산된 메트릭을 조회합니다.

```http
GET /metrics/:sessionId
```

**Response** (200 OK):
```json
{
  "metricsId": "metrics-303",
  "visionSessionId": "vision-101",
  "calculatedAt": "2025-10-14T12:33:30Z",
  "metrics": {
    // ... 15 metrics (동일)
    "detailedAnalysis": {
      "eyeMovementPatterns": {
        "saccadeCount": 450,
        "averageSaccadeAmplitude": 125.5,
        "saccadeVariability": 25.3
      },
      "fixationBehavior": {
        "totalFixations": 380,
        "averageFixationDuration": 245.2,
        "fixationsPerWord": 1.35
      },
      "readingSpeed": {
        "wordsPerMinute": 118.5,
        "readingTime": 180,
        "totalWords": 355
      }
    },
    "comparisonWithPeers": {
      "grade": 2,
      "percentile": 65,
      "averages": {
        "wordsPerMinute": 110.5,
        "regressionRate": 15.2,
        "overallScore": 72.3
      }
    }
  }
}
```

---

### 4. Analysis APIs (AI 분석)

#### 4.1 AI 분석 생성
메트릭 기반으로 AI 분석을 생성합니다.

```http
POST /analysis/ai-analyze
```

**Request Body**:
```json
{
  "visionSessionId": "vision-101"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "analysis": {
    "readingStrategy": "fluent",
    "strengths": [
      "빠른 읽기 속도",
      "적은 역행 횟수",
      "효율적인 시선 이동"
    ],
    "weaknesses": [
      "단어당 응시 횟수 과다",
      "어휘력 부족 징후"
    ],
    "recommendations": [
      "매일 10-15분 소리내어 읽기 연습",
      "모르는 단어 메모하고 사전 찾기"
    ],
    "confidenceScore": 0.85,
    "narrative": "2학년 평균 수준의 양호한 읽기 능력을 보입니다. 전반적으로 안정적인 읽기 패턴이 관찰됩니다.",
    "detectedPatterns": [
      {
        "pattern": "fast_reading",
        "confidence": 0.90,
        "description": "평균보다 빠른 읽기 속도"
      }
    ]
  }
}
```

---

#### 4.2 종합 리포트 조회
Vision TEST의 종합 리포트를 조회합니다.

```http
GET /analysis/:sessionId/report
```

**Response** (200 OK):
```json
{
  "visionSessionId": "vision-101",
  "studentName": "홍길동",
  "grade": 2,
  "testDate": "2025-10-14T12:30:00Z",
  "calibrationScore": 0.85,
  "metrics": {
    // ... 15 metrics + detailed analysis + peer comparison
  },
  "aiAnalysis": {
    // ... AI analysis
  },
  "heatmapData": [
    {
      "passageId": "p1",
      "resolution": { "width": 32, "height": 18 },
      "cells": [
        { "x": 0, "y": 0, "intensity": 0.05 },
        { "x": 1, "y": 0, "intensity": 0.12 },
        // ... 576 cells (32x18)
      ]
    }
  ],
  "passages": [
    {
      "passageId": "p1",
      "text": "어느 날 토끼가 숲 속에서 놀고 있었어요...",
      "wordCount": 150
    }
  ],
  "gazeReplayAvailable": true
}
```

---

### 5. Admin APIs (관리자)

#### 5.1 세션 목록 조회
Vision TEST 세션 목록을 조회합니다 (관리자 전용).

```http
GET /admin/sessions?grade=2&status=completed&limit=20&offset=0
```

**Query Parameters**:
- `grade` (optional): 학년 필터 (1-6)
- `status` (optional): 상태 필터 (completed, in_progress, failed)
- `studentName` (optional): 학생 이름 검색
- `limit` (optional): 페이지 크기 (기본값: 20)
- `offset` (optional): 오프셋 (기본값: 0)

**Response** (200 OK):
```json
{
  "total": 145,
  "limit": 20,
  "offset": 0,
  "sessions": [
    {
      "visionSessionId": "vision-101",
      "sessionId": "session-789",
      "studentName": "홍길동",
      "grade": 2,
      "status": "completed",
      "overallScore": 78.5,
      "testDate": "2025-10-14T12:30:00Z"
    }
    // ... 19 more
  ]
}
```

---

#### 5.2 Gaze Replay 데이터 조회
Gaze replay를 위한 데이터를 조회합니다.

```http
GET /admin/session/:sessionId/gaze-replay
```

**Response** (200 OK):
```json
{
  "visionSessionId": "vision-101",
  "passages": [
    {
      "passageId": "p1",
      "text": "어느 날 토끼가 숲 속에서 놀고 있었어요...",
      "gazePoints": [
        {
          "timestamp": 1697000000000,
          "x": 0.512,
          "y": 0.342,
          "confidence": 0.95,
          "type": "fixation"
        }
        // ... ~1500 points per passage
      ]
    }
  ],
  "totalPoints": 4500,
  "duration": 180
}
```

---

#### 5.3 Gaze 데이터 조회 (Flattened)
**NEW** - 모든 gaze points를 플래튼하고 정렬하여 반환합니다.

```http
GET /admin/session/:sessionId/gaze-data
```

**Response** (200 OK):
```json
{
  "gazePoints": [
    {
      "timestamp": 1697000000000,
      "x": 0.512,
      "y": 0.342,
      "confidence": 0.95,
      "type": "fixation"
    },
    {
      "timestamp": 1697000033000,
      "x": 0.548,
      "y": 0.338,
      "confidence": 0.93,
      "type": "saccade"
    }
    // ... 4500 points (sorted by timestamp)
  ],
  "passageText": "어느 날 토끼가 숲 속에서 놀고 있었어요...\n\n다음 지문..."
}
```

---

#### 5.4 수동 캘리브레이션 보정
관리자가 캘리브레이션을 수동으로 보정합니다.

```http
POST /admin/session/:sessionId/adjust-calibration
```

**Request Body**:
```json
{
  "visionSessionId": "vision-101",
  "adminId": "admin-555",
  "adjustments": {
    "offsetX": -10.5,
    "offsetY": 5.2,
    "scaleX": 1.02,
    "scaleY": 0.98,
    "rotation": 0.5
  },
  "notes": "학생이 머리를 약간 기울인 상태로 테스트를 진행했음"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "adjustmentId": "adj-606",
  "adjustedCalibrationMatrix": {
    "a": 1960.3, "b": 0.15, "c": -25.8,
    "d": 0.06, "e": 1058.9, "f": -5.6
  },
  "appliedAt": "2025-10-14T13:00:00Z"
}
```

---

#### 5.5 히트맵 데이터 조회
Attention heatmap 데이터를 조회합니다.

```http
GET /admin/session/:sessionId/heatmap
```

**Response** (200 OK):
```json
{
  "visionSessionId": "vision-101",
  "heatmaps": [
    {
      "passageId": "p1",
      "resolution": { "width": 32, "height": 18 },
      "cells": [
        { "x": 0, "y": 0, "intensity": 0.05, "fixationCount": 2, "totalDuration": 180 },
        { "x": 1, "y": 0, "intensity": 0.12, "fixationCount": 5, "totalDuration": 450 },
        // ... 576 cells
      ],
      "maxIntensity": 1.0,
      "totalFixations": 380
    }
  ]
}
```

---

### 6. Template APIs (템플릿 관리)

#### 6.1 템플릿 목록 조회
Vision TEST 템플릿 목록을 조회합니다.

```http
GET /templates?grade=2&status=active
```

**Response** (200 OK):
```json
{
  "total": 12,
  "templates": [
    {
      "templateId": "tmpl-707",
      "title": "초등 2학년 Vision TEST - 봄",
      "grade": 2,
      "templateType": "vision",
      "visionConfig": {
        "enableEyeTracking": true,
        "targetGrade": 2,
        "passages": [
          {
            "passageId": "p1",
            "text": "어느 날 토끼가...",
            "wordCount": 150
          }
        ]
      },
      "isActive": true,
      "createdAt": "2025-10-01T00:00:00Z"
    }
  ]
}
```

---

#### 6.2 템플릿 상세 조회
특정 템플릿의 상세 정보를 조회합니다.

```http
GET /templates/:templateId
```

**Response** (200 OK):
```json
{
  "templateId": "tmpl-707",
  "title": "초등 2학년 Vision TEST - 봄",
  "grade": 2,
  "templateType": "vision",
  "visionConfig": {
    "enableEyeTracking": true,
    "targetGrade": 2,
    "calibrationPoints": 9,
    "passages": [
      {
        "passageId": "p1",
        "text": "어느 날 토끼가 숲 속에서 놀고 있었어요...",
        "wordCount": 150,
        "estimatedReadingTime": 60,
        "questions": [
          {
            "questionId": "q1",
            "text": "토끼가 어디에서 놀고 있었나요?",
            "options": ["집", "숲", "학교", "공원"],
            "correctAnswer": 1
          }
        ]
      }
    ],
    "showPassageWithQuestions": false,
    "expectedMetrics": {
      "wordsPerMinute": 120,
      "fixationsPerWord": 1.2,
      "regressionRate": 10
    }
  },
  "isActive": true,
  "createdAt": "2025-10-01T00:00:00Z"
}
```

---

## 🚨 에러 코드

### 표준 HTTP 상태 코드
- `200 OK`: 요청 성공
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 오류

### Vision TEST 특정 에러 코드
```json
{
  "error": {
    "code": "VISION_ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

**에러 코드 목록**:
- `CALIBRATION_NOT_FOUND`: 캘리브레이션을 찾을 수 없음
- `CALIBRATION_EXPIRED`: 캘리브레이션 만료 (7일 경과)
- `CALIBRATION_FAILED`: 캘리브레이션 정확도 낮음 (<70%)
- `SESSION_NOT_FOUND`: 세션을 찾을 수 없음
- `INVALID_GAZE_DATA`: 유효하지 않은 gaze 데이터
- `METRICS_CALCULATION_FAILED`: 메트릭 계산 실패
- `INSUFFICIENT_GAZE_DATA`: gaze 데이터 부족 (<1000 points)
- `AI_ANALYSIS_FAILED`: AI 분석 생성 실패

---

## 📊 데이터 모델

### GazePoint
```typescript
interface GazePoint {
  timestamp: number;        // Unix timestamp (ms)
  x: number;                // Normalized X coordinate (0-1)
  y: number;                // Normalized Y coordinate (0-1)
  confidence: number;       // Confidence score (0-1)
  type: 'fixation' | 'saccade' | 'blink' | 'off-page';
}
```

### CalibrationMatrix
```typescript
interface CalibrationMatrix {
  a: number;  // Scale X
  b: number;  // Shear X
  c: number;  // Translate X
  d: number;  // Shear Y
  e: number;  // Scale Y
  f: number;  // Translate Y
}
```

### VisionMetrics
```typescript
interface VisionMetrics {
  // Eye Movement Patterns (6)
  averageSaccadeAmplitude: number;    // pixels
  saccadeVariability: number;         // std dev
  averageSaccadeVelocity: number;     // px/s
  optimalLandingRate: number;         // percentage
  returnSweepAccuracy: number;        // percentage
  scanPathEfficiency: number;         // 0-1

  // Fixation Behavior (4)
  averageFixationDuration: number;    // ms
  fixationsPerWord: number;           // ratio
  regressionRate: number;             // percentage
  vocabularyGapScore: number;         // 0-100

  // Reading Speed & Rhythm (3)
  wordsPerMinute: number;             // WPM
  rhythmRegularity: number;           // 0-1
  staminaScore: number;               // 0-100

  // Comprehension & Cognitive (2)
  gazeComprehensionCorrelation: number; // -1 to 1
  cognitiveLoadIndex: number;         // 0-100

  // Overall
  overallEyeTrackingScore: number;    // 0-100
}
```

---

## 🔄 일반적인 플로우

### 학생 플로우
```
1. Login → Get JWT Token
2. Check active calibration (GET /calibration/active/:userId)
   - If expired or not found:
     3a. Start calibration (POST /calibration/start)
     3b. Record 9 points (POST /calibration/record-point × 9)
     3c. Validate (POST /calibration/validate)
   - If active: Skip to step 4
4. Start Vision session (POST /session/start)
5. Save gaze data chunks (POST /session/save-gaze-data × N)
6. Submit session (POST /session/submit)
7. Backend auto-calculates:
   - Metrics (POST /metrics/calculate)
   - AI Analysis (POST /analysis/ai-analyze)
8. View report (GET /analysis/:sessionId/report)
```

### 관리자 플로우
```
1. Login → Get JWT Token
2. List sessions (GET /admin/sessions)
3. View session detail:
   - Get gaze replay (GET /admin/session/:id/gaze-replay)
   - Get heatmap (GET /admin/session/:id/heatmap)
4. Adjust calibration if needed (POST /admin/session/:id/adjust-calibration)
```

---

## 📝 사용 예제

### JavaScript/TypeScript (Axios)
```typescript
import axios from 'axios';

const API_BASE_URL = 'https://api.example.com/api/v1/vision';
const token = localStorage.getItem('jwt-token');

const visionAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// 캘리브레이션 시작
const startCalibration = async (userId: string) => {
  const response = await visionAPI.post('/calibration/start', {
    userId,
    deviceInfo: {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    }
  });
  return response.data;
};

// Gaze 데이터 저장
const saveGazeData = async (
  visionSessionId: string,
  gazeChunk: GazeChunk
) => {
  const response = await visionAPI.post('/session/save-gaze-data', {
    visionSessionId,
    gazeChunk
  });
  return response.data;
};

// 리포트 조회
const getReport = async (sessionId: string) => {
  const response = await visionAPI.get(`/analysis/${sessionId}/report`);
  return response.data;
};
```

---

## 🔧 Rate Limiting

API 요청은 다음과 같이 제한됩니다:

- **일반 요청**: 100 requests/minute
- **Gaze 데이터 저장**: 300 requests/minute (실시간 저장 고려)
- **관리자 요청**: 200 requests/minute

**응답 헤더**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697000060
```

**Rate Limit 초과**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 📚 추가 리소스

- **Vision TEST PRD**: `/docs/VISION_TEST_PRD.md`
- **E2E Testing Guide**: `/docs/VISION_TEST_E2E_TESTING_GUIDE.md`
- **Implementation Summary**: `/docs/VISION_TEST_IMPLEMENTATION_SUMMARY.md`
- **Frontend Documentation**: `/frontend/README.md`
- **Backend Documentation**: `/backend/README.md`

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-10-14
**작성자**: Claude Code
**연락처**: support@example.com
