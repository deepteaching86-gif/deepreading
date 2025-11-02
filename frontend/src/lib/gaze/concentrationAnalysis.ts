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

import type { FixationPoint, ConcentrationMetrics, GazePath, ReadingPattern } from '../../types/gazeAnalytics';
import {
  calculateLineTransitionMetrics,
  analyzeLineTransitions,
  type TextLayout
} from './lineTransitionAnalysis';

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
function countBlinks(fixations: FixationPoint[], _totalDuration: number): number {
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

/**
 * Calculate reading pattern metrics including line transitions
 */
export function calculateReadingPattern(
  gazePath: GazePath,
  textLayout: TextLayout,
  textContent: string
): ReadingPattern {
  const { fixations } = gazePath;

  // Analyze line transitions
  const lineTransitions = analyzeLineTransitions(fixations, textLayout);
  const lineMetrics = calculateLineTransitionMetrics(lineTransitions);

  // Calculate reading speed (words per minute)
  const wordCount = textContent.split(/\s+/).length;
  const durationMinutes = gazePath.totalDuration / 60000;
  const wordsPerMinute = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

  // Estimate comprehension based on reading pattern
  const comprehensionEstimate = calculateComprehensionEstimate({
    regressionRate: lineMetrics.regressionLines / lineTransitions.length,
    skipRate: lineMetrics.skippedLines / lineTransitions.length,
    lineAccuracy: lineMetrics.lineTransitionAccuracy,
    avgFixationDuration: average(fixations.map(f => f.duration))
  });

  // Estimate text difficulty
  const difficultyLevel = calculateDifficultyLevel({
    avgFixationDuration: average(fixations.map(f => f.duration)),
    regressionRate: lineMetrics.regressionLines / lineTransitions.length,
    wordsPerMinute
  });

  // Find focus areas (top 10% longest fixations)
  const sortedByDuration = [...fixations].sort((a, b) => b.duration - a.duration);
  const focusAreas = sortedByDuration.slice(0, Math.ceil(fixations.length * 0.1));

  // Detect skipped regions
  const skippedRegions = detectSkippedRegions(fixations, textLayout);

  return {
    wordsPerMinute,
    comprehensionEstimate,
    difficultyLevel,
    focusAreas,
    skippedRegions,
    normalLineBreaks: lineMetrics.normalLineBreaks,
    regressionLines: lineMetrics.regressionLines,
    skippedLines: lineMetrics.skippedLines,
    deviations: lineMetrics.deviations,
    lineTransitionAccuracy: lineMetrics.lineTransitionAccuracy
  };
}

/**
 * Estimate comprehension based on reading pattern
 */
function calculateComprehensionEstimate(metrics: {
  regressionRate: number;
  skipRate: number;
  lineAccuracy: number;
  avgFixationDuration: number;
}): number {
  // High regression rate = lower comprehension (trying to re-read)
  const regressionPenalty = Math.min(1, metrics.regressionRate * 2); // 0-1

  // High skip rate = lower comprehension (not reading carefully)
  const skipPenalty = Math.min(1, metrics.skipRate * 3); // 0-1

  // Low line accuracy = lower comprehension (losing place)
  const accuracyBonus = metrics.lineAccuracy; // 0-1

  // Optimal fixation duration is 200-300ms
  // Too short = skimming, too long = struggling
  const fixationOptimal = metrics.avgFixationDuration >= 200 && metrics.avgFixationDuration <= 300 ? 1 : 0.7;

  // Weighted combination
  const score = (
    accuracyBonus * 0.3 +
    (1 - regressionPenalty) * 0.3 +
    (1 - skipPenalty) * 0.2 +
    fixationOptimal * 0.2
  );

  return Math.max(0, Math.min(1, score));
}

/**
 * Estimate text difficulty based on reading behavior
 */
function calculateDifficultyLevel(metrics: {
  avgFixationDuration: number;
  regressionRate: number;
  wordsPerMinute: number;
}): number {
  // Longer fixations = more difficult
  const fixationScore = Math.min(1, (metrics.avgFixationDuration - 200) / 200); // 0-1

  // More regressions = more difficult
  const regressionScore = Math.min(1, metrics.regressionRate * 2); // 0-1

  // Slower reading = more difficult
  const speedScore = metrics.wordsPerMinute < 200 ? 0.7 : metrics.wordsPerMinute < 150 ? 1 : 0.3;

  // Weighted average
  const difficulty = (
    fixationScore * 0.4 +
    regressionScore * 0.4 +
    speedScore * 0.2
  );

  return Math.max(0, Math.min(1, difficulty));
}

/**
 * Detect regions that were skipped during reading
 */
function detectSkippedRegions(
  fixations: FixationPoint[],
  textLayout: TextLayout
): Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> {
  const skippedRegions: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> = [];

  // Find gaps in fixations (Y coordinate jumps >2 lines)
  for (let i = 1; i < fixations.length; i++) {
    const prev = fixations[i - 1];
    const curr = fixations[i];

    const yDiff = Math.abs(curr.y - prev.y);
    const lineHeight = 1 / textLayout.lines.length; // Normalized line height

    if (yDiff > lineHeight * 2) {
      // Skipped at least 2 lines
      skippedRegions.push({
        start: { x: prev.x, y: prev.y },
        end: { x: curr.x, y: curr.y }
      });
    }
  }

  return skippedRegions;
}
