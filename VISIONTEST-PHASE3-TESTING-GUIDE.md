# ✅ VISIONTEST Phase 3: 실제 테스팅 가이드

## 📋 개요

**날짜**: 2025-01-02
**Phase**: Phase 3 - Performance Optimization 활성화
**상태**: ✅ **VisionTestPage 통합 완료**
**테스트 준비**: 완료

---

## 🎯 Phase 3 활성화 완료

### VisionTestPage 통합 내용

**파일**: `frontend/src/pages/student/VisionTestPage.tsx`

**추가된 기능**:
1. ✅ Phase 3 토글 버튼 (UI 상단 상태 바)
2. ✅ enablePhase3 state (localStorage 저장)
3. ✅ useGazeTracking에 Phase 3 옵션 전달
4. ✅ Phase 1+2 옵션도 동시 활성화 (enableHybridMode, enableVerticalCorrection)

**변경 사항**:
```typescript
// Lines 107-112: Phase 3 state 추가
const [enablePhase3, setEnablePhase3] = useState(() => {
  const stored = localStorage.getItem('gaze-tracking-phase3-enabled');
  return stored === 'true'; // Default: false (opt-in)
});

// Lines 169-195: useGazeTracking 옵션 설정
const { ... } = useGazeTracking({
  // 기본 옵션
  enabled: state.stage === 'testing',
  onGazePoint: handleGazePoint,
  // ... 기타 콜백들

  // ✨ Phase 1+2: 하이브리드 모드 및 수직 보정
  enableHybridMode: true,           // MediaPipe + OpenCV + 3D fusion
  enableVerticalCorrection: true,   // Y축 보정

  // ✨ Phase 3: 성능 최적화 (사용자가 토글 가능)
  enableWebWorker: enablePhase3,       // Worker 백그라운드 처리
  enableROIOptimization: enablePhase3, // ROI 최적화 및 캐싱
  enableFrameSkip: enablePhase3,       // 적응형 프레임 스킵
  performanceMode: 'balanced'          // 균형 모드
});

// Lines 618-638: Phase 3 토글 버튼 UI
<button
  onClick={() => {
    const newValue = !enablePhase3;
    setEnablePhase3(newValue);
    localStorage.setItem('gaze-tracking-phase3-enabled', newValue.toString());
    // Restart tracking to apply changes
    if (isTracking) {
      stopTracking();
      setTimeout(() => startTracking(), 100);
    }
  }}
  className={...}
  title={enablePhase3 ? "Phase 3 최적화 활성화 (Worker + ROI + FrameSkip)" : "Phase 3 최적화 비활성화 (기본 모드)"}
>
  ⚡ Phase3 {enablePhase3 ? 'ON' : 'OFF'}
</button>
```

---

## 🧪 테스트 시나리오

### 1. Phase 3 OFF vs ON 비교 테스트 (A/B Test)

#### Phase 3 OFF 테스트 (Baseline)
1. VisionTestPage 접속
2. 상단 상태 바에서 `⚡ Phase3 OFF` 확인
3. 캘리브레이션 진행 → "진행하기" 클릭
4. 지문 읽기 시작
5. **성능 지표 측정**:
   - FPS 확인 (상단 상태 바)
   - Chrome DevTools → Performance 탭 → CPU 사용률
   - Chrome DevTools → Memory 탭 → 메모리 사용량
   - 시선 추적 부드러움 (👁️ ON 켜서 시각적 확인)

**예상 성능 (Phase 2 기준)**:
- FPS: 25-28 fps (±5 fluctuation)
- Main Thread CPU: 60-80%
- Memory: ~150MB
- 응답 지연: 50-100ms

#### Phase 3 ON 테스트 (Optimized)
1. 상단 상태 바에서 `⚡ Phase3 OFF` 버튼 클릭 → `⚡ Phase3 ON` 변경
2. Tracking 자동 재시작 (100ms 대기 후)
3. 동일한 방법으로 테스트 진행
4. **성능 지표 측정** (동일한 방법)

**예상 성능 (Phase 3 목표)**:
- FPS: 29-30 fps (±2 stable)
- Main Thread CPU: 42-55% (-30% 개선)
- Worker Thread CPU: ~18% (새로 추가)
- Memory: ~125MB (-17% 개선)
- 응답 지연: 35-45ms (-30% 개선)

---

### 2. 개별 최적화 검증 테스트

#### Test 2.1: Web Worker 백그라운드 처리
**확인 방법**:
1. Phase 3 ON 상태에서 테스트 시작
2. Chrome DevTools → Sources → Web Workers 확인
3. `opencvWorker.ts` Worker 실행 중인지 확인
4. Console에서 다음 로그 확인:
   ```
   🚀 Phase 3: Initializing Web Worker and MatPool...
   ✅ Web Worker initialized successfully
   ✅ MatPool will be managed by Worker
   ```

**예상 효과**:
- 메인 스레드 CPU 30% 감소
- UI 응답성 향상 (부드러운 스크롤, 버튼 반응)

#### Test 2.2: ROI 최적화 및 캐싱
**확인 방법**:
1. Phase 3 ON 상태
2. Console에서 ROI 캐싱 로그 확인 (120 프레임마다)
3. 얼굴을 정지 상태로 유지 → 캐시 히트 확인

**예상 로그**:
```
🔄 ROI Cache Hit: reusing previous ROI
```

**예상 효과**:
- OpenCV 처리 시간 40% 감소 (15-20ms → 8-12ms)
- 캐시 히트율 ~25% (정지 시)

#### Test 2.3: 적응형 프레임 스킵
**확인 방법**:
1. Phase 3 ON 상태
2. Console에서 Frame Skip Stats 로그 확인 (120 프레임마다):
   ```
   ⏭️ Frame Skip Stats: {
     processingRate: '66.7%',
     skipRate: '33.3%',
     cpuSavings: '33.3%',
     currentInterval: 2
   }
   ```
3. 다양한 움직임 테스트:
   - **정지 상태**: skipRate ~50% (interval=3)
   - **중간 움직임**: skipRate ~33% (interval=2)
   - **빠른 움직임**: skipRate ~0% (interval=1, 모든 프레임 처리)

**예상 효과**:
- 평균 처리 프레임 33% 감소 (30 fps → 20 fps for OpenCV)
- CPU 절감 10-15% 추가
- MediaPipe는 30fps 유지 (정확도 보장)

---

### 3. 장시간 안정성 테스트

**테스트 절차**:
1. Phase 3 ON 상태로 30분 테스트 실행
2. 다음 지표를 5분마다 기록:
   - FPS (평균, 최소, 최대)
   - CPU 사용률 (메인 스레드, Worker 스레드)
   - 메모리 사용량 (증가율 확인)
   - Frame Skip 통계

**검증 항목**:
- ✅ 메모리 누수 없음 (메모리 안정적 유지)
- ✅ FPS 저하 없음 (30분 후에도 29-30 fps 유지)
- ✅ Worker 안정성 (타임아웃 에러 없음)
- ✅ ROI 캐시 효율성 (캐시 히트율 20-30% 유지)

---

## 📊 성능 측정 방법

### Chrome DevTools Performance Profiling

**Step 1: CPU 사용률 측정**
1. Chrome DevTools 열기 (F12)
2. Performance 탭 선택
3. Record 시작 (●)
4. 30초 동안 테스트 실행
5. Record 정지
6. 결과 분석:
   - Main Thread CPU: Task → Scripting 시간 확인
   - Worker Thread CPU: Worker 항목 확인

**Step 2: 메모리 사용량 측정**
1. Memory 탭 선택
2. Allocation instrumentation on timeline 선택
3. Start 버튼 클릭
4. 30초 동안 테스트 실행
5. Stop 버튼 클릭
6. 메모리 증가 추이 확인

**Step 3: FPS 측정**
1. Performance Monitor 패널 열기 (Ctrl+Shift+P → "Show Performance Monitor")
2. FPS, CPU usage, JS heap size 실시간 모니터링

---

## 🎯 예상 결과

### Desktop (일반 PC)

| 지표 | Phase 2 (OFF) | Phase 3 (ON) | 개선율 |
|------|--------------|-------------|--------|
| **FPS (평균)** | 25-28 fps | 29-30 fps | +7-18% |
| **FPS (안정성)** | ±5 fps | ±2 fps | 60% 향상 |
| **메인 CPU** | 60-80% | 42-55% | -30% |
| **Worker CPU** | - | ~18% | (신규) |
| **메모리** | 150MB | 125MB | -17% |
| **응답 지연** | 50-100ms | 35-45ms | -30% |

### 주요 개선 포인트
1. **UI 응답성**: 메인 스레드 CPU 30% 감소 → 부드러운 인터페이스
2. **FPS 안정성**: ±5 → ±2 fps (60% 향상) → 일관된 추적 성능
3. **메모리 효율**: 17% 감소 + GC 빈도 40-50% 감소 → 장시간 안정성
4. **처리 효율**: 적응형 프레임 스킵으로 CPU 절감 → 배터리 절약 (모바일)

---

## 🐛 알려진 이슈 및 해결 방법

### Issue 1: Worker 초기화 실패
**증상**: Console에 "❌ Failed to initialize Phase 3 optimizations" 에러
**원인**: OpenCV.js 로드 실패 또는 Worker 파일 경로 문제
**해결**:
1. OpenCV.js CDN 로드 확인 (Network 탭)
2. Worker 파일 경로 확인 (`frontend/src/workers/opencvWorker.ts`)
3. 자동으로 Fallback to main thread 처리됨

### Issue 2: ROI 캐시가 작동하지 않음
**증상**: Console에 ROI Cache Hit 로그가 나타나지 않음
**원인**: 얼굴 움직임이 너무 크거나 enableROIOptimization이 false
**해결**:
1. Phase 3 ON 확인
2. 얼굴을 정지 상태로 유지 (velocity < 0.05)
3. Console에서 velocity 로그 확인

### Issue 3: Frame Skip이 너무 공격적
**증상**: 시선 추적이 끊기는 느낌
**원인**: Frame Skip interval이 3으로 너무 높음
**해결**:
1. 얼굴/시선을 조금 움직여 velocity 증가
2. Console에서 currentInterval 확인 (1-3)
3. Interval 1-2는 정상, 3은 정지 상태

### Issue 4: 성능 개선이 느껴지지 않음
**증상**: Phase 3 ON/OFF 차이가 명확하지 않음
**원인**: 고성능 PC에서는 Phase 2도 충분히 빠름
**해결**:
1. Chrome DevTools Performance 탭으로 정량 측정
2. 저사양 PC에서 테스트 (더 명확한 차이)
3. 장시간 테스트 (30분+)로 안정성 차이 확인

---

## 📝 테스트 체크리스트

### Phase 3 기본 테스트
- [ ] Phase 3 ON/OFF 토글 버튼 작동 확인
- [ ] Worker 초기화 로그 확인 (Console)
- [ ] FPS 측정 (Performance Monitor)
- [ ] CPU 사용률 측정 (Performance Profiler)
- [ ] 메모리 사용량 측정 (Memory Profiler)

### 개별 최적화 검증
- [ ] Worker 백그라운드 처리 확인 (Sources → Web Workers)
- [ ] ROI 캐싱 로그 확인 (Console)
- [ ] Frame Skip Stats 로그 확인 (Console)
- [ ] MatPool 통계 확인 (Worker 내부, 필요시 추가 로깅)

### 장시간 안정성 테스트
- [ ] 30분 테스트 완료
- [ ] 메모리 누수 없음 확인
- [ ] FPS 저하 없음 확인
- [ ] Worker 타임아웃 에러 없음 확인

### A/B 비교 테스트
- [ ] Phase 3 OFF 성능 측정 완료
- [ ] Phase 3 ON 성능 측정 완료
- [ ] 성능 개선율 계산 완료
- [ ] 결과 문서화 완료

---

## 🚀 다음 단계

### 단기 (1-2주)
1. **실제 성능 측정** ✅ 시작 가능
   - Desktop 벤치마크 테스트
   - FPS, CPU, 메모리 실측
   - 성능 목표 달성 여부 확인

2. **사용자 피드백 수집**
   - Beta 테스터 모집 (5-10명)
   - A/B 테스트 진행 (Phase 2 vs Phase 3)
   - 주관적 체감 성능 설문

### 중기 (2-4주)
3. **단위/통합 테스트 작성**
   - AdaptiveROI 테스트
   - FrameSkipper 테스트
   - MatPool 테스트
   - Worker 통합 테스트

4. **성능 개선 보고서 작성**
   - 실측 데이터 기반 분석
   - 최적화 기법별 기여도 분석
   - 알려진 이슈 및 개선 방향

### 장기 (1-2개월)
5. **플랫폼 확장**
   - iPad Native 구현
   - Android 구현
   - Cross-platform 성능 비교

6. **Production 배포**
   - 최종 QA 테스트
   - Production 환경 배포
   - 모니터링 및 롤백 계획

---

**작성일**: 2025-01-02
**상태**: Phase 3 VisionTestPage 통합 완료 ✅
**다음**: 실제 성능 측정 및 A/B 테스트 🎯
**테스트 시작**: 즉시 가능 🚀
