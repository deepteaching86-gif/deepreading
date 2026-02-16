"""
MST Simulation Engine
=====================

Monte Carlo simulation for evaluating and optimizing MST routing cutpoints.
Generates synthetic examinees, administers test with given cutpoints,
and computes quality metrics (RMSE, bias, classification accuracy).
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from .irt_engine import IRTEngine


class MSTSimulator:
    """
    Simulate MST test administration with different cutpoint configurations.

    Uses Monte Carlo simulation to evaluate how well a given set of cutpoints
    recovers true ability values across the ability distribution.
    """

    def __init__(self, irt_engine: IRTEngine = None):
        self.irt = irt_engine or IRTEngine()

    def simulate(
        self,
        n_simulees: int,
        item_bank: List[Dict],
        cutpoints: Dict,
        true_thetas: Optional[np.ndarray] = None,
        stage_items: Optional[Dict[int, int]] = None
    ) -> Dict:
        """
        Run Monte Carlo simulation of MST administration.

        Args:
            n_simulees: Number of simulated examinees
            item_bank: List of item dicts with 'a', 'b', 'c', 'stage', 'panel', 'domain'
            cutpoints: Dict with 'stage1_to_2' and 'stage2_to_3_{low,medium,high}' keys
            true_thetas: Optional array of true ability values. If None, sampled from N(0,1).
            stage_items: Optional dict of stage -> item count. Default {1:8, 2:16, 3:16}.

        Returns:
            Dict with rmse, bias, mean_se, classification_accuracy, theta_correlation,
            panel_distribution, n_simulees
        """
        if stage_items is None:
            stage_items = {1: 8, 2: 16, 3: 16}

        if true_thetas is None:
            true_thetas = np.random.normal(0, 1, n_simulees)

        # Parse cutpoints
        s1_cuts = cutpoints.get('stage1_to_2', {"low": -0.5, "high": 0.5})
        s2_cuts = {
            'low': cutpoints.get('stage2_to_3_low', {"L1": -1.0, "L2": -0.5}),
            'medium': cutpoints.get('stage2_to_3_medium', {"M1": -0.25, "M2": 0.25}),
            'high': cutpoints.get('stage2_to_3_high', {"H1": 0.5, "H2": 1.0}),
        }

        # Organize item bank by stage and panel
        items_by_stage_panel = self._organize_items(item_bank)

        estimated_thetas = []
        standard_errors = []
        panel_counts = {}

        for true_theta in true_thetas:
            est_theta, se, panels = self._simulate_one_examinee(
                true_theta, items_by_stage_panel, s1_cuts, s2_cuts, stage_items
            )
            estimated_thetas.append(est_theta)
            standard_errors.append(se)
            panel_key = f"{panels[1]}_{panels[2]}"
            panel_counts[panel_key] = panel_counts.get(panel_key, 0) + 1

        estimated_thetas = np.array(estimated_thetas)
        standard_errors = np.array(standard_errors)

        # Compute metrics
        errors = estimated_thetas - true_thetas
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        bias = float(np.mean(errors))
        mean_se = float(np.mean(standard_errors))
        theta_corr = float(np.corrcoef(true_thetas, estimated_thetas)[0, 1])

        # Classification accuracy (correct proficiency level assignment)
        true_levels = np.array([self.irt.ability_to_proficiency_level(t) for t in true_thetas])
        est_levels = np.array([self.irt.ability_to_proficiency_level(t) for t in estimated_thetas])
        classification_accuracy = float(np.mean(true_levels == est_levels))

        return {
            'n_simulees': n_simulees,
            'rmse': round(rmse, 4),
            'bias': round(bias, 4),
            'mean_se': round(mean_se, 4),
            'theta_correlation': round(theta_corr, 4),
            'classification_accuracy': round(classification_accuracy, 4),
            'panel_distribution': panel_counts,
            'cutpoints_used': cutpoints,
        }

    def _organize_items(self, item_bank: List[Dict]) -> Dict:
        """Organize items by (stage, panel) for quick lookup."""
        organized = {}
        for item in item_bank:
            key = (item.get('stage', 1), item.get('panel', 'routing'))
            if key not in organized:
                organized[key] = []
            organized[key].append(item)
        return organized

    def _simulate_one_examinee(
        self,
        true_theta: float,
        items_by_stage_panel: Dict,
        s1_cuts: Dict,
        s2_cuts: Dict,
        stage_items: Dict
    ) -> Tuple[float, float, Dict]:
        """
        Simulate a single examinee through the MST.

        Returns:
            Tuple of (estimated_theta, standard_error, {stage: panel_name})
        """
        responses = []
        items_used = []
        panels = {}

        # Stage 1: Routing
        s1_items = items_by_stage_panel.get((1, 'routing'), [])
        if not s1_items:
            s1_items = self._generate_synthetic_items(stage_items[1], 0.0, 0.5)

        selected_s1 = self._sample_items(s1_items, stage_items[1])
        for item in selected_s1:
            resp = self._generate_response(true_theta, item)
            responses.append(resp)
            items_used.append(item)

        theta_s1, _ = self.irt.eap_estimate(responses, items_used)

        # Route to Stage 2
        s2_panel = self.irt.route_to_stage2_panel(theta_s1, cutpoints=s1_cuts)
        panels[1] = s2_panel

        # Stage 2
        s2_items = items_by_stage_panel.get((2, s2_panel), [])
        if not s2_items:
            target_b = {"low": -1.0, "medium": 0.0, "high": 1.0}.get(s2_panel, 0.0)
            s2_items = self._generate_synthetic_items(stage_items[2], target_b, 0.5)

        selected_s2 = self._sample_items(s2_items, stage_items[2])
        for item in selected_s2:
            resp = self._generate_response(true_theta, item)
            responses.append(resp)
            items_used.append(item)

        theta_s2, _ = self.irt.eap_estimate(responses, items_used)

        # Route to Stage 3
        s3_panel = self.irt.route_to_stage3_panel(
            theta_s2, s2_panel, cutpoints=s2_cuts.get(s2_panel)
        )
        panels[2] = s3_panel

        # Stage 3
        s3_items = items_by_stage_panel.get((3, s3_panel), [])
        if not s3_items:
            panel_targets = {
                'L1': -2.0, 'L2': -1.0, 'L3': -0.5,
                'M1': -0.5, 'M2': 0.0, 'M3': 0.5,
                'H1': 0.5, 'H2': 1.0, 'H3': 2.0,
            }
            target_b = panel_targets.get(s3_panel, 0.0)
            s3_items = self._generate_synthetic_items(stage_items[3], target_b, 0.5)

        selected_s3 = self._sample_items(s3_items, stage_items[3])
        for item in selected_s3:
            resp = self._generate_response(true_theta, item)
            responses.append(resp)
            items_used.append(item)

        # Final estimate
        final_theta, final_se = self.irt.eap_estimate(responses, items_used)
        return final_theta, final_se, panels

    def _generate_response(self, true_theta: float, item: Dict) -> bool:
        """Generate a simulated response using 3PL model."""
        prob = self.irt.three_pl_probability(
            true_theta, item['a'], item['b'], item.get('c', 0.25)
        )
        return bool(np.random.random() < prob)

    def _sample_items(self, items: List[Dict], n: int) -> List[Dict]:
        """Sample n items (with replacement if needed)."""
        if len(items) >= n:
            indices = np.random.choice(len(items), n, replace=False)
        else:
            indices = np.random.choice(len(items), n, replace=True)
        return [items[i] for i in indices]

    def _generate_synthetic_items(
        self, count: int, target_b: float, b_spread: float
    ) -> List[Dict]:
        """Generate synthetic items when real items are unavailable."""
        items = []
        for _ in range(count):
            items.append({
                'a': float(np.random.uniform(0.8, 2.0)),
                'b': float(np.random.normal(target_b, b_spread)),
                'c': 0.25,
            })
        return items

    def grid_search_cutpoints(
        self,
        item_bank: List[Dict],
        n_simulees: int = 500,
        s1_low_range: Tuple[float, float] = (-1.0, 0.0),
        s1_high_range: Tuple[float, float] = (0.0, 1.0),
        grid_step: float = 0.25
    ) -> List[Dict]:
        """
        Search for optimal Stage 1→2 cutpoints by minimizing RMSE.

        Only optimizes Stage 1→2 routing (the most impactful transition).
        Stage 2→3 cutpoints are held at defaults.

        Args:
            item_bank: Full item bank
            n_simulees: Number of simulees per configuration
            s1_low_range: (min, max) range for low cutpoint
            s1_high_range: (min, max) range for high cutpoint
            grid_step: Step size for grid search

        Returns:
            List of results sorted by RMSE (ascending)
        """
        # Generate shared true thetas for fair comparison
        true_thetas = np.random.normal(0, 1, n_simulees)

        low_values = np.arange(s1_low_range[0], s1_low_range[1] + grid_step, grid_step)
        high_values = np.arange(s1_high_range[0], s1_high_range[1] + grid_step, grid_step)

        results = []
        for low_cut in low_values:
            for high_cut in high_values:
                if high_cut <= low_cut:
                    continue

                cutpoints = {
                    'stage1_to_2': {"low": round(float(low_cut), 2), "high": round(float(high_cut), 2)},
                    'stage2_to_3_low': {"L1": -1.0, "L2": -0.5},
                    'stage2_to_3_medium': {"M1": -0.25, "M2": 0.25},
                    'stage2_to_3_high': {"H1": 0.5, "H2": 1.0},
                }

                result = self.simulate(
                    n_simulees=n_simulees,
                    item_bank=item_bank,
                    cutpoints=cutpoints,
                    true_thetas=true_thetas
                )
                result['config_label'] = f"low={low_cut:.2f}, high={high_cut:.2f}"
                results.append(result)

        results.sort(key=lambda r: r['rmse'])
        return results
