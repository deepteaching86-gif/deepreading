-- Add new survey categories to QuestionCategory enum
-- Migration: Expand survey from 17 to 25 questions

-- Add new enum values
ALTER TYPE "QuestionCategory" ADD VALUE IF NOT EXISTS 'digital_literacy';
ALTER TYPE "QuestionCategory" ADD VALUE IF NOT EXISTS 'critical_thinking';
ALTER TYPE "QuestionCategory" ADD VALUE IF NOT EXISTS 'reading_attitude';
