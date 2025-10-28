"""
English Adaptive Test Service Layer v2
======================================

Business logic for MST-based English proficiency testing with database integration.
"""

from typing import Dict, List, Optional
import random

from .irt_engine import IRTEngine
from .database import EnglishTestDB


class EnglishTestServiceV2:
    """
    Service layer for English Adaptive Test operations.

    Integrates IRT engine with database layer for complete test management.
    """

    def __init__(self, db: EnglishTestDB, irt_engine: IRTEngine):
        self.db = db
        self.irt = irt_engine

        # MST configuration
        self.STAGE_ITEMS = {
            1: 8,   # Routing module
            2: 16,  # Panel modules
            3: 16   # Subtrack modules
        }

        # Form rotation (1, 2, 3)
        self.FORM_COUNT = 3

    def start_session(self, user_id: str) -> Dict:
        """
        Start new English adaptive test session.

        Args:
            user_id: User identifier

        Returns:
            Dictionary with session and first_item
        """
        # Create session in database
        session = self.db.create_session(user_id)

        # Select first item from routing panel
        first_item = self._select_item(
            stage=1,
            panel='routing',
            theta_current=0.0,
            excluded_ids=[]
        )

        if not first_item:
            raise ValueError("No items available for routing panel")

        # Increment exposure
        self.db.increment_exposure(first_item['id'])

        return {
            'session_id': session['id'],
            'user_id': session['user_id'],
            'started_at': session['started_at'].isoformat(),
            'stage': session['stage'],
            'panel': session['panel'],
            'items_completed': session['items_completed'],
            'total_items': 40,
            'first_item': self._format_item(first_item)
        }

    def submit_response(
        self,
        session_id: int,
        item_id: int,
        selected_answer: str,
        response_time: Optional[int] = None
    ) -> Dict:
        """
        Process item response and return next item.

        Args:
            session_id: Session ID
            item_id: Item ID
            selected_answer: Selected option ('A', 'B', 'C', 'D')
            response_time: Response time in milliseconds

        Returns:
            Response result with next_item (or None if test complete)
        """
        # Get session
        session = self.db.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Get item
        item = self.db.get_item(item_id)
        if not item:
            raise ValueError(f"Item {item_id} not found")

        # Check correctness
        is_correct = (selected_answer == item['correct_answer'])

        # Get all responses so far
        responses = self.db.get_session_responses(session_id)

        # Add current response
        responses_bool = [r['is_correct'] for r in responses] + [is_correct]
        items_params = [
            {'a': r['discrimination'], 'b': r['difficulty'], 'c': r['guessing']}
            for r in responses
        ] + [
            {'a': item['discrimination'], 'b': item['difficulty'], 'c': item['guessing']}
        ]

        # Update θ estimate using IRT EAP
        theta_est, se = self.irt.eap_estimate(responses_bool, items_params)

        # Record response in database
        self.db.create_response(
            session_id=session_id,
            item_id=item_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            theta_estimate=theta_est,
            standard_error=se,
            response_time=response_time
        )

        # Update session items_completed and current estimates
        items_completed = session['items_completed'] + 1
        self.db.update_session(session_id, {
            'items_completed': items_completed,
            'current_theta': theta_est,
            'current_se': se
        })

        # Check if stage transition needed
        current_stage = session['stage']
        items_in_stage = len([r for r in responses if r is not None]) + 1  # Include current

        # Filter by current stage (responses don't have stage field, so count all)
        # This is simplified - in production, track stage transitions properly
        stage_complete = (items_in_stage >= self.STAGE_ITEMS[current_stage])

        new_stage = current_stage
        new_panel = session['panel']

        if stage_complete and current_stage < 3:
            if current_stage == 1:
                # Route to Stage 2 panel based on theta
                new_stage = 2
                new_panel = self.irt.route_to_stage2_panel(theta_est)

            elif current_stage == 2:
                # Route to Stage 3 subtrack
                new_stage = 3
                new_panel = self.irt.route_to_stage3_panel(theta_est, session['panel'])

            # Update session stage/panel
            self.db.update_session(session_id, {
                'stage': new_stage,
                'panel': new_panel
            })

        # Check if test complete (40 items total)
        test_completed = (items_completed >= 40)

        if test_completed:
            next_item = None
        else:
            # Get list of already answered item IDs
            answered_ids = [r['item_id'] for r in responses] + [item_id]

            # Select next item
            next_item = self._select_item(
                stage=new_stage,
                panel=new_panel,
                theta_current=theta_est,
                excluded_ids=answered_ids
            )

            if next_item:
                self.db.increment_exposure(next_item['id'])

        return {
            'is_correct': is_correct,
            'next_item': self._format_item(next_item) if next_item else None,
            'current_theta': round(theta_est, 3),
            'standard_error': round(se, 3),
            'items_completed': items_completed,
            'total_items': 40,
            'stage': new_stage,
            'panel': new_panel,
            'test_completed': test_completed
        }

    def get_session_status(self, session_id: int) -> Dict:
        """
        Get current session status.

        Args:
            session_id: Session ID

        Returns:
            Session status dictionary
        """
        session = self.db.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        return {
            'session_id': session['id'],
            'user_id': session['user_id'],
            'started_at': session['started_at'].isoformat(),
            'completed_at': session['completed_at'].isoformat() if session['completed_at'] else None,
            'status': session['status'],
            'items_completed': session['items_completed'],
            'current_theta': session['current_theta'],
            'current_se': session['current_se'],
            'stage': session['stage'],
            'panel': session['panel']
        }

    def finalize_session(self, session_id: int) -> Dict:
        """
        Finalize test session and generate comprehensive report.

        Args:
            session_id: Session ID

        Returns:
            Final test results (FR-005)
        """
        session = self.db.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        if session['status'] == 'completed':
            raise ValueError("Session already completed")

        # Get all responses
        responses = self.db.get_session_responses(session_id)

        if not responses:
            raise ValueError("No responses found for session")

        # Calculate final θ using all responses
        responses_bool = [r['is_correct'] for r in responses]
        items_params = [
            {'a': r['discrimination'], 'b': r['difficulty'], 'c': r['guessing']}
            for r in responses
        ]

        final_theta, se = self.irt.eap_estimate(responses_bool, items_params)

        # Convert to proficiency level (1-10)
        proficiency_level = self.irt.ability_to_proficiency_level(final_theta)

        # Get statistics
        stats = self.db.get_session_statistics(session_id)

        # Estimate Lexile/AR (placeholder - requires ML model)
        lexile_score = self._estimate_lexile(final_theta)
        ar_level = self._estimate_ar(final_theta)

        # Calculate vocabulary size (FR-004)
        vocabulary_size, vocabulary_bands = self._calculate_vocabulary_metrics(responses)

        # Prepare final results
        final_results = {
            'final_theta': round(final_theta, 3),
            'standard_error': round(se, 3),
            'proficiency_level': proficiency_level,
            'lexile_score': lexile_score,
            'ar_level': ar_level,
            'vocabulary_size': vocabulary_size,
            'vocabulary_bands': vocabulary_bands,
            'total_items': stats['total_items'],
            'correct_count': stats['correct_count'],
            'accuracy_percentage': stats['accuracy_percentage']
        }

        # Update session in database
        self.db.finalize_session(session_id, final_results)

        # Add session info
        final_results.update({
            'session_id': session_id,
            'user_id': session['user_id'],
            'completed_at': session['updated_at'].isoformat()  # Will be updated by finalize
        })

        return final_results

    # ===== Helper Methods =====

    def _select_item(
        self,
        stage: int,
        panel: str,
        theta_current: float,
        excluded_ids: List[int]
    ) -> Optional[Dict]:
        """
        Select optimal item using Fisher Information with exposure control.

        Args:
            stage: MST stage (1, 2, 3)
            panel: Panel name
            theta_current: Current ability estimate
            excluded_ids: Already answered item IDs

        Returns:
            Selected item or None
        """
        # Select form using rotation (currently only form 1 is available)
        form_id = 1  # TODO: Implement proper form rotation when forms 2 and 3 are added

        # Get candidate items from database
        candidates = self.db.get_items_for_selection(
            stage=stage,
            panel=panel,
            form_id=form_id,
            excluded_ids=excluded_ids
        )

        if not candidates:
            return None

        # Use IRT engine for Fisher Information-based selection
        selected_item = self.irt.select_next_item(
            theta_current=theta_current,
            candidate_items=candidates
        )

        return selected_item

    def _format_item(self, item: Optional[Dict]) -> Optional[Dict]:
        """Format item for API response"""
        if not item:
            return None

        return {
            'id': item['id'],
            'stem': item['stem'],
            'passage': item.get('passage_content'),
            'options': item['options'],
            'domain': item['domain'],
            'skill_tag': item.get('skill_tag'),
            'difficulty': item.get('difficulty'),  # Add difficulty for visualization
            'source': item.get('source', 'manual')  # Add source: 'manual' or 'ai_generated'
        }

    def _estimate_lexile(self, theta: float) -> int:
        """
        Estimate Lexile score from θ.

        Placeholder - requires trained Gradient Boosting model (FR-005).
        """
        lexile_min, lexile_max = 200, 1700
        theta_min, theta_max = -3, 3

        lexile = lexile_min + (theta - theta_min) / (theta_max - theta_min) * (lexile_max - lexile_min)
        return int(max(lexile_min, min(lexile_max, lexile)))

    def _estimate_ar(self, theta: float) -> float:
        """
        Estimate AR level from θ.

        Placeholder - requires trained Gradient Boosting model (FR-005).
        """
        ar_min, ar_max = 1.0, 12.0
        theta_min, theta_max = -3, 3

        ar = ar_min + (theta - theta_min) / (theta_max - theta_min) * (ar_max - ar_min)
        return round(max(ar_min, min(ar_max, ar)), 1)

    def _calculate_vocabulary_metrics(self, responses: List[Dict]) -> tuple[Optional[int], Optional[Dict]]:
        """
        Calculate vocabulary size using Nation's VST formula (FR-004).

        Formula: Vocab Size = Σ((correct/tested) × band_size) for each frequency band

        Args:
            responses: List of response dictionaries with VST fields

        Returns:
            Tuple of (vocabulary_size, vocabulary_bands_data)
            vocabulary_bands_data includes:
                - band distribution (correct/total per band)
                - pseudoword accuracy
                - confidence level (High/Low)
        """
        # Filter vocabulary domain responses
        vocab_responses = [r for r in responses if r['domain'] == 'vocabulary']

        if len(vocab_responses) < 14:
            return None, None

        # Separate real words and pseudowords
        real_words = [r for r in vocab_responses if not r.get('is_pseudoword', False)]
        pseudowords = [r for r in vocab_responses if r.get('is_pseudoword', False)]

        # Group real words by frequency band
        band_stats = {}
        for response in real_words:
            band = response.get('frequency_band')
            band_size = response.get('band_size', 0)

            if not band or not band_size:
                continue

            if band not in band_stats:
                band_stats[band] = {
                    'correct': 0,
                    'total': 0,
                    'band_size': band_size
                }

            band_stats[band]['total'] += 1
            if response['is_correct']:
                band_stats[band]['correct'] += 1

        # Calculate vocabulary size using Nation's formula
        total_vocab_size = 0
        for band, stats in band_stats.items():
            if stats['total'] > 0:
                band_estimate = (stats['correct'] / stats['total']) * stats['band_size']
                total_vocab_size += band_estimate

        # Check pseudoword accuracy for confidence level
        pseudoword_accuracy = 0.0
        confidence = 'Unknown'

        if len(pseudowords) > 0:
            correct_pseudo = sum(1 for p in pseudowords if p['is_correct'])
            pseudoword_accuracy = correct_pseudo / len(pseudowords)

            # Confidence: High if ≥66% pseudoword accuracy (2/3 correct)
            confidence = 'High' if pseudoword_accuracy >= 0.66 else 'Low'

        # Prepare band distribution with details
        vocabulary_bands = {
            'bands': {
                band: {
                    'correct': stats['correct'],
                    'total': stats['total'],
                    'percentage': round((stats['correct'] / stats['total']) * 100, 1) if stats['total'] > 0 else 0
                }
                for band, stats in band_stats.items()
            },
            'pseudowords': {
                'correct': sum(1 for p in pseudowords if p['is_correct']),
                'total': len(pseudowords),
                'accuracy': round(pseudoword_accuracy * 100, 1)
            },
            'confidence': confidence
        }

        return int(total_vocab_size), vocabulary_bands
