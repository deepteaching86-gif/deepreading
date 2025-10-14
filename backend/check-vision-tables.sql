-- Check if Vision TEST tables exist
SELECT
    table_name,
    CASE
        WHEN table_name IN ('vision_calibrations', 'vision_test_sessions', 'vision_gaze_data', 'vision_metrics', 'vision_calibration_adjustments')
        THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE 'vision%'
ORDER BY table_name;

-- If no results, tables don't exist. Run the migration SQL in Supabase Dashboard.
