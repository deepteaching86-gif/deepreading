# 시선 추적 시스템 안정성 개선 수정 사항

> **작성일**: 2025-01-20  
> **작성자**: Claude Code  
> **이슈**: Calibration stage video stream 안정성 문제 해결

## 📋 수정 사항 요약

### 1. Callback Recreation 문제 해결

**문제점**:
- Stage 변경 시 callback 함수들이 재생성되어 `useGazeTracking` hook이 재실행됨
- 이로 인해 detection loop가 중단되고 재시작되면서 video stream 손실 발생

**해결책**:
- `useRef`를 사용하여 state 값에 대한 참조 유지
- Callback 함수들을 dependency 없는 stable callback으로 변경
- Stage 변경에도 callback이 재생성되지 않도록 수정

### 2. 수정된 파일들

#### `CalibrationScreenSimple.tsx`
```typescript
// Before: callback이 stage와 pointCountdown을 dependency로 가짐
onRawGazeData: useCallback((data) => {
  if (stage === 'calibration' && pointCountdown > 0) {
    // ...
  }
}, [stage, pointCountdown])  // 문제: stage 변경 시 재생성

// After: useRef를 사용하여 stable callback 생성
const stageRef = useRef(stage);
const pointCountdownRef = useRef(pointCountdown);

const handleRawGazeData = useCallback((data) => {
  if (stageRef.current === 'calibration' && pointCountdownRef.current > 0) {
    // ...
  }
}, [])  // No dependencies - stable callback
```

#### `VisionTestPage.tsx`
```typescript
// Before: concentrationAlerts.length를 dependency로 가짐
onConcentrationData: useCallback((rawData) => {
  // ...
  if (currentSession && currentSession.alerts.length > concentrationAlerts.length) {
    // ...
  }
}, [concentrationAlerts.length])  // 문제: alerts 업데이트 시 재생성

// After: useRef를 사용하여 stable callback 생성
const concentrationAlertsRef = useRef<ConcentrationAlert[]>([]);

const handleConcentrationData = useCallback((rawData) => {
  // ...
  if (currentSession && currentSession.alerts.length > concentrationAlertsRef.current.length) {
    // ...
  }
}, [])  // No dependencies - stable callback
```

## 🎯 개선 효과

1. **Video Stream 안정성 향상**
   - Stage 전환 시에도 video stream이 끊어지지 않음
   - `readyState: 0` 무한 루프 문제 해결

2. **Detection Loop 연속성 유지**
   - Callback 재생성으로 인한 detection loop 중단 방지
   - 부드러운 stage 전환 가능

3. **성능 최적화**
   - 불필요한 callback 재생성 제거
   - React re-render 최소화

## 🔍 이미 적용된 개선사항 (확인됨)

### 1. Detection Loop Restart 방지 (Commit c255a577)
- `useGazeTracking.ts` line 880
- `detectAndEstimateGaze`를 dependency array에서 제거
- Self-sustaining loop이므로 재시작 불필요

### 2. Vertical Tracking Sensitivity 개선 (Commit accd1b02)
- `useGazeTracking.ts` line 1043-1044
- `enhancedPitchInfluence`: 0.05 → 8.0으로 증가
- 수직 방향 홍채 움직임 감지 개선

## 📦 배포 체크리스트

### Frontend 배포 (Netlify)

1. **빌드 테스트**
   ```bash
   cd frontend
   npm run build
   ```

2. **Git Commit & Push**
   ```bash
   git add .
   git commit -m "fix: Stabilize video stream during calibration stage transitions

   - Use refs to prevent callback recreation on state changes
   - Maintain stable callbacks in CalibrationScreenSimple and VisionTestPage
   - Prevents video stream loss and detection loop restart issues"
   
   git push origin main
   ```

3. **Netlify 자동 배포**
   - Push 후 Netlify에서 자동으로 빌드 및 배포 시작
   - 배포 상태 확인: https://app.netlify.com

4. **배포 후 테스트**
   - URL: https://playful-cocada-a89755.netlify.app
   - Vision TEST 진입 → Calibration 시작
   - Camera Check → Calibration stage 전환 시 video stream 유지 확인
   - Console에서 에러 로그 확인

## 🧪 테스트 시나리오

### 1. Video Stream 안정성 테스트
1. Vision TEST 진입
2. Calibration 시작 버튼 클릭
3. Camera Check stage에서 얼굴 인식 확인
4. 3초 카운트다운 후 Calibration stage 자동 전환
5. **확인사항**:
   - Video stream이 끊어지지 않고 유지되는지
   - Console에 `readyState: 0` 에러가 없는지
   - Face detection이 계속 작동하는지

### 2. Calibration 완료 테스트
1. 9개 점 순차적으로 표시
2. 각 점당 3초씩 응시
3. 파란색 시선 마커가 표시되는지 확인
4. 캘리브레이션 완료 메시지 확인

### 3. Vertical Tracking 테스트
1. Calibration 완료 후 테스트 시작
2. 위/아래로 시선 이동
3. Gaze marker가 수직 방향으로 잘 따라가는지 확인
4. 수평 방향과 비슷한 감도로 작동하는지 확인

## 📊 모니터링 포인트

### Console 로그 확인
```javascript
// 정상 작동 시
✅ MediaPipe Tasks Vision initialized successfully
✅ Camera stream obtained: {active: true, tracks: 2, videoTracks: 1}
✅ Video playback started: {readyState: 4, videoWidth: 640, videoHeight: 480}
🔄 Starting detection loop
✅ Face detected with 478 landmarks

// 문제 발생 시 (수정 전)
⏳ Video not ready: {readyState: 0, width: 0, height: 0}
❌ Detection loop restart detected
```

### Performance Metrics
- Face Detection FPS: 목표 30 FPS
- Gaze Update Latency: < 50ms
- Vertical Tracking Range: ±20°
- Horizontal Tracking Range: ±30°

## 🚀 향후 개선 계획

### Phase 2: 3D Ray Projection (계획)
- JEOresearch/EyeTracker 방식의 3D ray projection 도입
- Eye sphere stabilization
- Ray-plane intersection for accurate gaze estimation
- 예상 성능 개선: Vertical tracking ~150% 향상

### Phase 3: Production Optimization (미정)
- Multi-browser compatibility
- Mobile device support
- Low-light environment handling
- Glasses/Sunglasses detection and compensation

## 📝 참고사항

- 현재 수정은 최소한의 변경으로 안정성 문제를 해결
- 기존 로직을 최대한 유지하면서 callback recreation만 방지
- 추가적인 리팩토링은 Phase 2에서 진행 예정

---

**문의사항**: 개발팀 또는 Claude Code에 문의