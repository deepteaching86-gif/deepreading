"""
Validity Study Infrastructure
==============================

DIF analysis, reliability computation, and external correlation
for the English Adaptive Test.

Implements:
- Mantel-Haenszel DIF analysis (ETS A/B/C classification)
- Marginal reliability: rho = 1 - mean(SE^2) / var(theta)
- Test-retest reliability (Pearson r for repeat examinees)
- External criterion correlation
"""

import numpy as np
from scipy import stats as scipy_stats
from typing import Dict, List, Optional, Tuple
from .database import EnglishTestDB


class ValidityAnalysis:
    """Validity study infrastructure for English CAT."""

    def __init__(self, db: EnglishTestDB):
        self.db = db

    def marginal_reliability(self) -> Dict:
        """
        Compute marginal reliability: rho = 1 - mean(SE^2) / var(theta).

        Uses completed sessions with status='completed'.
        Target: rho >= 0.85

        Returns:
            Dict with marginal_reliability, mean_se, theta_variance,
            n_sessions, sem_at_cutpoints
        """
        conn = self.db._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                SELECT final_theta, standard_error
                FROM english_test_sessions
                WHERE status = 'completed'
                  AND final_theta IS NOT NULL
                  AND standard_error IS NOT NULL;
            """)

            rows = cursor.fetchall()
            if len(rows) < 2:
                return {
                    'marginal_reliability': None,
                    'mean_se': None,
                    'theta_variance': None,
                    'n_sessions': len(rows),
                    'message': 'Insufficient data (need >= 2 completed sessions)'
                }

            thetas = np.array([r[0] for r in rows], dtype=float)
            ses = np.array([r[1] for r in rows], dtype=float)

            theta_var = float(np.var(thetas, ddof=1))
            mean_se_sq = float(np.mean(ses ** 2))
            mean_se = float(np.mean(ses))

            if theta_var == 0:
                rho = 0.0
            else:
                rho = 1.0 - mean_se_sq / theta_var

            # SEM at key theta cutpoints
            cutpoints = [-2.0, -1.0, 0.0, 1.0, 2.0]
            sem_at_cutpoints = {}
            for cp in cutpoints:
                nearby = ses[np.abs(thetas - cp) < 0.5]
                if len(nearby) > 0:
                    sem_at_cutpoints[str(cp)] = round(float(np.mean(nearby)), 4)

            # Store result in reliability_results table
            try:
                cursor.execute("""
                    INSERT INTO reliability_results (
                        n_sessions, marginal_reliability, mean_se,
                        theta_variance, sem_at_cutpoints, analysis_date
                    ) VALUES (%s, %s, %s, %s, %s, NOW());
                """, (
                    len(rows), round(rho, 4), round(mean_se, 4),
                    round(theta_var, 4),
                    str(sem_at_cutpoints)  # JSON-like storage
                ))
                conn.commit()
            except Exception:
                conn.rollback()

            return {
                'marginal_reliability': round(rho, 4),
                'mean_se': round(mean_se, 4),
                'theta_variance': round(theta_var, 4),
                'n_sessions': len(rows),
                'target_met': rho >= 0.85,
                'sem_at_cutpoints': sem_at_cutpoints,
            }

        finally:
            cursor.close()
            self.db._return_connection(conn)

    def test_retest_reliability(self, max_days_between: int = 30) -> Dict:
        """
        Test-retest reliability for users with multiple sessions.

        Pearson correlation between first and second theta estimates.
        Target: r >= 0.85

        Args:
            max_days_between: Maximum days between test and retest

        Returns:
            Dict with pearson_r, p_value, n_pairs, ci_low, ci_high
        """
        conn = self.db._get_connection()
        cursor = conn.cursor()

        try:
            # Find users with 2+ completed sessions within time window
            cursor.execute("""
                WITH ranked AS (
                    SELECT user_id, final_theta, completed_at,
                           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY completed_at) as rn
                    FROM english_test_sessions
                    WHERE status = 'completed'
                      AND final_theta IS NOT NULL
                      AND completed_at IS NOT NULL
                )
                SELECT a.user_id, a.final_theta as theta1, b.final_theta as theta2,
                       EXTRACT(DAY FROM b.completed_at - a.completed_at) as days_between
                FROM ranked a
                JOIN ranked b ON a.user_id = b.user_id AND a.rn = 1 AND b.rn = 2
                WHERE EXTRACT(DAY FROM b.completed_at - a.completed_at) <= %s;
            """, (max_days_between,))

            pairs = cursor.fetchall()
            n_pairs = len(pairs)

            if n_pairs < 3:
                return {
                    'pearson_r': None,
                    'p_value': None,
                    'n_pairs': n_pairs,
                    'message': f'Insufficient pairs (need >= 3, found {n_pairs})'
                }

            theta1 = np.array([p[1] for p in pairs], dtype=float)
            theta2 = np.array([p[2] for p in pairs], dtype=float)

            r, p_value = scipy_stats.pearsonr(theta1, theta2)

            # Fisher z-transform for 95% CI
            z = np.arctanh(r)
            se_z = 1.0 / np.sqrt(n_pairs - 3)
            z_low = z - 1.96 * se_z
            z_high = z + 1.96 * se_z
            ci_low = float(np.tanh(z_low))
            ci_high = float(np.tanh(z_high))

            return {
                'pearson_r': round(float(r), 4),
                'p_value': round(float(p_value), 6),
                'n_pairs': n_pairs,
                'ci_95_low': round(ci_low, 4),
                'ci_95_high': round(ci_high, 4),
                'target_met': float(r) >= 0.85,
                'max_days_between': max_days_between,
            }

        finally:
            cursor.close()
            self.db._return_connection(conn)

    def mantel_haenszel_dif(
        self,
        item_id: int,
        grouping_var: str,
        reference_group: str,
        focal_group: str
    ) -> Dict:
        """
        Mantel-Haenszel DIF analysis for a single item.

        Groups by theta deciles, computes MH chi-square and delta-DIF.
        ETS classification: |delta| < 1.0 = A (negligible),
                           1.0-1.5 = B (moderate), > 1.5 = C (large)

        Args:
            item_id: Item to analyze
            grouping_var: 'gender' or 'grade_band' (column in sessions table)
            reference_group: Reference group value (e.g., 'male')
            focal_group: Focal group value (e.g., 'female')

        Returns:
            Dict with mh_chi_square, mh_d_dif, dif_classification, counts
        """
        conn = self.db._get_connection()
        cursor = conn.cursor()

        try:
            # Get responses for this item joined with session demographics
            if grouping_var == 'gender':
                cursor.execute("""
                    SELECT r.is_correct, s.gender, s.final_theta
                    FROM english_test_responses r
                    JOIN english_test_sessions s ON r.session_id = s.id
                    WHERE r.item_id = %s
                      AND s.status = 'completed'
                      AND s.gender IS NOT NULL
                      AND s.final_theta IS NOT NULL;
                """, (item_id,))
            elif grouping_var == 'grade_band':
                cursor.execute("""
                    SELECT r.is_correct,
                           CASE WHEN s.grade_level <= 6 THEN 'elementary'
                                WHEN s.grade_level <= 9 THEN 'middle'
                                ELSE 'high' END as grade_band,
                           s.final_theta
                    FROM english_test_responses r
                    JOIN english_test_sessions s ON r.session_id = s.id
                    WHERE r.item_id = %s
                      AND s.status = 'completed'
                      AND s.grade_level IS NOT NULL
                      AND s.final_theta IS NOT NULL;
                """, (item_id,))
            else:
                return {'error': f'Unknown grouping variable: {grouping_var}'}

            rows = cursor.fetchall()
            if len(rows) < 10:
                return {
                    'item_id': item_id,
                    'message': f'Insufficient data ({len(rows)} responses)',
                    'n_total': len(rows),
                }

            # Separate into reference and focal groups
            ref_data = [(r[0], r[2]) for r in rows if r[1] == reference_group]
            foc_data = [(r[0], r[2]) for r in rows if r[1] == focal_group]

            n_ref = len(ref_data)
            n_foc = len(foc_data)

            if n_ref < 5 or n_foc < 5:
                return {
                    'item_id': item_id,
                    'message': f'Insufficient group sizes (ref={n_ref}, foc={n_foc})',
                    'n_reference': n_ref,
                    'n_focal': n_foc,
                }

            # Create theta deciles for matching
            all_thetas = np.array([r[2] for r in rows])
            decile_bins = np.percentile(all_thetas, np.arange(0, 110, 10))

            # Compute MH statistics across strata (deciles)
            alpha_num = 0.0
            alpha_den = 0.0
            mh_numerator = 0.0

            for k in range(len(decile_bins) - 1):
                low, high = decile_bins[k], decile_bins[k + 1]

                # Get responses in this stratum
                ref_correct = sum(1 for c, t in ref_data if low <= t < high and c)
                ref_total = sum(1 for _, t in ref_data if low <= t < high)
                foc_correct = sum(1 for c, t in foc_data if low <= t < high and c)
                foc_total = sum(1 for _, t in foc_data if low <= t < high)

                n_k = ref_total + foc_total
                if n_k == 0:
                    continue

                # MH alpha components
                ref_incorrect = ref_total - ref_correct
                foc_incorrect = foc_total - foc_correct

                alpha_num += (ref_correct * foc_incorrect) / max(n_k, 1)
                alpha_den += (ref_incorrect * foc_correct) / max(n_k, 1)

                # MH chi-square components
                expected_ref_correct = ref_total * (ref_correct + foc_correct) / max(n_k, 1)
                mh_numerator += ref_correct - expected_ref_correct

            # MH alpha (odds ratio)
            if alpha_den == 0:
                mh_alpha = 1.0
            else:
                mh_alpha = alpha_num / alpha_den

            # Delta DIF (log-odds scale, times -2.35)
            if mh_alpha <= 0:
                mh_d_dif = 0.0
            else:
                mh_d_dif = -2.35 * np.log(mh_alpha)

            # MH chi-square (simplified)
            mh_chi_sq = (abs(mh_numerator) - 0.5) ** 2  # Continuity corrected

            # ETS DIF classification
            abs_d = abs(mh_d_dif)
            if abs_d < 1.0:
                classification = 'A'  # Negligible
            elif abs_d < 1.5:
                classification = 'B'  # Moderate
            else:
                classification = 'C'  # Large

            # Store result
            try:
                cursor.execute("""
                    INSERT INTO dif_results (
                        item_id, grouping_variable, reference_group, focal_group,
                        mh_chi_square, mh_d_dif, dif_classification,
                        n_reference, n_focal, analysis_date
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW());
                """, (
                    item_id, grouping_var, reference_group, focal_group,
                    round(float(mh_chi_sq), 4), round(float(mh_d_dif), 4),
                    classification, n_ref, n_foc
                ))
                conn.commit()
            except Exception:
                conn.rollback()

            return {
                'item_id': item_id,
                'grouping_variable': grouping_var,
                'reference_group': reference_group,
                'focal_group': focal_group,
                'mh_chi_square': round(float(mh_chi_sq), 4),
                'mh_d_dif': round(float(mh_d_dif), 4),
                'dif_classification': classification,
                'n_reference': n_ref,
                'n_focal': n_foc,
            }

        finally:
            cursor.close()
            self.db._return_connection(conn)

    def external_criterion_correlation(
        self,
        external_scores: Dict[str, float]
    ) -> Dict:
        """
        Correlate CAT theta with external assessment scores.

        Args:
            external_scores: {user_id: external_score} mapping

        Returns:
            Dict with pearson_r, p_value, n_matched, ci_95_low, ci_95_high
        """
        conn = self.db._get_connection()
        cursor = conn.cursor()

        try:
            user_ids = list(external_scores.keys())
            if len(user_ids) < 3:
                return {
                    'message': 'Need at least 3 matched scores',
                    'n_provided': len(user_ids)
                }

            # Get most recent theta for each user
            placeholders = ','.join(['%s'] * len(user_ids))
            cursor.execute(f"""
                SELECT DISTINCT ON (user_id) user_id, final_theta
                FROM english_test_sessions
                WHERE user_id IN ({placeholders})
                  AND status = 'completed'
                  AND final_theta IS NOT NULL
                ORDER BY user_id, completed_at DESC;
            """, user_ids)

            rows = cursor.fetchall()
            if len(rows) < 3:
                return {
                    'message': f'Only {len(rows)} matched users found in CAT data',
                    'n_provided': len(user_ids),
                    'n_matched': len(rows)
                }

            # Match theta with external scores
            cat_thetas = []
            ext_scores = []
            for user_id, theta in rows:
                if user_id in external_scores:
                    cat_thetas.append(float(theta))
                    ext_scores.append(float(external_scores[user_id]))

            n_matched = len(cat_thetas)
            if n_matched < 3:
                return {
                    'message': 'Insufficient matched pairs',
                    'n_matched': n_matched
                }

            cat_thetas = np.array(cat_thetas)
            ext_scores = np.array(ext_scores)

            r, p_value = scipy_stats.pearsonr(cat_thetas, ext_scores)

            # Fisher z-transform for 95% CI
            z = np.arctanh(r)
            se_z = 1.0 / np.sqrt(n_matched - 3)
            z_low = z - 1.96 * se_z
            z_high = z + 1.96 * se_z
            ci_low = float(np.tanh(z_low))
            ci_high = float(np.tanh(z_high))

            return {
                'pearson_r': round(float(r), 4),
                'p_value': round(float(p_value), 6),
                'n_matched': n_matched,
                'ci_95_low': round(ci_low, 4),
                'ci_95_high': round(ci_high, 4),
            }

        finally:
            cursor.close()
            self.db._return_connection(conn)
