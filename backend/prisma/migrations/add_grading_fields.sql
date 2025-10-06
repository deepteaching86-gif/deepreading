-- Add grading-related fields to schema

-- Add fields to test_templates table
ALTER TABLE test_templates
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add fields to answers table
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS question_number INTEGER,
  ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add fields to test_results table
ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER DEFAULT 0;

-- Update existing test_templates if needed
UPDATE test_templates SET total_points = 100 WHERE total_points IS NULL;
UPDATE test_templates SET passing_score = 60 WHERE passing_score IS NULL;
UPDATE test_templates SET status = 'active' WHERE status IS NULL;

-- Create index for faster grading queries
CREATE INDEX IF NOT EXISTS idx_test_sessions_status_completed ON test_sessions(status, completed_at)
  WHERE status = 'completed';

-- Update question_number from question table join
UPDATE answers a
SET question_number = q.question_number
FROM questions q
WHERE a.question_id = q.id
  AND a.question_number IS NULL;
