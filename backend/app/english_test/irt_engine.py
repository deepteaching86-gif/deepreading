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

    def select_next_item(
        self,
        theta_current: float,
        candidate_items: List[Dict],
        exposure_control: bool = True,
        max_exposure_rate: float = 0.25
    ) -> Optional[Dict]:
        """
        Select next item using Maximum Fisher Information criterion.

        Implements "randomesque" exposure control (Kingsbury & Zara, 1989):
        - Select top 5 items by information
        - Randomly choose from top 5 weighted by (1 / exposure_count)

        Args:
            theta_current: Current ability estimate
            candidate_items: List of candidate items with parameters and metadata
            exposure_control: Enable exposure control
            max_exposure_rate: Maximum exposure rate threshold

        Returns:
            Selected item or None if no candidates available
        """
        if not candidate_items:
            return None

        # Calculate information for all items
        item_info = []
        for item in candidate_items:
            info = self.fisher_information(theta_current, [item])
            item_info.append((item, info))

        # Sort by information (descending)
        item_info.sort(key=lambda x: x[1], reverse=True)

        if not exposure_control:
            # Return item with maximum information
            return item_info[0][0]

        # Randomesque selection from top 5
        top_k = min(5, len(item_info))
        top_items = item_info[:top_k]

        # Calculate selection weights (inverse of exposure count)
        weights = []
        for item, _ in top_items:
            exposure_count = item.get('exposure_count', 0)
            # Add 1 to avoid division by zero
            weight = 1.0 / (exposure_count + 1)
            weights.append(weight)

        # Normalize weights
        weights = np.array(weights)
        weights /= weights.sum()

        # Random selection
        selected_idx = np.random.choice(top_k, p=weights)
        selected_item = top_items[selected_idx][0]

        return selected_item

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

    def route_to_stage2_panel(self, theta_stage1: float) -> str:
        """
        Route student to Stage 2 panel based on Stage 1 θ estimate.

        Routing logic (PRD Section 3.2):
        - θ < -0.5 → Low panel
        - -0.5 ≤ θ < 0.5 → Medium panel
        - θ ≥ 0.5 → High panel

        Args:
            theta_stage1: Theta estimate from Stage 1

        Returns:
            Panel name: 'low', 'medium', or 'high'
        """
        if theta_stage1 < -0.5:
            return 'low'
        elif theta_stage1 < 0.5:
            return 'medium'
        else:
            return 'high'

    def route_to_stage3_panel(
        self,
        theta_stage2: float,
        stage2_panel: str
    ) -> str:
        """
        Route student to Stage 3 subtrack based on Stage 2 results.

        Routing logic:
        - Low panel: θ < -1.0 → L1, -1.0 ≤ θ < -0.5 → L2, θ ≥ -0.5 → L3
        - Medium panel: θ < -0.25 → M1, -0.25 ≤ θ < 0.25 → M2, θ ≥ 0.25 → M3
        - High panel: θ < 0.5 → H1, 0.5 ≤ θ < 1.0 → H2, θ ≥ 1.0 → H3

        Args:
            theta_stage2: Theta estimate from Stage 2
            stage2_panel: Stage 2 panel ('low', 'medium', 'high')

        Returns:
            Subtrack name: 'L1'-'L3', 'M1'-'M3', or 'H1'-'H3'
        """
        if stage2_panel == 'low':
            if theta_stage2 < -1.0:
                return 'L1'
            elif theta_stage2 < -0.5:
                return 'L2'
            else:
                return 'L3'

        elif stage2_panel == 'medium':
            if theta_stage2 < -0.25:
                return 'M1'
            elif theta_stage2 < 0.25:
                return 'M2'
            else:
                return 'M3'

        else:  # 'high'
            if theta_stage2 < 0.5:
                return 'H1'
            elif theta_stage2 < 1.0:
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
