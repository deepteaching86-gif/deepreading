"""
IRT Item Calibration Pipeline
==============================

Implements 2PL Marginal Maximum Likelihood (MML) calibration using
the EM algorithm with Bayesian priors for item parameter estimation.

Mathematical Foundation:
- 2PL Model: P(theta) = 1 / (1 + exp(-a(theta - b)))
- MML-EM: E-step computes posterior theta distribution,
          M-step maximizes item parameters
- Bayesian priors: a ~ LogNormal(0, 0.5), b ~ Normal(0, 2)

Quality metrics:
- Point-biserial correlation >= 0.20
- INFIT/OUTFIT MNSQ: 0.70 - 1.30

Reference: Baker & Kim (2004), "Item Response Theory: Parameter
Estimation Techniques"
"""

import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Optional
from datetime import datetime


class CalibrationPipeline:
    """
    IRT 2PL calibration pipeline using MML-EM algorithm.

    Designed to work with the EnglishTestDB response matrix format.
    Supports Bayesian priors for stable estimation with small samples.
    """

    def __init__(
        self,
        n_quadrature: int = 31,
        theta_range: Tuple[float, float] = (-4.0, 4.0),
        max_em_iterations: int = 100,
        em_convergence: float = 0.001,
        prior_a_mean: float = 0.0,
        prior_a_sd: float = 0.5,
        prior_b_mean: float = 0.0,
        prior_b_sd: float = 2.0,
    ):
        self.n_quadrature = n_quadrature
        self.theta_range = theta_range
        self.max_em_iterations = max_em_iterations
        self.em_convergence = em_convergence

        # Bayesian priors for a (log-normal) and b (normal)
        self.prior_a_mean = prior_a_mean
        self.prior_a_sd = prior_a_sd
        self.prior_b_mean = prior_b_mean
        self.prior_b_sd = prior_b_sd

        # Setup quadrature points with standard normal prior for theta
        self.quad_points = np.linspace(theta_range[0], theta_range[1], n_quadrature)
        self.quad_weights = norm.pdf(self.quad_points, 0, 1)
        self.quad_weights /= np.sum(self.quad_weights)

    def calibrate(
        self,
        response_matrix: List[List[Optional[bool]]],
        items: List[Dict],
        guessing: float = 0.25,
    ) -> Dict:
        """
        Run full 2PL MML-EM calibration on response data.

        Args:
            response_matrix: (N_students x N_items) matrix, True/False/None
            items: List of item dicts with 'id' key
            guessing: Fixed guessing parameter (c) for all items

        Returns:
            Dict with calibrated parameters, fit statistics, and flagged items
        """
        # Convert to numpy array with NaN for missing
        N, J = len(response_matrix), len(response_matrix[0])
        data = np.full((N, J), np.nan)
        for i in range(N):
            for j in range(J):
                if response_matrix[i][j] is not None:
                    data[i][j] = 1.0 if response_matrix[i][j] else 0.0

        # Initialize parameters from current values or defaults
        a_params = np.array([
            max(0.3, min(3.0, item.get('discrimination', 1.0) or 1.0))
            for item in items
        ])
        b_params = np.array([
            max(-3.5, min(3.5, item.get('difficulty', 0.0) or 0.0))
            for item in items
        ])
        c_param = guessing

        # Run EM algorithm
        a_params, b_params, converged, n_iterations = self._em_algorithm(
            data, a_params, b_params, c_param
        )

        # Compute fit statistics
        fit_stats = self._compute_fit_statistics(data, a_params, b_params, c_param)

        # Compute point-biserial correlations
        point_biserials = self._compute_point_biserial(data)

        # Determine calibration status and flag problematic items
        results = []
        flagged = []
        for j in range(J):
            n_responses = int(np.sum(~np.isnan(data[:, j])))
            correct_rate = float(np.nanmean(data[:, j]))

            # Determine calibration status based on sample size
            if n_responses >= 200:
                cal_status = 'calibrated'
            elif n_responses >= 30:
                cal_status = 'provisional'
            else:
                cal_status = 'uncalibrated'

            item_result = {
                'item_id': items[j]['id'],
                'discrimination': round(float(a_params[j]), 4),
                'difficulty': round(float(b_params[j]), 4),
                'guessing': guessing,
                'point_biserial': round(float(point_biserials[j]), 4),
                'infit': round(float(fit_stats['infit'][j]), 4),
                'outfit': round(float(fit_stats['outfit'][j]), 4),
                'correct_rate': round(correct_rate, 4),
                'calibration_n': n_responses,
                'calibration_status': cal_status,
            }

            # Flag items with poor fit
            flags = self._evaluate_item_flags(item_result)
            if flags:
                item_result['calibration_status'] = 'flagged'
                item_result['flags'] = flags
                flagged.append(item_result)

            results.append(item_result)

        return {
            'items': results,
            'flagged_items': flagged,
            'n_items': J,
            'n_students': N,
            'converged': converged,
            'n_iterations': n_iterations,
            'calibrated_at': datetime.now().isoformat(),
        }

    def _em_algorithm(
        self,
        data: np.ndarray,
        a_init: np.ndarray,
        b_init: np.ndarray,
        c: float,
    ) -> Tuple[np.ndarray, np.ndarray, bool, int]:
        """
        EM algorithm for 2PL MML estimation.

        E-step: Compute posterior theta distribution for each student
        M-step: Update item parameters using expected sufficient statistics
        """
        N, J = data.shape
        a = a_init.copy()
        b = b_init.copy()
        Q = self.n_quadrature
        theta_q = self.quad_points

        converged = False
        for iteration in range(self.max_em_iterations):
            a_old = a.copy()
            b_old = b.copy()

            # === E-step: Compute posterior weights ===
            # For each student i, compute P(theta_q | responses_i)
            # posterior[i, q] = L(responses_i | theta_q) * prior(theta_q) / marginal
            log_likelihood = np.zeros((N, Q))
            for q in range(Q):
                theta = theta_q[q]
                for j in range(J):
                    p = self._prob_2pl(theta, a[j], b[j], c)
                    p = np.clip(p, 1e-10, 1 - 1e-10)
                    mask = ~np.isnan(data[:, j])
                    log_likelihood[mask, q] += (
                        data[mask, j] * np.log(p)
                        + (1 - data[mask, j]) * np.log(1 - p)
                    )

            # Add log prior
            log_prior = np.log(self.quad_weights + 1e-20)
            log_posterior = log_likelihood + log_prior[np.newaxis, :]

            # Normalize (in log space for stability)
            log_max = np.max(log_posterior, axis=1, keepdims=True)
            posterior = np.exp(log_posterior - log_max)
            posterior_sum = np.sum(posterior, axis=1, keepdims=True)
            posterior_sum = np.maximum(posterior_sum, 1e-20)
            posterior = posterior / posterior_sum  # (N, Q)

            # === M-step: Update item parameters ===
            for j in range(J):
                mask = ~np.isnan(data[:, j])
                if mask.sum() < 10:
                    continue

                r_j = data[mask, j]  # responses for item j
                w_j = posterior[mask, :]  # posterior weights (n_resp, Q)

                # Expected counts
                # n_q = sum of posterior weights at each quadrature point
                n_q = np.sum(w_j, axis=0)  # (Q,)
                # r_q = expected correct at each point
                r_q = np.sum(w_j * r_j[:, np.newaxis], axis=0)  # (Q,)

                # Expected proportion correct at each theta
                p_q = np.where(n_q > 0.01, r_q / n_q, 0.5)
                p_q = np.clip(p_q, 0.01, 0.99)

                # Update b: find theta where P(theta) = 0.5 (adjusted for c)
                target = (0.5 - c) / (1 - c)
                target = np.clip(target, 0.01, 0.99)

                # Optimize a, b via L-BFGS-B with priors baked in
                a_new, b_new = self._update_item_params(
                    theta_q, n_q, r_q, a[j], b[j], c
                )

                a[j] = a_new
                b[j] = b_new

            # Check convergence
            a_change = np.max(np.abs(a - a_old))
            b_change = np.max(np.abs(b - b_old))
            if a_change < self.em_convergence and b_change < self.em_convergence:
                converged = True
                break

        return a, b, converged, iteration + 1

    def _prob_2pl(self, theta: float, a: float, b: float, c: float = 0.0) -> float:
        """2PL (or 3PL with fixed c) probability."""
        exponent = -a * (theta - b)
        exponent = np.clip(exponent, -20, 20)
        return c + (1 - c) / (1 + np.exp(exponent))

    def _update_item_params(
        self,
        theta_q: np.ndarray,
        n_q: np.ndarray,
        r_q: np.ndarray,
        a_current: float,
        b_current: float,
        c: float,
    ) -> Tuple[float, float]:
        """
        Optimize single item's (a, b) parameters via L-BFGS-B.

        Maximizes the expected complete-data log-likelihood from E-step
        sufficient statistics (n_q, r_q) with Bayesian priors.
        """
        def neg_expected_ll(params):
            a_val, b_val = params
            # Model probabilities at each quadrature point
            exponent = np.clip(-a_val * (theta_q - b_val), -20, 20)
            p_star = 1.0 / (1.0 + np.exp(exponent))
            p_q = c + (1.0 - c) * p_star
            p_q = np.clip(p_q, 1e-10, 1 - 1e-10)

            # Expected log-likelihood: Σ_q [ r_q*log(P) + (n_q-r_q)*log(1-P) ]
            ll = np.sum(r_q * np.log(p_q) + (n_q - r_q) * np.log(1 - p_q))

            # Bayesian priors (added to log-likelihood)
            # a ~ LogNormal(prior_a_mean, prior_a_sd)
            if a_val > 0.1:
                ll -= (np.log(a_val) - self.prior_a_mean) ** 2 / (2 * self.prior_a_sd ** 2)
            # b ~ Normal(prior_b_mean, prior_b_sd)
            ll -= (b_val - self.prior_b_mean) ** 2 / (2 * self.prior_b_sd ** 2)

            return -ll

        result = minimize(
            neg_expected_ll,
            x0=[a_current, b_current],
            method='L-BFGS-B',
            bounds=[(0.2, 3.0), (-4.0, 4.0)],
        )

        if result.success or result.fun < neg_expected_ll([a_current, b_current]):
            return float(result.x[0]), float(result.x[1])
        return a_current, b_current

    def _compute_fit_statistics(
        self,
        data: np.ndarray,
        a: np.ndarray,
        b: np.ndarray,
        c: float,
    ) -> Dict[str, np.ndarray]:
        """
        Compute INFIT and OUTFIT mean-square statistics.

        OUTFIT: unweighted mean square (sensitive to outliers)
        INFIT: information-weighted mean square (robust)

        Acceptable range: 0.70 - 1.30 for MCQ items
        """
        N, J = data.shape

        infit = np.ones(J)
        outfit = np.ones(J)

        for j in range(J):
            mask = ~np.isnan(data[:, j])
            n_resp = mask.sum()
            if n_resp < 10:
                continue

            responses = data[mask, j]

            # Estimate theta for each student (simple EAP with current params)
            thetas = self._estimate_student_thetas(data, a, b, c, mask)

            # Compute expected probabilities and variances
            p_vals = np.array([self._prob_2pl(t, a[j], b[j], c) for t in thetas])
            p_vals = np.clip(p_vals, 1e-10, 1 - 1e-10)

            # Variance: var = p * (1 - p)
            var_vals = p_vals * (1 - p_vals)

            # Standardized residuals squared
            residuals_sq = (responses - p_vals) ** 2

            # OUTFIT: mean of z^2
            z_sq = residuals_sq / (var_vals + 1e-10)
            outfit[j] = float(np.mean(z_sq))

            # INFIT: information-weighted
            numerator = np.sum(residuals_sq)
            denominator = np.sum(var_vals)
            if denominator > 0:
                infit[j] = float(numerator / denominator)

        return {'infit': infit, 'outfit': outfit}

    def _estimate_student_thetas(
        self,
        data: np.ndarray,
        a: np.ndarray,
        b: np.ndarray,
        c: float,
        student_mask: np.ndarray,
    ) -> np.ndarray:
        """Quick EAP theta estimates for students with valid responses."""
        indices = np.where(student_mask)[0]
        thetas = np.zeros(len(indices))

        for idx, i in enumerate(indices):
            # Simple EAP with current parameters
            log_posterior = np.zeros(self.n_quadrature)
            for q, theta in enumerate(self.quad_points):
                for j in range(data.shape[1]):
                    if np.isnan(data[i, j]):
                        continue
                    p = self._prob_2pl(theta, a[j], b[j], c)
                    p = np.clip(p, 1e-10, 1 - 1e-10)
                    if data[i, j] == 1:
                        log_posterior[q] += np.log(p)
                    else:
                        log_posterior[q] += np.log(1 - p)
                # Add prior
                log_posterior[q] += norm.logpdf(theta, 0, 1)

            # Normalize
            log_posterior -= np.max(log_posterior)
            posterior = np.exp(log_posterior)
            posterior /= np.sum(posterior) + 1e-20

            thetas[idx] = np.sum(self.quad_points * posterior)

        return thetas

    def _compute_point_biserial(self, data: np.ndarray) -> np.ndarray:
        """
        Compute point-biserial correlation for each item.

        Correlates item scores (0/1) with total test scores.
        Minimum acceptable: 0.20
        """
        N, J = data.shape
        rpb = np.zeros(J)

        # Compute total scores (excluding the target item for each calculation)
        for j in range(J):
            mask = ~np.isnan(data[:, j])
            if mask.sum() < 10:
                continue

            item_scores = data[mask, j]

            # Total score excluding item j
            other_cols = np.delete(data[mask, :], j, axis=1)
            total_scores = np.nansum(other_cols, axis=1)

            # Point-biserial = correlation between item and total
            if np.std(item_scores) < 1e-10 or np.std(total_scores) < 1e-10:
                rpb[j] = 0.0
                continue

            correlation = np.corrcoef(item_scores, total_scores)[0, 1]
            rpb[j] = correlation if not np.isnan(correlation) else 0.0

        return rpb

    def _evaluate_item_flags(self, item_result: Dict) -> List[str]:
        """
        Evaluate item quality and return list of flag reasons.

        Criteria:
        - Point-biserial < 0.20: poor discrimination
        - INFIT or OUTFIT outside 0.70-1.30: poor model fit
        - Discrimination < 0.3 or > 2.5: extreme parameters
        - Correct rate < 0.10 or > 0.95: too easy or too hard
        """
        flags = []

        rpb = item_result.get('point_biserial', 0)
        if rpb < 0.20:
            flags.append(f'low_point_biserial ({rpb:.3f} < 0.20)')

        infit = item_result.get('infit', 1.0)
        if infit < 0.70 or infit > 1.30:
            flags.append(f'infit_misfit ({infit:.3f})')

        outfit = item_result.get('outfit', 1.0)
        if outfit < 0.70 or outfit > 1.30:
            flags.append(f'outfit_misfit ({outfit:.3f})')

        a = item_result.get('discrimination', 1.0)
        if a < 0.3:
            flags.append(f'low_discrimination ({a:.3f} < 0.30)')
        elif a > 2.5:
            flags.append(f'high_discrimination ({a:.3f} > 2.50)')

        cr = item_result.get('correct_rate', 0.5)
        if cr < 0.10:
            flags.append(f'too_difficult (correct_rate={cr:.3f})')
        elif cr > 0.95:
            flags.append(f'too_easy (correct_rate={cr:.3f})')

        return flags


def run_calibration(db, min_responses: int = 30) -> Dict:
    """
    Convenience function to run calibration pipeline using database.

    Args:
        db: EnglishTestDB instance
        min_responses: Minimum responses per item to include

    Returns:
        Calibration results dict
    """
    # Extract response matrix from database
    items, matrix = db.get_response_matrix(min_responses_per_item=min_responses)

    if not items or not matrix:
        return {
            'error': 'Insufficient data for calibration',
            'n_items': len(items) if items else 0,
            'min_responses_required': min_responses,
        }

    # Run calibration
    pipeline = CalibrationPipeline()
    results = pipeline.calibrate(matrix, items)

    # Update database with calibrated parameters
    updated_count = 0
    flagged_count = 0
    for item_result in results['items']:
        try:
            db.update_item_calibration(
                item_id=item_result['item_id'],
                discrimination=item_result['discrimination'],
                difficulty=item_result['difficulty'],
                guessing=item_result['guessing'],
                point_biserial=item_result['point_biserial'],
                calibration_n=item_result['calibration_n'],
                calibration_status=item_result['calibration_status'],
            )
            updated_count += 1
            if item_result['calibration_status'] == 'flagged':
                flagged_count += 1
        except Exception as e:
            print(f"Failed to update item {item_result['item_id']}: {e}")

    results['updated_count'] = updated_count
    results['flagged_count'] = flagged_count

    return results
