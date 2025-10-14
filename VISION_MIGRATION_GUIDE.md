# Vision TEST 데이터베이스 마이그레이션 가이드

## 문제 상황
```
The table `public.vision_calibrations` does not exist in the current database.
```

Vision TEST 관련 테이블들이 production 데이터베이스에 생성되지 않아 발생하는 에러입니다.

## 해결 방법: Supabase Dashboard에서 SQL 실행

### 1단계: Supabase 로그인
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `sxnjeqqvqbhueqbwsnpj`

### 2단계: SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭

### 3단계: 마이그레이션 SQL 복사

아래 파일의 전체 내용을 복사하세요:
```
backend/prisma/migrations/20250614_add_vision_test_models/migration.sql
```

### 4단계: SQL 실행
1. SQL Editor에 복사한 내용 붙여넣기
2. **"Run"** 버튼 클릭 (또는 `Ctrl + Enter`)
3. 성공 메시지 확인: "Success. No rows returned"

### 5단계: 테이블 확인
SQL Editor에서 다음 쿼리 실행:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'vision%'
ORDER BY table_name;
```

**예상 결과** (5개 테이블):
```
vision_calibration_adjustments
vision_calibrations
vision_gaze_data
vision_metrics
vision_test_sessions
```

### 6단계: Render 백엔드 재시작
마이그레이션 완료 후 백엔드가 자동으로 재시작되거나, 수동으로 재시작하세요:
1. https://dashboard.render.com 접속
2. `literacy-backend` 서비스 선택
3. **"Manual Deploy"** → **"Deploy latest commit"** 클릭

## 완료 확인

프론트엔드에서 Vision TEST 시작 시 더 이상 400 에러가 발생하지 않으면 성공입니다!

## 생성되는 테이블

1. **vision_calibrations** - 시선 캘리브레이션 데이터 (재사용 가능, 7일 유효)
2. **vision_test_sessions** - Vision TEST 세션 데이터 (1:1 with test_sessions)
3. **vision_gaze_data** - 시선 추적 원시 데이터 (대용량)
4. **vision_metrics** - 분석된 15개 핵심 메트릭
5. **vision_calibration_adjustments** - 수동 보정 이력

## 문제 발생 시

테이블이 이미 존재한다는 에러가 발생하면:
- 정상입니다! 이미 마이그레이션이 완료된 상태입니다.
- 5단계로 이동하여 테이블 존재 여부만 확인하세요.
