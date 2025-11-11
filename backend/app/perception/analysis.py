"""
Gaze Analysis Algorithms for Visual Perception Test
====================================================

Implements:
- 10 Concentration Metrics (weighted scoring)
- 15 Gaze Analysis Items (detailed measurements)
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import math


class GazeAnalyzer:
    """Analyzes gaze data to compute concentration and comprehension metrics"""

    def __init__(self, gaze_data: List[Dict], responses: List[Dict], passage_bounds: Dict):
        """
        Initialize analyzer with gaze data

        Args:
            gaze_data: List of gaze points with {x, y, timestamp, confidence, ...}
            responses: List of question responses
            passage_bounds: Text bounding box {x, y, width, height}
        """
        self.gaze_data = gaze_data
        self.responses = responses
        self.passage_bounds = passage_bounds

    # ===== Concentration Metrics (10 items, 0-100 each) =====

    def calculate_fixation_stability(self) -> float:
        """
        1. 시선 고정 안정성 (Fixation Stability) - Weight: 12%

        Measures standard deviation of gaze positions during fixations
        Lower SD = higher stability = higher score
        """
        fixations = self._detect_fixations(self.gaze_data)

        if not fixations:
            return 0.0

        stability_scores = []
        for fixation in fixations:
            points = fixation["points"]
            x_coords = [p["gaze_x"] for p in points]
            y_coords = [p["gaze_y"] for p in points]

            x_std = np.std(x_coords)
            y_std = np.std(y_coords)
            avg_std = (x_std + y_std) / 2

            # Lower SD is better (more stable)
            # Normalize: 0-10px std → 100-0 score
            score = max(0, 100 - (avg_std * 10))
            stability_scores.append(score)

        return np.mean(stability_scores)

    def calculate_reading_pattern_regularity(self) -> float:
        """
        2. 읽기 패턴 규칙성 (Reading Pattern Regularity) - Weight: 10%

        Analyzes left-to-right horizontal movement consistency
        """
        saccades = self._detect_saccades(self.gaze_data)

        if not saccades:
            return 0.0

        # Calculate horizontal directionality
        horizontal_saccades = [s for s in saccades if abs(s["dx"]) > abs(s["dy"])]

        if not horizontal_saccades:
            return 0.0

        # Count forward (left-to-right) saccades
        forward_count = sum(1 for s in horizontal_saccades if s["dx"] > 0)
        forward_ratio = forward_count / len(horizontal_saccades)

        # Higher forward ratio = more regular reading pattern
        return forward_ratio * 100

    def calculate_regression_frequency(self) -> float:
        """
        3. 역행 빈도 (Regression Frequency) - Weight: 10%

        Measures backward (right-to-left) eye movements
        Lower regression rate = higher score
        """
        saccades = self._detect_saccades(self.gaze_data)

        if not saccades:
            return 100.0

        # Count regressions (rightward to leftward saccades)
        regressions = [s for s in saccades if s["dx"] < -20]  # -20px threshold
        regression_rate = len(regressions) / len(saccades)

        # Lower regression rate is better
        # Normalize: 0-30% regression → 100-0 score
        score = max(0, 100 - (regression_rate * 333))

        return score

    def calculate_focus_retention_rate(self) -> float:
        """
        4. 화면 집중 유지율 (Focus Retention Rate) - Weight: 10%

        Percentage of gaze points within passage area
        """
        if not self.gaze_data:
            return 0.0

        # Count points inside passage bounds
        inside_count = sum(
            1 for p in self.gaze_data
            if self._is_point_in_bounds(p, self.passage_bounds)
        )

        retention_rate = inside_count / len(self.gaze_data)

        return retention_rate * 100

    def calculate_reading_speed_consistency(self) -> float:
        """
        5. 읽기 속도 일관성 (Reading Speed Consistency) - Weight: 8%

        Measures variation in reading speed across lines
        Lower CV = higher consistency = higher score
        """
        # Calculate speed per line (fixations per second)
        line_speeds = self._calculate_line_speeds(self.gaze_data)

        if not line_speeds or len(line_speeds) < 2:
            return 100.0

        # Calculate coefficient of variation (CV)
        mean_speed = np.mean(line_speeds)
        std_speed = np.std(line_speeds)

        if mean_speed == 0:
            return 0.0

        cv = std_speed / mean_speed

        # Lower CV is better
        # Normalize: 0-0.5 CV → 100-0 score
        score = max(0, 100 - (cv * 200))

        return score

    def calculate_blink_frequency_score(self) -> float:
        """
        6. 눈 깜빡임 빈도 (Blink Frequency) - Weight: 8%

        Optimal: 15-20 blinks/minute
        Too few = eye strain, Too many = fatigue/distraction
        """
        blinks = self._detect_blinks(self.gaze_data)

        # Calculate duration in minutes
        if not self.gaze_data:
            return 0.0

        timestamps = [p["timestamp"] for p in self.gaze_data]
        duration_seconds = (timestamps[-1] - timestamps[0]).total_seconds()
        duration_minutes = duration_seconds / 60

        if duration_minutes == 0:
            return 0.0

        blinks_per_minute = len(blinks) / duration_minutes

        # Score based on optimal range (15-20 bpm)
        if 15 <= blinks_per_minute <= 20:
            score = 100
        elif blinks_per_minute < 15:
            # Too few blinks
            score = max(0, (blinks_per_minute / 15) * 100)
        else:
            # Too many blinks
            score = max(0, 100 - ((blinks_per_minute - 20) * 5))

        return score

    def calculate_fixation_duration_score(self) -> float:
        """
        7. 고정 시간 분포 (Fixation Duration Distribution) - Weight: 8%

        Optimal: 200-400ms per fixation
        """
        fixations = self._detect_fixations(self.gaze_data)

        if not fixations:
            return 0.0

        durations = [f["duration"] for f in fixations]

        # Count fixations in optimal range (200-400ms)
        optimal_count = sum(1 for d in durations if 200 <= d <= 400)
        optimal_ratio = optimal_count / len(durations)

        return optimal_ratio * 100

    def calculate_vertical_drift_score(self) -> float:
        """
        8. 수직 이탈 빈도 (Vertical Drift Frequency) - Weight: 8%

        Measures unintended vertical eye movements (line skipping/jumping)
        """
        saccades = self._detect_saccades(self.gaze_data)

        if not saccades:
            return 100.0

        # Count vertical saccades (more vertical than horizontal)
        vertical_saccades = [s for s in saccades if abs(s["dy"]) > abs(s["dx"])]

        # Exclude intentional line breaks (large downward movements)
        drift_saccades = [
            s for s in vertical_saccades
            if not (s["dy"] > 30)  # Not a line break
        ]

        drift_rate = len(drift_saccades) / len(saccades)

        # Lower drift rate is better
        # Normalize: 0-20% drift → 100-0 score
        score = max(0, 100 - (drift_rate * 500))

        return score

    def calculate_horizontal_regression_score(self) -> float:
        """
        9. 수평 역행 패턴 (Horizontal Regression Pattern) - Weight: 8%

        Analyzes purposeful re-reading vs. random regressions
        """
        regressions = self._detect_regressions(self.gaze_data)

        if not regressions:
            return 100.0

        # Classify regressions as purposeful or random
        purposeful_count = sum(
            1 for r in regressions
            if r["distance"] > 50  # Long regressions = re-reading
        )

        purposeful_ratio = purposeful_count / len(regressions) if regressions else 1.0

        # Higher purposeful ratio = better comprehension strategy
        return purposeful_ratio * 100

    def calculate_sustained_attention_score(self) -> float:
        """
        10. 주의력 지속 시간 (Sustained Attention Duration) - Weight: 18%

        Longest continuous focus period
        Optimal: 120-180 seconds
        """
        attention_periods = self._detect_attention_periods(self.gaze_data)

        if not attention_periods:
            return 0.0

        # Find maximum attention duration
        max_duration = max(p["duration"] for p in attention_periods)

        # Score based on optimal range (120-180 seconds)
        if 120 <= max_duration <= 180:
            score = 100
        elif max_duration < 120:
            score = (max_duration / 120) * 100
        else:
            score = max(0, 100 - ((max_duration - 180) / 3))

        return score

    def calculate_concentration_score(self) -> Tuple[int, Dict[str, float]]:
        """
        Calculate overall concentration score (0-100) using weighted metrics

        Returns:
            (score, metrics_dict)
        """
        metrics = {
            "fixation_stability": self.calculate_fixation_stability(),
            "reading_pattern_regularity": self.calculate_reading_pattern_regularity(),
            "regression_frequency": self.calculate_regression_frequency(),
            "focus_retention_rate": self.calculate_focus_retention_rate(),
            "reading_speed_consistency": self.calculate_reading_speed_consistency(),
            "blink_frequency_score": self.calculate_blink_frequency_score(),
            "fixation_duration_score": self.calculate_fixation_duration_score(),
            "vertical_drift_score": self.calculate_vertical_drift_score(),
            "horizontal_regression_score": self.calculate_horizontal_regression_score(),
            "sustained_attention_score": self.calculate_sustained_attention_score()
        }

        # Weighted sum (weights add up to 100%)
        weights = {
            "fixation_stability": 0.12,
            "reading_pattern_regularity": 0.10,
            "regression_frequency": 0.10,
            "focus_retention_rate": 0.10,
            "reading_speed_consistency": 0.08,
            "blink_frequency_score": 0.08,
            "fixation_duration_score": 0.08,
            "vertical_drift_score": 0.08,
            "horizontal_regression_score": 0.08,
            "sustained_attention_score": 0.18
        }

        total_score = sum(metrics[key] * weights[key] for key in metrics)

        return int(round(total_score)), metrics

    # ===== Gaze Analysis Items (15 items) =====

    def calculate_gaze_analysis(self) -> Dict:
        """
        Calculate all 15 gaze analysis items

        Returns comprehensive gaze metrics
        """
        fixations = self._detect_fixations(self.gaze_data)
        saccades = self._detect_saccades(self.gaze_data)

        # Calculate reading duration
        if self.gaze_data:
            timestamps = [p["timestamp"] for p in self.gaze_data]
            duration_minutes = (timestamps[-1] - timestamps[0]).total_seconds() / 60
        else:
            duration_minutes = 0

        # Reading Behavior (5 items)
        avg_reading_speed_wpm = self._calculate_wpm(self.gaze_data, duration_minutes)
        total_fixation_count = len(fixations)
        avg_fixation_duration = np.mean([f["duration"] for f in fixations]) if fixations else 0
        saccade_count = len(saccades)
        avg_saccade_length = np.mean([s["distance"] for s in saccades]) if saccades else 0

        # Concentration (5 items)
        inside_count = sum(
            1 for p in self.gaze_data
            if self._is_point_in_bounds(p, self.passage_bounds)
        )
        in_text_gaze_ratio = inside_count / len(self.gaze_data) if self.gaze_data else 0

        regressions = self._detect_regressions(self.gaze_data)
        regression_count = len(regressions)

        line_drifts = [
            s for s in saccades
            if abs(s["dy"]) > abs(s["dx"]) and abs(s["dy"]) < 30
        ]
        line_drift_count = len(line_drifts)

        attention_periods = self._detect_attention_periods(self.gaze_data)
        max_sustained_attention = max(
            [p["duration"] for p in attention_periods]
        ) if attention_periods else 0

        distraction_index = self._calculate_distraction_index(self.gaze_data)

        # Comprehension Correlation (3 items)
        correlations = self._calculate_correlations(
            regression_count, avg_fixation_duration, avg_reading_speed_wpm
        )

        # Question Solving (2 items)
        option_gaze_dist = self._calculate_option_gaze_distribution(self.gaze_data)
        revisit_frequency = self._calculate_revisit_frequency(self.gaze_data)

        return {
            # Reading Behavior
            "avg_reading_speed_wpm": avg_reading_speed_wpm,
            "total_fixation_count": total_fixation_count,
            "avg_fixation_duration": avg_fixation_duration,
            "saccade_count": saccade_count,
            "avg_saccade_length": avg_saccade_length,
            # Concentration
            "in_text_gaze_ratio": in_text_gaze_ratio,
            "regression_count": regression_count,
            "line_drift_count": line_drift_count,
            "max_sustained_attention": max_sustained_attention,
            "distraction_index": distraction_index,
            # Comprehension Correlation
            "regression_accuracy_corr": correlations["regression_accuracy"],
            "fixation_accuracy_corr": correlations["fixation_accuracy"],
            "speed_accuracy_corr": correlations["speed_accuracy"],
            # Question Solving
            "option_gaze_distribution": option_gaze_dist,
            "revisit_frequency": revisit_frequency
        }

    # ===== Helper Methods =====

    def _detect_fixations(self, gaze_data: List[Dict]) -> List[Dict]:
        """Detect fixation events (I-DT algorithm)"""
        fixations = []
        i = 0

        while i < len(gaze_data):
            window = []
            j = i

            # Collect points within dispersion threshold
            while j < len(gaze_data):
                window.append(gaze_data[j])

                if len(window) < 3:
                    j += 1
                    continue

                # Calculate dispersion
                x_coords = [p["gaze_x"] for p in window]
                y_coords = [p["gaze_y"] for p in window]
                dispersion = max(x_coords) - min(x_coords) + max(y_coords) - min(y_coords)

                if dispersion > 30:  # 30px threshold
                    break

                j += 1

            # If window has enough points, it's a fixation
            if len(window) >= 3:
                duration = (window[-1]["timestamp"] - window[0]["timestamp"]).total_seconds() * 1000
                fixations.append({
                    "points": window,
                    "duration": duration,
                    "centroid_x": np.mean([p["gaze_x"] for p in window]),
                    "centroid_y": np.mean([p["gaze_y"] for p in window])
                })
                i = j
            else:
                i += 1

        return fixations

    def _detect_saccades(self, gaze_data: List[Dict]) -> List[Dict]:
        """Detect saccade events (rapid eye movements)"""
        saccades = []
        fixations = self._detect_fixations(gaze_data)

        for i in range(len(fixations) - 1):
            fix1 = fixations[i]
            fix2 = fixations[i + 1]

            dx = fix2["centroid_x"] - fix1["centroid_x"]
            dy = fix2["centroid_y"] - fix1["centroid_y"]
            distance = math.sqrt(dx**2 + dy**2)

            saccades.append({
                "dx": dx,
                "dy": dy,
                "distance": distance
            })

        return saccades

    def _detect_blinks(self, gaze_data: List[Dict]) -> List[Dict]:
        """Detect blink events (confidence drops)"""
        blinks = []

        for i in range(1, len(gaze_data)):
            if gaze_data[i]["confidence"] < 0.3 and gaze_data[i-1]["confidence"] >= 0.3:
                # Blink start
                blink_start = i
                blink_end = i

                # Find blink end
                while blink_end < len(gaze_data) and gaze_data[blink_end]["confidence"] < 0.3:
                    blink_end += 1

                duration = (gaze_data[blink_end-1]["timestamp"] - gaze_data[blink_start]["timestamp"]).total_seconds() * 1000

                if 50 <= duration <= 500:  # Valid blink duration
                    blinks.append({
                        "start": blink_start,
                        "end": blink_end,
                        "duration": duration
                    })

        return blinks

    def _detect_regressions(self, gaze_data: List[Dict]) -> List[Dict]:
        """Detect regression saccades (backward movements)"""
        saccades = self._detect_saccades(gaze_data)
        regressions = []

        for s in saccades:
            if s["dx"] < -20:  # Backward movement
                regressions.append(s)

        return regressions

    def _detect_attention_periods(self, gaze_data: List[Dict]) -> List[Dict]:
        """Detect continuous attention periods"""
        periods = []
        current_period_start = 0
        last_in_bounds = self._is_point_in_bounds(gaze_data[0], self.passage_bounds)

        for i in range(1, len(gaze_data)):
            in_bounds = self._is_point_in_bounds(gaze_data[i], self.passage_bounds)

            if in_bounds and not last_in_bounds:
                # Attention period start
                current_period_start = i

            if not in_bounds and last_in_bounds:
                # Attention period end
                duration = (gaze_data[i-1]["timestamp"] - gaze_data[current_period_start]["timestamp"]).total_seconds()

                if duration > 5:  # Minimum 5 seconds
                    periods.append({
                        "start": current_period_start,
                        "end": i - 1,
                        "duration": duration
                    })

            last_in_bounds = in_bounds

        return periods

    def _calculate_line_speeds(self, gaze_data: List[Dict]) -> List[float]:
        """Calculate reading speed per line"""
        # Simplified: group by Y-coordinate ranges
        # More sophisticated line detection would use NLP + layout analysis
        return [100, 95, 105, 98, 102]  # Placeholder

    def _calculate_wpm(self, gaze_data: List[Dict], duration_minutes: float) -> float:
        """Estimate words per minute from gaze data"""
        # Simplified: assume average fixation duration correlates with reading speed
        fixations = self._detect_fixations(gaze_data)

        if not fixations or duration_minutes == 0:
            return 0

        # Estimate: 1 fixation ≈ 1 word for grade 2 students
        words_read = len(fixations)
        wpm = words_read / duration_minutes

        return wpm

    def _calculate_distraction_index(self, gaze_data: List[Dict]) -> float:
        """Calculate distraction index (0-100, lower is better)"""
        if not gaze_data:
            return 0

        # Count points outside passage area
        outside_count = sum(
            1 for p in gaze_data
            if not self._is_point_in_bounds(p, self.passage_bounds)
        )

        distraction_index = (outside_count / len(gaze_data)) * 100

        return distraction_index

    def _calculate_correlations(
        self, regression_count: int, avg_fixation: float, wpm: float
    ) -> Dict[str, Optional[float]]:
        """Calculate correlation between gaze metrics and comprehension accuracy"""
        # Calculate comprehension accuracy
        if not self.responses:
            return {
                "regression_accuracy": None,
                "fixation_accuracy": None,
                "speed_accuracy": None
            }

        correct_count = sum(1 for r in self.responses if r["is_correct"])
        accuracy = correct_count / len(self.responses)

        # Simplified correlation calculations (would use scipy.stats.pearsonr in production)
        return {
            "regression_accuracy": -0.3,  # Placeholder: more regressions → lower accuracy
            "fixation_accuracy": 0.5,     # Placeholder: longer fixations → higher accuracy
            "speed_accuracy": 0.2         # Placeholder: moderate speed → optimal accuracy
        }

    def _calculate_option_gaze_distribution(self, gaze_data: List[Dict]) -> Dict[str, float]:
        """Calculate gaze distribution across answer options"""
        # Placeholder - requires option bounding boxes
        return {
            "A": 0.25,
            "B": 0.30,
            "C": 0.20,
            "D": 0.25
        }

    def _calculate_revisit_frequency(self, gaze_data: List[Dict]) -> float:
        """Calculate how often student revisits answer options"""
        # Placeholder - requires detailed tracking
        return 2.5  # Average 2.5 revisits per question

    def _is_point_in_bounds(self, point: Dict, bounds: Dict) -> bool:
        """Check if gaze point is within bounding box"""
        x, y = point["gaze_x"], point["gaze_y"]
        return (
            bounds["x"] <= x <= bounds["x"] + bounds["width"] and
            bounds["y"] <= y <= bounds["y"] + bounds["height"]
        )
