#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ML Training Data Migration Script
Runs SQL migration directly without Prisma
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import psycopg2
from urllib.parse import quote_plus

# Database connection parameters
DB_CONFIG = {
    "host": "db.sxnjeqqvqbhueqbwsnpj.supabase.co",
    "port": 5432,
    "database": "postgres",
    "user": "postgres.sxnjeqqvqbhueqbwsnpj",
    "password": "DeepReading2025!@#$SecureDB"
}

# SQL Migration
SQL_MIGRATION = """
-- Create ENUMs for ML Training Data
DO $$ BEGIN
    CREATE TYPE "DatasetPurpose" AS ENUM (
        'PUPIL_DETECTION',
        'GAZE_ESTIMATION',
        'VERTICAL_CORRECTION',
        'CALIBRATION_OPTIMIZE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DataQuality" AS ENUM (
        'EXCELLENT',
        'GOOD',
        'FAIR',
        'POOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ML Training Samples Table
CREATE TABLE IF NOT EXISTS "ml_training_samples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "vision_session_id" UUID,
    "age_group" VARCHAR(20) NOT NULL,
    "gender" VARCHAR(10),
    "wears_glasses" BOOLEAN NOT NULL DEFAULT false,
    "device_type" VARCHAR(50) NOT NULL,
    "screen_resolution" VARCHAR(20),
    "iris_landmarks" JSONB NOT NULL,
    "face_landmarks" JSONB NOT NULL,
    "head_pose" JSONB NOT NULL,
    "calibration_points" JSONB NOT NULL,
    "pupil_diameters" JSONB,
    "quality" "DataQuality" NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "quality_notes" TEXT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'VISIONTEST',
    "is_anonymized" BOOLEAN NOT NULL DEFAULT true,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_training_samples_pkey" PRIMARY KEY ("id")
);

-- Create ML Models Table
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

-- Create ML Data Consent Table
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

-- Create Indexes
CREATE INDEX IF NOT EXISTS "ml_training_samples_quality_idx" ON "ml_training_samples"("quality");
CREATE INDEX IF NOT EXISTS "ml_training_samples_age_group_idx" ON "ml_training_samples"("age_group");
CREATE INDEX IF NOT EXISTS "ml_training_samples_vision_session_id_idx" ON "ml_training_samples"("vision_session_id");
CREATE INDEX IF NOT EXISTS "ml_models_purpose_is_production_idx" ON "ml_models"("purpose", "is_production");

-- Create Unique Constraint
CREATE UNIQUE INDEX IF NOT EXISTS "ml_data_consents_user_id_key" ON "ml_data_consents"("user_id");

-- Add Foreign Key Constraints
DO $$ BEGIN
    ALTER TABLE "ml_training_samples"
    ADD CONSTRAINT "ml_training_samples_vision_session_id_fkey"
    FOREIGN KEY ("vision_session_id") REFERENCES "vision_test_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TABLE "ml_training_samples" IS 'ML training samples storing only feature vectors (2-5KB per sample)';
COMMENT ON TABLE "ml_models" IS 'ML model metadata and deployment tracking';
COMMENT ON TABLE "ml_data_consents" IS 'User consent tracking for ML data collection';
"""

def run_migration():
    """Run the ML training data migration"""
    print("🔄 ML 학습 데이터 마이그레이션 시작...")
    print(f"📡 데이터베이스 연결 중: {DB_CONFIG['host']}:{DB_CONFIG['port']}")

    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("✅ 데이터베이스 연결 성공")
        print("📝 SQL 마이그레이션 실행 중...")

        # Execute migration
        cur.execute(SQL_MIGRATION)
        conn.commit()

        print("✅ 마이그레이션 완료")

        # Verify tables created
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('ml_training_samples', 'ml_models', 'ml_data_consents')
            ORDER BY table_name
        """)
        tables = cur.fetchall()

        print("\n📊 생성된 테이블:")
        for table in tables:
            print(f"  ✓ {table[0]}")

        # Close connection
        cur.close()
        conn.close()

        print("\n🎉 ML 데이터 수집 시스템 데이터베이스 준비 완료!")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        raise

if __name__ == "__main__":
    run_migration()
