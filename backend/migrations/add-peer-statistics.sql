-- CreateTable: PeerStatistics
-- 또래 평균 통계 테이블

CREATE TABLE "peer_statistics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "avg_score" DECIMAL(5,2) NOT NULL,
    "avg_percentage" DECIMAL(5,2) NOT NULL,
    "std_deviation" DECIMAL(5,2) NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "simulated_sample_size" INTEGER NOT NULL DEFAULT 0,
    "percentile_distribution" JSONB NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "peer_statistics_grade_category_key" ON "peer_statistics"("grade", "category");

-- CreateIndex
CREATE INDEX "peer_statistics_grade_idx" ON "peer_statistics"("grade");

-- Add category enum constraint (optional, for data integrity)
-- This ensures only valid categories are stored
ALTER TABLE "peer_statistics"
ADD CONSTRAINT "peer_statistics_category_check"
CHECK (category IN (
    'vocabulary',
    'reading',
    'grammar',
    'reasoning',
    'reading_motivation',
    'writing_motivation',
    'reading_environment',
    'reading_habit',
    'reading_preference'
));
