# VISIONTEST Phase 2: 상하 오차 보정 특화 알고리즘

## 📋 Phase 2 목표

**핵심 목표**: 수직 방향 시선 추적 정확도를 40% 향상 (±50px → ±30px)

**현재 문제점**:
- 화면 상단/하단을 볼 때 오차 증가
- MediaPipe는 수평 방향보다 수직 방향에서 부정확
- 눈을 위로 볼 때 EAR (Eye Aspect Ratio) 감소로 추적 실패 가능

---

## 🎯 Phase 2 구현 전략

### 1. Vertical Gaze Correction Algorithm

**핵심 아이디어**: Y축 방향에 대한 특별한 보정 계수 적용

```typescript
// 수직 방향 보정 함수
function applyVerticalCorrection(
  gazeY: number,
  headPitch: number,
  eyeAspectRatio: number
): number {
  // 1. 머리 기울기 보정
  const pitchCorrection = headPitch * PITCH_CORRECTION_FACTOR;

  // 2. EAR 기반 보정 (눈을 위로 볼 때 EAR 감소)
  const earCorrection = (0.15 - eyeAspectRatio) * EAR_CORRECTION_FACTOR;

  // 3. 비선형 보정 (화면 상단/하단에서 더 큰 보정)
  const nonlinearCorrection = Math.sign(gazeY - 0.5) *
    Math.pow(Math.abs(gazeY - 0.5), 1.2) * NONLINEAR_FACTOR;

  // 4. 최종 보정된 Y 좌표
  return gazeY + pitchCorrection + earCorrection + nonlinearCorrection;
}
```

### 2. 3D 모델 가중치 동적 조정

**전략**: 수직 방향에서는 3D 모델의 가중치 증가

```typescript
// 상황별 가중치 조정
if (isVerticalGaze) {
  // 수직 방향: 3D 모델 가중치 증가 (15% → 30%)
  weights = {
    mediapipe: 0.45,  // 60% → 45%
    opencv: 0.25,     // 유지
    model3d: 0.30     // 15% → 30%
  };
} else {
  // 수평 방향: 기본 가중치
  weights = {
    mediapipe: 0.60,
    opencv: 0.25,
    model3d: 0.15
  };
}
```

### 3. Multi-Point Calibration for Vertical Axis

**개선**: 캘리브레이션 포인트를 수직 방향에 더 많이 배치

```typescript
// 기존 9포인트 캘리브레이션
[TL, TC, TR]
[ML, MC, MR]
[BL, BC, BR]

// 개선 13포인트 캘리브레이션 (수직 강화)
[TL, TC, TR]
[T2, ---, T2]  // ← 추가 상단 포인트
[ML, MC, MR]
[B2, ---, B2]  // ← 추가 하단 포인트
[BL, BC, BR]
```

---

## 🔧 구현 계획

### Week 1: Vertical Correction Algorithm

**파일**: `frontend/src/utils/verticalGazeCorrection.ts` (새 파일)

```typescript
export interface VerticalCorrectionConfig {
  pitchFactor: number;      // 머리 기울기 보정 계수 (0.3)
  earFactor: number;        // EAR 보정 계수 (0.5)
  nonlinearFactor: number;  // 비선형 보정 계수 (0.2)
  enableCorrection: boolean; // 보정 활성화 여부
}

export class VerticalGazeCorrector {
  constructor(config?: Partial<VerticalCorrectionConfig>);

  // 수직 보정 적용
  correctVertical(
    gazeY: number,
    headPitch: number,
    eyeAspectRatio: number
  ): number;

  // 수직 방향 여부 판단
  isVerticalGaze(gazeX: number, gazeY: number): boolean;

  // 통계 수집
  getStats(): VerticalCorrectionStats;
}
```

### Week 2: 하이브리드에 3D 모델 통합

**목표**: 3D 모드 gaze estimation을 하이브리드 융합에 포함

**수정 파일**: `frontend/src/hooks/useGazeTracking.ts`

```typescript
// 3D 모드에서도 하이브리드 융합 적용
if (use3DTracking && leftIris3D && rightIris3D) {
  // ... 기존 3D 계산 ...

  const screenCoords = intersectionToScreenCoords(intersection, monitor);

  // ✨ NEW: 3D 결과를 하이브리드에 추가
  if (enableHybridMode) {
    const hybridInput: HybridGazeInput = {
      mediapipe: { /* 2D MediaPipe */ },
      opencv: { /* OpenCV pupil */ },
      model3d: {  // ← 3D 모델 결과 추가
        x: screenCoords.x,
        y: screenCoords.y,
        confidence: is3DCalibrated ? 0.9 : 0.5,
        source: '3d-model'
      }
    };

    const fusedEstimate = hybridEstimator.estimate(hybridInput);
    // 융합된 결과 사용
  }
}
```

### Week 3: Enhanced Calibration

**목표**: 13포인트 캘리브레이션 구현

**수정 파일**: `frontend/src/components/calibration/CalibrationScreen.tsx`

```typescript
// 기존 9포인트
const CALIBRATION_POINTS_9 = [
  { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
  { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
];

// ✨ NEW: 13포인트 (수직 강화)
const CALIBRATION_POINTS_13 = [
  { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
  { x: 0.2, y: 0.3 }, { x: 0.8, y: 0.3 },  // ← 추가
  { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
  { x: 0.2, y: 0.7 }, { x: 0.8, y: 0.7 },  // ← 추가
  { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 }
];
```

---

## 📊 예상 성능 개선

| 지표 | Phase 1 (하이브리드) | Phase 2 (수직 보정) | 개선율 |
|------|-------------------|------------------|-------|
| **상하 오차** | ±30px (목표) | ±20px (목표) | 33% ↑ |
| **좌우 오차** | ±25px (목표) | ±22px (목표) | 12% ↑ |
| **화면 상단** | ±40px | ±25px | 38% ↑ |
| **화면 하단** | ±40px | ±25px | 38% ↑ |

---

## 🧪 테스트 시나리오

### 1. 수직 시선 이동 테스트

```typescript
// 테스트 케이스
const verticalTargets = [
  { x: 0.5, y: 0.1 },  // 상단
  { x: 0.5, y: 0.3 },
  { x: 0.5, y: 0.5 },  // 중앙
  { x: 0.5, y: 0.7 },
  { x: 0.5, y: 0.9 }   // 하단
];

// 각 타겟에 대해 정확도 측정
for (const target of verticalTargets) {
  const error = measureGazeError(target);
  console.log(`Target Y: ${target.y}, Error: ${error}px`);
}
```

### 2. 머리 기울기 변화 테스트

- 고개를 숙인 상태에서 시선 추적
- 고개를 든 상태에서 시선 추적
- 정면 상태와 비교

### 3. EAR 변화 테스트

- 눈을 크게 뜬 상태
- 반쯤 감은 상태 (졸린 상태)
- 위를 볼 때 (EAR 자연스럽게 감소)

---

## 🚀 구현 우선순위

### 우선순위 1: Vertical Correction Algorithm (Week 1)
- ✅ 가장 큰 영향도
- ✅ 독립적 구현 가능
- ✅ 즉시 테스트 가능

### 우선순위 2: 하이브리드에 3D 통합 (Week 2)
- ⚠️ 3D 모드와 2D 모드 통합 복잡도
- ✅ 정확도 크게 향상
- ⚠️ 성능 영향 고려 필요

### 우선순위 3: Enhanced Calibration (Week 3)
- ⚠️ UX 변경 필요
- ⚠️ 캘리브레이션 시간 증가 (13포인트)
- ✅ 장기적 정확도 향상

---

## 📁 생성될 파일

### 새 파일

1. `frontend/src/utils/verticalGazeCorrection.ts` - 수직 보정 알고리즘
2. `VISIONTEST-PHASE2-VERTICAL-CORRECTION-COMPLETE.md` - 완료 보고서

### 수정 파일

1. `frontend/src/hooks/useGazeTracking.ts` - 3D 하이브리드 통합
2. `frontend/src/utils/hybridGazeEstimator.ts` - 동적 가중치
3. `frontend/src/components/calibration/CalibrationScreen.tsx` - 13포인트 캘리브레이션

---

## 🔍 알려진 도전 과제

### 1. EAR Threshold 조정
- **문제**: 눈을 위로 볼 때 EAR이 0.12 이하로 떨어질 수 있음
- **해결**: 수직 시선 감지 시 EAR threshold 동적 조정

### 2. 3D 모드 성능
- **문제**: 3D 계산이 추가되면 FPS 저하 가능
- **해결**: Web Worker 또는 프레임 스킵 (Phase 3)

### 3. 캘리브레이션 시간
- **문제**: 13포인트 캘리브레이션은 시간 소요
- **해결**: 옵션으로 제공 (기본 9포인트, 고급 13포인트)

---

**작성일**: 2025-01-02
**Phase**: Phase 2 - 상하 오차 보정 특화 (3주)
**상태**: 설계 완료, 구현 준비 중
