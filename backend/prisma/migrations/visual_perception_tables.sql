-- Visual Perception Test Tables Migration
-- Safe to run - only creates new tables, doesn't modify existing ones

-- Create enums
DO $$ BEGIN
    CREATE TYPE "PerceptionTestPhase" AS ENUM ('introduction', 'calibration', 'reading', 'questions', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PerceptionTestStatus" AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PerceptionPassage table
CREATE TABLE IF NOT EXISTS "perception_passages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "sentence_count" INTEGER NOT NULL,
    "category" VARCHAR(50),
    "difficulty" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perception_passages_pkey" PRIMARY KEY ("id")
);

-- Create PerceptionQuestion table
CREATE TABLE IF NOT EXISTS "perception_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "passage_id" UUID NOT NULL,
    "question_number" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_answer" VARCHAR(10) NOT NULL,
    "question_type" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perception_questions_pkey" PRIMARY KEY ("id")
);

-- Create PerceptionTestSession table
CREATE TABLE IF NOT EXISTS "perception_test_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_code" VARCHAR(20) NOT NULL,
    "student_id" UUID NOT NULL,
    "grade" INTEGER NOT NULL,
    "passage_id" UUID NOT NULL,
    "current_phase" "PerceptionTestPhase" NOT NULL DEFAULT 'introduction',
    "status" "PerceptionTestStatus" NOT NULL DEFAULT 'in_progress',
    "calibration_data" JSONB,
    "calibration_accuracy" DOUBLE PRECISION,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calibration_completed_at" TIMESTAMP(3),
    "reading_started_at" TIMESTAMP(3),
    "reading_completed_at" TIMESTAMP(3),
    "questions_started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "perception_test_sessions_pkey" PRIMARY KEY ("id")
);

-- Create PerceptionGazeData table
CREATE TABLE IF NOT EXISTS "perception_gaze_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "phase" VARCHAR(20) NOT NULL,
    "gaze_x" DOUBLE PRECISION NOT NULL,
    "gaze_y" DOUBLE PRECISION NOT NULL,
    "head_pitch" DOUBLE PRECISION,
    "head_yaw" DOUBLE PRECISION,
    "head_roll" DOUBLE PRECISION,
    "pupil_diameter" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perception_gaze_data_pkey" PRIMARY KEY ("id")
);

-- Create PerceptionResponse table
CREATE TABLE IF NOT EXISTS "perception_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_answer" VARCHAR(10) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "response_time" INTEGER,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perception_responses_pkey" PRIMARY KEY ("id")
);

-- Create PerceptionTestResult table
CREATE TABLE IF NOT EXISTS "perception_test_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "comprehension_score" INTEGER NOT NULL,
    "concentration_score" INTEGER NOT NULL,
    "overall_grade" VARCHAR(5) NOT NULL,
    "fixation_stability" DOUBLE PRECISION NOT NULL,
    "reading_pattern_regularity" DOUBLE PRECISION NOT NULL,
    "regression_frequency" DOUBLE PRECISION NOT NULL,
    "focus_retention_rate" DOUBLE PRECISION NOT NULL,
    "reading_speed_consistency" DOUBLE PRECISION NOT NULL,
    "blink_frequency_score" DOUBLE PRECISION NOT NULL,
    "fixation_duration_score" DOUBLE PRECISION NOT NULL,
    "vertical_drift_score" DOUBLE PRECISION NOT NULL,
    "horizontal_regression_score" DOUBLE PRECISION NOT NULL,
    "sustained_attention_score" DOUBLE PRECISION NOT NULL,
    "avg_reading_speed_wpm" DOUBLE PRECISION NOT NULL,
    "total_fixation_count" INTEGER NOT NULL,
    "avg_fixation_duration" DOUBLE PRECISION NOT NULL,
    "saccade_count" INTEGER NOT NULL,
    "avg_saccade_length" DOUBLE PRECISION NOT NULL,
    "in_text_gaze_ratio" DOUBLE PRECISION NOT NULL,
    "regression_count" INTEGER NOT NULL,
    "line_drift_count" INTEGER NOT NULL,
    "max_sustained_attention" DOUBLE PRECISION NOT NULL,
    "distraction_index" DOUBLE PRECISION NOT NULL,
    "regression_accuracy_corr" DOUBLE PRECISION,
    "fixation_accuracy_corr" DOUBLE PRECISION,
    "speed_accuracy_corr" DOUBLE PRECISION,
    "option_gaze_distribution" JSONB NOT NULL,
    "revisit_frequency" DOUBLE PRECISION NOT NULL,
    "strengths" JSONB,
    "improvements" JSONB,
    "recommendations" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perception_test_results_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "perception_test_sessions_session_code_key" ON "perception_test_sessions"("session_code");
CREATE INDEX IF NOT EXISTS "perception_test_sessions_student_id_idx" ON "perception_test_sessions"("student_id");
CREATE INDEX IF NOT EXISTS "perception_test_sessions_status_idx" ON "perception_test_sessions"("status");

CREATE INDEX IF NOT EXISTS "perception_questions_passage_id_idx" ON "perception_questions"("passage_id");
CREATE UNIQUE INDEX IF NOT EXISTS "perception_questions_passage_id_question_number_key" ON "perception_questions"("passage_id", "question_number");

CREATE INDEX IF NOT EXISTS "perception_gaze_data_session_id_idx" ON "perception_gaze_data"("session_id");
CREATE INDEX IF NOT EXISTS "perception_gaze_data_phase_idx" ON "perception_gaze_data"("phase");
CREATE INDEX IF NOT EXISTS "perception_gaze_data_timestamp_idx" ON "perception_gaze_data"("timestamp");

CREATE INDEX IF NOT EXISTS "perception_responses_session_id_idx" ON "perception_responses"("session_id");
CREATE INDEX IF NOT EXISTS "perception_responses_question_id_idx" ON "perception_responses"("question_id");

CREATE UNIQUE INDEX IF NOT EXISTS "perception_test_results_session_id_key" ON "perception_test_results"("session_id");

CREATE INDEX IF NOT EXISTS "perception_passages_grade_idx" ON "perception_passages"("grade");
CREATE INDEX IF NOT EXISTS "perception_passages_is_active_idx" ON "perception_passages"("is_active");

-- Add foreign key constraints
ALTER TABLE "perception_questions"
    DROP CONSTRAINT IF EXISTS "perception_questions_passage_id_fkey",
    ADD CONSTRAINT "perception_questions_passage_id_fkey"
    FOREIGN KEY ("passage_id") REFERENCES "perception_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perception_test_sessions"
    DROP CONSTRAINT IF EXISTS "perception_test_sessions_student_id_fkey",
    ADD CONSTRAINT "perception_test_sessions_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perception_test_sessions"
    DROP CONSTRAINT IF EXISTS "perception_test_sessions_passage_id_fkey",
    ADD CONSTRAINT "perception_test_sessions_passage_id_fkey"
    FOREIGN KEY ("passage_id") REFERENCES "perception_passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "perception_gaze_data"
    DROP CONSTRAINT IF EXISTS "perception_gaze_data_session_id_fkey",
    ADD CONSTRAINT "perception_gaze_data_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "perception_test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perception_responses"
    DROP CONSTRAINT IF EXISTS "perception_responses_session_id_fkey",
    ADD CONSTRAINT "perception_responses_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "perception_test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perception_responses"
    DROP CONSTRAINT IF EXISTS "perception_responses_question_id_fkey",
    ADD CONSTRAINT "perception_responses_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "perception_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "perception_test_results"
    DROP CONSTRAINT IF EXISTS "perception_test_results_session_id_fkey",
    ADD CONSTRAINT "perception_test_results_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "perception_test_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
