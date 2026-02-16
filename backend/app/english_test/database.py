"""
English Adaptive Test Database Layer
=====================================

Direct PostgreSQL database access using psycopg2.
Mirrors Prisma schema for English test tables.
"""

import os
import logging
import socket
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import json

logger = logging.getLogger(__name__)


class EnglishTestDB:
    """
    Database access layer for English Adaptive Test.

    Uses direct connections (no pool) for PgBouncer compatibility
    and to avoid connection pool exhaustion on managed hosting.
    Each operation creates a fresh connection and closes it after use.
    """

    def __init__(self):
        """
        Initialize database layer using DATABASE_URL from environment.
        """
        # Prefer DIRECT_URL (bypasses PgBouncer) for psycopg2 compatibility
        self.database_url = os.environ.get('DIRECT_URL') or os.environ.get('DATABASE_URL')

        if self.database_url:
            logger.info("Using DATABASE_URL from environment")
        else:
            logger.error("DATABASE_URL not found in environment!")
            raise ValueError("DATABASE_URL environment variable is required")

    def _get_connection(self):
        """Create a fresh database connection (no pool)."""
        try:
            conn = psycopg2.connect(self.database_url)
            return conn
        except Exception as e:
            logger.error(f"Failed to create connection: {e}")
            raise

    def _return_connection(self, conn):
        """Close the connection (replaces pool return)."""
        try:
            if conn and not conn.closed:
                conn.close()
        except Exception as e:
            logger.warning(f"Failed to close connection: {e}")

    # ===== Session Methods =====

    def create_session(self, user_id: str) -> Dict:
        """
        Create new English test session.

        Args:
            user_id: User identifier

        Returns:
            Session dictionary with id, user_id, timestamps, etc.
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                INSERT INTO english_test_sessions (
                    user_id, started_at, status, items_completed, stage, panel
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (user_id, datetime.now(), 'active', 0, 1, 'routing'))

            session = dict(cursor.fetchone())
            conn.commit()
            return session

        finally:
            cursor.close()
            self._return_connection(conn)

    def get_session(self, session_id: int) -> Optional[Dict]:
        """
        Get session by ID.

        Args:
            session_id: Session ID

        Returns:
            Session dictionary or None if not found
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT * FROM english_test_sessions WHERE id = %s;
            """, (session_id,))

            result = cursor.fetchone()
            return dict(result) if result else None

        finally:
            cursor.close()
            self._return_connection(conn)

    def update_session(self, session_id: int, updates: Dict) -> Dict:
        """
        Update session fields.

        Args:
            session_id: Session ID
            updates: Dictionary of field: value pairs to update

        Returns:
            Updated session dictionary
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            # Build dynamic UPDATE query
            set_clauses = []
            values = []

            for field, value in updates.items():
                # Convert numpy types to Python native types
                if hasattr(value, 'item'):  # numpy scalar
                    value = value.item()
                elif isinstance(value, (list, tuple)) and len(value) > 0 and hasattr(value[0], 'item'):
                    value = [v.item() if hasattr(v, 'item') else v for v in value]

                set_clauses.append(f"{field} = %s")
                values.append(value)

            values.append(session_id)  # For WHERE clause

            query = f"""
                UPDATE english_test_sessions
                SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *;
            """

            cursor.execute(query, values)
            session = dict(cursor.fetchone())
            conn.commit()
            return session

        finally:
            cursor.close()
            self._return_connection(conn)

    def finalize_session(self, session_id: int, final_results: Dict) -> Dict:
        """
        Finalize session with final results.

        Args:
            session_id: Session ID
            final_results: Dictionary with final_theta, proficiency_level, etc.

        Returns:
            Completed session dictionary
        """
        updates = {
            'status': 'completed',
            'completed_at': datetime.now(),
            'final_theta': final_results.get('final_theta'),
            'standard_error': final_results.get('standard_error'),
            'proficiency_level': final_results.get('proficiency_level'),
            'lexile_score': final_results.get('lexile_score'),
            'ar_level': final_results.get('ar_level'),
            'vocabulary_size': final_results.get('vocabulary_size'),
            'vocabulary_bands': json.dumps(final_results.get('vocabulary_bands')) if final_results.get('vocabulary_bands') else None,
            'total_items': final_results.get('total_items'),
            'correct_count': final_results.get('correct_count'),
            'accuracy_percentage': final_results.get('accuracy_percentage')
        }

        return self.update_session(session_id, updates)

    # ===== Item Methods =====

    def get_item(self, item_id: int) -> Optional[Dict]:
        """
        Get item by ID.

        Args:
            item_id: Item ID

        Returns:
            Item dictionary or None
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT i.*, p.title as passage_title, p.content as passage_content
                FROM items i
                LEFT JOIN passages p ON i.passage_id = p.id
                WHERE i.id = %s;
            """, (item_id,))

            result = cursor.fetchone()
            if result:
                item = dict(result)
                # Parse JSON options field
                if isinstance(item['options'], str):
                    item['options'] = json.loads(item['options'])

                # Map IRT parameters: discrimination->a, difficulty->b, guessing->c
                item['a'] = item['discrimination']
                item['b'] = item['difficulty']
                item['c'] = item['guessing']

                return item
            return None

        finally:
            cursor.close()
            self._return_connection(conn)

    def get_items_for_selection(
        self,
        stage: int,
        panel: str,
        form_id: int = 1,
        domain: Optional[str] = None,
        excluded_ids: Optional[List[int]] = None
    ) -> List[Dict]:
        """
        Get candidate items for adaptive selection.

        Args:
            stage: MST stage (1, 2, 3)
            panel: Panel name (routing, low, med, high, etc.)
            form_id: Form ID (1, 2, 3)
            domain: Filter by domain (grammar, vocabulary, reading)
            excluded_ids: List of item IDs to exclude

        Returns:
            List of item dictionaries
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            query = """
                SELECT i.*, p.title as passage_title, p.content as passage_content
                FROM items i
                LEFT JOIN passages p ON i.passage_id = p.id
                WHERE i.stage = %s
                  AND i.panel = %s
                  AND i.form_id = %s
                  AND i.status = 'active'
            """
            params = [stage, panel, form_id]

            if domain:
                query += " AND i.domain = %s"
                params.append(domain)

            if excluded_ids:
                query += f" AND i.id NOT IN ({','.join(['%s'] * len(excluded_ids))})"
                params.extend(excluded_ids)

            query += " ORDER BY i.exposure_rate NULLS FIRST, i.exposure_count ASC;"

            cursor.execute(query, params)
            items = [dict(row) for row in cursor.fetchall()]

            # Parse JSON options and map IRT parameters
            for item in items:
                if isinstance(item['options'], str):
                    item['options'] = json.loads(item['options'])

                # Map IRT parameters: discrimination->a, difficulty->b, guessing->c
                item['a'] = item['discrimination']
                item['b'] = item['difficulty']
                item['c'] = item['guessing']

            return items

        finally:
            cursor.close()
            self._return_connection(conn)

    def increment_exposure(self, item_id: int):
        """
        Increment item exposure count (for exposure control).

        Args:
            item_id: Item ID
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                UPDATE items
                SET exposure_count = exposure_count + 1
                WHERE id = %s;
            """, (item_id,))
            conn.commit()

        finally:
            cursor.close()
            self._return_connection(conn)

    # ===== Response Methods =====

    def create_response(
        self,
        session_id: int,
        item_id: int,
        selected_answer: str,
        is_correct: bool,
        stage: int,
        item_order: int,
        theta_estimate: Optional[float] = None,
        standard_error: Optional[float] = None,
        response_time: Optional[int] = None
    ) -> Dict:
        """
        Record item response.

        Args:
            session_id: Session ID
            item_id: Item ID
            selected_answer: Selected option ('A', 'B', 'C', 'D')
            is_correct: Whether answer is correct
            stage: Current MST stage (1, 2, or 3)
            item_order: Sequential order of this item in the session
            theta_estimate: Theta estimate after this response
            standard_error: Standard error of estimate
            response_time: Response time in milliseconds

        Returns:
            Response dictionary
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            # Convert numpy types to Python native types
            if theta_estimate is not None:
                theta_estimate = float(theta_estimate)
            if standard_error is not None:
                standard_error = float(standard_error)

            cursor.execute("""
                INSERT INTO english_test_responses (
                    session_id, item_id, selected_answer, is_correct,
                    stage, item_order,
                    theta_estimate, standard_error, response_time, responded_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                session_id, item_id, selected_answer, is_correct,
                stage, item_order,
                theta_estimate, standard_error, response_time, datetime.now()
            ))

            response = dict(cursor.fetchone())
            conn.commit()
            return response

        finally:
            cursor.close()
            self._return_connection(conn)

    def get_session_responses(self, session_id: int) -> List[Dict]:
        """
        Get all responses for a session.

        Args:
            session_id: Session ID

        Returns:
            List of response dictionaries
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT r.*,
                       i.discrimination, i.difficulty, i.guessing, i.domain,
                       i.frequency_band, i.target_word, i.is_pseudoword, i.band_size
                FROM english_test_responses r
                JOIN items i ON r.item_id = i.id
                WHERE r.session_id = %s
                ORDER BY r.responded_at ASC;
            """, (session_id,))

            return [dict(row) for row in cursor.fetchall()]

        finally:
            cursor.close()
            self._return_connection(conn)

    # ===== Item Insert/Update Methods =====

    def insert_item(self, item: Dict) -> Dict:
        """
        Insert a new item into the database.

        Args:
            item: Item dictionary with required fields

        Returns:
            Inserted item dictionary
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                INSERT INTO items (
                    stage, panel, form_id, domain, stem, options, correct_answer,
                    skill_tag, difficulty, discrimination, guessing,
                    passage_id, status, calibration_status, source, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                RETURNING *;
            """, (
                item['stage'],
                item['panel'],
                item.get('form_id', 1),
                item['domain'],
                item['stem'],
                json.dumps(item['options']) if isinstance(item['options'], dict) else item['options'],
                item['correct_answer'],
                item.get('skill_tag'),
                item.get('difficulty'),
                item.get('discrimination'),
                item.get('guessing', 0.25),
                item.get('passage_id'),
                item.get('status', 'active'),
                item.get('calibration_status', 'uncalibrated'),
                item.get('source', 'ai_generated'),
            ))

            result = dict(cursor.fetchone())
            conn.commit()
            return result

        finally:
            cursor.close()
            self._return_connection(conn)

    def update_item_calibration(
        self,
        item_id: int,
        discrimination: float,
        difficulty: float,
        guessing: float,
        point_biserial: float,
        calibration_n: int,
        calibration_status: str
    ) -> Dict:
        """
        Update item IRT parameters after calibration.

        Args:
            item_id: Item ID
            discrimination: Calibrated a parameter
            difficulty: Calibrated b parameter
            guessing: Calibrated c parameter
            point_biserial: Point-biserial correlation
            calibration_n: Number of responses used
            calibration_status: 'provisional', 'calibrated', or 'flagged'

        Returns:
            Updated item dictionary
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                UPDATE items
                SET discrimination = %s,
                    difficulty = %s,
                    guessing = %s,
                    point_biserial = %s,
                    calibration_n = %s,
                    calibration_status = %s,
                    calibrated_at = NOW(),
                    updated_at = NOW()
                WHERE id = %s
                RETURNING *;
            """, (
                float(discrimination),
                float(difficulty),
                float(guessing),
                float(point_biserial),
                int(calibration_n),
                calibration_status,
                item_id
            ))

            result = cursor.fetchone()
            conn.commit()
            return dict(result) if result else None

        finally:
            cursor.close()
            self._return_connection(conn)

    def get_response_matrix(self, min_responses_per_item: int = 30) -> Tuple[List[Dict], List[List[Optional[bool]]]]:
        """
        Extract response matrix for IRT calibration.

        Returns items with sufficient responses and their response data
        as a (students x items) boolean matrix.

        Args:
            min_responses_per_item: Minimum responses required per item

        Returns:
            Tuple of (items_list, response_matrix) where response_matrix[i][j]
            is True/False/None for student i on item j
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            # Get items with sufficient responses
            cursor.execute("""
                SELECT i.id, i.discrimination, i.difficulty, i.guessing,
                       i.domain, i.stage, i.panel, i.calibration_status,
                       COUNT(r.id) as response_count,
                       AVG(CASE WHEN r.is_correct THEN 1.0 ELSE 0.0 END) as correct_rate
                FROM items i
                JOIN english_test_responses r ON r.item_id = i.id
                WHERE i.status = 'active'
                GROUP BY i.id
                HAVING COUNT(r.id) >= %s
                ORDER BY i.id;
            """, (min_responses_per_item,))

            items = [dict(row) for row in cursor.fetchall()]

            if not items:
                return [], []

            item_ids = [item['id'] for item in items]

            # Get all session IDs that completed the test
            cursor.execute("""
                SELECT DISTINCT session_id
                FROM english_test_responses
                WHERE item_id = ANY(%s)
                ORDER BY session_id;
            """, (item_ids,))

            session_ids = [row['session_id'] for row in cursor.fetchall()]

            # Build response matrix
            cursor.execute("""
                SELECT session_id, item_id, is_correct
                FROM english_test_responses
                WHERE item_id = ANY(%s)
                ORDER BY session_id, item_id;
            """, (item_ids,))

            responses = cursor.fetchall()

            # Create lookup: (session_id, item_id) -> is_correct
            resp_lookup = {}
            for r in responses:
                resp_lookup[(r['session_id'], r['item_id'])] = r['is_correct']

            # Build matrix: rows=sessions, cols=items
            item_id_to_idx = {iid: idx for idx, iid in enumerate(item_ids)}
            matrix = []
            for sid in session_ids:
                row = [None] * len(item_ids)
                for iid in item_ids:
                    key = (sid, iid)
                    if key in resp_lookup:
                        row[item_id_to_idx[iid]] = resp_lookup[key]
                matrix.append(row)

            return items, matrix

        finally:
            cursor.close()
            self._return_connection(conn)

    def get_item_statistics(self, item_id: int) -> Dict:
        """
        Get response statistics for a single item.

        Args:
            item_id: Item ID

        Returns:
            Dict with response_count, correct_rate, point_biserial estimate
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT
                    COUNT(*) as response_count,
                    AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as correct_rate,
                    AVG(response_time) as avg_response_time
                FROM english_test_responses
                WHERE item_id = %s;
            """, (item_id,))

            result = dict(cursor.fetchone())
            return {
                'response_count': int(result['response_count']) if result['response_count'] else 0,
                'correct_rate': round(float(result['correct_rate']), 4) if result['correct_rate'] else None,
                'avg_response_time': round(float(result['avg_response_time']), 0) if result['avg_response_time'] else None,
            }

        finally:
            cursor.close()
            self._return_connection(conn)

    def get_calibration_summary(self) -> Dict:
        """
        Get summary of item calibration status across the item bank.

        Returns:
            Dict with counts per calibration_status and overall statistics
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT
                    COALESCE(calibration_status::text, 'uncalibrated') as cal_status,
                    COUNT(*) as count,
                    AVG(calibration_n) as avg_calibration_n
                FROM items
                WHERE status = 'active'
                GROUP BY calibration_status
                ORDER BY cal_status;
            """)

            rows = [dict(r) for r in cursor.fetchall()]
            summary = {}
            total = 0
            for row in rows:
                summary[row['cal_status']] = {
                    'count': row['count'],
                    'avg_n': round(float(row['avg_calibration_n']), 0) if row['avg_calibration_n'] else 0
                }
                total += row['count']

            summary['total_active'] = total
            return summary

        finally:
            cursor.close()
            self._return_connection(conn)

    # ===== Growth Tracking Methods =====

    def get_user_test_history(self, user_id: str) -> List[Dict]:
        """Get all completed sessions for a user, ordered by date."""
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT id, final_theta, standard_error, proficiency_level,
                       grammar_score, vocabulary_score, reading_score,
                       items_completed, started_at, completed_at
                FROM english_test_sessions
                WHERE user_id = %s AND status = 'completed'
                ORDER BY started_at ASC;
            """, (user_id,))

            return [dict(row) for row in cursor.fetchall()]

        finally:
            cursor.close()
            self._return_connection(conn)

    # ===== Routing Config Methods =====

    def get_routing_config(self) -> Dict:
        """Load active MST routing cutpoints from mst_routing_config table."""
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT stage_transition, cutpoints, description
                FROM mst_routing_config
                WHERE is_active = true
                ORDER BY stage_transition;
            """)

            rows = [dict(row) for row in cursor.fetchall()]
            config = {}
            for row in rows:
                config[row['stage_transition']] = row['cutpoints']
            return config

        finally:
            cursor.close()
            self._return_connection(conn)

    def update_routing_config(self, stage_transition: str, cutpoints: dict) -> Dict:
        """Update cutpoints for a specific stage transition."""
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                UPDATE mst_routing_config
                SET cutpoints = %s, updated_at = NOW()
                WHERE stage_transition = %s AND is_active = true
                RETURNING *;
            """, (json.dumps(cutpoints), stage_transition))

            result = cursor.fetchone()
            conn.commit()
            if not result:
                raise ValueError(f"No active config found for {stage_transition}")
            return dict(result)

        finally:
            cursor.close()
            self._return_connection(conn)

    # ===== Utility Methods =====

    def get_session_statistics(self, session_id: int) -> Dict:
        """
        Get session statistics.

        Args:
            session_id: Session ID

        Returns:
            Dictionary with total_items, correct_count, accuracy, etc.
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                SELECT
                    COUNT(*) as total_items,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
                    AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy_percentage,
                    AVG(response_time) as avg_response_time
                FROM english_test_responses
                WHERE session_id = %s;
            """, (session_id,))

            stats = dict(cursor.fetchone())
            return {
                'total_items': int(stats['total_items']) if stats['total_items'] else 0,
                'correct_count': int(stats['correct_count']) if stats['correct_count'] else 0,
                'accuracy_percentage': round(float(stats['accuracy_percentage']), 2) if stats['accuracy_percentage'] else 0.0,
                'avg_response_time': round(float(stats['avg_response_time']), 2) if stats['avg_response_time'] else None
            }

        finally:
            cursor.close()
            self._return_connection(conn)
