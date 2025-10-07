-- Add survey response functionality
-- Migration: Add SurveyResponse model and update TestSession

-- Add survey_completed_at column to test_sessions
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS survey_completed_at TIMESTAMP;

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  question_number INTEGER NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_session_id ON survey_responses(session_id);

-- Update existing sessions to have started_at if null (migration safety)
UPDATE test_sessions SET started_at = created_at WHERE started_at IS NULL AND status != 'pending';
