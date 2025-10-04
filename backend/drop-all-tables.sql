-- ⚠️ WARNING: This will DELETE ALL tables and data in the public schema!
-- Use this only for development/testing environments

-- Drop all tables with CASCADE to handle foreign key dependencies
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS statistics CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS test_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS test_templates CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old tables (from previous schema) if they exist
DROP TABLE IF EXISTS ability_history CASCADE;
DROP TABLE IF EXISTS assessment_analytics CASCADE;
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS class_statistics CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS curriculum_standards CASCADE;
DROP TABLE IF EXISTS difficulty_calibrations CASCADE;
DROP TABLE IF EXISTS domain_statistics CASCADE;
DROP TABLE IF EXISTS learning_recommendations CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS question_passages CASCADE;
DROP TABLE IF EXISTS question_tags CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS user_relationships CASCADE;

-- Drop all ENUM types
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "QuestionCategory" CASCADE;
DROP TYPE IF EXISTS "QuestionType" CASCADE;
DROP TYPE IF EXISTS "Difficulty" CASCADE;
DROP TYPE IF EXISTS "SessionStatus" CASCADE;
DROP TYPE IF EXISTS "ReviewStatus" CASCADE;
DROP TYPE IF EXISTS "AssessmentType" CASCADE;
DROP TYPE IF EXISTS "AssessmentStatus" CASCADE;
DROP TYPE IF EXISTS "GradingMethod" CASCADE;
DROP TYPE IF EXISTS "RecommendationStatus" CASCADE;

-- Drop UUID extension if needed (usually keep this)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Verify all tables are dropped
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public';

-- Expected result: empty (no rows)
