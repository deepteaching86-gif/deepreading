-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'parent', 'admin');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'multiple_select', 'short_answer', 'essay', 'fill_blank', 'true_false', 'matching', 'ordering');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('diagnostic', 'formative', 'summative', 'practice', 'mock');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('created', 'in_progress', 'paused', 'completed', 'expired', 'abandoned');

-- CreateEnum
CREATE TYPE "GradingMethod" AS ENUM ('auto', 'ai', 'manual');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('pending', 'accepted', 'completed', 'dismissed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_number" VARCHAR(20),
    "grade_level" INTEGER NOT NULL,
    "class_id" INTEGER,
    "birth_date" DATE,
    "gender" VARCHAR(10),
    "school_name" VARCHAR(100),
    "preferred_difficulty" REAL NOT NULL DEFAULT 0.5,
    "learning_style" VARCHAR(20),
    "accessibility_needs" TEXT[],
    "total_assessments" INTEGER NOT NULL DEFAULT 0,
    "total_study_time" INTEGER NOT NULL DEFAULT 0,
    "average_score" REAL,
    "current_ability" REAL NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "teacher_number" VARCHAR(20),
    "subject" VARCHAR(50),
    "school_name" VARCHAR(100),
    "department" VARCHAR(50),
    "can_create_questions" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_students" BOOLEAN NOT NULL DEFAULT true,
    "can_view_all_classes" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "relationship" VARCHAR(20) NOT NULL,
    "occupation" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "school_year" INTEGER NOT NULL,
    "semester" INTEGER,
    "teacher_id" INTEGER,
    "school_name" VARCHAR(100),
    "max_students" INTEGER NOT NULL DEFAULT 30,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_relationships" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "related_user_id" INTEGER NOT NULL,
    "relationship_type" VARCHAR(20) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "permission_level" VARCHAR(20) NOT NULL DEFAULT 'view',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "domain" VARCHAR(50) NOT NULL,
    "sub_domain" VARCHAR(50),
    "grade_level" INTEGER NOT NULL,
    "difficulty" REAL NOT NULL,
    "irt_discrimination" REAL NOT NULL DEFAULT 1.0,
    "irt_difficulty" REAL NOT NULL DEFAULT 0.0,
    "irt_guessing" REAL NOT NULL DEFAULT 0.25,
    "curriculum_standard_id" INTEGER,
    "learning_objectives" TEXT[],
    "points" INTEGER NOT NULL DEFAULT 1,
    "time_limit" INTEGER,
    "answer" JSONB NOT NULL,
    "explanation" TEXT,
    "hint" TEXT,
    "created_by" INTEGER,
    "reviewed_by" INTEGER,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'draft',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "average_time_spent" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_passages" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "passage_text" TEXT NOT NULL,
    "passage_title" VARCHAR(200),
    "source" VARCHAR(200),
    "author" VARCHAR(100),
    "genre" VARCHAR(50),
    "word_count" INTEGER,
    "reading_level" REAL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_order" INTEGER NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tags" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "tag" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_standards" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "subject" VARCHAR(50) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "achievement_level" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "type" "AssessmentType" NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "is_adaptive" BOOLEAN NOT NULL DEFAULT true,
    "time_limit" INTEGER,
    "initial_difficulty" REAL NOT NULL DEFAULT 0.5,
    "current_difficulty" REAL,
    "min_difficulty" REAL NOT NULL DEFAULT 0.0,
    "max_difficulty" REAL NOT NULL DEFAULT 1.0,
    "target_question_count" INTEGER NOT NULL DEFAULT 30,
    "target_domains" JSONB,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'created',
    "started_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "resumed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "assigned_by" INTEGER,
    "class_id" INTEGER,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_order" INTEGER NOT NULL,
    "difficulty_at_assignment" REAL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "time_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "answer" JSONB NOT NULL,
    "is_correct" BOOLEAN,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "points_earned" REAL,
    "max_points" INTEGER,
    "time_spent" INTEGER,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "difficulty_at_response" REAL,
    "ability_before" REAL,
    "ability_after" REAL,
    "grading_method" "GradingMethod" NOT NULL,
    "graded_by" INTEGER,
    "graded_at" TIMESTAMP(3),
    "grading_notes" TEXT,
    "answer_changes" INTEGER NOT NULL DEFAULT 0,
    "confidence_level" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "total_score" REAL NOT NULL,
    "max_score" REAL NOT NULL,
    "percentage" REAL NOT NULL,
    "domain_scores" JSONB NOT NULL,
    "sub_domain_scores" JSONB,
    "correct_count" INTEGER NOT NULL,
    "incorrect_count" INTEGER NOT NULL,
    "partial_count" INTEGER NOT NULL,
    "skipped_count" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "ability_estimate" REAL,
    "ability_se" REAL,
    "theta" REAL,
    "percentile" INTEGER,
    "grade" VARCHAR(5),
    "level_estimate" INTEGER,
    "total_time_spent" INTEGER NOT NULL,
    "average_time_per_question" REAL NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "recommendations" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_progress" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "total_assessments" INTEGER NOT NULL DEFAULT 0,
    "completed_assessments" INTEGER NOT NULL DEFAULT 0,
    "total_questions_attempted" INTEGER NOT NULL DEFAULT 0,
    "total_correct" INTEGER NOT NULL DEFAULT 0,
    "total_study_time" INTEGER NOT NULL DEFAULT 0,
    "average_score" REAL,
    "average_accuracy" REAL,
    "current_ability" REAL NOT NULL DEFAULT 0.5,
    "domain_strengths" JSONB NOT NULL,
    "domain_weaknesses" JSONB NOT NULL,
    "recommended_domains" TEXT[],
    "growth_rate" REAL,
    "consistency_score" REAL,
    "effort_score" REAL,
    "preferred_question_types" TEXT[],
    "optimal_study_time" VARCHAR(20),
    "average_session_duration" INTEGER,
    "last_assessment_date" DATE,
    "last_study_date" DATE,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "weekly_goal" INTEGER,
    "monthly_goal" INTEGER,
    "target_level" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ability_history" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "assessment_id" INTEGER,
    "ability_value" REAL NOT NULL,
    "ability_se" REAL,
    "measurement_method" VARCHAR(20) NOT NULL,
    "domain" VARCHAR(50),
    "grade_level" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ability_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_statistics" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "domain" VARCHAR(50) NOT NULL,
    "sub_domain" VARCHAR(50),
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL NOT NULL,
    "average_score" REAL NOT NULL,
    "average_time" REAL NOT NULL,
    "ability_estimate" REAL,
    "difficulty_distribution" JSONB NOT NULL,
    "last_practiced" DATE,
    "practice_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration" INTEGER,
    "activities" JSONB,
    "questions_completed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_recommendations" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "recommendation_type" VARCHAR(30) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "target_domain" VARCHAR(50),
    "target_sub_domain" VARCHAR(50),
    "recommended_questions" INTEGER[],
    "estimated_duration" INTEGER,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'pending',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "learning_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "difficulty_calibration" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "estimated_difficulty" REAL NOT NULL,
    "estimated_discrimination" REAL NOT NULL,
    "estimated_guessing" REAL NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "mean_score" REAL NOT NULL,
    "standard_deviation" REAL NOT NULL,
    "confidence_level" REAL NOT NULL,
    "needs_recalibration" BOOLEAN NOT NULL DEFAULT false,
    "calibrated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "difficulty_calibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_analytics" (
    "id" SERIAL NOT NULL,
    "assessment_id" INTEGER NOT NULL,
    "completion_rate" REAL NOT NULL,
    "average_score" REAL NOT NULL,
    "median_score" REAL NOT NULL,
    "score_distribution" JSONB NOT NULL,
    "difficulty_distribution" JSONB NOT NULL,
    "adaptive_efficiency" REAL,
    "average_completion_time" INTEGER NOT NULL,
    "time_distribution" JSONB NOT NULL,
    "most_difficult_questions" INTEGER[],
    "most_easy_questions" INTEGER[],
    "discrimination_quality" REAL,
    "high_performers" INTEGER[],
    "struggling_students" INTEGER[],
    "analyzed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_statistics" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_students" INTEGER NOT NULL,
    "active_students" INTEGER NOT NULL,
    "total_assessments" INTEGER NOT NULL,
    "completion_rate" REAL NOT NULL,
    "average_score" REAL NOT NULL,
    "median_score" REAL NOT NULL,
    "top_score" REAL NOT NULL,
    "domain_averages" JSONB NOT NULL,
    "average_growth_rate" REAL NOT NULL,
    "improvement_trend" VARCHAR(20) NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_teacher_number_key" ON "teachers"("teacher_number");

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "parents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_student_id_related_user_id_relationship__key" ON "user_relationships"("student_id", "related_user_id", "relationship_type");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_option_order_key" ON "question_options"("question_id", "option_order");

-- CreateIndex
CREATE UNIQUE INDEX "question_tags_question_id_tag_key" ON "question_tags"("question_id", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_standards_code_key" ON "curriculum_standards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_assessment_id_question_id_key" ON "assessment_questions"("assessment_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_assessment_id_question_order_key" ON "assessment_questions"("assessment_id", "question_order");

-- CreateIndex
CREATE UNIQUE INDEX "responses_assessment_id_question_id_student_id_key" ON "responses"("assessment_id", "question_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "scores_assessment_id_key" ON "scores"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_progress_student_id_key" ON "student_progress"("student_id");

-- CreateIndex
CREATE INDEX "ability_history_student_id_recorded_at_idx" ON "ability_history"("student_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "domain_statistics_student_id_domain_sub_domain_key" ON "domain_statistics"("student_id", "domain", "sub_domain");

-- CreateIndex
CREATE UNIQUE INDEX "difficulty_calibration_question_id_key" ON "difficulty_calibration"("question_id");

-- CreateIndex
CREATE INDEX "difficulty_calibration_question_id_idx" ON "difficulty_calibration"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_analytics_assessment_id_key" ON "assessment_analytics"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_statistics_class_id_period_type_period_start_key" ON "class_statistics"("class_id", "period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_curriculum_standard_id_fkey" FOREIGN KEY ("curriculum_standard_id") REFERENCES "curriculum_standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_passages" ADD CONSTRAINT "question_passages_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ability_history" ADD CONSTRAINT "ability_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_statistics" ADD CONSTRAINT "domain_statistics_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_recommendations" ADD CONSTRAINT "learning_recommendations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "difficulty_calibration" ADD CONSTRAINT "difficulty_calibration_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_analytics" ADD CONSTRAINT "assessment_analytics_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_statistics" ADD CONSTRAINT "class_statistics_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

