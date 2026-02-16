-- Migration: Add calibration tracking fields to items table
-- Purpose: Track IRT parameter calibration status separately from item active status
-- Part of Phase 2-A: Psychometric Foundation

-- Add calibration_status enum
DO $$ BEGIN
  CREATE TYPE "CalibrationStatus" AS ENUM ('uncalibrated', 'provisional', 'calibrated', 'flagged');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add calibration tracking columns
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS calibration_status "CalibrationStatus" DEFAULT 'uncalibrated',
  ADD COLUMN IF NOT EXISTS calibration_n INTEGER DEFAULT 0;

-- Set all existing items to 'uncalibrated' (their IRT params were AI-assigned)
UPDATE items SET calibration_status = 'uncalibrated' WHERE calibration_status IS NULL;

-- Create index for calibration queries
CREATE INDEX IF NOT EXISTS idx_items_calibration_status ON items(calibration_status);

-- Add comment for documentation
COMMENT ON COLUMN items.calibration_status IS 'IRT parameter calibration status: uncalibrated (AI-assigned), provisional (N<200), calibrated (N>=200), flagged (poor fit)';
COMMENT ON COLUMN items.calibration_n IS 'Number of responses used in most recent IRT calibration';
