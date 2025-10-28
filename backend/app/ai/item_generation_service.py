"""
Item Generation Service
========================

High-level service for AI-powered test item generation.
Handles generation workflows, database integration, and quality control.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import Json

from .gemini_client import GeminiClient

logger = logging.getLogger(__name__)


class ItemGenerationService:
    """
    Service for AI-powered test item generation and management.

    Coordinates between Gemini API client and database to generate,
    validate, and store test items with proper metadata.
    """

    def __init__(self, gemini_client: GeminiClient, database_url: str):
        """
        Initialize item generation service.

        Args:
            gemini_client: Initialized GeminiClient instance
            database_url: PostgreSQL database connection URL
        """
        self.client = gemini_client
        self.database_url = database_url

    def generate_and_save_item(
        self,
        domain: str,
        difficulty: float,
        discrimination: float,
        skill_tag: str,
        cefr_level: str,
        stage: int,
        panel: str,
        form_id: int = 1,
        text_type: Optional[str] = None,
        constraints: Optional[Dict] = None,
        auto_approve: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a single item and save it to database.

        Args:
            domain: Test domain (vocabulary, grammar, reading)
            difficulty: IRT difficulty parameter
            discrimination: IRT discrimination parameter
            skill_tag: Specific skill being tested
            cefr_level: CEFR level
            stage: MST stage (1, 2, or 3)
            panel: Panel identifier (routing, low, medium, high, etc.)
            form_id: Form identifier
            text_type: Text type for reading items
            constraints: Additional generation constraints
            auto_approve: Whether to auto-approve without validation

        Returns:
            Dictionary with generated item data and metadata
        """
        logger.info(f"Generating {domain} item: {cefr_level}, difficulty={difficulty:.2f}")

        # Generate item using Gemini
        item_data = self.client.generate_item(
            domain=domain,
            difficulty=difficulty,
            discrimination=discrimination,
            skill_tag=skill_tag,
            cefr_level=cefr_level,
            text_type=text_type,
            constraints=constraints
        )

        # Validate item quality
        if not auto_approve:
            validation_result = self.client.validate_item(item_data)
            item_data['validation'] = validation_result

            if not validation_result.get('approved', False):
                logger.warning(f"Item failed validation: {validation_result.get('issues', [])}")
                item_data['status'] = 'flagged'
            else:
                item_data['status'] = 'active'
        else:
            item_data['status'] = 'active'

        # Save to database
        item_id = self._save_item_to_database(
            item_data=item_data,
            domain=domain,
            stage=stage,
            panel=panel,
            form_id=form_id,
            skill_tag=skill_tag,
            text_type=text_type or 'practical',
            difficulty=difficulty,
            discrimination=discrimination
        )

        item_data['id'] = item_id
        logger.info(f"Saved item {item_id} to database")

        return item_data

    def batch_generate_items(
        self,
        specifications: List[Dict[str, Any]],
        auto_approve: bool = False
    ) -> Dict[str, Any]:
        """
        Generate multiple items in batch.

        Args:
            specifications: List of item specifications
            auto_approve: Whether to auto-approve all items

        Returns:
            Summary with generated items and statistics
        """
        logger.info(f"Starting batch generation of {len(specifications)} items")

        generated_items = []
        failed_items = []

        for i, spec in enumerate(specifications, 1):
            try:
                logger.info(f"Generating item {i}/{len(specifications)}")
                item = self.generate_and_save_item(**spec, auto_approve=auto_approve)
                generated_items.append(item)
            except Exception as e:
                logger.error(f"Failed to generate item {i}: {e}")
                failed_items.append({'spec': spec, 'error': str(e)})

        summary = {
            'total_requested': len(specifications),
            'total_generated': len(generated_items),
            'total_failed': len(failed_items),
            'success_rate': len(generated_items) / len(specifications) * 100,
            'generated_items': generated_items,
            'failed_items': failed_items
        }

        logger.info(f"Batch generation complete: {summary['total_generated']}/{summary['total_requested']} successful")
        return summary

    def validate_existing_item(self, item_id: int) -> Dict[str, Any]:
        """
        Validate an existing item from database.

        Args:
            item_id: Item ID to validate

        Returns:
            Validation result
        """
        # Fetch item from database
        item = self._fetch_item_from_database(item_id)

        if not item:
            raise ValueError(f"Item {item_id} not found")

        # Validate using Gemini
        validation_result = self.client.validate_item(item)

        # Update database with validation results
        self._update_item_validation(item_id, validation_result)

        logger.info(f"Validated item {item_id}: score={validation_result['overall_score']}")
        return validation_result

    def regenerate_item(
        self,
        item_id: int,
        preserve_parameters: bool = True
    ) -> Dict[str, Any]:
        """
        Regenerate an existing item (e.g., if flagged for quality issues).

        Args:
            item_id: Item ID to regenerate
            preserve_parameters: Whether to use same IRT parameters

        Returns:
            New generated item data
        """
        # Fetch original item
        original_item = self._fetch_item_from_database(item_id)

        if not original_item:
            raise ValueError(f"Item {item_id} not found")

        # Mark original as inactive
        self._deactivate_item(item_id)

        # Generate new item with same or new parameters
        if preserve_parameters:
            spec = {
                'domain': original_item['domain'],
                'difficulty': original_item['difficulty'],
                'discrimination': original_item['discrimination'],
                'skill_tag': original_item['skill_tag'],
                'cefr_level': original_item.get('cefr_level', 'B1'),
                'stage': original_item['stage'],
                'panel': original_item['panel'],
                'form_id': original_item['form_id'],
                'text_type': original_item.get('text_type')
            }
        else:
            # Allow regeneration with modified parameters (future enhancement)
            raise NotImplementedError("Parameter modification not yet supported")

        new_item = self.generate_and_save_item(**spec, auto_approve=False)

        logger.info(f"Regenerated item {item_id} -> {new_item['id']}")
        return new_item

    # ===== Database Operations =====

    def _save_item_to_database(
        self,
        item_data: Dict[str, Any],
        domain: str,
        stage: int,
        panel: str,
        form_id: int,
        skill_tag: str,
        text_type: str,
        difficulty: float,
        discrimination: float
    ) -> int:
        """Save generated item to PostgreSQL database."""

        conn = psycopg2.connect(self.database_url)
        cur = conn.cursor()

        try:
            # Handle passage if present
            passage_id = None
            if item_data.get('passage'):
                # Save passage first
                passage_title = item_data.get('passage_title') or 'AI Generated Passage'
                cur.execute("""
                    INSERT INTO passages (title, content, word_count, lexile_score, ar_level, genre, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    RETURNING id
                """, (
                    passage_title,
                    item_data['passage'],
                    len(item_data['passage'].split()),
                    item_data.get('estimated_lexile', 500),
                    item_data.get('estimated_ar', 3.0),
                    text_type
                ))
                passage_id = cur.fetchone()[0]

            # Save item
            cur.execute("""
                INSERT INTO items (
                    passage_id, stem, options, correct_answer, domain, text_type,
                    skill_tag, discrimination, difficulty, guessing,
                    stage, panel, form_id, status,
                    exposure_count, exposure_rate,
                    created_at, updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s,
                    NOW(), NOW()
                )
                RETURNING id
            """, (
                passage_id,
                item_data['stem'],
                Json(item_data['options']),
                item_data['correct_answer'],
                domain,
                text_type,
                skill_tag,
                discrimination,
                difficulty,
                0.25,  # Guessing parameter for 4-option MC
                stage,
                panel,
                form_id,
                item_data.get('status', 'active'),
                0,  # Initial exposure count
                0.0  # Initial exposure rate
            ))

            item_id = cur.fetchone()[0]

            # Save AI metadata
            cur.execute("""
                INSERT INTO ai_generated_items (
                    item_id, model_name, generation_params, validation_result,
                    rationale, created_at
                )
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (
                item_id,
                item_data.get('model', 'gemini-1.5-pro'),
                Json(item_data.get('generation_params', {})),
                Json(item_data.get('validation', {})),
                item_data.get('rationale', '')
            ))

            conn.commit()
            return item_id

        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to save item to database: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def _fetch_item_from_database(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Fetch item from database."""

        conn = psycopg2.connect(self.database_url)
        cur = conn.cursor()

        try:
            cur.execute("""
                SELECT
                    id, passage_id, stem, options, correct_answer, domain, text_type,
                    skill_tag, discrimination, difficulty, guessing,
                    stage, panel, form_id, status
                FROM items
                WHERE id = %s
            """, (item_id,))

            row = cur.fetchone()

            if not row:
                return None

            return {
                'id': row[0],
                'passage_id': row[1],
                'stem': row[2],
                'options': row[3],
                'correct_answer': row[4],
                'domain': row[5],
                'text_type': row[6],
                'skill_tag': row[7],
                'discrimination': row[8],
                'difficulty': row[9],
                'guessing': row[10],
                'stage': row[11],
                'panel': row[12],
                'form_id': row[13],
                'status': row[14]
            }

        finally:
            cur.close()
            conn.close()

    def _update_item_validation(self, item_id: int, validation_result: Dict[str, Any]) -> None:
        """Update item validation results in database."""

        conn = psycopg2.connect(self.database_url)
        cur = conn.cursor()

        try:
            # Update status based on validation
            new_status = 'active' if validation_result.get('approved', False) else 'flagged'

            cur.execute("""
                UPDATE items
                SET status = %s, updated_at = NOW()
                WHERE id = %s
            """, (new_status, item_id))

            # Update AI metadata if exists
            cur.execute("""
                UPDATE ai_generated_items
                SET validation_result = %s
                WHERE item_id = %s
            """, (Json(validation_result), item_id))

            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to update validation for item {item_id}: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    def _deactivate_item(self, item_id: int) -> None:
        """Mark item as inactive."""

        conn = psycopg2.connect(self.database_url)
        cur = conn.cursor()

        try:
            cur.execute("""
                UPDATE items
                SET status = 'inactive', updated_at = NOW()
                WHERE id = %s
            """, (item_id,))

            conn.commit()

        finally:
            cur.close()
            conn.close()

    def list_ai_generated_items(
        self,
        limit: int = 50,
        offset: int = 0,
        model_name: Optional[str] = None,
        min_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        List AI-generated items with pagination and filtering.

        Args:
            limit: Maximum number of items to return
            offset: Number of items to skip
            model_name: Filter by AI model name
            min_score: Minimum validation overall_score

        Returns:
            Dictionary with items list and pagination info
        """
        conn = psycopg2.connect(self.database_url)
        cur = conn.cursor()

        try:
            # Build query with filters
            where_clauses = []
            params = []

            if model_name:
                where_clauses.append("ai.model_name = %s")
                params.append(model_name)

            if min_score is not None:
                where_clauses.append("(ai.validation_result->>'overall_score')::float >= %s")
                params.append(min_score)

            where_sql = ""
            if where_clauses:
                where_sql = "WHERE " + " AND ".join(where_clauses)

            # Get total count
            count_query = f"""
                SELECT COUNT(*)
                FROM ai_generated_items ai
                {where_sql}
            """
            cur.execute(count_query, params)
            total_count = cur.fetchone()[0]

            # Get items
            params.extend([limit, offset])
            query = f"""
                SELECT
                    i.id, i.domain, i.skill_tag, i.difficulty, i.discrimination,
                    i.stage, i.panel, i.status, i.created_at,
                    ai.model_name, ai.validation_result, ai.rationale, ai.generation_params
                FROM items i
                INNER JOIN ai_generated_items ai ON i.id = ai.item_id
                {where_sql}
                ORDER BY ai.created_at DESC
                LIMIT %s OFFSET %s
            """

            cur.execute(query, params)
            rows = cur.fetchall()

            items = []
            for row in rows:
                gen_params = row[12] or {}
                items.append({
                    'id': row[0],
                    'domain': row[1],
                    'skill_tag': row[2],
                    'cefr_level': gen_params.get('cefr_level'),
                    'difficulty': float(row[3]) if row[3] else None,
                    'discrimination': float(row[4]) if row[4] else None,
                    'stage': row[5],
                    'panel': row[6],
                    'status': row[7],
                    'created_at': row[8].isoformat() if row[8] else None,
                    'model_name': row[9],
                    'validation_result': row[10],
                    'rationale': row[11]
                })

            return {
                'items': items,
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': (offset + limit) < total_count
            }

        finally:
            cur.close()
            conn.close()

    def get_ai_item_details(self, item_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed AI metadata for a specific item.

        Args:
            item_id: Item ID

        Returns:
            Detailed item information with AI metadata, or None if not found
        """
        conn = psycopg2.connect(self.database_url)
        cur = conn.cursor()

        try:
            cur.execute("""
                SELECT
                    i.id, i.passage_id, i.stem, i.options, i.correct_answer,
                    i.domain, i.text_type, i.skill_tag,
                    i.discrimination, i.difficulty, i.guessing,
                    i.stage, i.panel, i.form_id, i.status,
                    i.exposure_count, i.exposure_rate, i.correct_rate,
                    i.created_at, i.updated_at,
                    ai.model_name, ai.generation_params, ai.validation_result,
                    ai.rationale, ai.created_at as ai_created_at,
                    p.title as passage_title, p.content as passage_content
                FROM items i
                INNER JOIN ai_generated_items ai ON i.id = ai.item_id
                LEFT JOIN passages p ON i.passage_id = p.id
                WHERE i.id = %s
            """, (item_id,))

            row = cur.fetchone()

            if not row:
                return None

            gen_params = row[21] or {}
            return {
                'item': {
                    'id': row[0],
                    'passage_id': row[1],
                    'stem': row[2],
                    'options': row[3],
                    'correct_answer': row[4],
                    'domain': row[5],
                    'text_type': row[6],
                    'skill_tag': row[7],
                    'cefr_level': gen_params.get('cefr_level'),
                    'discrimination': float(row[8]) if row[8] else None,
                    'difficulty': float(row[9]) if row[9] else None,
                    'guessing': float(row[10]) if row[10] else None,
                    'stage': row[11],
                    'panel': row[12],
                    'form_id': row[13],
                    'status': row[14],
                    'exposure_count': row[15],
                    'exposure_rate': float(row[16]) if row[16] else None,
                    'correct_rate': float(row[17]) if row[17] else None,
                    'created_at': row[18].isoformat() if row[18] else None,
                    'updated_at': row[19].isoformat() if row[19] else None
                },
                'ai_metadata': {
                    'model_name': row[20],
                    'generation_params': row[21],
                    'validation_result': row[22],
                    'rationale': row[23],
                    'created_at': row[24].isoformat() if row[24] else None
                },
                'passage': {
                    'title': row[25],
                    'content': row[26]
                } if row[25] or row[26] else None
            }

        finally:
            cur.close()
            conn.close()
