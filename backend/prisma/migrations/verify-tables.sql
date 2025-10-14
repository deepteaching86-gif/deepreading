-- Vision TEST 테이블 존재 확인 쿼리
-- Supabase SQL Editor에서 실행하세요

SELECT
    table_name,
    CASE
        WHEN table_name IN (
            'vision_calibrations',
            'vision_test_sessions',
            'vision_gaze_data',
            'vision_metrics',
            'vision_calibration_adjustments'
        ) THEN '✅ Vision TEST table'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'vision%'
ORDER BY table_name;

-- 예상 결과: 5개 테이블이 모두 표시되어야 함
-- vision_calibration_adjustments
-- vision_calibrations
-- vision_gaze_data
-- vision_metrics
-- vision_test_sessions
