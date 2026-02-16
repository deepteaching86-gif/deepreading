"""
IRT 3PL EAP Estimation Engine for English Adaptive Testing
==========================================================

Implements Item Response Theory 3-Parameter Logistic Model with
Expected A Posteriori (EAP) estimation for adaptive testing.

Mathematical Foundation:
- 3PL Model: P(θ) = c + (1-c) / (1 + exp(-a(θ-b)))
- EAP: θ_EAP = ∫ θ × L(θ|responses) × π(θ) dθ / ∫ L(θ|responses) × π(θ) dθ

Based on PRD Section 3.3: IRT 3PL EAP Estimation Algorithm
"""

import numpy as np
from scipy.integrate import quad
from scipy.stats import norm
from typing import List, Dict, Tuple, Optional


class IRTEngine:
    """
    IRT 3-Parameter Logistic Model with EAP estimation.

    Attributes:
        prior_mean (float): Prior distribution mean for θ (default: 0.0)
        prior_sd (float): Prior distribution standard deviation (default: 1.0)
        quadrature_points (int): Number of quadrature points for integration
        theta_min (float): Minimum θ value for integration range
        theta_max (float): Maximum θ value for integration range
    """

    def __init__(
        self,
        prior_mean: float = 0.0,
        prior_sd: float = 1.0,
        quadrature_points: int = 41,
        theta_min: float = -4.0,
        theta_max: float = 4.0
    ):
        self.prior_mean = prior_mean
        self.prior_sd = prior_sd
        self.quadrature_points = quadrature_points
        self.theta_min = theta_min
        self.theta_max = theta_max

        # Precompute quadrature points and weights for efficiency
        self.quad_points, self.quad_weights = self._setup_quadrature()

    def _setup_quadrature(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Setup Gauss-Hermite quadrature points and weights.

        Returns:
            Tuple of (quadrature_points, weights)
        """
        # Create evenly spaced quadrature points
        points = np.linspace(self.theta_min, self.theta_max, self.quadrature_points)

        # Compute weights using trapezoidal rule
        weights = np.ones(self.quadrature_points)
        weights[0] = weights[-1] = 0.5
        weights *= (self.theta_max - self.theta_min) / (self.quadrature_points - 1)

        return points, weights

    def three_pl_probability(
        self,
        theta: float,
        a: float,
        b: float,
        c: float = 0.25
    ) -> float:
        """
        Calculate probability of correct response using 3PL model.

        P(θ) = c + (1-c) / (1 + exp(-a(θ-b)))

        Args:
            theta: Ability parameter
            a: Discrimination parameter (0.5 ~ 2.5)
            b: Difficulty parameter (-3 ~ 3)
            c: Guessing parameter (0.0 ~ 0.35, default: 0.25)

        Returns:
            Probability of correct response (0.0 ~ 1.0)
        """
        exponent = -a * (theta - b)
        # Clip exponent to prevent overflow
        exponent = np.clip(exponent, -20, 20)

        return c + (1 - c) / (1 + np.exp(exponent))

    def likelihood(
        self,
        theta: float,
        responses: List[bool],
        items: List[Dict[str, float]]
    ) -> float:
        """
        Calculate likelihood L(θ | responses).

        L(θ) = ∏ P(θ)^response × (1-P(θ))^(1-response)

        Args:
            theta: Ability parameter
            responses: List of boolean responses (True=correct, False=incorrect)
            items: List of item parameters {'a': float, 'b': float, 'c': float}

        Returns:
            Likelihood value
        """
        likelihood_value = 1.0

        for response, item in zip(responses, items):
            prob = self.three_pl_probability(theta, item['a'], item['b'], item['c'])

            # Prevent numerical underflow
            prob = np.clip(prob, 1e-10, 1 - 1e-10)

            if response:
                likelihood_value *= prob
            else:
                likelihood_value *= (1 - prob)

        return likelihood_value

    def eap_estimate(
        self,
        responses: List[bool],
        items: List[Dict[str, float]],
        prior_mean: Optional[float] = None,
        prior_sd: Optional[float] = None
    ) -> Tuple[float, float]:
        """
        Estimate θ using Expected A Posteriori (EAP) method.

        θ_EAP = ∫ θ × L(θ|R) × π(θ) dθ / ∫ L(θ|R) × π(θ) dθ
        SE = sqrt(∫ (θ - θ_EAP)² × L(θ|R) × π(θ) dθ / ∫ L(θ|R) × π(θ) dθ)

        Args:
            responses: List of boolean responses
            items: List of item parameters
            prior_mean: Override default prior mean
            prior_sd: Override default prior standard deviation

        Returns:
            Tuple of (theta_eap, standard_error)
        """
        if prior_mean is None:
            prior_mean = self.prior_mean
        if prior_sd is None:
            prior_sd = self.prior_sd

        # Use precomputed quadrature points
        likelihoods = np.array([
            self.likelihood(theta, responses, items)
            for theta in self.quad_points
        ])

        # Prior probabilities
        priors = norm.pdf(self.quad_points, prior_mean, prior_sd)

        # Posterior = Likelihood × Prior
        posteriors = likelihoods * priors

        # Normalize posterior
        posterior_sum = np.sum(posteriors * self.quad_weights)

        if posterior_sum < 1e-100:
            # Fallback to prior mean if all likelihoods are zero
            return prior_mean, prior_sd

        # EAP estimate: E[θ | responses]
        theta_eap = np.sum(
            self.quad_points * posteriors * self.quad_weights
        ) / posterior_sum

        # Standard error: sqrt(Var[θ | responses])
        variance = np.sum(
            ((self.quad_points - theta_eap) ** 2) * posteriors * self.quad_weights
        ) / posterior_sum

        se = np.sqrt(variance)

        return theta_eap, se

    def fisher_information(
        self,
        theta: float,
        items: List[Dict[str, float]]
    ) -> float:
        """
        Calculate Fisher Information at ability level θ.

        I(θ) = ∑ [(P'(θ))² / (P(θ)(1-P(θ)))]

        where P'(θ) = a(1-c) × P(θ)(1-P(θ)) / (P(θ)-c)

        Args:
            theta: Ability parameter
            items: List of item parameters

        Returns:
            Fisher information value
        """
        total_info = 0.0

        for item in items:
            a, b, c = item['a'], item['b'], item['c']
            p = self.three_pl_probability(theta, a, b, c)

            # Prevent division by zero
            p = np.clip(p, c + 1e-10, 1 - 1e-10)

            # Derivative of P(θ)
            p_prime = a * (1 - c) * np.exp(-a * (theta - b)) / \
                      ((1 + np.exp(-a * (theta - b))) ** 2)

            # Fisher information for this item
            item_info = (p_prime ** 2) / (p * (1 - p))
            total_info += item_info

        return total_info

    # Default domain target proportions for content balancing
    DOMAIN_TARGETS = {
        'grammar': 0.33,
        'vocabulary': 0.40,
        'reading': 0.27,
    }

    def select_next_item(
        self,
        theta_current: float,
        candidate_items: List[Dict],
        exposure_control: bool = True,
        max_exposure_rate: float = 0.25,
        domain_counts: Optional[Dict[str, int]] = None,
        content_targets: Optional[Dict[str, float]] = None,
        stage: int = 1
    ) -> Optional[Dict]:
        """
        Select next item using Maximum Fisher Information with content balancing.

        Implements:
        1. Kingsbury-Zara content balancing: prioritize underrepresented domains
        2. a-Stratification: prefer low-a items early, high-a items later
        3. Randomesque exposure control (top 5, weighted by inverse exposure)

        Args:
            theta_current: Current ability estimate
            candidate_items: List of candidate items with parameters and metadata
            exposure_control: Enable exposure control
            max_exposure_rate: Maximum exposure rate threshold
            domain_counts: Dict of domain -> count of items already administered
            content_targets: Dict of domain -> target proportion (default: DOMAIN_TARGETS)
            stage: Current MST stage (1, 2, or 3) for a-stratification

        Returns:
            Selected item or None if no candidates available
        """
        if not candidate_items:
            return None

        targets = content_targets or self.DOMAIN_TARGETS

        # --- a-Stratification weight by stage ---
        # Stage 1: prefer lower discrimination (broad measurement)
        # Stage 2: balanced
        # Stage 3: prefer higher discrimination (precise measurement)
        a_stage_weight = {1: -0.3, 2: 0.0, 3: 0.3}.get(stage, 0.0)

        # Calculate information for all items with a-stratification bonus
        item_info = []
        for item in candidate_items:
            info = self.fisher_information(theta_current, [item])
            a_val = item.get('a', item.get('discrimination', 1.0))
            # a-stratification: adjust info score by discrimination preference
            stratified_info = info * (1.0 + a_stage_weight * (a_val - 1.2))
            item_info.append((item, stratified_info))

        # Sort by stratified information (descending)
        item_info.sort(key=lambda x: x[1], reverse=True)

        if not exposure_control:
            return item_info[0][0]

        # --- Kingsbury-Zara Content Balancing ---
        need_domain = self._get_underrepresented_domain(domain_counts, targets)

        # Randomesque selection from top K with content balancing
        top_k = min(5, len(item_info))
        top_items = item_info[:top_k]

        # If content balancing identifies an underrepresented domain,
        # boost weight for items from that domain
        weights = []
        for item, _ in top_items:
            exposure_count = item.get('exposure_count', 0)
            base_weight = 1.0 / (exposure_count + 1)

            # Content balancing boost: 3x weight for underrepresented domain
            item_domain = item.get('domain', '').lower()
            if need_domain and item_domain == need_domain:
                base_weight *= 3.0

            weights.append(base_weight)

        # Normalize weights
        weights = np.array(weights)
        if weights.sum() == 0:
            weights = np.ones(len(weights))
        weights /= weights.sum()

        # Random selection
        selected_idx = np.random.choice(len(weights), p=weights)
        selected_item = top_items[selected_idx][0]

        return selected_item

    def _get_underrepresented_domain(
        self,
        domain_counts: Optional[Dict[str, int]],
        targets: Dict[str, float]
    ) -> Optional[str]:
        """
        Identify the most underrepresented domain using Kingsbury-Zara method.

        Compares current domain proportions against target proportions.
        Returns the domain with the largest negative deviation (most underrepresented).

        Args:
            domain_counts: Dict of domain -> count administered so far
            targets: Dict of domain -> target proportion

        Returns:
            Domain name to prioritize, or None if balanced
        """
        if not domain_counts:
            return None

        total = sum(domain_counts.values())
        if total == 0:
            return None

        # Calculate deviation from target for each domain
        max_deficit = 0.0
        need_domain = None

        for domain, target_prop in targets.items():
            current_count = domain_counts.get(domain, 0)
            current_prop = current_count / total
            deficit = target_prop - current_prop

            # Only consider domains that are below target
            if deficit > max_deficit:
                max_deficit = deficit
                need_domain = domain

        # Only trigger content balancing if deficit > 5% threshold
        if max_deficit > 0.05:
            return need_domain

        return None

    def ability_to_proficiency_level(
        self,
        theta: float,
        grade: int = None
    ) -> int:
        """
        Convert θ to 10-level proficiency scale.

        Mapping (based on PRD):
        - Level 1-2: θ < -2.0 (Below Basic)
        - Level 3-4: -2.0 ≤ θ < -1.0 (Basic)
        - Level 5-6: -1.0 ≤ θ < 0.0 (Proficient)
        - Level 7-8: 0.0 ≤ θ < 1.0 (Advanced)
        - Level 9-10: θ ≥ 1.0 (Superior)

        Args:
            theta: Ability parameter
            grade: Student grade (unused in base implementation)

        Returns:
            Proficiency level (1-10)
        """
        if theta < -2.5:
            return 1
        elif theta < -2.0:
            return 2
        elif theta < -1.5:
            return 3
        elif theta < -1.0:
            return 4
        elif theta < -0.5:
            return 5
        elif theta < 0.0:
            return 6
        elif theta < 0.5:
            return 7
        elif theta < 1.0:
            return 8
        elif theta < 1.5:
            return 9
        else:
            return 10

    # Default MST routing cutpoints (hardcoded fallback)
    DEFAULT_STAGE1_TO_2 = {"low": -0.5, "high": 0.5}
    DEFAULT_STAGE2_TO_3 = {
        "low": {"L1": -1.0, "L2": -0.5},
        "medium": {"M1": -0.25, "M2": 0.25},
        "high": {"H1": 0.5, "H2": 1.0},
    }

    def route_to_stage2_panel(
        self,
        theta_stage1: float,
        cutpoints: Optional[Dict] = None
    ) -> str:
        """
        Route student to Stage 2 panel based on Stage 1 θ estimate.

        Routing logic (PRD Section 3.2):
        - θ < low_cut → Low panel
        - low_cut ≤ θ < high_cut → Medium panel
        - θ ≥ high_cut → High panel

        Args:
            theta_stage1: Theta estimate from Stage 1
            cutpoints: Optional dict with 'low' and 'high' keys.
                       Defaults to {"low": -0.5, "high": 0.5}.

        Returns:
            Panel name: 'low', 'medium', or 'high'
        """
        if cutpoints is None:
            cutpoints = self.DEFAULT_STAGE1_TO_2
        low_cut = cutpoints.get("low", -0.5)
        high_cut = cutpoints.get("high", 0.5)

        if theta_stage1 < low_cut:
            return 'low'
        elif theta_stage1 < high_cut:
            return 'medium'
        else:
            return 'high'

    def route_to_stage3_panel(
        self,
        theta_stage2: float,
        stage2_panel: str,
        cutpoints: Optional[Dict] = None
    ) -> str:
        """
        Route student to Stage 3 subtrack based on Stage 2 results.

        Uses configurable cutpoints per panel. Each panel has two cutpoints
        that divide examinees into three groups.

        Args:
            theta_stage2: Theta estimate from Stage 2
            stage2_panel: Stage 2 panel ('low', 'medium', 'high')
            cutpoints: Optional dict keyed by panel with sub-cutpoints.
                       Defaults to hardcoded values per panel.

        Returns:
            Subtrack name: 'L1'-'L3', 'M1'-'M3', or 'H1'-'H3'
        """
        if cutpoints is None:
            cutpoints = self.DEFAULT_STAGE2_TO_3.get(stage2_panel, {})

        if stage2_panel == 'low':
            c1 = cutpoints.get("L1", -1.0)
            c2 = cutpoints.get("L2", -0.5)
            if theta_stage2 < c1:
                return 'L1'
            elif theta_stage2 < c2:
                return 'L2'
            else:
                return 'L3'

        elif stage2_panel == 'medium':
            c1 = cutpoints.get("M1", -0.25)
            c2 = cutpoints.get("M2", 0.25)
            if theta_stage2 < c1:
                return 'M1'
            elif theta_stage2 < c2:
                return 'M2'
            else:
                return 'M3'

        else:  # 'high'
            c1 = cutpoints.get("H1", 0.5)
            c2 = cutpoints.get("H2", 1.0)
            if theta_stage2 < c1:
                return 'H1'
            elif theta_stage2 < c2:
                return 'H2'
            else:
                return 'H3'


# Example usage and testing
if __name__ == "__main__":
    # Initialize IRT engine
    irt = IRTEngine()

    # Example items (a, b, c parameters)
    example_items = [
        {'a': 1.2, 'b': -0.5, 'c': 0.25},
        {'a': 1.5, 'b': 0.0, 'c': 0.20},
        {'a': 1.0, 'b': 0.8, 'c': 0.25},
        {'a': 1.8, 'b': -1.2, 'c': 0.22},
        {'a': 1.3, 'b': 1.5, 'c': 0.28},
    ]

    # Example responses (True=correct, False=incorrect)
    example_responses = [True, True, False, True, False]

    # Estimate ability
    theta_est, se = irt.eap_estimate(example_responses, example_items)

    print(f"=== IRT 3PL EAP Estimation Test ===")
    print(f"Responses: {example_responses}")
    print(f"Correct: {sum(example_responses)}/{len(example_responses)}")
    print(f"\nEstimated θ: {theta_est:.3f}")
    print(f"Standard Error: {se:.3f}")
    print(f"Proficiency Level: {irt.ability_to_proficiency_level(theta_est)}/10")

    # MST routing
    print(f"\n=== MST Routing ===")
    stage2_panel = irt.route_to_stage2_panel(theta_est)
    print(f"Stage 1 θ: {theta_est:.3f} → Stage 2 Panel: {stage2_panel.upper()}")

    # Simulate Stage 2
    stage2_responses = [True, True, True, False, True, True, False, True]
    stage2_theta, stage2_se = irt.eap_estimate(
        stage2_responses,
        example_items + [
            {'a': 1.4, 'b': 0.3, 'c': 0.24},
            {'a': 1.6, 'b': 0.6, 'c': 0.26},
            {'a': 1.1, 'b': -0.2, 'c': 0.23}
        ]
    )

    stage3_panel = irt.route_to_stage3_panel(stage2_theta, stage2_panel)
    print(f"Stage 2 θ: {stage2_theta:.3f} → Stage 3 Panel: {stage3_panel}")

    # Item selection example
    print(f"\n=== Next Item Selection ===")
    candidate_items = [
        {'id': 101, 'a': 1.5, 'b': 0.2, 'c': 0.25, 'exposure_count': 5},
        {'id': 102, 'a': 1.8, 'b': 0.3, 'c': 0.22, 'exposure_count': 12},
        {'id': 103, 'a': 1.3, 'b': 0.1, 'c': 0.27, 'exposure_count': 3},
        {'id': 104, 'a': 1.6, 'b': 0.4, 'c': 0.24, 'exposure_count': 8},
    ]

    selected = irt.select_next_item(stage2_theta, candidate_items)
    print(f"Current θ: {stage2_theta:.3f}")
    print(f"Selected Item ID: {selected['id']}")
    print(f"Item parameters: a={selected['a']}, b={selected['b']}, c={selected['c']}")
    print(f"Exposure count: {selected['exposure_count']}")
