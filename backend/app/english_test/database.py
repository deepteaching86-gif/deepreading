"""
English Adaptive Test Database Layer
=====================================

Direct PostgreSQL database access using psycopg2.
Mirrors Prisma schema for English test tables.
"""

import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import json


class EnglishTestDB:
    """
    Database access layer for English Adaptive Test.

    Uses direct PostgreSQL connection via psycopg2.
    Schema mirrors Prisma definitions in schema.prisma.
    """

    def __init__(self):
        # Get database URL from environment (URL-encoded)
        self.database_url = os.getenv(
            'DIRECT_URL',
            'postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres'
        )

    def _get_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.database_url)

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
            conn.close()

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
            conn.close()

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
            conn.close()

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
                return item
            return None

        finally:
            cursor.close()
            conn.close()

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
                SELECT * FROM items
                WHERE stage = %s
                  AND panel = %s
                  AND form_id = %s
                  AND status = 'active'
            """
            params = [stage, panel, form_id]

            if domain:
                query += " AND domain = %s"
                params.append(domain)

            if excluded_ids:
                query += f" AND id NOT IN ({','.join(['%s'] * len(excluded_ids))})"
                params.extend(excluded_ids)

            query += " ORDER BY exposure_rate NULLS FIRST, exposure_count ASC;"

            cursor.execute(query, params)
            items = [dict(row) for row in cursor.fetchall()]

            # Parse JSON options
            for item in items:
                if isinstance(item['options'], str):
                    item['options'] = json.loads(item['options'])

            return items

        finally:
            cursor.close()
            conn.close()

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
            conn.close()

    # ===== Response Methods =====

    def create_response(
        self,
        session_id: int,
        item_id: int,
        selected_answer: str,
        is_correct: bool,
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
            theta_estimate: Theta estimate after this response
            standard_error: Standard error of estimate
            response_time: Response time in milliseconds

        Returns:
            Response dictionary
        """
        conn = self._get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        try:
            cursor.execute("""
                INSERT INTO english_test_responses (
                    session_id, item_id, selected_answer, is_correct,
                    theta_estimate, standard_error, response_time, responded_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                session_id, item_id, selected_answer, is_correct,
                theta_estimate, standard_error, response_time, datetime.now()
            ))

            response = dict(cursor.fetchone())
            conn.commit()
            return response

        finally:
            cursor.close()
            conn.close()

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
                SELECT r.*, i.discrimination, i.difficulty, i.guessing, i.domain
                FROM english_test_responses r
                JOIN items i ON r.item_id = i.id
                WHERE r.session_id = %s
                ORDER BY r.responded_at ASC;
            """, (session_id,))

            return [dict(row) for row in cursor.fetchall()]

        finally:
            cursor.close()
            conn.close()

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
            conn.close()
