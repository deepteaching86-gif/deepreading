# Phase 2: 3D Eye Tracking Implementation Plan

> JEOresearch/EyeTracker 분석 기반 개선 계획
> 작성일: 2025-01-20

## 🎯 목표

현재 2D 기반 시선 추적을 JEOresearch의 3D geometric approach로 업그레이드하여:
- Vertical tracking 정확도 150% 향상
- Head pose 변화에 강건한 시스템
- 재캘리브레이션 없는 거리 적응

## 📋 구현 단계

### Stage 1: Nose-Based Coordinate System (1주차)

#### 1.1 Nose Landmarks 확장
```typescript
// 현재: 2-3개 nose landmarks
const noseTip = landmarks[1];
const noseBridge = landmarks[168];

// 개선: 24개 nose landmarks for PCA
const NOSE_INDICES = [4, 45, 275, 220, 440, 1, 5, 51, 281, 44, 274, 
                      241, 461, 125, 354, 218, 438, 195, 167, 393, 
                      165, 391, 3, 248];

const nosePoints = NOSE_INDICES.map(i => landmarks[i]);
```

#### 1.2 PCA 기반 좌표계 구축
```typescript
interface FaceCoordinateSystem {
  center: Point3D;
  axes: Matrix3x3;  // PCA eigenvectors
  scale: number;    // Nose region scale
}

function computeFaceCoordinates(nosePoints: Point3D[]): FaceCoordinateSystem {
  // Center point
  const center = averagePoint(nosePoints);
  
  // Covariance matrix
  const centered = nosePoints.map(p => subtract(p, center));
  const cov = computeCovariance(centered);
  
  // PCA for stable axes
  const { eigenvectors } = eigenDecomposition(cov);
  
  // Reference matrix stabilization (prevent flipping)
  if (previousAxes) {
    eigenvectors = stabilizeAxes(eigenvectors, previousAxes);
  }
  
  return { center, axes: eigenvectors, scale: computeScale(nosePoints) };
}
```

### Stage 2: 3D Eye Sphere Model (1주차)

#### 2.1 Eye Sphere Tracking
```typescript
interface EyeSphere3D {
  center: Point3D;       // World coordinates
  localOffset: Point3D;  // Head-relative offset
  radius: number;
}

class EyeSphereTracker {
  private calibrationScale: number;
  private leftEyeOffset: Point3D;
  private rightEyeOffset: Point3D;
  
  calibrate(faceCoords: FaceCoordinateSystem, iris3D: Point3D) {
    // Store eye position as head-relative offset
    this.leftEyeOffset = faceCoords.axes.transpose()
      .multiply(iris3D.subtract(faceCoords.center));
    this.calibrationScale = faceCoords.scale;
  }
  
  track(faceCoords: FaceCoordinateSystem): EyeSphere3D {
    // Scale compensation
    const scaleRatio = faceCoords.scale / this.calibrationScale;
    const scaledOffset = this.leftEyeOffset.multiply(scaleRatio);
    
    // Transform to world coordinates
    const worldCenter = faceCoords.center.add(
      faceCoords.axes.multiply(scaledOffset)
    );
    
    return { 
      center: worldCenter, 
      localOffset: scaledOffset,
      radius: 0.012 * scaleRatio 
    };
  }
}
```

#### 2.2 Binocular Fusion
```typescript
function computeCombinedGaze(
  leftSphere: EyeSphere3D,
  rightSphere: EyeSphere3D,
  leftIris: Point3D,
  rightIris: Point3D
): GazeRay3D {
  // Individual gaze rays
  const leftRay = createRay(leftSphere.center, leftIris);
  const rightRay = createRay(rightSphere.center, rightIris);
  
  // Combined direction (average)
  const combinedDir = normalize(
    leftRay.direction.add(rightRay.direction).divide(2)
  );
  
  // Origin (eye midpoint)
  const origin = leftSphere.center.add(rightSphere.center).divide(2);
  
  return { origin, direction: combinedDir };
}
```

### Stage 3: Ray-Plane Intersection (2주차)

#### 3.1 Virtual Monitor Definition
```typescript
interface VirtualMonitor {
  center: Point3D;    // 50cm distance
  normal: Vector3D;   // Perpendicular to screen
  width: number;      // 60cm
  height: number;     // 40cm
}

const VIRTUAL_MONITOR: VirtualMonitor = {
  center: { x: 0, y: 0, z: 500 },  // 500mm from eyes
  normal: { x: 0, y: 0, z: 1 },    // Facing user
  width: 600,   // 600mm
  height: 400   // 400mm
};
```

#### 3.2 Ray-Plane Intersection
```typescript
function computeGazePoint(gazeRay: GazeRay3D, monitor: VirtualMonitor): Point2D {
  // Ray: P = O + t*D
  // Plane: dot(N, P - C) = 0
  
  const O = gazeRay.origin;
  const D = gazeRay.direction;
  const N = monitor.normal;
  const C = monitor.center;
  
  // Solve for t
  const denom = dot(N, D);
  if (Math.abs(denom) < 0.0001) {
    return null; // Ray parallel to plane
  }
  
  const t = dot(N, C.subtract(O)) / denom;
  
  // Intersection point
  const intersection = O.add(D.multiply(t));
  
  // Convert to normalized screen coordinates
  return {
    x: (intersection.x - C.x) / monitor.width + 0.5,
    y: (intersection.y - C.y) / monitor.height + 0.5
  };
}
```

### Stage 4: Enhanced Filtering (2주차)

#### 4.1 Deque-Based Smoothing
```typescript
class GazeSmoother {
  private history: Deque<Point3D>;
  private maxLength: number = 5;
  
  addSample(direction: Point3D): Point3D {
    this.history.push(direction);
    if (this.history.length > this.maxLength) {
      this.history.shift();
    }
    
    // Average recent samples
    return this.history.reduce((sum, d) => sum.add(d))
      .divide(this.history.length);
  }
}
```

## 📊 예상 성능 개선

| Metric | Current (2D) | Phase 2 (3D) | Improvement |
|--------|-------------|--------------|-------------|
| Vertical Tracking | ±10° | ±20° | 100% |
| Head Rotation Tolerance | ±15° | ±45° | 200% |
| Distance Adaptation | Manual | Automatic | ∞ |
| Calibration Frequency | Every session | Once | 90% reduction |
| Jitter (std dev) | 0.5° | 0.2° | 60% reduction |

## 🔧 구현 우선순위

### Week 1 (Critical)
1. ✅ Nose-based coordinate system
2. ✅ 3D eye sphere model
3. ✅ Scale compensation

### Week 2 (Enhancement)
4. ✅ Ray-plane intersection
5. ✅ Deque smoothing
6. ✅ Reference matrix stabilization

### Week 3 (Optimization)
7. ⬜ Performance tuning
8. ⬜ Multi-point calibration
9. ⬜ Production testing

## 💻 테스트 계획

### Unit Tests
- Coordinate system stability
- Scale compensation accuracy
- Ray-plane intersection correctness

### Integration Tests
- Head movement robustness
- Distance change adaptation
- Vertical tracking range

### User Tests
- Calibration ease
- Tracking accuracy
- System responsiveness

## 📝 Migration Strategy

1. **Parallel Implementation**: Keep 2D system while developing 3D
2. **Feature Flag**: `use3DTracking` toggle for A/B testing
3. **Gradual Rollout**: 10% → 50% → 100% users
4. **Fallback Ready**: Instant revert if issues detected

## 🎯 Success Metrics

- **Vertical Tracking**: >15° range without recalibration
- **User Satisfaction**: >80% prefer 3D over 2D
- **Calibration Time**: <30 seconds one-time setup
- **Accuracy**: <2° average error across all head poses

---

**참고 자료**:
- JEOresearch/EyeTracker: https://github.com/JEOresearch/EyeTracker
- MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh
- 3D Computer Vision fundamentals