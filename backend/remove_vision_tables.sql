-- Manual migration to remove Vision Test tables only
-- Created: 2025-11-03
-- Purpose: Drop 5 Vision test tables without affecting other data

-- Drop Vision tables in reverse dependency order
DROP TABLE IF EXISTS "vision_calibration_adjustments" CASCADE;
DROP TABLE IF EXISTS "vision_gaze_data" CASCADE;
DROP TABLE IF EXISTS "vision_metrics" CASCADE;
DROP TABLE IF EXISTS "vision_test_sessions" CASCADE;
DROP TABLE IF EXISTS "vision_calibrations" CASCADE;

-- Verify tables are dropped
SELECT 'Vision tables removed successfully' AS status;
