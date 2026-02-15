"""
Database Operations for Visual Perception Test

Auto-initializes tables and seed data on first connection.
"""

import sys
import os
import logging

try:
    from prisma import Prisma
except Exception as e:
    print(f"ERROR: Failed to import Prisma: {type(e).__name__}: {e}")
    raise

from typing import Optional, List, Dict
from datetime import datetime
import uuid
import json

logger = logging.getLogger(__name__)

# Deterministic UUIDs for seed passages (prevents duplicate inserts)
SEED_PASSAGE_IDS = [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567801",
    "a1b2c3d4-e5f6-7890-abcd-ef1234567802",
    "a1b2c3d4-e5f6-7890-abcd-ef1234567803",
]


class PerceptionDatabase:
    """Database operations for perception test"""

    _initialized = False

    def __init__(self):
        self.db = Prisma()

    async def connect(self):
        """Connect to database and ensure tables/data exist"""
        if not self.db.is_connected():
            await self.db.connect()

        if not PerceptionDatabase._initialized:
            await self._ensure_initialized()
            PerceptionDatabase._initialized = True

    async def disconnect(self):
        """Disconnect from database"""
        if self.db.is_connected():
            await self.db.disconnect()

    async def _ensure_initialized(self):
        """Ensure perception tables exist and have seed data"""
        import psycopg2

        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            logger.warning("DATABASE_URL not set, skipping auto-initialization")
            return

        conn = None
        try:
            conn = psycopg2.connect(database_url)
            conn.autocommit = False
            cursor = conn.cursor()

            # Check if perception_passages table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'perception_passages'
                );
            """)
            table_exists = cursor.fetchone()[0]

            if not table_exists:
                logger.info("Creating perception tables...")
                self._run_migration(cursor)
                conn.commit()
                logger.info("Perception tables created successfully")

            # Check if passages have data
            cursor.execute("SELECT COUNT(*) FROM perception_passages;")
            count = cursor.fetchone()[0]

            if count == 0:
                logger.info("Seeding perception passages...")
                self._seed_passages(cursor)
                conn.commit()
                logger.info("Perception data seeded successfully")
            else:
                logger.info(f"Perception passages already exist ({count} passages)")

            cursor.close()

        except Exception as e:
            logger.error(f"Auto-initialization error: {type(e).__name__}: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                conn.close()

    def _run_migration(self, cursor):
        """Create perception tables using raw SQL"""
        # Create enums
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE "PerceptionTestPhase" AS ENUM ('introduction', 'calibration', 'reading', 'questions', 'completed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE "PerceptionTestStatus" AS ENUM ('in_progress', 'completed', 'abandoned');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "perception_passages" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "grade" INTEGER NOT NULL,
                "title" VARCHAR(200) NOT NULL,
                "content" TEXT NOT NULL,
                "word_count" INTEGER NOT NULL,
                "sentence_count" INTEGER NOT NULL,
                "category" VARCHAR(100),
                "difficulty" VARCHAR(20),
                "is_active" BOOLEAN NOT NULL DEFAULT true,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "perception_passages_pkey" PRIMARY KEY ("id")
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "perception_questions" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "passage_id" UUID NOT NULL,
                "question_number" INTEGER NOT NULL,
                "question_text" TEXT NOT NULL,
                "options" JSONB NOT NULL,
                "correct_answer" VARCHAR(10) NOT NULL,
                "question_type" VARCHAR(50),
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "perception_questions_pkey" PRIMARY KEY ("id")
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "perception_test_sessions" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "session_code" VARCHAR(50) NOT NULL,
                "student_id" UUID NOT NULL,
                "grade" INTEGER NOT NULL,
                "passage_id" UUID NOT NULL,
                "current_phase" "PerceptionTestPhase" NOT NULL DEFAULT 'introduction',
                "status" "PerceptionTestStatus" NOT NULL DEFAULT 'in_progress',
                "calibration_data" JSONB,
                "calibration_accuracy" DOUBLE PRECISION,
                "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "calibration_started_at" TIMESTAMP(3),
                "calibration_completed_at" TIMESTAMP(3),
                "reading_started_at" TIMESTAMP(3),
                "reading_completed_at" TIMESTAMP(3),
                "questions_started_at" TIMESTAMP(3),
                "completed_at" TIMESTAMP(3),
                CONSTRAINT "perception_test_sessions_pkey" PRIMARY KEY ("id")
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "perception_gaze_data" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "session_id" UUID NOT NULL,
                "phase" VARCHAR(20) NOT NULL,
                "gaze_x" DOUBLE PRECISION NOT NULL,
                "gaze_y" DOUBLE PRECISION NOT NULL,
                "head_pitch" DOUBLE PRECISION,
                "head_yaw" DOUBLE PRECISION,
                "head_roll" DOUBLE PRECISION,
                "left_pupil_diameter" DOUBLE PRECISION,
                "right_pupil_diameter" DOUBLE PRECISION,
                "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
                "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "perception_gaze_data_pkey" PRIMARY KEY ("id")
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "perception_responses" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "session_id" UUID NOT NULL,
                "question_id" UUID NOT NULL,
                "selected_answer" VARCHAR(10) NOT NULL,
                "is_correct" BOOLEAN NOT NULL,
                "response_time" INTEGER,
                "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "perception_responses_pkey" PRIMARY KEY ("id")
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "perception_test_results" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "session_id" UUID NOT NULL,
                "comprehension_score" INTEGER NOT NULL,
                "concentration_score" INTEGER NOT NULL,
                "overall_grade" VARCHAR(5) NOT NULL,
                "fixation_stability" DOUBLE PRECISION NOT NULL,
                "reading_pattern_regularity" DOUBLE PRECISION NOT NULL,
                "regression_frequency" DOUBLE PRECISION NOT NULL,
                "focus_retention_rate" DOUBLE PRECISION NOT NULL,
                "reading_speed_consistency" DOUBLE PRECISION NOT NULL,
                "blink_frequency_score" DOUBLE PRECISION NOT NULL,
                "fixation_duration_score" DOUBLE PRECISION NOT NULL,
                "vertical_drift_score" DOUBLE PRECISION NOT NULL,
                "horizontal_regression_score" DOUBLE PRECISION NOT NULL,
                "sustained_attention_score" DOUBLE PRECISION NOT NULL,
                "avg_reading_speed_wpm" DOUBLE PRECISION NOT NULL,
                "total_fixation_count" INTEGER NOT NULL,
                "avg_fixation_duration" DOUBLE PRECISION NOT NULL,
                "saccade_count" INTEGER NOT NULL,
                "avg_saccade_length" DOUBLE PRECISION NOT NULL,
                "in_text_gaze_ratio" DOUBLE PRECISION NOT NULL,
                "regression_count" INTEGER NOT NULL,
                "line_drift_count" INTEGER NOT NULL,
                "max_sustained_attention" DOUBLE PRECISION NOT NULL,
                "distraction_index" DOUBLE PRECISION NOT NULL,
                "regression_accuracy_corr" DOUBLE PRECISION,
                "fixation_accuracy_corr" DOUBLE PRECISION,
                "speed_accuracy_corr" DOUBLE PRECISION,
                "option_gaze_distribution" JSONB NOT NULL,
                "revisit_frequency" DOUBLE PRECISION NOT NULL,
                "strengths" JSONB,
                "improvements" JSONB,
                "recommendations" JSONB,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "perception_test_results_pkey" PRIMARY KEY ("id")
            );
        """)

        # Create indexes
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS "perception_test_sessions_session_code_key" ON "perception_test_sessions"("session_code");')
        cursor.execute('CREATE INDEX IF NOT EXISTS "perception_test_sessions_student_id_idx" ON "perception_test_sessions"("student_id");')
        cursor.execute('CREATE INDEX IF NOT EXISTS "perception_questions_passage_id_idx" ON "perception_questions"("passage_id");')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS "perception_questions_passage_id_question_number_key" ON "perception_questions"("passage_id", "question_number");')
        cursor.execute('CREATE INDEX IF NOT EXISTS "perception_gaze_data_session_id_idx" ON "perception_gaze_data"("session_id");')
        cursor.execute('CREATE INDEX IF NOT EXISTS "perception_responses_session_id_idx" ON "perception_responses"("session_id");')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS "perception_test_results_session_id_key" ON "perception_test_results"("session_id");')
        cursor.execute('CREATE INDEX IF NOT EXISTS "perception_passages_grade_idx" ON "perception_passages"("grade");')

        # Add foreign key constraints (safe with IF NOT EXISTS pattern)
        fk_statements = [
            ('perception_questions', 'perception_questions_passage_id_fkey', '"passage_id"', '"perception_passages"("id")', 'CASCADE'),
            ('perception_gaze_data', 'perception_gaze_data_session_id_fkey', '"session_id"', '"perception_test_sessions"("id")', 'CASCADE'),
            ('perception_responses', 'perception_responses_session_id_fkey', '"session_id"', '"perception_test_sessions"("id")', 'CASCADE'),
            ('perception_responses', 'perception_responses_question_id_fkey', '"question_id"', '"perception_questions"("id")', 'RESTRICT'),
            ('perception_test_results', 'perception_test_results_session_id_fkey', '"session_id"', '"perception_test_sessions"("id")', 'CASCADE'),
        ]
        for table, fk_name, col, ref, on_delete in fk_statements:
            cursor.execute(f"""
                ALTER TABLE "{table}"
                    DROP CONSTRAINT IF EXISTS "{fk_name}",
                    ADD CONSTRAINT "{fk_name}"
                    FOREIGN KEY ({col}) REFERENCES {ref} ON DELETE {on_delete} ON UPDATE CASCADE;
            """)

        # session FK to users table (may not exist, so wrap in try)
        try:
            cursor.execute("""
                ALTER TABLE "perception_test_sessions"
                    DROP CONSTRAINT IF EXISTS "perception_test_sessions_student_id_fkey",
                    ADD CONSTRAINT "perception_test_sessions_student_id_fkey"
                    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            """)
        except Exception:
            pass  # users table might not exist

        cursor.execute("""
            ALTER TABLE "perception_test_sessions"
                DROP CONSTRAINT IF EXISTS "perception_test_sessions_passage_id_fkey",
                ADD CONSTRAINT "perception_test_sessions_passage_id_fkey"
                FOREIGN KEY ("passage_id") REFERENCES "perception_passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        """)

    def _seed_passages(self, cursor):
        """Seed sample passages for grades 1-6"""
        from .sample_data import get_seed_passages

        for passage_data in get_seed_passages():
            # Check if passage already exists
            cursor.execute(
                "SELECT id FROM perception_passages WHERE id = %s",
                (passage_data["id"],)
            )
            if cursor.fetchone():
                continue

            questions = passage_data.pop("questions")

            cursor.execute(
                """
                INSERT INTO perception_passages
                (id, grade, title, content, word_count, sentence_count, category, difficulty)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    passage_data["id"],
                    passage_data["grade"],
                    passage_data["title"],
                    passage_data["content"],
                    passage_data["word_count"],
                    passage_data["sentence_count"],
                    passage_data.get("category"),
                    passage_data.get("difficulty"),
                )
            )
            logger.info(f"Seeded passage: {passage_data['title']} (grade {passage_data['grade']})")

            for q in questions:
                cursor.execute(
                    """
                    INSERT INTO perception_questions
                    (passage_id, question_number, question_text, options, correct_answer, question_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        passage_data["id"],
                        q["question_number"],
                        q["question_text"],
                        json.dumps(q["options"]),
                        q["correct_answer"],
                        q.get("question_type"),
                    )
                )

    # ===== Session Operations =====

    async def create_session(
        self,
        student_id: str,
        grade: int,
        passage_id: str
    ) -> Dict:
        """Create a new perception test session"""
        session_code = f"PERCEPTION-{uuid.uuid4().hex[:12].upper()}"

        session = await self.db.perceptiontestsession.create(
            data={
                "studentId": student_id,
                "grade": grade,
                "passageId": passage_id,
                "sessionCode": session_code,
                "currentPhase": "introduction",
                "status": "in_progress"
            },
            include={
                "passage": {
                    "include": {
                        "questions": True
                    }
                }
            }
        )

        return session.model_dump() if hasattr(session, 'model_dump') else dict(session)

    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session by ID"""
        session = await self.db.perceptiontestsession.find_unique(
            where={"id": session_id},
            include={
                "passage": {
                    "include": {
                        "questions": True
                    }
                },
                "responses": True,
                "result": True
            }
        )

        return session.model_dump() if session and hasattr(session, 'model_dump') else (dict(session) if session else None)

    async def update_session_phase(
        self,
        session_id: str,
        phase: str
    ) -> Dict:
        """Update session phase"""
        timestamp_fields = {
            "calibration": {"calibrationStartedAt": datetime.utcnow()},
            "reading": {"readingStartedAt": datetime.utcnow()},
            "questions": {"questionsStartedAt": datetime.utcnow()},
            "completed": {"completedAt": datetime.utcnow()}
        }

        update_data = {
            "currentPhase": phase,
            **timestamp_fields.get(phase, {})
        }

        session = await self.db.perceptiontestsession.update(
            where={"id": session_id},
            data=update_data
        )

        return session

    async def save_calibration(
        self,
        session_id: str,
        calibration_points: List[Dict],
        calibration_accuracy: float
    ) -> Dict:
        """Save calibration data"""
        session = await self.db.perceptiontestsession.update(
            where={"id": session_id},
            data={
                "calibrationPoints": calibration_points,
                "calibrationAccuracy": calibration_accuracy,
                "calibrationCompletedAt": datetime.utcnow()
            }
        )

        return session

    async def complete_session(self, session_id: str) -> Dict:
        """Mark session as completed"""
        session = await self.db.perceptiontestsession.update(
            where={"id": session_id},
            data={
                "status": "completed",
                "completedAt": datetime.utcnow()
            }
        )

        return session

    # ===== Gaze Data Operations =====

    async def save_gaze_data(
        self,
        session_id: str,
        gaze_data: Dict
    ) -> Dict:
        """Save gaze tracking data"""
        data = await self.db.perceptiongazedata.create(
            data={
                "sessionId": session_id,
                "phase": gaze_data["phase"],
                "gazeX": gaze_data["gaze_x"],
                "gazeY": gaze_data["gaze_y"],
                "confidence": gaze_data["confidence"],
                "headPitch": gaze_data.get("head_pitch"),
                "headYaw": gaze_data.get("head_yaw"),
                "headRoll": gaze_data.get("head_roll"),
                "leftPupilDiameter": gaze_data.get("left_pupil_diameter"),
                "rightPupilDiameter": gaze_data.get("right_pupil_diameter"),
                "timestamp": gaze_data.get("timestamp", datetime.utcnow())
            }
        )

        return data

    async def get_gaze_data(
        self,
        session_id: str,
        phase: Optional[str] = None
    ) -> List[Dict]:
        """Get gaze data for session"""
        where_clause = {"sessionId": session_id}

        if phase:
            where_clause["phase"] = phase

        data = await self.db.perceptiongazedata.find_many(
            where=where_clause,
            order_by={"timestamp": "asc"}
        )

        return data

    # ===== Response Operations =====

    async def save_response(
        self,
        session_id: str,
        question_id: str,
        selected_answer: str,
        is_correct: bool,
        response_time: Optional[int] = None
    ) -> Dict:
        """Save student response"""
        response = await self.db.perceptionresponse.create(
            data={
                "sessionId": session_id,
                "questionId": question_id,
                "selectedAnswer": selected_answer,
                "isCorrect": is_correct,
                "responseTime": response_time
            }
        )

        return response

    async def get_responses(self, session_id: str) -> List[Dict]:
        """Get all responses for session"""
        responses = await self.db.perceptionresponse.find_many(
            where={"sessionId": session_id},
            include={"question": True}
        )

        return responses

    # ===== Result Operations =====

    async def save_result(
        self,
        session_id: str,
        result_data: Dict
    ) -> Dict:
        """Save test result"""
        result = await self.db.perceptiontestresult.create(
            data={
                "sessionId": session_id,
                **result_data
            }
        )

        return result

    async def get_result(self, session_id: str) -> Optional[Dict]:
        """Get test result"""
        result = await self.db.perceptiontestresult.find_unique(
            where={"sessionId": session_id}
        )

        return result

    # ===== Passage Operations =====

    async def get_passage_for_grade(self, grade: int) -> Optional[Dict]:
        """Get a passage for the given grade, falling back to nearest available"""
        # Try exact grade first
        passages = await self.db.perceptionpassage.find_many(
            where={"grade": grade},
            include={"questions": True}
        )

        # Fallback: try nearest grade if exact match not found
        if not passages:
            logger.info(f"No passages for grade {grade}, searching all grades...")
            all_passages = await self.db.perceptionpassage.find_many(
                include={"questions": True}
            )

            if not all_passages:
                return None

            # Pick the passage with the closest grade
            all_passages.sort(key=lambda p: abs(p.grade - grade))
            passages = [all_passages[0]]
            logger.info(f"Using passage for grade {passages[0].grade} as fallback")

        passage = passages[0]
        return passage.model_dump() if hasattr(passage, 'model_dump') else dict(passage)

    async def get_passage(self, passage_id: str) -> Optional[Dict]:
        """Get passage by ID"""
        passage = await self.db.perceptionpassage.find_unique(
            where={"id": passage_id},
            include={"questions": True}
        )

        return passage.model_dump() if passage and hasattr(passage, 'model_dump') else (dict(passage) if passage else None)
