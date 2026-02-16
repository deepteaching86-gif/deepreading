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

        # Load routing config from DB (fallback to hardcoded defaults)
        self.routing_config = self._load_routing_config()

    def start_session(self, user_id: str, grade_level: int = None, gender: str = None) -> Dict:
        """
        Start new English adaptive test session.

        Args:
            user_id: User identifier
            grade_level: Optional student grade level (1-12) for DIF analysis
            gender: Optional student gender for DIF analysis

        Returns:
            Dictionary with session and first_item
        """
        # Create session in database
        session = self.db.create_session(user_id)

        # Store demographics if provided (for DIF analysis)
        if grade_level is not None or gender is not None:
            demo_updates = {}
            if grade_level is not None:
                demo_updates['grade_level'] = grade_level
            if gender is not None:
                demo_updates['gender'] = gender
            self.db.update_session(session['id'], demo_updates)

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
            'total_items': 45,  # Hard cap (adaptive stopping may end earlier)
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

        # Update session items_completed and current estimates
        items_completed = session['items_completed'] + 1
        current_stage = session['stage']

        # Record response in database with stage tracking
        self.db.create_response(
            session_id=session_id,
            item_id=item_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            stage=current_stage,
            item_order=items_completed,
            theta_estimate=theta_est,
            standard_error=se,
            response_time=response_time
        )

        # Update session
        self.db.update_session(session_id, {
            'items_completed': items_completed,
            'current_theta': theta_est,
            'current_se': se
        })

        # Check if stage transition needed (count only responses from current stage)
        # Note: Use r.get('stage', 1) with default=1 for backward compatibility with old responses
        items_in_current_stage = len([r for r in responses if r.get('stage', 1) == current_stage]) + 1  # Include current
        stage_complete = (items_in_current_stage >= self.STAGE_ITEMS[current_stage])

        new_stage = current_stage
        new_panel = session['panel']

        if stage_complete and current_stage < 3:
            if current_stage == 1:
                # Route to Stage 2 panel based on theta (configurable cutpoints)
                new_stage = 2
                new_panel = self.irt.route_to_stage2_panel(
                    theta_est,
                    cutpoints=self._get_stage2_cutpoints()
                )

            elif current_stage == 2:
                # Route to Stage 3 subtrack (configurable cutpoints)
                new_stage = 3
                new_panel = self.irt.route_to_stage3_panel(
                    theta_est,
                    session['panel'],
                    cutpoints=self._get_stage3_cutpoints(session['panel'])
                )

            # Update session stage/panel
            self.db.update_session(session_id, {
                'stage': new_stage,
                'panel': new_panel
            })

        # Check if test complete (adaptive stopping rule)
        test_completed = self._should_stop(se, items_completed, new_stage)

        if test_completed:
            next_item = None
        else:
            # Get list of already answered item IDs
            answered_ids = [r['item_id'] for r in responses] + [item_id]

            # Compute domain counts for content balancing (including current item)
            domain_counts: Dict[str, int] = {}
            for r in responses:
                d = (r.get('domain') or '').lower()
                if d:
                    domain_counts[d] = domain_counts.get(d, 0) + 1
            current_domain = (item.get('domain') or '').lower()
            if current_domain:
                domain_counts[current_domain] = domain_counts.get(current_domain, 0) + 1

            # Select next item with content balancing
            next_item = self._select_item(
                stage=new_stage,
                panel=new_panel,
                theta_current=theta_est,
                excluded_ids=answered_ids,
                domain_counts=domain_counts
            )

            if next_item:
                self.db.increment_exposure(next_item['id'])

        return {
            'is_correct': is_correct,
            'next_item': self._format_item(next_item) if next_item else None,
            'current_theta': round(theta_est, 3),
            'standard_error': round(se, 3),
            'items_completed': items_completed,
            'total_items': 45,  # Hard cap (adaptive stopping may end earlier)
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

        # Estimate Lexile/AR (statistical estimates, not official scores)
        lexile_data = self._estimate_lexile(final_theta)
        ar_level = self._estimate_ar(final_theta)

        # Calculate vocabulary size (FR-004)
        vocabulary_size, vocabulary_bands = self._calculate_vocabulary_metrics(responses)

        # Calculate domain-specific scores
        domain_scores = self._calculate_domain_scores(responses)

        # Prepare final results
        final_results = {
            'final_theta': round(final_theta, 3),
            'standard_error': round(se, 3),
            'proficiency_level': proficiency_level,
            'lexile_score': lexile_data['score'],
            'lexile_details': lexile_data,
            'ar_level': ar_level,
            'vocabulary_size': vocabulary_size,
            'vocabulary_bands': vocabulary_bands,
            'domain_scores': domain_scores,
            'total_items': stats['total_items'],
            'correct_count': stats['correct_count'],
            'accuracy_percentage': stats['accuracy_percentage'],
            'score_disclaimer': '본 점수는 IRT 능력 추정치 기반 통계 추정값이며, 공식 Lexile/AR 평가 결과가 아닙니다.'
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

    # ===== Growth Tracking =====

    def calculate_growth(self, user_id: str) -> Dict:
        """
        Calculate theta growth trend using linear regression.

        Args:
            user_id: User identifier

        Returns:
            Dictionary with sessions history, theta trend, domain trends
        """
        import numpy as np

        sessions = self.db.get_user_test_history(user_id)

        if not sessions:
            return {
                'sessions': [],
                'theta_trend': 0.0,
                'domain_trends': {'grammar': 0.0, 'vocabulary': 0.0, 'reading': 0.0},
                'total_tests': 0
            }

        # Format sessions for response
        formatted = []
        for s in sessions:
            formatted.append({
                'id': s['id'],
                'final_theta': float(s['final_theta']) if s['final_theta'] else None,
                'standard_error': float(s['standard_error']) if s['standard_error'] else None,
                'grammar_score': float(s['grammar_score']) if s.get('grammar_score') else None,
                'vocabulary_score': float(s['vocabulary_score']) if s.get('vocabulary_score') else None,
                'reading_score': float(s['reading_score']) if s.get('reading_score') else None,
                'items_completed': s['items_completed'],
                'started_at': s['started_at'].isoformat() if s['started_at'] else None,
                'completed_at': s['completed_at'].isoformat() if s['completed_at'] else None,
            })

        # Calculate theta trend (slope via linear regression)
        theta_trend = 0.0
        valid_thetas = [(i, s['final_theta']) for i, s in enumerate(sessions) if s['final_theta'] is not None]
        if len(valid_thetas) >= 2:
            x = np.array([v[0] for v in valid_thetas], dtype=float)
            y = np.array([v[1] for v in valid_thetas], dtype=float)
            slope, _ = np.polyfit(x, y, 1)
            theta_trend = round(float(slope), 4)

        # Per-domain trends
        domain_trends = {}
        for domain in ['grammar', 'vocabulary', 'reading']:
            key = f'{domain}_score'
            valid = [(i, float(s[key])) for i, s in enumerate(sessions) if s.get(key) is not None]
            if len(valid) >= 2:
                x = np.array([v[0] for v in valid], dtype=float)
                y = np.array([v[1] for v in valid], dtype=float)
                slope, _ = np.polyfit(x, y, 1)
                domain_trends[domain] = round(float(slope), 4)
            else:
                domain_trends[domain] = 0.0

        return {
            'sessions': formatted,
            'theta_trend': theta_trend,
            'domain_trends': domain_trends,
            'total_tests': len(sessions)
        }

    def _load_routing_config(self) -> Dict:
        """
        Load routing cutpoints from DB, fallback to hardcoded defaults.

        Returns:
            Dict with keys 'stage1_to_2', 'stage2_to_3_low', etc.
        """
        try:
            config = self.db.get_routing_config()
            if config:
                return config
        except Exception as e:
            print(f"Warning: Could not load routing config from DB: {e}")
        return {}

    def _get_stage2_cutpoints(self) -> Optional[Dict]:
        """Get Stage 1→2 cutpoints from loaded config, or None for defaults."""
        return self.routing_config.get('stage1_to_2')

    def _get_stage3_cutpoints(self, stage2_panel: str) -> Optional[Dict]:
        """Get Stage 2→3 cutpoints for a specific panel from loaded config."""
        key = f'stage2_to_3_{stage2_panel}'
        return self.routing_config.get(key)

    # ===== Helper Methods =====

    def _select_item(
        self,
        stage: int,
        panel: str,
        theta_current: float,
        excluded_ids: List[int],
        domain_counts: Optional[Dict[str, int]] = None
    ) -> Optional[Dict]:
        """
        Select optimal item using Fisher Information with content balancing.

        Args:
            stage: MST stage (1, 2, 3)
            panel: Panel name
            theta_current: Current ability estimate
            excluded_ids: Already answered item IDs
            domain_counts: Dict of domain -> count for content balancing

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
            # Fallback: Generate items using AI when database pool is depleted
            print(f"⚠️ No items available in database for stage={stage}, panel={panel}")
            print(f"🤖 Attempting AI generation...")

            try:
                from app.english_test.ai_item_generator import get_generator

                ai_generator = get_generator()
                generated_items = ai_generator.generate_items(
                    stage=stage,
                    panel=panel,
                    count=5  # Generate 5 items to replenish pool
                )

                if generated_items:
                    print(f"✅ Generated {len(generated_items)} items using Gemini AI")

                    # Save generated items to database
                    for item in generated_items:
                        try:
                            self.db.insert_item(item)
                        except Exception as insert_error:
                            print(f"⚠️ Failed to save item {item.get('id')}: {insert_error}")

                    # Use first generated item as candidate
                    candidates = [generated_items[0]]
                    print(f"🎯 Selected AI-generated item: {generated_items[0]['id']}")
                else:
                    print(f"❌ AI generation returned no items")
                    return None

            except Exception as e:
                print(f"❌ AI generation failed: {type(e).__name__}: {e}")
                return None

        # Use IRT engine for Fisher Information-based selection with content balancing
        selected_item = self.irt.select_next_item(
            theta_current=theta_current,
            candidate_items=candidates,
            domain_counts=domain_counts,
            stage=stage
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

    def _estimate_lexile(self, theta: float, grade: int = None) -> dict:
        """
        Estimate Lexile score from θ with grade-band correction.

        Returns dict with score, confidence interval, and grade context.
        Raw estimate uses logistic mapping, then clipped to MetaMetrics
        published grade-band ranges when grade is available.

        NOTE: This is a statistical estimate, NOT an official Lexile score.
        """
        import math

        # Raw logistic estimate
        L_min = 100
        L_max = 1700
        k = 0.85
        theta_mid = 0.0
        raw_lexile = L_min + (L_max - L_min) / (1 + math.exp(-k * (theta - theta_mid)))
        raw_lexile = int(max(100, min(1700, raw_lexile)))

        # MetaMetrics published grade-band ranges (mid-year typical)
        GRADE_LEXILE_RANGES = {
            1: (190, 530), 2: (420, 650), 3: (520, 820),
            4: (740, 940), 5: (830, 1010), 6: (925, 1070),
            7: (970, 1120), 8: (1010, 1185), 9: (1050, 1335),
            10: (1050, 1335), 11: (1080, 1385), 12: (1080, 1385)
        }

        # Grade context lookup
        GRADE_LABELS = {
            1: '1학년', 2: '2학년', 3: '3학년', 4: '4학년',
            5: '5학년', 6: '6학년', 7: '중1', 8: '중2',
            9: '중3', 10: '고1', 11: '고2', 12: '고3'
        }

        # Find approximate grade band for the raw score
        grade_context = None
        for g in range(1, 13):
            low, high = GRADE_LEXILE_RANGES[g]
            if low <= raw_lexile <= high:
                grade_context = GRADE_LABELS[g]
                break
        if not grade_context:
            if raw_lexile < 190:
                grade_context = '1학년 이전'
            else:
                grade_context = '고3 이상'

        # Clip to grade band if grade provided
        final_lexile = raw_lexile
        if grade and grade in GRADE_LEXILE_RANGES:
            low, high = GRADE_LEXILE_RANGES[grade]
            final_lexile = max(low, min(high, raw_lexile))

        return {
            'score': final_lexile,
            'confidence_low': max(100, final_lexile - 200),
            'confidence_high': min(1700, final_lexile + 200),
            'grade_context': grade_context,
            'is_estimated': True
        }

    def _estimate_ar(self, theta: float) -> float:
        """
        Estimate AR (Accelerated Reader) level from θ.

        Based on AR-Lexile-Grade correspondences:
        - θ = -2.5 → AR 1.0 (Grade 1)
        - θ = -1.5 → AR 2.5 (Grade 2-3)
        - θ = -0.5 → AR 4.5 (Grade 4-5)
        - θ = 0.5  → AR 6.5 (Grade 6-7)
        - θ = 1.5  → AR 9.0 (Grade 9-10)
        - θ = 2.5  → AR 12.0 (Grade 12+)

        Uses piecewise linear with smoothing at boundaries.
        """
        # Piecewise linear mapping based on known correspondences
        breakpoints = [
            (-3.0, 0.5),
            (-2.5, 1.0),
            (-1.5, 2.5),
            (-0.5, 4.5),
            (0.5, 6.5),
            (1.5, 9.0),
            (2.5, 12.0),
            (3.0, 13.0),
        ]

        # Clamp theta
        theta = max(-3.0, min(3.0, theta))

        # Find segment and interpolate
        for i in range(len(breakpoints) - 1):
            t1, ar1 = breakpoints[i]
            t2, ar2 = breakpoints[i + 1]
            if theta <= t2:
                ratio = (theta - t1) / (t2 - t1)
                ar = ar1 + ratio * (ar2 - ar1)
                return round(max(0.5, min(13.0, ar)), 1)

        return 13.0

    def _should_stop(self, se: float, n_items: int, stage: int) -> bool:
        """
        Hybrid adaptive stopping rule.

        - Minimum 20 items (content coverage across domains)
        - Hard cap at 45 items
        - Early stop when SE ≤ 0.30 AND in Stage 3 (routing stages must complete)
        - Expected savings: ~5-8 items on average (20% time reduction)
        """
        if n_items < 20:
            return False
        if n_items >= 45:
            return True
        if stage >= 3 and se <= 0.30:
            return True
        return False

    def _calculate_domain_scores(self, responses: List[Dict]) -> Dict:
        """
        Calculate per-domain (grammar, vocabulary, reading) accuracy scores.

        Returns:
            Dictionary with domain scores as percentages and item counts.
        """
        domain_stats = {}
        for r in responses:
            domain = r.get('domain', 'unknown')
            if domain not in domain_stats:
                domain_stats[domain] = {'correct': 0, 'total': 0}
            domain_stats[domain]['total'] += 1
            if r['is_correct']:
                domain_stats[domain]['correct'] += 1

        result = {}
        for domain in ['grammar', 'vocabulary', 'reading']:
            stats = domain_stats.get(domain, {'correct': 0, 'total': 0})
            total = stats['total']
            correct = stats['correct']
            result[domain] = {
                'correct': correct,
                'total': total,
                'percentage': round((correct / total) * 100, 1) if total > 0 else 0
            }

        return result

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
