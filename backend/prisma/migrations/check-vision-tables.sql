-- 간단한 테이블 존재 확인 (Supabase SQL Editor에서 실행)

-- 방법 1: 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'vision%'
ORDER BY table_name;

-- 예상 결과: 5개 행
-- vision_calibration_adjustments
-- vision_calibrations
-- vision_gaze_data
-- vision_metrics
-- vision_test_sessions

-- =====================================

-- 방법 2: 각 테이블에 직접 쿼리 (에러 없으면 존재하는 것)
SELECT COUNT(*) as calibrations_count FROM vision_calibrations;
SELECT COUNT(*) as sessions_count FROM vision_test_sessions;
SELECT COUNT(*) as gaze_data_count FROM vision_gaze_data;
SELECT COUNT(*) as metrics_count FROM vision_metrics;
SELECT COUNT(*) as adjustments_count FROM vision_calibration_adjustments;

-- 위 쿼리가 에러 없이 실행되면 → 모든 테이블 존재
-- "relation does not exist" 에러 발생하면 → 테이블 없음
