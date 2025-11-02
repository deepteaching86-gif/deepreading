# VISIONTEST 하이브리드 알고리즘 설계 문서

## 📋 개요

**목표**: MediaPipe + OpenCV.js + 3D 안구 모델의 융합을 통한 시선 추적 정확도 향상

**현재 시스템 (Phase 0)**:
- ✅ MediaPipe Face Landmarker (478 landmarks + iris)
- ✅ 3D Tracking (JEOresearch nose-based coordinate system)
- ✅ Adaptive Kalman Filter
- ✅ Polynomial Regression Calibration

**개선 로드맵**:
- **Phase 1**: 하이브리드 알고리즘 구현 (4주) ← **현재 시작**
- **Phase 2**: 3D 안구 모델 구현 (3주)
- **Phase 3**: 성능 최적화 (2주)
- **Phase 4**: 상하 오차 보정 특화 (2주)

---

## 🎯 Phase 1: 하이브리드 알고리즘 구현

### 1.1 현재 시스템 분석

#### 기존 알고리즘 구조
```typescript
// useGazeTracking.ts - 현재 구조
MediaPipe Face Landmarker
  ↓
478 Face Landmarks + Iris (468-477)
  ↓
3D Coordinate System (Nose-based)
  ↓
Eye Sphere Tracker + Gaze Smoother
  ↓
Adaptive Kalman Filter
  ↓
Polynomial Regression Calibration
  ↓
Final Gaze Estimation
```

#### 현재 강점
- ✅ MediaPipe의 빠른 랜드마크 감지 (30 FPS+)
- ✅ 3D 추적으로 머리 움직임 보정
- ✅ Kalman Filter로 노이즈 감소
- ✅ 다항 회귀로 개인화된 캘리브레이션

#### 현재 약점
- ❌ 상하 방향 오차 (특히 화면 상단/하단)
- ❌ 조명 변화에 민감
- ❌ 급격한 시선 이동 시 지연
- ❌ 단일 알고리즘 의존 (MediaPipe만 사용)

### 1.2 하이브리드 알고리즘 아키텍처

#### 3-Algorithm Ensemble
```typescript
┌─────────────────┐
│  Raw Video Feed │
└────────┬────────┘
         │
    ┌────┴─────┬─────────┬──────────┐
    │          │         │          │
    ▼          ▼         ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐
│MediaPipe│ │OpenCV│ │TensorFlow│ │3D Model│
│Face Land│ │Pupil │ │(보조)   │ │Eye Track│
└────┬───┘ └───┬──┘ └────┬───┘ └────┬───┘
     │         │         │          │
     └─────────┴─────────┴──────────┘
                  │
                  ▼
        ┌──────────────────┐
        │  Hybrid Fusion   │
        │  (가중 평균)      │
        │  + Confidence    │
        │  + Kalman Filter │
        └────────┬─────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Final Gaze Est │
        └────────────────┘
```

### 1.3 알고리즘별 역할 분담

#### Algorithm 1: MediaPipe (Primary - 60% weight)
**역할**: 빠른 얼굴/눈 랜드마크 감지
**강점**:
- 478개 정밀 랜드마크
- Iris tracking (468-477)
- 30 FPS+ 성능
- 다양한 조명 환경 대응

**약점**:
- 상하 방향 정확도 제한
- 급격한 움직임 시 지연

**구현 위치**: `useGazeTracking.ts` (이미 구현됨)

#### Algorithm 2: OpenCV.js (Secondary - 25% weight)
**역할**: 전통적 컴퓨터 비전으로 Pupil 감지
**강점**:
- Pupil detection (Circle Hough Transform)
- Haar Cascade로 눈 영역 감지
- MediaPipe 실패 시 백업

**약점**:
- 성능 부담 (10-15 FPS)
- 조명 민감도

**구현 계획**:
```typescript
// utils/opencvPupilDetector.ts (새 파일)
export class OpenCVPupilDetector {
  detectPupils(frame: ImageData): {
    left: { x: number; y: number; radius: number };
    right: { x: number; y: number; radius: number };
    confidence: number;
  }
}
```

#### Algorithm 3: 3D Eye Model (Refinement - 15% weight)
**역할**: 3D 안구 구조 기반 시선 벡터 계산
**강점**:
- 물리적으로 정확한 시선 벡터
- 상하 오차 보정
- 머리 회전 보정

**약점**:
- 초기 캘리브레이션 필요
- 계산 복잡도

**구현 위치**: `gazeTracking3D.ts` (부분 구현됨, 개선 필요)

### 1.4 하이브리드 융합 전략

#### Weighted Ensemble with Dynamic Confidence
```typescript
interface HybridGazeEstimation {
  mediapipe: { x: number; y: number; confidence: number };
  opencv: { x: number; y: number; confidence: number };
  model3d: { x: number; y: number; confidence: number };
}

function fusedGazeEstimate(hybrid: HybridGazeEstimation): GazePoint {
  // 1. Normalize confidences
  const totalConf =
    hybrid.mediapipe.confidence +
    hybrid.opencv.confidence +
    hybrid.model3d.confidence;

  // 2. Dynamic weighting based on confidence
  const w1 = (hybrid.mediapipe.confidence / totalConf) * 0.6; // Base 60%
  const w2 = (hybrid.opencv.confidence / totalConf) * 0.25;   // Base 25%
  const w3 = (hybrid.model3d.confidence / totalConf) * 0.15;  // Base 15%

  // 3. Weighted average
  const x =
    hybrid.mediapipe.x * w1 +
    hybrid.opencv.x * w2 +
    hybrid.model3d.x * w3;

  const y =
    hybrid.mediapipe.y * w1 +
    hybrid.opencv.y * w2 +
    hybrid.model3d.y * w3;

  return { x, y, timestamp: Date.now() };
}
```

#### Fallback Strategy
```typescript
// 알고리즘 실패 시 Fallback 체계
if (mediapipe.confidence < 0.3) {
  // MediaPipe 실패 → OpenCV로 전환
  if (opencv.confidence > 0.5) {
    return opencv.estimate;
  }
  // OpenCV도 실패 → 3D Model만 사용
  return model3d.estimate;
}
```

---

## 🚀 Phase 1 구현 계획

### Week 1: OpenCV.js 통합
- [x] OpenCV.js 라이브러리 추가
- [ ] Pupil Detection 알고리즘 구현
- [ ] Haar Cascade 눈 감지 구현
- [ ] 성능 프로파일링

### Week 2: 하이브리드 융합 로직
- [ ] `HybridGazeEstimator` 클래스 구현
- [ ] 3개 알고리즘 병렬 실행
- [ ] 가중 평균 융합
- [ ] Confidence 기반 동적 가중치

### Week 3: 성능 최적화
- [ ] Web Worker로 OpenCV 실행
- [ ] ROI (Region of Interest) 적용
- [ ] 프레임 스킵 전략
- [ ] 30 FPS 목표 달성

### Week 4: 테스트 및 검증
- [ ] A/B 테스트 (기존 vs 하이브리드)
- [ ] 정확도 측정 (상하/좌우 오차)
- [ ] 사용자 피드백 수집
- [ ] 문서화

---

## 📊 성공 지표

### 정량적 지표
- **정확도 향상**: 기존 대비 20% 이상 오차 감소
- **상하 오차**: 50px → 30px 이하
- **FPS 유지**: 30 FPS 이상
- **초기화 시간**: 3초 이하

### 정성적 지표
- 사용자 체감 정확도 향상
- 조명 변화 대응력 개선
- 급격한 시선 이동 추적 안정성

---

## 🔧 기술 스택

### 추가 설치 필요
```bash
npm install opencv.js
# 또는 CDN 사용
<script src="https://docs.opencv.org/4.x/opencv.js"></script>
```

### 기존 라이브러리 활용
- ✅ @mediapipe/tasks-vision (v0.10.22)
- ✅ @tensorflow/tfjs (v4.22.0)
- ✅ ml-matrix (v6.12.1)

---

## 🚨 위험 요소 및 대응

| 위험 요소 | 영향도 | 발생 확률 | 대응 방안 |
|---------|--------|----------|----------|
| OpenCV.js 성능 저하 | 높음 | 중간 | Web Worker, ROI, 프레임 스킵 |
| 3D 모델 정확도 부족 | 높음 | 높음 | 충분한 학습 데이터, 전이 학습 |
| 30 FPS 미달 | 중간 | 중간 | 프레임 스킵, ROI, 병렬 처리 |
| 하이브리드 융합 복잡도 | 중간 | 낮음 | 점진적 통합, A/B 테스트 |
| 브라우저 호환성 | 낮음 | 높음 | Polyfill, 최소 사양 명시 |

---

## 📝 다음 단계

### Immediate (이번 주)
1. ✅ 하이브리드 알고리즘 설계 문서 작성
2. OpenCV.js CDN 통합
3. Pupil Detection 기본 구현
4. 성능 벤치마크

### Short-term (2-4주)
- 하이브리드 융합 로직 완성
- 성능 최적화 (Web Worker, ROI)
- A/B 테스트 및 검증

### Long-term (2-3개월)
- Phase 2: 3D 안구 모델 개선
- Phase 3: 성능 최적화
- Phase 4: 상하 오차 보정 특화
- 플랫폼 확장 (iPad, Android)

---

**작성일**: 2025-01-02
**버전**: 1.0
**상태**: Phase 1 시작 준비 완료
