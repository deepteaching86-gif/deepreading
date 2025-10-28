"""
English Adaptive Test Service Layer
===================================

Business logic for MST-based English proficiency testing.
Handles session management, item selection, and IRT estimation.
"""

from typing import Dict, List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from .irt_engine import IRTEngine


class EnglishTestService:
    """
    Service layer for English Adaptive Test operations.

    Manages test sessions, item selection, response recording,
    and IRT-based ability estimation.
    """

    def __init__(self, db: Session, irt_engine: IRTEngine):
        self.db = db
        self.irt = irt_engine

        # MST configuration
        self.STAGE_ITEMS = {
            1: 8,   # Routing module
            2: 16,  # Panel modules
            3: 16   # Subtrack modules
        }

    def start_session(self, user_id: str) -> Tuple[Dict, Dict]:
        """
        Start a new English adaptive test session.

        Args:
            user_id: User UUID

        Returns:
            Tuple of (session_dict, first_item_dict)
        """
        # Create new session (pseudo-code - actual implementation would use Prisma)
        session = {
            'id': self._generate_session_id(),
            'user_id': user_id,
            'started_at': datetime.now(),
            'status': 'in_progress',
            'stage': 1,
            'panel': 'routing',
            'items_completed': 0,
            'responses': [],
            'theta_history': []
        }

        # Select first item from routing panel
        first_item = self._select_item(stage=1, panel='routing', theta_current=0.0)

        return session, first_item

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
            Dictionary with response result and next item
        """
        # Get session and item (pseudo-code)
        session = self._get_session(session_id)
        item = self._get_item(item_id)

        # Check correctness
        is_correct = (selected_answer == item['correct_answer'])

        # Record response
        response = {
            'session_id': session_id,
            'item_id': item_id,
            'selected_answer': selected_answer,
            'is_correct': is_correct,
            'response_time': response_time,
            'stage': session['stage'],
            'item_order': session['items_completed'] + 1,
            'answered_at': datetime.now()
        }
        session['responses'].append(response)
        session['items_completed'] += 1

        # Update θ estimate using IRT EAP
        responses_bool = [r['is_correct'] for r in session['responses']]
        items_params = [self._get_item_params(r['item_id']) for r in session['responses']]

        theta_est, se = self.irt.eap_estimate(responses_bool, items_params)

        # Store current theta estimate
        response['theta_estimate'] = theta_est
        response['se_estimate'] = se
        session['theta_history'].append({'theta': theta_est, 'se': se})

        # Check if stage transition needed
        current_stage = session['stage']
        items_in_stage = len([r for r in session['responses'] if r['stage'] == current_stage])

        stage_complete = (items_in_stage >= self.STAGE_ITEMS[current_stage])

        if stage_complete:
            # Transition to next stage
            if current_stage == 1:
                # Route to Stage 2 panel
                session['stage'] = 2
                session['panel'] = self.irt.route_to_stage2_panel(theta_est)
                session['stage1_theta'] = theta_est

            elif current_stage == 2:
                # Route to Stage 3 subtrack
                session['stage'] = 3
                session['stage2_panel'] = session['panel']
                session['panel'] = self.irt.route_to_stage3_panel(theta_est, session['stage2_panel'])
                session['stage2_theta'] = theta_est

        # Check if test complete
        test_completed = (session['items_completed'] >= 40)

        if test_completed:
            next_item = None
        else:
            # Select next item
            next_item = self._select_next_item(session, theta_est)

        return {
            'is_correct': is_correct,
            'next_item': next_item,
            'current_theta': theta_est,
            'standard_error': se,
            'items_completed': session['items_completed'],
            'total_items': 40,
            'stage': session['stage'],
            'panel': session['panel'],
            'test_completed': test_completed
        }

    def get_session_status(self, session_id: int) -> Dict:
        """
        Get current session status and progress.

        Args:
            session_id: Session ID

        Returns:
            Session status dictionary
        """
        session = self._get_session(session_id)

        # Calculate current theta if responses exist
        if session['responses']:
            responses_bool = [r['is_correct'] for r in session['responses']]
            items_params = [self._get_item_params(r['item_id']) for r in session['responses']]
            theta_est, se = self.irt.eap_estimate(responses_bool, items_params)
        else:
            theta_est, se = None, None

        return {
            'session_id': session['id'],
            'user_id': session['user_id'],
            'started_at': session['started_at'],
            'completed_at': session.get('completed_at'),
            'status': session['status'],
            'items_completed': session['items_completed'],
            'current_theta': theta_est,
            'current_se': se,
            'stage': session['stage'],
            'panel': session['panel']
        }

    def finalize_session(self, session_id: int) -> Dict:
        """
        Finalize test session and generate report.

        Args:
            session_id: Session ID

        Returns:
            Final test results dictionary
        """
        session = self._get_session(session_id)

        if session['status'] == 'completed':
            raise ValueError("Session already completed")

        # Calculate final θ
        responses_bool = [r['is_correct'] for r in session['responses']]
        items_params = [self._get_item_params(r['item_id']) for r in session['responses']]
        final_theta, se = self.irt.eap_estimate(responses_bool, items_params)

        # Convert to proficiency level
        proficiency_level = self.irt.ability_to_proficiency_level(final_theta)

        # Calculate accuracy
        correct_count = sum(responses_bool)
        total_items = len(responses_bool)
        accuracy_percentage = (correct_count / total_items * 100) if total_items > 0 else 0

        # Estimate Lexile/AR (placeholder - requires ML model)
        lexile_score = self._estimate_lexile(final_theta)
        ar_level = self._estimate_ar(final_theta)

        # Calculate vocabulary bands from responses
        vocabulary_bands = self._calculate_vocabulary_bands(session['responses'])
        vocabulary_size = self._estimate_vocabulary_size(vocabulary_bands)

        # Update session
        session['status'] = 'completed'
        session['completed_at'] = datetime.now()
        session['final_theta'] = final_theta
        session['standard_error'] = se
        session['proficiency_level'] = proficiency_level
        session['lexile_score'] = lexile_score
        session['ar_level'] = ar_level
        session['correct_count'] = correct_count

        return {
            'session_id': session_id,
            'final_theta': final_theta,
            'standard_error': se,
            'proficiency_level': proficiency_level,
            'lexile_score': lexile_score,
            'ar_level': ar_level,
            'vocabulary_size': vocabulary_size,
            'vocabulary_bands': vocabulary_bands,
            'total_items': total_items,
            'correct_count': correct_count,
            'accuracy_percentage': round(accuracy_percentage, 2),
            'completed_at': session['completed_at']
        }

    # ===== Helper Methods =====

    def _generate_session_id(self) -> int:
        """Generate unique session ID (placeholder)"""
        import random
        return random.randint(100000, 999999)

    def _get_session(self, session_id: int) -> Dict:
        """Get session from database (placeholder)"""
        # TODO: Implement actual database query using Prisma
        raise NotImplementedError("Database integration pending")

    def _get_item(self, item_id: int) -> Dict:
        """Get item from database (placeholder)"""
        # TODO: Implement actual database query
        raise NotImplementedError("Database integration pending")

    def _get_item_params(self, item_id: int) -> Dict:
        """Get IRT parameters for item"""
        item = self._get_item(item_id)
        return {
            'a': item['discrimination'],
            'b': item['difficulty'],
            'c': item['guessing']
        }

    def _select_item(self, stage: int, panel: str, theta_current: float) -> Dict:
        """
        Select item from specific stage/panel.

        Args:
            stage: Stage number (1, 2, 3)
            panel: Panel name
            theta_current: Current ability estimate

        Returns:
            Item dictionary
        """
        # TODO: Query database for candidate items
        # Filter by stage, panel, form rotation
        # Use IRT engine for selection with exposure control

        raise NotImplementedError("Item selection pending database integration")

    def _select_next_item(self, session: Dict, theta_current: float) -> Dict:
        """Select next item based on current state"""
        return self._select_item(
            stage=session['stage'],
            panel=session['panel'],
            theta_current=theta_current
        )

    def _estimate_lexile(self, theta: float) -> Optional[int]:
        """
        Estimate Lexile score from θ.

        Placeholder implementation - requires trained ML model.

        Args:
            theta: Ability parameter

        Returns:
            Estimated Lexile score (200L - 1700L)
        """
        # Simple linear mapping as placeholder
        # Actual implementation requires Gradient Boosting model
        lexile_min, lexile_max = 200, 1700
        theta_min, theta_max = -3, 3

        # Linear interpolation
        lexile = lexile_min + (theta - theta_min) / (theta_max - theta_min) * (lexile_max - lexile_min)
        return int(max(lexile_min, min(lexile_max, lexile)))

    def _estimate_ar(self, theta: float) -> Optional[float]:
        """
        Estimate AR level from θ.

        Placeholder implementation - requires trained ML model.

        Args:
            theta: Ability parameter

        Returns:
            Estimated AR level (1.0 - 12.0)
        """
        # Simple linear mapping as placeholder
        ar_min, ar_max = 1.0, 12.0
        theta_min, theta_max = -3, 3

        ar = ar_min + (theta - theta_min) / (theta_max - theta_min) * (ar_max - ar_min)
        return round(max(ar_min, min(ar_max, ar)), 1)

    def _calculate_vocabulary_bands(self, responses: List[Dict]) -> Optional[Dict[str, int]]:
        """
        Calculate vocabulary performance by frequency bands.

        Analyzes correct responses for vocabulary items and groups them
        by word frequency bands (1000-2000, 2000-5000, 5000-10000).

        Args:
            responses: List of response dictionaries

        Returns:
            Dictionary with band names as keys and correct counts as values
        """
        bands = {
            "1000-2000": 0,
            "2000-5000": 0,
            "5000-10000": 0,
            "10000+": 0
        }

        # Count correct vocabulary items by frequency band
        for response in responses:
            item = self._get_item(response['item_id'])

            # Only process vocabulary items
            if item.get('domain') != 'vocabulary':
                continue

            # Skip if not correct
            if not response['is_correct']:
                continue

            # Get skill_tag to determine band
            skill_tag = item.get('skill_tag', '')

            # Map skill tags to bands
            if '1000' in skill_tag or '2000' in skill_tag or 'basic vocabulary' in skill_tag:
                bands["1000-2000"] += 1
            elif '5000' in skill_tag or 'intermediate vocabulary' in skill_tag or 'general vocabulary' in skill_tag:
                bands["2000-5000"] += 1
            elif '10000' in skill_tag or 'advanced vocabulary' in skill_tag or 'academic vocabulary' in skill_tag:
                bands["5000-10000"] += 1
            else:
                # Default to most common band
                bands["2000-5000"] += 1

        # Return None if no vocabulary items were answered
        if sum(bands.values()) == 0:
            return None

        return bands

    def _estimate_vocabulary_size(self, vocabulary_bands: Optional[Dict[str, int]]) -> Optional[int]:
        """
        Estimate total vocabulary size from band performance.

        Uses frequency band performance to extrapolate total vocabulary size.
        Based on research showing vocabulary size correlates with frequency band mastery.

        Args:
            vocabulary_bands: Dictionary of correct counts by frequency band

        Returns:
            Estimated vocabulary size (total words known)
        """
        if not vocabulary_bands:
            return None

        # Calculate weighted vocabulary size based on band mastery
        # Bands represent: 1000-2000 (1000 words), 2000-5000 (3000 words),
        #                  5000-10000 (5000 words), 10000+ (10000+ words)

        band_1 = vocabulary_bands.get("1000-2000", 0)
        band_2 = vocabulary_bands.get("2000-5000", 0)
        band_3 = vocabulary_bands.get("5000-10000", 0)
        band_4 = vocabulary_bands.get("10000+", 0)

        # Simple estimation: assume mastery correlates with vocabulary range
        # This is a placeholder - real implementation would use validated model
        base_vocab = 1000  # Assume minimum 1000 common words

        # Add estimated words from each band (conservative estimate)
        if band_1 > 0:
            base_vocab += min(band_1 * 100, 1000)  # Up to 1000 more
        if band_2 > 0:
            base_vocab += min(band_2 * 150, 3000)  # Up to 3000 more
        if band_3 > 0:
            base_vocab += min(band_3 * 200, 5000)  # Up to 5000 more
        if band_4 > 0:
            base_vocab += band_4 * 250  # Open-ended for advanced learners

        return base_vocab
