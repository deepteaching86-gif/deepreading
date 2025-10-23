-- English Adaptive Test Tables
-- Generated from Prisma schema for manual deployment

-- Create enums
DO $$ BEGIN
  CREATE TYPE "ItemDomain" AS ENUM ('grammar', 'vocabulary', 'reading');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TextType" AS ENUM ('expository', 'argumentative', 'narrative', 'practical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ItemStatus" AS ENUM ('active', 'flagged', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Passages table
CREATE TABLE IF NOT EXISTS "passages" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "word_count" INTEGER NOT NULL,
  "lexile_score" INTEGER,
  "ar_level" DOUBLE PRECISION,
  "genre" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Items table (updated with new fields)
CREATE TABLE IF NOT EXISTS "items" (
  "id" SERIAL PRIMARY KEY,
  "passage_id" INTEGER REFERENCES "passages"("id") ON DELETE SET NULL,

  -- Content
  "stem" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correct_answer" CHAR(1) NOT NULL,

  -- Classification
  "domain" "ItemDomain" NOT NULL,
  "text_type" "TextType",
  "skill_tag" TEXT,

  -- IRT Parameters (nullable until calibrated)
  "discrimination" DOUBLE PRECISION,
  "difficulty" DOUBLE PRECISION,
  "guessing" DOUBLE PRECISION DEFAULT 0.25,

  -- MST Configuration
  "stage" INTEGER NOT NULL,
  "panel" TEXT NOT NULL,
  "form_id" INTEGER DEFAULT 1,

  -- Quality Metrics (FR-009)
  "exposure_count" INTEGER DEFAULT 0,
  "exposure_rate" DOUBLE PRECISION,
  "point_biserial" DOUBLE PRECISION,
  "correct_rate" DOUBLE PRECISION,
  "status" "ItemStatus" DEFAULT 'active',

  -- Timestamps
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "calibrated_at" TIMESTAMP(3)
);

-- English Test Sessions table
CREATE TABLE IF NOT EXISTS "english_test_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'active',
  "items_completed" INTEGER DEFAULT 0,
  "current_theta" DOUBLE PRECISION,
  "current_se" DOUBLE PRECISION,
  "stage" INTEGER DEFAULT 1,
  "panel" TEXT DEFAULT 'routing',

  -- Final Results (FR-005)
  "final_theta" DOUBLE PRECISION,
  "standard_error" DOUBLE PRECISION,
  "proficiency_level" INTEGER,
  "lexile_score" INTEGER,
  "ar_level" DOUBLE PRECISION,
  "vocabulary_size" INTEGER,
  "vocabulary_bands" JSONB,
  "total_items" INTEGER,
  "correct_count" INTEGER,
  "accuracy_percentage" DOUBLE PRECISION,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Responses table
CREATE TABLE IF NOT EXISTS "english_test_responses" (
  "id" SERIAL PRIMARY KEY,
  "session_id" INTEGER NOT NULL REFERENCES "english_test_sessions"("id") ON DELETE CASCADE,
  "item_id" INTEGER NOT NULL REFERENCES "items"("id") ON DELETE CASCADE,
  "selected_answer" CHAR(1) NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "response_time" INTEGER,
  "theta_estimate" DOUBLE PRECISION,
  "standard_error" DOUBLE PRECISION,
  "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "unique_session_item" UNIQUE ("session_id", "item_id")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_items_domain" ON "items"("domain");
CREATE INDEX IF NOT EXISTS "idx_items_status" ON "items"("status");
CREATE INDEX IF NOT EXISTS "idx_items_stage_panel" ON "items"("stage", "panel");
CREATE INDEX IF NOT EXISTS "idx_items_exposure_rate" ON "items"("exposure_rate");

CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "english_test_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_status" ON "english_test_sessions"("status");

CREATE INDEX IF NOT EXISTS "idx_responses_session_id" ON "english_test_responses"("session_id");
CREATE INDEX IF NOT EXISTS "idx_responses_item_id" ON "english_test_responses"("item_id");

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_items_updated_at') THEN
    CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON "items"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON "english_test_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE "items" IS 'English test items with IRT parameters and quality metrics (FR-002, FR-009)';
COMMENT ON COLUMN "items"."domain" IS 'Item domain: grammar (32.5%), vocabulary (35%), reading (32.5%) - FR-002';
COMMENT ON COLUMN "items"."point_biserial" IS 'Item discrimination metric - FR-009';
COMMENT ON COLUMN "items"."exposure_rate" IS 'Item exposure control for security - FR-009';
COMMENT ON TABLE "english_test_sessions" IS 'MST-based adaptive test sessions with comprehensive diagnostics - FR-005';
COMMENT ON COLUMN "english_test_sessions"."vocabulary_size" IS 'Estimated vocabulary size (14k+ words) - FR-004';
COMMENT ON COLUMN "english_test_sessions"."vocabulary_bands" IS 'Vocabulary distribution across frequency bands - FR-004';
