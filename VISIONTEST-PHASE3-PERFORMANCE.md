# 🚀 VISIONTEST Phase 3: 성능 최적화 설계

## 📋 개요

**목표**: 30 FPS 유지 + 메모리 최적화 + 낮은 CPU 사용률
**기간**: 2주
**우선순위**: 높음 (사용자 경험 직결)

---

## 🎯 성능 목표

| 지표 | 현재 (Phase 2) | 목표 (Phase 3) | 개선율 |
|------|---------------|---------------|--------|
| **FPS** | 25-30 (불안정) | 28-30 (안정) | 20% ↑ |
| **CPU 사용률** | 60-80% | 40-60% | 25% ↓ |
| **메모리** | ~150MB | ~120MB | 20% ↓ |
| **응답 지연** | 50-100ms | 30-50ms | 40% ↓ |
| **OpenCV 처리** | 메인 스레드 | Web Worker | 100% 분리 |

---

## 🔧 최적화 전략

### 1. Web Worker 구현 (우선순위: 최상)

**목적**: OpenCV 처리를 백그라운드로 이동하여 메인 스레드 부하 감소

#### 1.1 Architecture

```
┌─────────────────┐
│  Main Thread    │
│  (UI + Render)  │
└────────┬────────┘
         │
         ↓ postMessage (video frame)
┌─────────────────┐
│  Worker Thread  │
│  (OpenCV)       │
└────────┬────────┘
         │
         ↓ postMessage (pupil result)
┌─────────────────┐
│  Main Thread    │
│  (Fusion)       │
└─────────────────┘
```

#### 1.2 Worker Interface

```typescript
// opencvWorker.ts
interface WorkerInput {
  type: 'DETECT_PUPILS';
  imageData: ImageData;
  eyeROIs: {
    left: { x: number; y: number; width: number; height: number };
    right: { x: number; y: number; width: number; height: number };
  };
}

interface WorkerOutput {
  type: 'PUPILS_DETECTED';
  result: {
    left: { x: number; y: number; radius: number } | null;
    right: { x: number; y: number; radius: number } | null;
    confidence: number;
  } | null;
  processingTime: number;
}
```

#### 1.3 구현 파일

**새 파일**:
- `frontend/src/workers/opencvWorker.ts` - Web Worker 스크립트
- `frontend/src/utils/opencvWorkerManager.ts` - Worker 관리자

**수정 파일**:
- `useGazeTracking.ts` - Worker 통합

#### 1.4 예상 효과

- **메인 스레드 CPU**: 60-80% → 40-50% (30% 감소)
- **FPS 안정성**: ±5 fps → ±2 fps
- **응답성**: UI 블로킹 제거

---

### 2. ROI 최적화 (우선순위: 높음)

**목적**: 처리 영역 최소화로 연산량 감소

#### 2.1 현재 ROI 설정

```typescript
// 현재: 눈 영역 + 20% 패딩
const padding = 0.2;
const roiWidth = eyeWidth * (1 + padding);
const roiHeight = eyeHeight * (1 + padding);

// 처리 픽셀 수: ~10,000 pixels per eye
```

#### 2.2 최적화된 ROI

**전략 1: 적응형 패딩**
```typescript
// 동공 감지 성공률에 따라 패딩 조정
const adaptivePadding =
  detectionSuccessRate > 0.8 ? 0.1 : 0.2;
```

**전략 2: ROI 캐싱**
```typescript
// 안정적일 때 ROI 재사용 (5프레임)
if (faceMovementVelocity < threshold) {
  reuseROI = true;
  skipROICalculation(5 frames);
}
```

**전략 3: 해상도 다운샘플링**
```typescript
// ROI 내부를 0.75배 축소 처리
const downsampledROI = resizeROI(originalROI, 0.75);
// 처리 픽셀 수: 10,000 → 5,625 (44% 감소)
```

#### 2.3 예상 효과

- **OpenCV 처리 시간**: 15-20ms → 8-12ms (40% 감소)
- **메모리 사용**: Mat 객체 크기 44% 감소

---

### 3. 프레임 스킵 전략 (우선순위: 중간)

**목적**: 스마트 샘플링으로 불필요한 처리 제거

#### 3.1 적응형 프레임 스킵

```typescript
interface FrameSkipStrategy {
  baseInterval: number;      // 기본 간격 (프레임)
  maxInterval: number;       // 최대 간격
  adaptiveMode: boolean;     // 적응형 모드
}

class AdaptiveFrameSkipper {
  private skipInterval: number = 1; // 1 = 모든 프레임 처리

  shouldProcess(
    gazeVelocity: number,
    faceMovementVelocity: number
  ): boolean {
    // 빠른 움직임: 모든 프레임 처리
    if (gazeVelocity > HIGH_THRESHOLD ||
        faceMovementVelocity > HIGH_THRESHOLD) {
      this.skipInterval = 1;
      return true;
    }

    // 중간 움직임: 2프레임마다 처리
    if (gazeVelocity > MED_THRESHOLD ||
        faceMovementVelocity > MED_THRESHOLD) {
      this.skipInterval = 2;
      return frameCount % 2 === 0;
    }

    // 정지 상태: 3프레임마다 처리
    this.skipInterval = 3;
    return frameCount % 3 === 0;
  }
}
```

#### 3.2 예상 효과

- **평균 처리 프레임**: 30 fps → 20 fps (33% 감소)
- **CPU 사용률**: 추가 10-15% 감소
- **FPS 안정성**: 향상 (버퍼 여유)

**주의**: MediaPipe는 항상 30fps로 유지 (시선 추적 정확도 유지)

---

### 4. 메모리 최적화 (우선순위: 중간)

#### 4.1 Mat 객체 재사용

```typescript
class MatPool {
  private pool: Map<string, cv.Mat> = new Map();

  getMat(key: string, rows: number, cols: number, type: number): cv.Mat {
    const poolKey = `${rows}x${cols}x${type}`;

    if (!this.pool.has(poolKey)) {
      this.pool.set(poolKey, new cv.Mat(rows, cols, type));
    }

    return this.pool.get(poolKey)!;
  }

  cleanup(): void {
    this.pool.forEach(mat => mat.delete());
    this.pool.clear();
  }
}
```

#### 4.2 즉시 메모리 해제

```typescript
// 현재: GC 의존
const temp = new cv.Mat();
processImage(temp);
// temp.delete() 없음 → 메모리 누수

// 개선: 명시적 해제
const temp = new cv.Mat();
try {
  processImage(temp);
} finally {
  temp.delete(); // 항상 해제
}
```

#### 4.3 예상 효과

- **메모리 사용**: 150MB → 120MB (20% 감소)
- **GC 빈도**: 50% 감소

---

### 5. 캐싱 전략 (우선순위: 낮음)

#### 5.1 결과 캐싱

```typescript
class GazeResultCache {
  private cache: Map<string, CachedResult> = new Map();
  private maxAge: number = 100; // ms

  get(cacheKey: string): GazeEstimate | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }
}
```

#### 5.2 예상 효과

- **캐시 히트율**: ~10%
- **CPU 절감**: ~5%

---

## 📐 구현 로드맵 (2주)

### Week 1: Web Worker + ROI 최적화

**Day 1-2**: Web Worker 구현
- [ ] `opencvWorker.ts` 생성
- [ ] `opencvWorkerManager.ts` 구현
- [ ] Worker ↔ Main 통신 프로토콜
- [ ] 에러 핸들링 및 Fallback

**Day 3-4**: useGazeTracking 통합
- [ ] Worker 초기화 로직
- [ ] postMessage 인터페이스
- [ ] 비동기 결과 처리
- [ ] 동기화 메커니즘

**Day 5-7**: ROI 최적화
- [ ] 적응형 패딩 구현
- [ ] ROI 캐싱 로직
- [ ] 다운샘플링 적용
- [ ] 성능 측정 및 조정

### Week 2: 프레임 스킵 + 메모리 최적화

**Day 8-10**: 프레임 스킵 전략
- [ ] AdaptiveFrameSkipper 클래스
- [ ] 움직임 감지 로직
- [ ] 스킵 간격 동적 조정
- [ ] MediaPipe와 OpenCV 분리 처리

**Day 11-12**: 메모리 최적화
- [ ] MatPool 구현
- [ ] 명시적 메모리 해제
- [ ] 메모리 누수 검사
- [ ] 성능 프로파일링

**Day 13-14**: 통합 테스트 및 검증
- [ ] FPS 측정 (목표: 28-30)
- [ ] CPU 사용률 측정
- [ ] 메모리 사용량 측정
- [ ] 장시간 안정성 테스트

---

## 🧪 성능 측정 방법

### 1. FPS 측정

```typescript
class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private lastTimestamp: number = 0;

  recordFrame(): void {
    const now = performance.now();
    if (this.lastTimestamp) {
      const fps = 1000 / (now - this.lastTimestamp);
      this.fpsHistory.push(fps);

      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
    }
    this.lastTimestamp = now;
  }

  getStats(): {
    current: number;
    average: number;
    min: number;
    max: number;
    stability: number; // 표준편차
  } {
    const avg = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
    const variance = this.fpsHistory
      .map(fps => Math.pow(fps - avg, 2))
      .reduce((a, b) => a + b) / this.fpsHistory.length;

    return {
      current: this.fpsHistory[this.fpsHistory.length - 1] || 0,
      average: avg,
      min: Math.min(...this.fpsHistory),
      max: Math.max(...this.fpsHistory),
      stability: Math.sqrt(variance)
    };
  }
}
```

### 2. CPU 사용률 측정

```typescript
// Chrome DevTools Performance API 활용
const measure = () => {
  performance.mark('frame-start');

  // 프레임 처리...

  performance.mark('frame-end');
  performance.measure('frame-duration', 'frame-start', 'frame-end');

  const measures = performance.getEntriesByType('measure');
  const frameDuration = measures[measures.length - 1].duration;

  // 16.67ms = 60fps 기준
  const cpuUsage = (frameDuration / 16.67) * 100;
};
```

### 3. 메모리 사용량 측정

```typescript
if (performance.memory) {
  const memStats = {
    usedJSHeapSize: performance.memory.usedJSHeapSize / 1048576, // MB
    totalJSHeapSize: performance.memory.totalJSHeapSize / 1048576,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit / 1048576
  };

  console.log('Memory:', memStats);
}
```

---

## ⚠️ 잠재적 위험 및 대응

### 위험 1: Web Worker 오버헤드

**위험**: Worker 통신 오버헤드가 이득을 상쇄
**확률**: 중간 (30%)
**영향**: 높음

**완화 방안**:
- SharedArrayBuffer 사용 (Chrome 지원)
- 배치 처리로 통신 횟수 감소
- Fallback: Worker 없이 메인 스레드 처리

### 위험 2: ROI 과도 축소

**위험**: ROI가 너무 작아서 동공 감지 실패
**확률**: 낮음 (20%)
**영향**: 중간

**완화 방안**:
- 적응형 패딩으로 자동 조정
- 감지 실패 시 패딩 증가
- 최소 ROI 크기 보장

### 위험 3: 프레임 스킵 부작용

**위험**: 빠른 시선 이동 추적 실패
**확률**: 중간 (40%)
**영향**: 중간

**완화 방안**:
- 움직임 감지 정확도 향상
- 보수적인 스킵 임계값
- MediaPipe는 항상 30fps 유지

---

## 📊 예상 최종 성능

### Before (Phase 2)

| 환경 | FPS | CPU | 메모리 |
|------|-----|-----|--------|
| Desktop (고성능) | 28-30 | 50-60% | 150MB |
| Desktop (일반) | 25-28 | 60-80% | 150MB |
| Laptop | 22-25 | 70-90% | 150MB |

### After (Phase 3)

| 환경 | FPS | CPU | 메모리 |
|------|-----|-----|--------|
| Desktop (고성능) | 29-30 | 35-45% | 120MB |
| Desktop (일반) | 28-30 | 45-60% | 120MB |
| Laptop | 26-28 | 55-75% | 120MB |

**개선율**:
- FPS: +10-20%
- CPU: -25%
- 메모리: -20%

---

## ✅ 성공 기준

1. **FPS**: 28 fps 이상 90% 이상 유지
2. **CPU**: 일반 데스크톱에서 60% 이하
3. **메모리**: 120MB 이하
4. **안정성**: 30분 연속 사용 시 성능 저하 없음
5. **정확도**: Phase 2 대비 동일 유지

---

## 🚀 Quick Start (개발자용)

### Phase 3 활성화

```typescript
const { currentGaze } = useGazeTracking({
  enabled: true,
  use3DTracking: true,
  enableHybridMode: true,
  enableVerticalCorrection: true,
  // ✨ Phase 3 옵션
  enableWebWorker: true,        // Web Worker 활성화
  enableROIOptimization: true,  // ROI 최적화
  enableFrameSkip: true,        // 프레임 스킵
  performanceMode: 'balanced'   // 'performance' | 'balanced' | 'quality'
});
```

### 성능 모니터링

```typescript
const { fps, cpuUsage, memoryUsage } = usePerformanceMonitor();

console.log('Performance:', {
  fps: fps.toFixed(1),
  cpu: `${cpuUsage.toFixed(1)}%`,
  memory: `${memoryUsage.toFixed(1)}MB`
});
```

---

**작성일**: 2025-01-02
**상태**: 설계 완료 - 구현 준비
**다음**: Web Worker 구현 시작
