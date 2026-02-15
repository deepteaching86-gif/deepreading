"""
Database Operations for Visual Perception Test

Uses raw SQL via psycopg2 — no Prisma query engine dependency.
Auto-initializes tables and seed data on first connection.
"""

import os
import logging
import uuid
import json
import asyncio
from typing import Optional, List, Dict
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor, Json

logger = logging.getLogger(__name__)


def _serialize_row(row: dict) -> dict:
    """Convert a RealDictRow to a serializable dict (UUID → str)."""
    if row is None:
        return None
    result = {}
    for key, val in row.items():
        if isinstance(val, uuid.UUID):
            val = str(val)
        result[key] = val
    return result


class PerceptionDatabase:
    """Database operations for perception test (psycopg2, no Prisma)."""

    _initialized = False

    def __init__(self):
        pass

    # ---- Connection pool ----

    @classmethod
    def _get_db_url(cls) -> str:
        # Prefer DIRECT_URL (bypasses PgBouncer) for psycopg2 compatibility
        url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
        if not url:
            raise RuntimeError("DATABASE_URL / DIRECT_URL not set")
        return url

    def _get_conn(self):
        """Create a fresh connection (no pool — avoids PgBouncer SET issues)."""
        return psycopg2.connect(self._get_db_url())

    def _put_conn(self, conn):
        """Close connection."""
        try:
            conn.close()
        except Exception:
            pass

    # ---- Lifecycle ----

    async def connect(self):
        """Ensure pool exists and tables/data are ready."""
        if not PerceptionDatabase._initialized:
            await asyncio.to_thread(self._sync_initialize)
            PerceptionDatabase._initialized = True

    async def disconnect(self):
        pass  # connections are closed after each use

    def _sync_initialize(self):
        conn = self._get_conn()
        try:
            cur = conn.cursor()

            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'perception_passages'
                );
            """)
            if not cur.fetchone()[0]:
                logger.info("Creating perception tables...")
                self._run_migration(cur)
                conn.commit()
                logger.info("Perception tables created")
            else:
                conn.commit()  # end implicit transaction

            cur.execute("SELECT COUNT(*) FROM perception_passages;")
            count = cur.fetchone()[0]
            if count == 0:
                logger.info("Seeding perception passages...")
                self._seed_passages(cur)
                conn.commit()
                logger.info("Perception data seeded")
            else:
                conn.commit()  # end implicit transaction
                logger.info(f"Perception passages exist ({count})")

            cur.close()
        except Exception as e:
            logger.error(f"Init error: {type(e).__name__}: {e}")
            try:
                conn.rollback()
            except Exception:
                pass
            raise
        finally:
            self._put_conn(conn)

    # ---- Migration ----

    def _run_migration(self, cursor):
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE "PerceptionTestPhase" AS ENUM
                    ('introduction','calibration','reading','questions','completed');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        """)
        cursor.execute("""
            DO $$ BEGIN
                CREATE TYPE "PerceptionTestStatus" AS ENUM
                    ('in_progress','completed','abandoned');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        """)

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
                "student_id" VARCHAR(255) NOT NULL,
                "grade" INTEGER NOT NULL,
                "passage_id" UUID NOT NULL,
                "current_phase" VARCHAR(20) NOT NULL DEFAULT 'introduction',
                "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
                "calibration_points" JSONB,
                "calibration_accuracy" DOUBLE PRECISION,
                "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "calibration_started_at" TIMESTAMP(3),
                "calibration_completed_at" TIMESTAMP(3),
                "reading_started_at" TIMESTAMP(3),
                "reading_completed_at" TIMESTAMP(3),
                "questions_started_at" TIMESTAMP(3),
                "questions_completed_at" TIMESTAMP(3),
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

        # Indexes
        for stmt in [
            'CREATE UNIQUE INDEX IF NOT EXISTS "pts_session_code_key" ON "perception_test_sessions"("session_code");',
            'CREATE INDEX IF NOT EXISTS "pts_student_id_idx" ON "perception_test_sessions"("student_id");',
            'CREATE INDEX IF NOT EXISTS "pq_passage_id_idx" ON "perception_questions"("passage_id");',
            'CREATE UNIQUE INDEX IF NOT EXISTS "pq_passage_qnum_key" ON "perception_questions"("passage_id","question_number");',
            'CREATE INDEX IF NOT EXISTS "pgd_session_id_idx" ON "perception_gaze_data"("session_id");',
            'CREATE INDEX IF NOT EXISTS "pr_session_id_idx" ON "perception_responses"("session_id");',
            'CREATE UNIQUE INDEX IF NOT EXISTS "ptr_session_id_key" ON "perception_test_results"("session_id");',
            'CREATE INDEX IF NOT EXISTS "pp_grade_idx" ON "perception_passages"("grade");',
        ]:
            cursor.execute(stmt)

        # Foreign keys (safe re-run)
        for table, fk, col, ref, on_del in [
            ("perception_questions", "pq_passage_fk", "passage_id", "perception_passages(id)", "CASCADE"),
            ("perception_gaze_data", "pgd_session_fk", "session_id", "perception_test_sessions(id)", "CASCADE"),
            ("perception_responses", "pr_session_fk", "session_id", "perception_test_sessions(id)", "CASCADE"),
            ("perception_responses", "pr_question_fk", "question_id", "perception_questions(id)", "RESTRICT"),
            ("perception_test_results", "ptr_session_fk", "session_id", "perception_test_sessions(id)", "CASCADE"),
            ("perception_test_sessions", "pts_passage_fk", "passage_id", "perception_passages(id)", "RESTRICT"),
        ]:
            cursor.execute(f"""
                ALTER TABLE "{table}"
                    DROP CONSTRAINT IF EXISTS "{fk}",
                    ADD CONSTRAINT "{fk}"
                    FOREIGN KEY ("{col}") REFERENCES {ref}
                    ON DELETE {on_del} ON UPDATE CASCADE;
            """)

    # ---- Seeding ----

    def _seed_passages(self, cursor):
        from .sample_data import get_seed_passages

        for p in get_seed_passages():
            cursor.execute("SELECT 1 FROM perception_passages WHERE id = %s", (p["id"],))
            if cursor.fetchone():
                continue

            questions = p.pop("questions")
            cursor.execute("""
                INSERT INTO perception_passages
                    (id, grade, title, content, word_count, sentence_count, category, difficulty)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """, (p["id"], p["grade"], p["title"], p["content"],
                  p["word_count"], p["sentence_count"], p.get("category"), p.get("difficulty")))
            logger.info(f"Seeded: {p['title']} (grade {p['grade']})")

            for q in questions:
                cursor.execute("""
                    INSERT INTO perception_questions
                        (passage_id, question_number, question_text, options, correct_answer, question_type)
                    VALUES (%s,%s,%s,%s,%s,%s)
                """, (p["id"], q["question_number"], q["question_text"],
                      Json(q["options"]), q["correct_answer"], q.get("question_type")))

    # ===== Passage Operations =====

    async def get_passage_for_grade(self, grade: int) -> Optional[Dict]:
        return await asyncio.to_thread(self._sync_get_passage_for_grade, grade)

    def _sync_get_passage_for_grade(self, grade: int) -> Optional[Dict]:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Try exact grade
            cur.execute(
                "SELECT * FROM perception_passages WHERE grade = %s AND is_active = true LIMIT 1",
                (grade,))
            row = cur.fetchone()

            # Fallback: nearest grade
            if not row:
                cur.execute(
                    "SELECT * FROM perception_passages WHERE is_active = true ORDER BY ABS(grade - %s) LIMIT 1",
                    (grade,))
                row = cur.fetchone()

            if not row:
                cur.close()
                return None

            passage = _serialize_row(row)

            # Get questions
            cur.execute(
                "SELECT * FROM perception_questions WHERE passage_id = %s ORDER BY question_number",
                (row["id"],))
            passage["questions"] = [_serialize_row(q) for q in cur.fetchall()]
            cur.close()
            return passage
        finally:
            self._put_conn(conn)

    async def get_passage(self, passage_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(self._sync_get_passage, passage_id)

    def _sync_get_passage(self, passage_id: str) -> Optional[Dict]:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM perception_passages WHERE id = %s", (passage_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return None
            passage = _serialize_row(row)
            cur.execute(
                "SELECT * FROM perception_questions WHERE passage_id = %s ORDER BY question_number",
                (row["id"],))
            passage["questions"] = [_serialize_row(q) for q in cur.fetchall()]
            cur.close()
            return passage
        finally:
            self._put_conn(conn)

    # ===== Session Operations =====

    async def create_session(self, student_id: str, grade: int, passage_id: str) -> Dict:
        return await asyncio.to_thread(self._sync_create_session, student_id, grade, passage_id)

    def _sync_create_session(self, student_id: str, grade: int, passage_id: str) -> Dict:
        session_code = f"PERCEPTION-{uuid.uuid4().hex[:12].upper()}"
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                INSERT INTO perception_test_sessions
                    (session_code, student_id, grade, passage_id, current_phase, status)
                VALUES (%s, %s, %s, %s, 'introduction', 'in_progress')
                RETURNING *
            """, (session_code, student_id, grade, passage_id))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    async def get_session(self, session_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(self._sync_get_session, session_id)

    def _sync_get_session(self, session_id: str) -> Optional[Dict]:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM perception_test_sessions WHERE id = %s", (session_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return None

            session = _serialize_row(row)

            # Attach passage + questions
            cur.execute("SELECT * FROM perception_passages WHERE id = %s", (row["passage_id"],))
            p_row = cur.fetchone()
            if p_row:
                passage = _serialize_row(p_row)
                cur.execute(
                    "SELECT * FROM perception_questions WHERE passage_id = %s ORDER BY question_number",
                    (p_row["id"],))
                passage["questions"] = [_serialize_row(q) for q in cur.fetchall()]
                session["passage"] = passage

            # Attach responses
            cur.execute(
                "SELECT * FROM perception_responses WHERE session_id = %s ORDER BY answered_at",
                (session_id,))
            session["responses"] = [_serialize_row(r) for r in cur.fetchall()]

            # Attach result
            cur.execute(
                "SELECT * FROM perception_test_results WHERE session_id = %s", (session_id,))
            res_row = cur.fetchone()
            session["result"] = _serialize_row(res_row) if res_row else None

            cur.close()
            return session
        finally:
            self._put_conn(conn)

    async def update_session_phase(self, session_id: str, phase: str) -> Dict:
        return await asyncio.to_thread(self._sync_update_session_phase, session_id, phase)

    def _sync_update_session_phase(self, session_id: str, phase: str) -> Dict:
        ts_col = {
            "calibration": "calibration_started_at",
            "reading": "reading_started_at",
            "questions": "questions_started_at",
            "completed": "completed_at",
        }.get(phase)

        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            if ts_col:
                cur.execute(f"""
                    UPDATE perception_test_sessions
                    SET current_phase = %s, "{ts_col}" = NOW()
                    WHERE id = %s RETURNING *
                """, (phase, session_id))
            else:
                cur.execute("""
                    UPDATE perception_test_sessions
                    SET current_phase = %s WHERE id = %s RETURNING *
                """, (phase, session_id))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    async def save_calibration(self, session_id: str, calibration_points: List[Dict], calibration_accuracy: float) -> Dict:
        return await asyncio.to_thread(
            self._sync_save_calibration, session_id, calibration_points, calibration_accuracy)

    def _sync_save_calibration(self, session_id: str, calibration_points: List[Dict], calibration_accuracy: float) -> Dict:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                UPDATE perception_test_sessions
                SET calibration_points = %s,
                    calibration_accuracy = %s,
                    calibration_completed_at = NOW()
                WHERE id = %s RETURNING *
            """, (Json(calibration_points), calibration_accuracy, session_id))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    async def complete_session(self, session_id: str) -> Dict:
        return await asyncio.to_thread(self._sync_complete_session, session_id)

    def _sync_complete_session(self, session_id: str) -> Dict:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                UPDATE perception_test_sessions
                SET status = 'completed', completed_at = NOW()
                WHERE id = %s RETURNING *
            """, (session_id,))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    # ===== Gaze Data Operations =====

    async def save_gaze_data(self, session_id: str, gaze_data: Dict) -> Dict:
        return await asyncio.to_thread(self._sync_save_gaze_data, session_id, gaze_data)

    def _sync_save_gaze_data(self, session_id: str, gaze_data: Dict) -> Dict:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                INSERT INTO perception_gaze_data
                    (session_id, phase, gaze_x, gaze_y, confidence,
                     head_pitch, head_yaw, head_roll,
                     left_pupil_diameter, right_pupil_diameter, timestamp)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING *
            """, (
                session_id,
                gaze_data["phase"],
                gaze_data["gaze_x"],
                gaze_data["gaze_y"],
                gaze_data["confidence"],
                gaze_data.get("head_pitch"),
                gaze_data.get("head_yaw"),
                gaze_data.get("head_roll"),
                gaze_data.get("left_pupil_diameter"),
                gaze_data.get("right_pupil_diameter"),
                gaze_data.get("timestamp", datetime.utcnow()),
            ))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    async def get_gaze_data(self, session_id: str, phase: Optional[str] = None) -> List[Dict]:
        return await asyncio.to_thread(self._sync_get_gaze_data, session_id, phase)

    def _sync_get_gaze_data(self, session_id: str, phase: Optional[str] = None) -> List[Dict]:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            if phase:
                cur.execute("""
                    SELECT * FROM perception_gaze_data
                    WHERE session_id = %s AND phase = %s
                    ORDER BY timestamp ASC
                """, (session_id, phase))
            else:
                cur.execute("""
                    SELECT * FROM perception_gaze_data
                    WHERE session_id = %s ORDER BY timestamp ASC
                """, (session_id,))
            rows = [_serialize_row(r) for r in cur.fetchall()]
            cur.close()
            return rows
        finally:
            self._put_conn(conn)

    # ===== Response Operations =====

    async def save_response(self, session_id: str, question_id: str,
                            selected_answer: str, is_correct: bool,
                            response_time: Optional[int] = None) -> Dict:
        return await asyncio.to_thread(
            self._sync_save_response, session_id, question_id,
            selected_answer, is_correct, response_time)

    def _sync_save_response(self, session_id, question_id, selected_answer, is_correct, response_time):
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                INSERT INTO perception_responses
                    (session_id, question_id, selected_answer, is_correct, response_time)
                VALUES (%s,%s,%s,%s,%s) RETURNING *
            """, (session_id, question_id, selected_answer, is_correct, response_time))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    async def get_responses(self, session_id: str) -> List[Dict]:
        return await asyncio.to_thread(self._sync_get_responses, session_id)

    def _sync_get_responses(self, session_id: str) -> List[Dict]:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT r.*, q.question_text, q.correct_answer, q.question_type
                FROM perception_responses r
                JOIN perception_questions q ON r.question_id = q.id
                WHERE r.session_id = %s ORDER BY r.answered_at
            """, (session_id,))
            rows = [_serialize_row(r) for r in cur.fetchall()]
            cur.close()
            return rows
        finally:
            self._put_conn(conn)

    # ===== Result Operations =====

    async def save_result(self, session_id: str, result_data: Dict) -> Dict:
        return await asyncio.to_thread(self._sync_save_result, session_id, result_data)

    def _sync_save_result(self, session_id: str, rd: Dict) -> Dict:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                INSERT INTO perception_test_results (
                    session_id,
                    comprehension_score, concentration_score, overall_grade,
                    fixation_stability, reading_pattern_regularity, regression_frequency,
                    focus_retention_rate, reading_speed_consistency,
                    blink_frequency_score, fixation_duration_score,
                    vertical_drift_score, horizontal_regression_score,
                    sustained_attention_score,
                    avg_reading_speed_wpm, total_fixation_count, avg_fixation_duration,
                    saccade_count, avg_saccade_length, in_text_gaze_ratio,
                    regression_count, line_drift_count,
                    max_sustained_attention, distraction_index,
                    regression_accuracy_corr, fixation_accuracy_corr, speed_accuracy_corr,
                    option_gaze_distribution, revisit_frequency,
                    strengths, improvements, recommendations
                ) VALUES (
                    %s, %s,%s,%s, %s,%s,%s, %s,%s, %s,%s, %s,%s, %s,
                    %s,%s,%s, %s,%s,%s, %s,%s, %s,%s, %s,%s,%s, %s,%s, %s,%s,%s
                ) RETURNING *
            """, (
                session_id,
                rd["comprehension_score"], rd["concentration_score"], rd["overall_grade"],
                rd["fixation_stability"], rd["reading_pattern_regularity"], rd["regression_frequency"],
                rd["focus_retention_rate"], rd["reading_speed_consistency"],
                rd["blink_frequency_score"], rd["fixation_duration_score"],
                rd["vertical_drift_score"], rd["horizontal_regression_score"],
                rd["sustained_attention_score"],
                rd["avg_reading_speed_wpm"], rd["total_fixation_count"], rd["avg_fixation_duration"],
                rd["saccade_count"], rd["avg_saccade_length"], rd["in_text_gaze_ratio"],
                rd["regression_count"], rd["line_drift_count"],
                rd["max_sustained_attention"], rd["distraction_index"],
                rd.get("regression_accuracy_corr"), rd.get("fixation_accuracy_corr"),
                rd.get("speed_accuracy_corr"),
                Json(rd["option_gaze_distribution"]), rd["revisit_frequency"],
                Json(rd.get("strengths", [])), Json(rd.get("improvements", [])),
                Json(rd.get("recommendations", [])),
            ))
            conn.commit()
            row = _serialize_row(cur.fetchone())
            cur.close()
            return row
        finally:
            self._put_conn(conn)

    async def get_result(self, session_id: str) -> Optional[Dict]:
        return await asyncio.to_thread(self._sync_get_result, session_id)

    def _sync_get_result(self, session_id: str) -> Optional[Dict]:
        conn = self._get_conn()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT * FROM perception_test_results WHERE session_id = %s", (session_id,))
            row = cur.fetchone()
            cur.close()
            return _serialize_row(row) if row else None
        finally:
            self._put_conn(conn)

    # ===== Debug helper =====

    async def debug_check(self) -> Dict:
        """Run diagnostic checks, returns step-by-step results."""
        return await asyncio.to_thread(self._sync_debug_check)

    def _sync_debug_check(self) -> Dict:
        steps = []
        conn = None
        try:
            conn = self._get_conn()
            steps.append({"step": "pool_connect", "status": "ok"})
        except Exception as e:
            steps.append({"step": "pool_connect", "status": "error", "error": str(e)})
            return {"steps": steps, "overall": "error"}

        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT COUNT(*) as cnt FROM perception_passages")
            cnt = cur.fetchone()["cnt"]
            steps.append({"step": "passages_count", "status": "ok", "count": cnt})

            if cnt > 0:
                cur.execute("SELECT id, title, grade FROM perception_passages LIMIT 1")
                row = cur.fetchone()
                steps.append({
                    "step": "sample_passage", "status": "ok",
                    "id": str(row["id"]), "title": row["title"], "grade": row["grade"]
                })

            cur.execute("SELECT COUNT(*) as cnt FROM perception_test_sessions")
            s_cnt = cur.fetchone()["cnt"]
            steps.append({"step": "sessions_count", "status": "ok", "count": s_cnt})
            cur.close()
        except Exception as e:
            import traceback
            steps.append({"step": "query", "status": "error", "error": str(e),
                          "trace": traceback.format_exc()})
        finally:
            if conn:
                self._put_conn(conn)

        overall = "ok" if all(s["status"] == "ok" for s in steps) else "error"
        return {"steps": steps, "overall": overall}
