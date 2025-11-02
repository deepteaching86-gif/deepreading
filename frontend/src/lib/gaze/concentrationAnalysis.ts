/**
 * Concentration Analysis Utilities
 * =================================
 *
 * Calculate concentration metrics from gaze data:
 * - Pupil dilation tracking
 * - Fixation quality
 * - Reading pattern analysis
 * - Overall concentration score
 */

import type { FixationPoint, ConcentrationMetrics, GazePath } from '../../types/gazeAnalytics';

/**
 * Calculate concentration metrics from gaze path
 */
export function calculateConcentrationMetrics(gazePath: GazePath): ConcentrationMetrics {
  const { fixations } = gazePath;

  // Pupil-based metrics
  const pupilDiameters = fixations.map(f => f.pupilDiameter);
  const avgPupilDiameter = average(pupilDiameters);
  const pupilVariability = standardDeviation(pupilDiameters);

  // Fixation quality
  const durations = fixations.map(f => f.duration);
  const avgFixationDuration = average(durations);
  const fixationStability = 1 - (standardDeviation(durations) / avgFixationDuration);

  // Reading pattern (regressions = backwards movements)
  const regressionCount = countRegressions(fixations);
  const regressionRate = (regressionCount / fixations.length) * 100;

  // Blinks (detected as gaps in fixations)
  const blinkCount = countBlinks(fixations, gazePath.totalDuration);
  const blinkRate = (blinkCount / (gazePath.totalDuration / 60000)); // per minute

  // Calculate overall score
  const concentrationScore = calculateConcentrationScore({
    pupilVariability,
    fixationStability,
    regressionRate,
    blinkRate
  });

  return {
    avgPupilDiameter,
    pupilVariability,
    avgFixationDuration,
    fixationStability,
    regressionCount,
    regressionRate,
    blinkCount,
    blinkRate,
    concentrationScore
  };
}

/**
 * Calculate concentration score (0-100)
 *
 * Formula:
 * - Pupil stability (30%): Low variability = high concentration
 * - Fixation quality (30%): Stable fixations = good focus
 * - Regression penalty (20%): Few regressions = good comprehension
 * - Blink normality (20%): Normal blink rate = not fatigued
 */
function calculateConcentrationScore(metrics: {
  pupilVariability: number;
  fixationStability: number;
  regressionRate: number;
  blinkRate: number;
}): number {
  // Pupil stability (0-1, higher is better)
  const pupilScore = Math.max(0, 1 - (metrics.pupilVariability / 2));

  // Fixation quality (already 0-1, higher is better)
  const fixationScore = Math.max(0, metrics.fixationStability);

  // Regression penalty (0-1, lower is better)
  const regressionScore = Math.max(0, 1 - (metrics.regressionRate / 20));

  // Blink normality (15-30 blinks/min is normal)
  const blinkScore = metrics.blinkRate >= 15 && metrics.blinkRate <= 30 ? 1 : 0.5;

  // Weighted average
  const score = (
    pupilScore * 0.3 +
    fixationScore * 0.3 +
    regressionScore * 0.2 +
    blinkScore * 0.2
  ) * 100;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Count regression (backward) saccades
 */
function countRegressions(fixations: FixationPoint[]): number {
  let count = 0;

  for (let i = 1; i < fixations.length; i++) {
    const prev = fixations[i - 1];
    const curr = fixations[i];

    // Regression = Y coordinate same or slightly higher, but X goes left
    const isRegression = curr.x < prev.x && Math.abs(curr.y - prev.y) < 0.1;

    if (isRegression) {
      count++;
    }
  }

  return count;
}

/**
 * Count blinks from fixation gaps
 * Blink = gap >150ms between fixations
 */
function countBlinks(fixations: FixationPoint[], totalDuration: number): number {
  let count = 0;

  for (let i = 1; i < fixations.length; i++) {
    const prev = fixations[i - 1];
    const curr = fixations[i];

    const gap = curr.timestamp - (prev.timestamp + prev.duration);

    if (gap > 150) {  // Typical blink duration
      count++;
    }
  }

  return count;
}

/**
 * Calculate average of array
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;

  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = average(squareDiffs);

  return Math.sqrt(avgSquareDiff);
}
