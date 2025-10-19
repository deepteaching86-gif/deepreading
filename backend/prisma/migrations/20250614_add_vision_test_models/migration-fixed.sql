-- Fixed Migration: Vision TEST Models with updated_at DEFAULT
-- This fixes the "Database error occurred" issue by adding DEFAULT CURRENT_TIMESTAMP to updated_at

-- 1. Add Vision TEST fields to test_templates (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'test_templates' AND column_name = 'template_type') THEN
        ALTER TABLE "test_templates" ADD COLUMN "template_type" VARCHAR(20) NOT NULL DEFAULT 'standard';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'test_templates' AND column_name = 'vision_config') THEN
        ALTER TABLE "test_templates" ADD COLUMN "vision_config" JSONB;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "test_templates_template_type_idx" ON "test_templates"("template_type");

-- 2. Create vision_test_sessions table
CREATE TABLE IF NOT EXISTS "vision_test_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "calibration_id" UUID,
    "calibration_score" DOUBLE PRECISION,
    "ai_analysis" JSONB,
    "reading_strategy" VARCHAR(50),
    "heatmap_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_test_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vision_test_sessions_session_id_key" ON "vision_test_sessions"("session_id");
CREATE INDEX IF NOT EXISTS "vision_test_sessions_session_id_idx" ON "vision_test_sessions"("session_id");
CREATE INDEX IF NOT EXISTS "vision_test_sessions_calibration_id_idx" ON "vision_test_sessions"("calibration_id");

-- Create trigger to auto-update updated_at on vision_test_sessions
CREATE OR REPLACE FUNCTION update_vision_test_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vision_test_sessions_updated_at_trigger ON "vision_test_sessions";
CREATE TRIGGER vision_test_sessions_updated_at_trigger
    BEFORE UPDATE ON "vision_test_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_vision_test_sessions_updated_at();

-- 3. Create vision_gaze_data table
CREATE TABLE IF NOT EXISTS "vision_gaze_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vision_session_id" UUID NOT NULL,
    "passage_id" VARCHAR(100) NOT NULL,
    "gaze_points" JSONB NOT NULL,
    "total_points" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_gaze_data_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vision_gaze_data_vision_session_id_idx" ON "vision_gaze_data"("vision_session_id");
CREATE INDEX IF NOT EXISTS "vision_gaze_data_passage_id_idx" ON "vision_gaze_data"("passage_id");

-- 4. Create vision_metrics table
CREATE TABLE IF NOT EXISTS "vision_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vision_session_id" UUID NOT NULL,

    -- A. Eye Movement Patterns (6 metrics)
    "average_saccade_amplitude" DOUBLE PRECISION NOT NULL,
    "saccade_variability" DOUBLE PRECISION NOT NULL,
    "average_saccade_velocity" DOUBLE PRECISION NOT NULL,
    "optimal_landing_rate" DOUBLE PRECISION NOT NULL,
    "return_sweep_accuracy" DOUBLE PRECISION NOT NULL,
    "scan_path_efficiency" DOUBLE PRECISION NOT NULL,

    -- B. Fixation Behavior (4 metrics)
    "average_fixation_duration" DOUBLE PRECISION NOT NULL,
    "fixations_per_word" DOUBLE PRECISION NOT NULL,
    "regression_rate" DOUBLE PRECISION NOT NULL,
    "vocabulary_gap_score" DOUBLE PRECISION NOT NULL,

    -- C. Reading Speed & Rhythm (3 metrics)
    "words_per_minute" DOUBLE PRECISION NOT NULL,
    "rhythm_regularity" DOUBLE PRECISION NOT NULL,
    "stamina_score" DOUBLE PRECISION NOT NULL,

    -- D. Comprehension & Cognitive (2 metrics)
    "gaze_comprehension_correlation" DOUBLE PRECISION NOT NULL,
    "cognitive_load_index" DOUBLE PRECISION NOT NULL,

    -- Overall Score
    "overall_eye_tracking_score" DOUBLE PRECISION NOT NULL,

    -- Additional Analysis Data
    "detailed_analysis" JSONB,
    "comparison_with_peers" JSONB,

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vision_metrics_vision_session_id_key" ON "vision_metrics"("vision_session_id");
CREATE INDEX IF NOT EXISTS "vision_metrics_vision_session_id_idx" ON "vision_metrics"("vision_session_id");

-- 5. Create vision_calibrations table
CREATE TABLE IF NOT EXISTS "vision_calibrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "calibration_points" JSONB NOT NULL,
    "overall_accuracy" DOUBLE PRECISION NOT NULL,
    "transform_matrix" JSONB NOT NULL,
    "device_info" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_calibrations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vision_calibrations_user_id_idx" ON "vision_calibrations"("user_id");
CREATE INDEX IF NOT EXISTS "vision_calibrations_expires_at_idx" ON "vision_calibrations"("expires_at");

-- 6. Create vision_calibration_adjustments table
CREATE TABLE IF NOT EXISTS "vision_calibration_adjustments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vision_session_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "adjustments" JSONB NOT NULL,
    "improvement_score" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vision_calibration_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vision_calibration_adjustments_vision_session_id_idx" ON "vision_calibration_adjustments"("vision_session_id");
CREATE INDEX IF NOT EXISTS "vision_calibration_adjustments_admin_id_idx" ON "vision_calibration_adjustments"("admin_id");

-- 7. Add Foreign Key Constraints (only if not exists)
DO $$
BEGIN
    -- vision_test_sessions constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_test_sessions_session_id_fkey') THEN
        ALTER TABLE "vision_test_sessions" ADD CONSTRAINT "vision_test_sessions_session_id_fkey"
        FOREIGN KEY ("session_id") REFERENCES "test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_test_sessions_calibration_id_fkey') THEN
        ALTER TABLE "vision_test_sessions" ADD CONSTRAINT "vision_test_sessions_calibration_id_fkey"
        FOREIGN KEY ("calibration_id") REFERENCES "vision_calibrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- vision_gaze_data constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_gaze_data_vision_session_id_fkey') THEN
        ALTER TABLE "vision_gaze_data" ADD CONSTRAINT "vision_gaze_data_vision_session_id_fkey"
        FOREIGN KEY ("vision_session_id") REFERENCES "vision_test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- vision_metrics constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_metrics_vision_session_id_fkey') THEN
        ALTER TABLE "vision_metrics" ADD CONSTRAINT "vision_metrics_vision_session_id_fkey"
        FOREIGN KEY ("vision_session_id") REFERENCES "vision_test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- vision_calibrations constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_calibrations_user_id_fkey') THEN
        ALTER TABLE "vision_calibrations" ADD CONSTRAINT "vision_calibrations_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- vision_calibration_adjustments constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_calibration_adjustments_vision_session_id_fkey') THEN
        ALTER TABLE "vision_calibration_adjustments" ADD CONSTRAINT "vision_calibration_adjustments_vision_session_id_fkey"
        FOREIGN KEY ("vision_session_id") REFERENCES "vision_test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vision_calibration_adjustments_admin_id_fkey') THEN
        ALTER TABLE "vision_calibration_adjustments" ADD CONSTRAINT "vision_calibration_adjustments_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- 8. Add comments for documentation
COMMENT ON TABLE "vision_test_sessions" IS 'Vision TEST 세션 데이터 (1:1 with test_sessions)';
COMMENT ON TABLE "vision_gaze_data" IS 'Vision TEST 시선 추적 데이터 (대용량 배열 저장)';
COMMENT ON TABLE "vision_metrics" IS 'Vision TEST 분석 지표 (15개 핵심 메트릭)';
COMMENT ON TABLE "vision_calibrations" IS 'Vision TEST 캘리브레이션 데이터 (재사용 가능, 7일 유효)';
COMMENT ON TABLE "vision_calibration_adjustments" IS 'Vision TEST 수동 보정 이력';

COMMENT ON COLUMN "test_templates"."template_type" IS 'Template type: standard or vision';
COMMENT ON COLUMN "test_templates"."vision_config" IS 'Vision-specific configuration (passages, expected metrics, etc.)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Vision TEST tables migration completed successfully';
    RAISE NOTICE '✅ Trigger for updated_at auto-update created';
END $$;
