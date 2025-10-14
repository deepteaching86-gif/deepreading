# Vision TEST 검증 가이드

## ✅ 완료된 작업

### 1. 데이터베이스 마이그레이션 (성공)
- **실행일**: 2025년 (just now)
- **파일**: `backend/prisma/migrations/20250614_add_vision_test_models/migration-safe.sql`
- **결과**: "Success. No rows returned"
- **생성된 테이블**:
  - ✅ vision_calibrations
  - ✅ vision_test_sessions
  - ✅ vision_gaze_data
  - ✅ vision_metrics
  - ✅ vision_calibration_adjustments

### 2. FPS 최적화 (완료)
- **변경 파일**: `frontend/src/hooks/useGazeTracking.ts`
- **변경 내용**: `setTimeout` 제거, `requestAnimationFrame`만 사용
- **예상 효과**: FPS 15-30으로 개선

### 3. 얼굴 위치 시각화 (완료)
- **변경 파일**:
  - `frontend/src/hooks/useGazeTracking.ts` - 중심 좌표 계산
  - `frontend/src/components/vision/CalibrationScreen.tsx` - 절대 위치 UI
- **변경 내용**:
  - 얼굴 중심점 계산 (`xMin + width/2`)
  - vw/vh 단위로 절대 위치 지정
  - 실시간 좌표 표시 추가

## 🔍 검증이 필요한 항목

### Backend 연동 확인

**방법 1: Render 백엔드 로그 확인**
1. https://dashboard.render.com 접속
2. `literacy-backend` 서비스 선택
3. "Logs" 탭에서 최근 로그 확인
4. ❌ 이전: `The table 'public.vision_calibrations' does not exist`
5. ✅ 예상: 더 이상 이 에러가 나타나지 않음

**방법 2: Vision TEST 시작 시도**
1. 프론트엔드에서 Vision TEST 시작
2. 개발자 도구 Network 탭 확인
3. `/api/vision/sessions/start` 요청 확인
4. ✅ 예상: 200 OK 응답
5. ❌ 이전: 400 Bad Request with database error

### Frontend 개선사항 확인

**FPS 개선 확인**:
- 캘리브레이션 화면에서 FPS 값 확인
- ❌ 이전: 매우 낮은 FPS (1-5?)
- ✅ 예상: 15-30 FPS

**얼굴 위치 표시 확인**:
- 캘리브레이션 화면에서 얼굴 감지 시
- ✅ 예상: 빨간색/초록색 박스가 실시간으로 표시됨
- ✅ 예상: "여기에 얼굴 위치" 가이드 박스와 함께 표시
- ✅ 예상: 박스 하단에 좌표 표시 (X:50% Y:50%)

## 🚀 다음 단계 (선택사항)

### 1. 태블릿 카메라 위치 보정 (사용자 요청 - 이전 세션)
- **목적**: 카메라가 상단, 좌측, 우측, 하단에 있는 경우 모두 지원
- **구현 필요**:
  - 디바이스 방향 감지
  - 시선 데이터 회전 보정
  - UI 회전 보정

### 2. 시선 인식 정확도 개선
- **현재 상태**: 사용자가 "시선 인식이 여전히 안돼"라고 보고
- **확인 필요**:
  - 캘리브레이션 완료 후 시선 점이 표시되는지
  - 시선 점이 실제 응시 위치와 일치하는지
  - 캘리브레이션 매트릭스가 올바르게 생성되는지

## 📊 테스트 체크리스트

- [ ] Render 백엔드 로그에 database 에러 없음
- [ ] Vision TEST 시작 시 400 에러 없음
- [ ] FPS 값 15-30 표시됨
- [ ] 얼굴 위치 박스가 실시간으로 표시됨
- [ ] 얼굴 중앙에 위치 시 초록색 박스 표시됨
- [ ] 캘리브레이션 9포인트 완료 가능
- [ ] 캘리브레이션 완료 후 시선 점 표시됨
- [ ] 시선 점이 응시 위치와 대략적으로 일치함

## 🐛 알려진 이슈

### WebGL 경고 (비중요)
```
WEBGL_multi_draw extension not supported, ANGLE_instanced_arrays extension not supported
```
- **영향**: 없음 (CPU 백엔드로 자동 대체)
- **상태**: 무시 가능

### 캘리브레이션 자동 진행 이슈 (이전 세션)
- **문제**: 3초 응시 후 자동으로 다음 포인트로 이동해야 하는데 안 됨
- **상태**: 확인 필요 (FPS 개선 후 해결되었을 수 있음)
