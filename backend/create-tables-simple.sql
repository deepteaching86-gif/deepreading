-- Simple Table Creation Script for Supabase SQL Editor
-- Execute this in Supabase Dashboard > SQL Editor

-- Step 1: Create Enums
CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'multiple_select', 'short_answer', 'essay', 'fill_blank', 'true_false', 'matching', 'ordering');
CREATE TYPE "ReviewStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE "AssessmentType" AS ENUM ('diagnostic', 'formative', 'summative', 'practice', 'mock');
CREATE TYPE "AssessmentStatus" AS ENUM ('created', 'in_progress', 'paused', 'completed', 'expired', 'abandoned');
CREATE TYPE "GradingMethod" AS ENUM ('auto', 'ai', 'manual');
CREATE TYPE "RecommendationStatus" AS ENUM ('pending', 'accepted', 'completed', 'dismissed');

-- Step 2: Create Users table
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(50) UNIQUE NOT NULL,
    "email" VARCHAR(100) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "is_email_verified" BOOLEAN DEFAULT false NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP(3)
);

-- Continue with migration.sql for complete setup
-- This is just a test to verify SQL Editor works
