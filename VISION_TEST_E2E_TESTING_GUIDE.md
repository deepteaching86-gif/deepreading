# Vision TEST E2E 테스팅 가이드

## 📋 테스트 개요

이 문서는 Vision TEST 기능의 End-to-End 테스팅을 위한 체크리스트와 가이드입니다.

**테스트 버전**: v1.0
**마지막 업데이트**: 2025-10-14
**테스터**: [담당자명]

---

## 🎯 테스트 환경 준비

### 필수 요구사항

- [ ] **브라우저**: Chrome 최신 버전 (권장)
- [ ] **카메라**: 웹캠 활성화 및 권한 허용
- [ ] **조명**: 얼굴이 잘 보이는 밝은 환경
- [ ] **네트워크**: 안정적인 인터넷 연결
- [ ] **화면**: 최소 1024x768 해상도
- [ ] **거리**: 모니터로부터 50-70cm 거리 유지

### 테스트 계정

**학생 계정**:
- 이메일: `student-test@example.com`
- 비밀번호: `[비밀번호]`
- 학년: 2학년

**관리자 계정**:
- 이메일: `admin-test@example.com`
- 비밀번호: `[비밀번호]`

---

## 🧪 테스트 시나리오

### 1. Calibration Flow 테스트 (캘리브레이션)

#### 1.1 환경 체크
- [ ] Vision TEST 템플릿 선택
- [ ] "시선 추적 테스트 시작" 버튼 클릭
- [ ] CalibrationScreen으로 이동 확인

#### 1.2 Instructions 화면
- [ ] 준비사항 안내 표시 확인
  - "카메라가 활성화되어야 합니다"
  - "얼굴이 화면 중앙에 위치해야 합니다"
  - "조명이 밝아야 합니다"
- [ ] "캘리브레이션 시작" 버튼 클릭

#### 1.3 카메라 권한
- [ ] 카메라 권한 요청 팝업 확인
- [ ] "허용" 클릭
- [ ] 비디오 스트림 시작 확인
- [ ] 얼굴 감지 확인 (녹색 landmark 표시)

#### 1.4 9-Point Calibration
각 포인트에 대해 테스트:

**포인트 1 (Top-Left)**:
- [ ] 포인트가 animate-pulse 효과로 강조 표시
- [ ] 3초 카운트다운 표시 (3 → 2 → 1)
- [ ] 실시간 gaze 위치 표시 (빨간 점)
- [ ] FPS 표시 (20-60 FPS 범위)
- [ ] 자동으로 다음 포인트로 이동

**포인트 2-9 반복**:
- [ ] 모든 포인트에 대해 동일한 프로세스 확인
- [ ] 진행률 바 업데이트 확인 (1/9 → 9/9)

#### 1.5 Validation
- [ ] "검증 중..." 로딩 스피너 표시
- [ ] Backend API 호출 확인 (`POST /api/v1/vision/calibration/validate`)
- [ ] 2-5초 대기

#### 1.6 성공 케이스
- [ ] "캘리브레이션 완료!" 메시지 표시
- [ ] 정확도 점수 표시 (70-100%)
- [ ] VisionTestPage로 자동 이동
- [ ] CalibrationID 저장 확인

#### 1.7 실패 케이스 (의도적으로 실패 유도)
- [ ] 얼굴을 화면 밖으로 이동
- [ ] "캘리브레이션 실패" 메시지 확인
- [ ] 정확도 점수 표시 (<70%)
- [ ] "다시 시도" 버튼 클릭 가능
- [ ] 재시도 시 처음부터 다시 시작

#### 1.8 재사용 테스트
- [ ] 동일한 사용자로 7일 이내 재접속
- [ ] 캘리브레이션 건너뛰기 확인
- [ ] 기존 calibrationMatrix 사용 확인

---

### 2. Vision TEST Flow 테스트 (테스트 진행)

#### 2.1 테스트 시작
- [ ] VisionTestPage 로딩 확인
- [ ] Gaze tracking 자동 시작 확인
- [ ] 비디오 스트림 표시 확인
- [ ] 실시간 gaze 위치 표시 (빨간 점)

#### 2.2 지문 읽기 (Passage 1)
- [ ] 첫 번째 지문 표시 확인
- [ ] 지문 텍스트 가독성 확인
- [ ] Gaze tracking 활성화 상태 확인 (녹색 인디케이터)
- [ ] FPS 표시 확인 (20-60 FPS)

**실시간 데이터 수집**:
- [ ] Console 확인: Gaze points 수집 로그
- [ ] 5초 대기 후 자동 chunk 저장 확인
- [ ] Network 탭: `POST /api/v1/vision/session/save-gaze-data` 호출 확인
- [ ] Response 200 OK 확인

#### 2.3 문제 풀이 (Passage 1)
- [ ] "다음" 버튼 클릭 또는 자동 이동
- [ ] 문제 표시 확인 (4지선다)
- [ ] 선택지 클릭 가능 확인
- [ ] 답안 선택 후 강조 표시 확인
- [ ] "다음 지문" 버튼 활성화 확인

#### 2.4 지문 2-N 반복
- [ ] 각 지문에 대해 2.2-2.3 프로세스 반복
- [ ] 진행률 표시 확인 (1/3 → 3/3)
- [ ] 각 지문마다 gaze data chunk 저장 확인

#### 2.5 테스트 제출
- [ ] 마지막 문제 풀이 후 "제출하기" 버튼 표시
- [ ] "제출하기" 클릭
- [ ] 최종 gaze data flush 확인
- [ ] Network 탭: `POST /api/v1/vision/session/submit` 호출 확인
- [ ] Response 200 OK 및 sessionId 반환 확인

#### 2.6 자동 처리
Backend에서 자동으로 처리:
- [ ] Metrics 계산 (15개)
- [ ] AI 분석 생성
- [ ] Heatmap 생성
- [ ] 3-5초 대기 후 결과 페이지로 이동

---

### 3. Vision TEST Report 테스트 (결과 확인)

#### 3.1 페이지 로딩
- [ ] `/student/vision/result/:sessionId` URL 확인
- [ ] VisionTestReport 컴포넌트 렌더링 확인
- [ ] Loading 스피너 표시 (데이터 로딩 중)
- [ ] 2-3초 내 데이터 표시

#### 3.2 Overall Score
- [ ] Overall Eye Tracking Score 표시 (0-100)
- [ ] 큰 숫자로 중앙 상단에 표시
- [ ] 학생 이름 및 테스트 날짜 표시

#### 3.3 Eye Movement Patterns (6개 메트릭)
Radar Chart 확인:
- [ ] Average Saccade Amplitude
- [ ] Saccade Variability
- [ ] Average Saccade Velocity
- [ ] Optimal Landing Rate
- [ ] Return Sweep Accuracy
- [ ] Scan Path Efficiency

**검증**:
- [ ] Radar 차트가 올바르게 렌더링됨
- [ ] 각 메트릭 값이 표시됨 (숫자 + 단위)
- [ ] 차트에 마우스 오버 시 툴팁 표시

#### 3.4 Fixation Behavior (4개 메트릭)
Bar Chart 확인:
- [ ] Average Fixation Duration (ms)
- [ ] Fixations Per Word
- [ ] Regression Rate (%)
- [ ] Vocabulary Gap Score (0-100)

**검증**:
- [ ] Bar 차트가 올바르게 렌더링됨
- [ ] 각 메트릭에 대한 optimal value 표시
- [ ] Status indicator (우수/보통/개선 필요)

#### 3.5 Reading Speed & Rhythm (3개 메트릭)
- [ ] Words Per Minute (WPM)
- [ ] Rhythm Regularity (0-1)
- [ ] Stamina Score (0-100)

#### 3.6 Comprehension & Cognitive (2개 메트릭)
- [ ] Gaze-Comprehension Correlation (-1 to 1)
- [ ] Cognitive Load Index (0-100)

#### 3.7 Heatmap Visualization
Canvas 렌더링 확인:
- [ ] 32x18 grid 히트맵 표시
- [ ] Purple gradient (밝은 보라 → 진한 보라)
- [ ] Intensity에 따른 색상 변화 확인
- [ ] 지문 위치와 일치하는지 확인

#### 3.8 AI Analysis
- [ ] **Strengths** 카드 표시 (3-5개 항목)
- [ ] **Weaknesses** 카드 표시 (3-5개 항목)
- [ ] **Recommendations** 카드 표시 (3-5개 항목)
- [ ] 각 항목이 한글로 표시됨
- [ ] Confidence Score 표시 (0.85 목표)
- [ ] Narrative 텍스트 표시

#### 3.9 Peer Comparison
- [ ] Peer comparison 그래프 표시
- [ ] 또래 평균과 비교
- [ ] Percentile ranking 표시

---

### 4. Gaze Replay 테스트 (관리자용)

#### 4.1 Admin 페이지 접속
- [ ] 관리자 계정으로 로그인
- [ ] `/admin/vision-sessions` URL 접속
- [ ] VisionSessions 목록 표시 확인

#### 4.2 세션 목록
- [ ] 테스트한 세션이 목록에 표시됨
- [ ] Status badge 확인 (completed)
- [ ] Overall Score 표시 확인
- [ ] 학생 이름, 학년, 날짜 표시 확인

#### 4.3 필터링
- [ ] **학년 필터**: 2학년 선택 시 해당 학년만 표시
- [ ] **상태 필터**: "완료" 선택 시 완료된 세션만 표시
- [ ] **학생 이름 검색**: 이름 입력 시 필터링 확인

#### 4.4 세션 상세
- [ ] 세션 클릭
- [ ] `/admin/vision-session/:sessionId` URL 이동
- [ ] VisionSessionDetail 컴포넌트 렌더링 확인

#### 4.5 Replay 탭
- [ ] "Replay" 탭 클릭
- [ ] GazeReplayPlayer 컴포넌트 로딩 확인
- [ ] 지문 텍스트 표시 확인
- [ ] Canvas 렌더링 확인

#### 4.6 Playback Controls
**Play 버튼**:
- [ ] "재생" 버튼 클릭
- [ ] 애니메이션 시작 확인
- [ ] Frame counter 증가 확인 (0 → totalFrames)
- [ ] ~30 FPS 재생 확인

**Pause 버튼**:
- [ ] "일시정지" 버튼 클릭
- [ ] 애니메이션 정지 확인
- [ ] 현재 프레임 유지 확인

**Stop 버튼**:
- [ ] "정지" 버튼 클릭
- [ ] 프레임 0으로 리셋 확인
- [ ] Canvas 초기화 확인

**Step Forward/Backward**:
- [ ] "→" 버튼 클릭 시 1 프레임 전진
- [ ] "←" 버튼 클릭 시 1 프레임 후진
- [ ] Frame counter 정확히 증감 확인

#### 4.7 Speed Control
- [ ] **0.5x**: 느린 재생 확인
- [ ] **1x**: 정상 속도 확인
- [ ] **2x**: 2배속 확인
- [ ] **4x**: 4배속 확인

#### 4.8 Timeline Slider
- [ ] 슬라이더 드래그 시 프레임 이동 확인
- [ ] 0% → 50% → 100% 이동 테스트
- [ ] 현재 프레임과 슬라이더 위치 동기화 확인

#### 4.9 Gaze Visualization
**Fixation (응시)**:
- [ ] 투명한 보라색 원으로 표시
- [ ] Duration에 따라 크기 변화 (15-50px)
- [ ] Duration 숫자 표시 (ms)

**Normal Saccade (정상 시선 이동)**:
- [ ] 보라색 선으로 표시 (#9333EA)
- [ ] 순차적인 점 연결 확인

**Regression (역행)**:
- [ ] 주황색 선으로 표시 (#F97316)
- [ ] Y축 역행 감지 확인

**Off-page (화면 밖)**:
- [ ] 회색 선으로 표시 (#6B7280)
- [ ] 화면 밖 점 표시 확인

#### 4.10 Metrics 탭
- [ ] "Metrics" 탭 클릭
- [ ] 15개 메트릭 카드 표시 확인
- [ ] 각 메트릭의 optimal value 및 status 표시 확인

#### 4.11 AI Analysis 탭
- [ ] "AI Analysis" 탭 클릭
- [ ] Strengths, Weaknesses, Recommendations 표시 확인
- [ ] Narrative 텍스트 표시 확인

---

## 🌐 Cross-Browser 테스팅

### Chrome (Windows/Mac)
- [ ] 모든 기능 정상 작동
- [ ] Gaze tracking FPS: 30-60
- [ ] Canvas 렌더링 정상
- [ ] Charts 렌더링 정상

### Safari (Mac/iOS)
- [ ] 카메라 권한 요청 확인
- [ ] MediaPipe 로딩 확인
- [ ] Gaze tracking 정상 작동
- [ ] Canvas 렌더링 정상
- [ ] iOS 터치 이벤트 정상

### Edge (Windows)
- [ ] 모든 기능 정상 작동
- [ ] Gaze tracking FPS: 30-60
- [ ] Canvas 렌더링 정상

### Mobile/Tablet (선택사항)
- [ ] iPad: 카메라 작동, 터치 인터페이스
- [ ] Android Tablet: 카메라 작동, 터치 인터페이스
- [ ] 반응형 레이아웃 확인

---

## 📊 성능 테스팅

### Gaze Tracking Performance
- [ ] **FPS**: 30-60 FPS 유지
- [ ] **CPU Usage**: <50% (정상 범위)
- [ ] **Memory Usage**: <500MB (정상 범위)
- [ ] **Latency**: <50ms (gaze point → screen coordinate)

### Network Performance
- [ ] **Chunk Upload**: <200ms per chunk
- [ ] **Chunk Size**: <100KB per chunk
- [ ] **Total Gaze Data**: <2MB per session
- [ ] **Metrics Calculation**: <500ms
- [ ] **Report Loading**: <2s

### Canvas Rendering
- [ ] **Heatmap Rendering**: <300ms
- [ ] **Replay FPS**: 30 FPS 유지
- [ ] **Frame Switching**: <16ms (60 FPS 목표)

---

## 🐛 알려진 이슈 및 해결 방법

### Issue 1: 카메라 권한 거부
**증상**: "카메라에 접근할 수 없습니다" 에러
**해결**: 브라우저 설정에서 카메라 권한 허용 후 페이지 새로고침

### Issue 2: 얼굴 감지 실패
**증상**: "얼굴을 감지할 수 없습니다" 경고
**해결**: 조명 개선, 얼굴을 화면 중앙에 위치, 안경 제거

### Issue 3: 낮은 FPS (<20)
**증상**: Gaze tracking이 느리거나 끊김
**해결**: 다른 탭 닫기, 브라우저 하드웨어 가속 활성화

### Issue 4: Calibration 정확도 낮음 (<70%)
**증상**: Calibration 실패
**해결**: 각 포인트를 정확히 3초간 응시, 머리 움직임 최소화

### Issue 5: Chunk 업로드 실패
**증상**: Network error during save-gaze-data
**해결**: 네트워크 연결 확인, 백엔드 서버 상태 확인

---

## ✅ 테스트 통과 기준

### 필수 통과 항목 (Critical)
- [ ] Calibration flow 완료 (70% 정확도 이상)
- [ ] Vision TEST 완료 (모든 지문 읽기 + 문제 풀이)
- [ ] Report 페이지 로딩 (15 metrics + AI analysis)
- [ ] Gaze replay 재생 (Play/Pause/Speed control)
- [ ] Admin 페이지 접속 및 세션 조회

### 중요 항목 (High Priority)
- [ ] Gaze tracking FPS 30+ 유지
- [ ] Chunk 업로드 성공률 95%+
- [ ] Metrics 계산 시간 <500ms
- [ ] Report 로딩 시간 <2s
- [ ] Canvas 렌더링 60 FPS

### 선택 항목 (Nice to Have)
- [ ] Safari/Edge 크로스 브라우저 테스트
- [ ] Mobile/Tablet 테스트
- [ ] 성능 최적화 검증

---

## 📝 테스트 결과 기록

### 테스트 정보
- **테스터**: [이름]
- **테스트 날짜**: [YYYY-MM-DD]
- **테스트 환경**: [OS + Browser + Version]
- **빌드 버전**: [Git Commit Hash]

### 결과 요약
- **전체 테스트 항목**: [총 개수]
- **통과**: [개수]
- **실패**: [개수]
- **건너뜀**: [개수]

### 발견된 버그
1. **[버그 제목]**
   - **심각도**: Critical/High/Medium/Low
   - **재현 방법**: [단계별 설명]
   - **예상 결과**: [설명]
   - **실제 결과**: [설명]
   - **스크린샷**: [첨부]

2. ...

### 개선 제안
1. **[제안 제목]**
   - **카테고리**: UX/Performance/Feature
   - **설명**: [상세 설명]
   - **우선순위**: High/Medium/Low

---

## 🎯 다음 단계

테스트 완료 후:
1. [ ] 테스트 결과를 팀과 공유
2. [ ] 발견된 버그 이슈 생성 (GitHub Issues)
3. [ ] 성능 개선 항목 우선순위 설정
4. [ ] 사용자 가이드 작성 (실제 사용 경험 기반)
5. [ ] 프로덕션 배포 최종 승인

---

**문서 버전**: 1.0
**작성일**: 2025-10-14
**작성자**: Claude Code
