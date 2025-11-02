-- ML Training Data System Migration
-- Execute this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/sql

-- ===== ENUMS =====

-- Create DatasetPurpose enum
DO $$ BEGIN
    CREATE TYPE "DatasetPurpose" AS ENUM (
        'PUPIL_DETECTION',      -- 동공 검출 학습
        'GAZE_ESTIMATION',      -- 시선 추정 학습
        'VERTICAL_CORRECTION',  -- 상하 오차 보정 학습
        'CALIBRATION_OPTIMIZE'  -- 캘리브레이션 최적화
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DataQuality enum
DO $$ BEGIN
    CREATE TYPE "DataQuality" AS ENUM (
        'EXCELLENT',  -- 95%+ 신뢰도
        'GOOD',       -- 85-95%
        'FAIR',       -- 70-85%
        'POOR'        -- <70%
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===== TABLES =====

-- ML Training Samples (특징 벡터만 저장, 이미지 없음!)
-- 샘플당 2-5KB로 매우 경량
CREATE TABLE IF NOT EXISTS "ml_training_samples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "vision_session_id" UUID,

    -- 메타데이터
    "age_group" VARCHAR(20) NOT NULL,
    "gender" VARCHAR(10),
    "wears_glasses" BOOLEAN NOT NULL DEFAULT false,
    "device_type" VARCHAR(50) NOT NULL,
    "screen_resolution" VARCHAR(20),

    -- 특징 벡터 (이미지 대신 랜드마크만!)
    "iris_landmarks" JSONB NOT NULL,
    "face_landmarks" JSONB NOT NULL,
    "head_pose" JSONB NOT NULL,
    "calibration_points" JSONB NOT NULL,
    "pupil_diameters" JSONB,

    -- 품질 정보
    "quality" "DataQuality" NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "quality_notes" TEXT,

    -- 데이터 출처
    "source" VARCHAR(50) NOT NULL DEFAULT 'VISIONTEST',

    -- 프라이버시
    "is_anonymized" BOOLEAN NOT NULL DEFAULT true,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_training_samples_pkey" PRIMARY KEY ("id")
);

-- ML Models
CREATE TABLE IF NOT EXISTS "ml_models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "purpose" "DatasetPurpose" NOT NULL,
    "architecture" VARCHAR(100) NOT NULL,
    "framework" VARCHAR(50) NOT NULL,
    "training_config" JSONB NOT NULL,
    "training_samples" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "model_url" VARCHAR(500),
    "model_checksum" VARCHAR(64),
    "is_production" BOOLEAN NOT NULL DEFAULT false,
    "deployed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- ML Data Consent
CREATE TABLE IF NOT EXISTS "ml_data_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_date" TIMESTAMP(3),
    "consent_version" VARCHAR(20),
    "collect_features" BOOLEAN NOT NULL DEFAULT true,
    "collect_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_data_consents_pkey" PRIMARY KEY ("id")
);

-- ===== INDEXES =====

CREATE INDEX IF NOT EXISTS "ml_training_samples_quality_idx"
    ON "ml_training_samples"("quality");

CREATE INDEX IF NOT EXISTS "ml_training_samples_age_group_idx"
    ON "ml_training_samples"("age_group");

CREATE INDEX IF NOT EXISTS "ml_training_samples_vision_session_id_idx"
    ON "ml_training_samples"("vision_session_id");

CREATE INDEX IF NOT EXISTS "ml_models_purpose_is_production_idx"
    ON "ml_models"("purpose", "is_production");

-- ===== CONSTRAINTS =====

CREATE UNIQUE INDEX IF NOT EXISTS "ml_data_consents_user_id_key"
    ON "ml_data_consents"("user_id");

-- ===== FOREIGN KEYS =====

DO $$ BEGIN
    ALTER TABLE "ml_training_samples"
    ADD CONSTRAINT "ml_training_samples_vision_session_id_fkey"
    FOREIGN KEY ("vision_session_id") REFERENCES "vision_test_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===== COMMENTS =====

COMMENT ON TABLE "ml_training_samples" IS 'ML training samples storing only feature vectors (2-5KB per sample)';
COMMENT ON TABLE "ml_models" IS 'ML model metadata and deployment tracking';
COMMENT ON TABLE "ml_data_consents" IS 'User consent tracking for ML data collection';

-- ===== VERIFICATION =====

-- Verify tables created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ml_training_samples', 'ml_models', 'ml_data_consents')
ORDER BY table_name;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '✅ ML Training Data System migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created tables:';
    RAISE NOTICE '   - ml_training_samples (경량 특징 벡터 저장)';
    RAISE NOTICE '   - ml_models (모델 메타데이터)';
    RAISE NOTICE '   - ml_data_consents (사용자 동의 관리)';
    RAISE NOTICE '';
    RAISE NOTICE '💾 예상 저장 용량: 샘플당 2-5KB (이미지 없음)';
    RAISE NOTICE '🎯 목표: 10,000 샘플 = ~50MB';
END $$;
