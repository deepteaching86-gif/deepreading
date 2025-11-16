-- Fix: session_code column length mismatch
-- Issue: Column defined as VARCHAR(20) but data is 23 chars
-- Solution: Alter column to VARCHAR(50) to match Prisma schema

-- Alter session_code column length
ALTER TABLE "perception_test_sessions"
  ALTER COLUMN "session_code" TYPE VARCHAR(50);

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE 'session_code column updated to VARCHAR(50)';
END $$;
