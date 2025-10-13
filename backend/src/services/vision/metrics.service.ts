// Vision TEST Metrics Calculation Service
// Core logic for calculating 15 metrics from gaze data

import {
  GazePoint,
  GazeType,
  VisionMetrics,
  VisionConfig,
  MetricDetailedAnalysis
} from '../../types/vision.types';

/**
 * Calculate all 15 core metrics from gaze data
 */
export async function calculateMetricsFromGazeData(
  gazePoints: GazePoint[],
  visionConfig: VisionConfig,
  comprehensionAccuracy?: number
): Promise<VisionMetrics> {
  // Filter out blinks and low confidence points
  const validGazePoints = gazePoints.filter(
    point => point.type !== GazeType.BLINK && point.confidence >= 0.5
  );

  // Separate fixations and saccades
  const fixations = validGazePoints.filter(p => p.type === GazeType.FIXATION);
  const saccades = validGazePoints.filter(p => p.type === GazeType.SACCADE);

  // Calculate passage word count
  const totalWords = visionConfig.passages.reduce((sum, p) => sum + p.wordCount, 0);

  // Calculate test duration (seconds)
  const startTime = validGazePoints[0].timestamp;
  const endTime = validGazePoints[validGazePoints.length - 1].timestamp;
  const durationSeconds = (endTime - startTime) / 1000;

  // ===== A. Eye Movement Patterns (6 metrics) =====

  // 1. Average Saccade Amplitude (pixels)
  const saccadeAmplitudes = calculateSaccadeAmplitudes(saccades);
  const averageSaccadeAmplitude = mean(saccadeAmplitudes);

  // 2. Saccade Variability (standard deviation)
  const saccadeVariability = standardDeviation(saccadeAmplitudes);

  // 3. Average Saccade Velocity (pixels/second)
  const saccadeVelocities = calculateSaccadeVelocities(saccades);
  const averageSaccadeVelocity = mean(saccadeVelocities);

  // 4. Optimal Landing Rate (percentage)
  const optimalLandingRate = calculateOptimalLandingRate(fixations, visionConfig);

  // 5. Return Sweep Accuracy (percentage)
  const returnSweepAccuracy = calculateReturnSweepAccuracy(validGazePoints, visionConfig);

  // 6. Scan Path Efficiency (0-1 score)
  const scanPathEfficiency = calculateScanPathEfficiency(validGazePoints, visionConfig);

  // ===== B. Fixation Behavior (4 metrics) =====

  // 7. Average Fixation Duration (milliseconds)
  const fixationDurations = calculateFixationDurations(fixations);
  const averageFixationDuration = mean(fixationDurations);

  // 8. Fixations Per Word
  const fixationsPerWord = fixations.length / totalWords;

  // 9. Regression Rate (percentage)
  const regressionRate = calculateRegressionRate(validGazePoints);

  // 10. Vocabulary Gap Score (0-100)
  const vocabularyGapScore = calculateVocabularyGapScore(fixations, visionConfig);

  // ===== C. Reading Speed & Rhythm (3 metrics) =====

  // 11. Words Per Minute (WPM)
  const wordsPerMinute = (totalWords / durationSeconds) * 60;

  // 12. Rhythm Regularity (0-1 score)
  const rhythmRegularity = calculateRhythmRegularity(fixationDurations);

  // 13. Stamina Score (0-100)
  const staminaScore = calculateStaminaScore(validGazePoints, durationSeconds);

  // ===== D. Comprehension & Cognitive (2 metrics) =====

  // 14. Gaze-Comprehension Correlation (-1 to 1)
  const gazeComprehensionCorrelation = calculateGazeComprehensionCorrelation(
    fixations,
    comprehensionAccuracy
  );

  // 15. Cognitive Load Index (0-100)
  const cognitiveLoadIndex = calculateCognitiveLoadIndex(validGazePoints);

  // ===== Overall Score =====
  const overallEyeTrackingScore = calculateOverallScore({
    averageSaccadeAmplitude,
    averageFixationDuration,
    fixationsPerWord,
    regressionRate,
    wordsPerMinute,
    scanPathEfficiency,
    rhythmRegularity,
    staminaScore
  }, visionConfig);

  // ===== Detailed Analysis =====
  const detailedAnalysis = calculateDetailedAnalysis(
    saccades,
    fixations,
    validGazePoints,
    wordsPerMinute,
    durationSeconds
  );

  return {
    averageSaccadeAmplitude,
    saccadeVariability,
    averageSaccadeVelocity,
    optimalLandingRate,
    returnSweepAccuracy,
    scanPathEfficiency,
    averageFixationDuration,
    fixationsPerWord,
    regressionRate,
    vocabularyGapScore,
    wordsPerMinute,
    rhythmRegularity,
    staminaScore,
    gazeComprehensionCorrelation,
    cognitiveLoadIndex,
    overallEyeTrackingScore,
    detailedAnalysis
  };
}

// ===== Helper Functions =====

function calculateSaccadeAmplitudes(saccades: GazePoint[]): number[] {
  const amplitudes: number[] = [];
  for (let i = 1; i < saccades.length; i++) {
    const prev = saccades[i - 1];
    const curr = saccades[i];
    const dx = (curr.x - prev.x) * 1920; // Assume 1920px width
    const dy = (curr.y - prev.y) * 1080; // Assume 1080px height
    const amplitude = Math.sqrt(dx * dx + dy * dy);
    amplitudes.push(amplitude);
  }
  return amplitudes;
}

function calculateSaccadeVelocities(saccades: GazePoint[]): number[] {
  const velocities: number[] = [];
  for (let i = 1; i < saccades.length; i++) {
    const prev = saccades[i - 1];
    const curr = saccades[i];
    const dx = (curr.x - prev.x) * 1920;
    const dy = (curr.y - prev.y) * 1080;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;
    velocities.push(velocity);
  }
  return velocities;
}

function calculateOptimalLandingRate(fixations: GazePoint[], _config: VisionConfig): number {
  // Optimal landing position: center of word (40-60% from word start)
  // This is a simplified calculation - in reality, would need word boundaries
  // For now, assume optimal if fixation duration is 150-300ms
  const optimalFixations = fixations.filter(_f => {
    const duration = 200; // Placeholder - would need actual duration
    return duration >= 150 && duration <= 300;
  });
  return (optimalFixations.length / fixations.length) * 100;
}

function calculateReturnSweepAccuracy(gazePoints: GazePoint[], _config: VisionConfig): number {
  // Return sweep: moving from end of line to start of next line
  // Detect large Y movement with negative X movement
  let returnSweeps = 0;
  let accurateReturns = 0;

  for (let i = 1; i < gazePoints.length; i++) {
    const prev = gazePoints[i - 1];
    const curr = gazePoints[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    // Detect return sweep: dx < -0.5 (moving left) and dy > 0.05 (moving down)
    if (dx < -0.5 && dy > 0.05) {
      returnSweeps++;
      // Accurate if lands near left edge (x < 0.2)
      if (curr.x < 0.2) {
        accurateReturns++;
      }
    }
  }

  return returnSweeps > 0 ? (accurateReturns / returnSweeps) * 100 : 100;
}

function calculateScanPathEfficiency(gazePoints: GazePoint[], _config: VisionConfig): number {
  // Efficiency: ratio of direct path length to actual path length
  // Lower ratio = more efficient (less wandering)
  if (gazePoints.length < 2) return 1.0;

  const directDistance = Math.sqrt(
    Math.pow((gazePoints[gazePoints.length - 1].x - gazePoints[0].x) * 1920, 2) +
    Math.pow((gazePoints[gazePoints.length - 1].y - gazePoints[0].y) * 1080, 2)
  );

  let actualDistance = 0;
  for (let i = 1; i < gazePoints.length; i++) {
    const dx = (gazePoints[i].x - gazePoints[i - 1].x) * 1920;
    const dy = (gazePoints[i].y - gazePoints[i - 1].y) * 1080;
    actualDistance += Math.sqrt(dx * dx + dy * dy);
  }

  return actualDistance > 0 ? Math.min(1.0, directDistance / actualDistance) : 1.0;
}

function calculateFixationDurations(fixations: GazePoint[]): number[] {
  // Group consecutive fixations and calculate duration
  const durations: number[] = [];
  let currentStart = 0;

  for (let i = 1; i < fixations.length; i++) {
    const timeDiff = fixations[i].timestamp - fixations[i - 1].timestamp;
    if (timeDiff > 100) { // New fixation if gap > 100ms
      const duration = fixations[i - 1].timestamp - fixations[currentStart].timestamp;
      durations.push(duration);
      currentStart = i;
    }
  }

  // Add last fixation
  if (fixations.length > 0) {
    durations.push(fixations[fixations.length - 1].timestamp - fixations[currentStart].timestamp);
  }

  return durations.filter(d => d > 0);
}

function calculateRegressionRate(gazePoints: GazePoint[]): number {
  // Regression: backward eye movement (negative horizontal movement)
  let regressions = 0;
  for (let i = 1; i < gazePoints.length; i++) {
    const dx = gazePoints[i].x - gazePoints[i - 1].x;
    // Consider regression if moving left by more than 0.05 (not just noise)
    if (dx < -0.05) {
      regressions++;
    }
  }
  return (regressions / gazePoints.length) * 100;
}

function calculateVocabularyGapScore(fixations: GazePoint[], _config: VisionConfig): number {
  // Higher fixations on certain words = vocabulary difficulty
  // This is simplified - would need word-level mapping
  const fixationDurations = calculateFixationDurations(fixations);
  const prolongedFixations = fixationDurations.filter(d => d > 400); // >400ms = vocabulary gap
  const gapPercentage = (prolongedFixations.length / fixationDurations.length) * 100;
  return Math.min(100, gapPercentage * 2); // Scale to 0-100
}

function calculateRhythmRegularity(fixationDurations: number[]): number {
  // Regularity: inverse of coefficient of variation
  if (fixationDurations.length < 2) return 1.0;
  const avg = mean(fixationDurations);
  const stdDev = standardDeviation(fixationDurations);
  const cv = avg > 0 ? stdDev / avg : 1.0; // Coefficient of variation
  return Math.max(0, 1 - cv); // Lower CV = more regular
}

function calculateStaminaScore(gazePoints: GazePoint[], _durationSeconds: number): number {
  // Stamina: compare reading speed in first half vs second half
  // Score decreases if second half is significantly slower
  const midpoint = Math.floor(gazePoints.length / 2);
  const firstHalf = gazePoints.slice(0, midpoint);
  const secondHalf = gazePoints.slice(midpoint);

  // Calculate path length for each half
  const firstDistance = calculatePathLength(firstHalf);
  const secondDistance = calculatePathLength(secondHalf);

  // Speed ratio (second half / first half)
  const speedRatio = firstDistance > 0 ? secondDistance / firstDistance : 1.0;

  // Score: 100 if consistent, decreases if second half slower
  return Math.min(100, speedRatio * 100);
}

function calculateGazeComprehensionCorrelation(
  fixations: GazePoint[],
  comprehensionAccuracy?: number
): number {
  // Correlation between gaze patterns and comprehension
  // This is simplified - would use statistical correlation in production
  if (comprehensionAccuracy === undefined) return 0;

  const avgFixationDuration = mean(calculateFixationDurations(fixations));

  // Hypothesis: optimal fixation duration (200-250ms) correlates with better comprehension
  const optimalDuration = 225;
  const deviation = Math.abs(avgFixationDuration - optimalDuration);
  const maxDeviation = 200;

  // Normalize: closer to optimal = higher correlation
  const gazeScore = Math.max(0, 1 - deviation / maxDeviation);
  const comprehensionScore = comprehensionAccuracy / 100;

  // Simple correlation: product of normalized scores
  return (gazeScore * comprehensionScore * 2) - 1; // Scale to -1 to 1
}

function calculateCognitiveLoadIndex(gazePoints: GazePoint[]): number {
  // Cognitive load: use pupil dilation if available, otherwise use fixation patterns
  const pupilData = gazePoints.filter(p => p.pupilDiameter !== undefined);

  if (pupilData.length > 10) {
    // Use pupil dilation variability as proxy for cognitive load
    const pupilDiameters = pupilData.map(p => p.pupilDiameter!);
    const avgPupil = mean(pupilDiameters);
    const stdDevPupil = standardDeviation(pupilDiameters);
    const cv = avgPupil > 0 ? stdDevPupil / avgPupil : 0;
    return Math.min(100, cv * 500); // Scale to 0-100
  } else {
    // Fallback: use fixation duration variability
    const fixations = gazePoints.filter(p => p.type === GazeType.FIXATION);
    const durations = calculateFixationDurations(fixations);
    const stdDev = standardDeviation(durations);
    return Math.min(100, stdDev / 2); // Scale to 0-100
  }
}

function calculateOverallScore(
  metrics: {
    averageSaccadeAmplitude: number;
    averageFixationDuration: number;
    fixationsPerWord: number;
    regressionRate: number;
    wordsPerMinute: number;
    scanPathEfficiency: number;
    rhythmRegularity: number;
    staminaScore: number;
  },
  config: VisionConfig
): number {
  // Weighted average of normalized metrics
  const expectedMetrics = config.expectedMetrics;

  // Normalize each metric to 0-100 scale
  const saccadeScore = normalizeToRange(
    metrics.averageSaccadeAmplitude,
    expectedMetrics.saccade[0],
    expectedMetrics.saccade[1]
  );

  const fixationScore = normalizeToRange(
    metrics.averageFixationDuration,
    expectedMetrics.fixation[0],
    expectedMetrics.fixation[1]
  );

  const regressionScore = Math.max(0, 100 - (metrics.regressionRate / expectedMetrics.regression) * 100);

  const wpmScore = normalizeToRange(
    metrics.wordsPerMinute,
    expectedMetrics.wpm[0],
    expectedMetrics.wpm[1]
  );

  const efficiencyScore = metrics.scanPathEfficiency * 100;
  const rhythmScore = metrics.rhythmRegularity * 100;
  const staminaScore = metrics.staminaScore;

  // Weighted average (weights sum to 1.0)
  const overallScore =
    saccadeScore * 0.1 +
    fixationScore * 0.15 +
    regressionScore * 0.15 +
    wpmScore * 0.2 +
    efficiencyScore * 0.15 +
    rhythmScore * 0.1 +
    staminaScore * 0.15;

  return Math.round(overallScore * 10) / 10; // Round to 1 decimal
}

function calculateDetailedAnalysis(
  saccades: GazePoint[],
  fixations: GazePoint[],
  allGazePoints: GazePoint[],
  wordsPerMinute: number,
  durationSeconds: number
): MetricDetailedAnalysis {
  const saccadeAmplitudes = calculateSaccadeAmplitudes(saccades);
  const fixationDurations = calculateFixationDurations(fixations);

  // Saccade distribution (characters: ~15px per character)
  const shortSaccades = saccadeAmplitudes.filter(a => a < 60).length; // < 4 chars
  const mediumSaccades = saccadeAmplitudes.filter(a => a >= 60 && a < 120).length; // 4-8 chars
  const longSaccades = saccadeAmplitudes.filter(a => a >= 120).length; // > 8 chars
  const totalSaccades = saccadeAmplitudes.length;

  // Fixation distribution
  const briefFixations = fixationDurations.filter(d => d < 150).length;
  const normalFixations = fixationDurations.filter(d => d >= 150 && d <= 300).length;
  const prolongedFixations = fixationDurations.filter(d => d > 300).length;
  const totalFixations = fixationDurations.length;

  // Regression types (simplified)
  let interWord = 0;
  let intraLine = 0;
  let interLine = 0;

  for (let i = 1; i < allGazePoints.length; i++) {
    const dx = allGazePoints[i].x - allGazePoints[i - 1].x;
    const dy = allGazePoints[i].y - allGazePoints[i - 1].y;

    if (dx < -0.05) { // Regression
      if (Math.abs(dy) < 0.02) {
        // Same line
        if (Math.abs(dx) < 0.1) {
          interWord++;
        } else {
          intraLine++;
        }
      } else {
        interLine++;
      }
    }
  }

  // Reading speed progression
  const midpoint = Math.floor(allGazePoints.length / 2);
  const firstHalfDuration = (allGazePoints[midpoint].timestamp - allGazePoints[0].timestamp) / 1000;
  const secondHalfDuration = durationSeconds - firstHalfDuration;
  const firstHalfWPM = firstHalfDuration > 0 ? wordsPerMinute * (durationSeconds / firstHalfDuration) : wordsPerMinute;
  const secondHalfWPM = secondHalfDuration > 0 ? wordsPerMinute * (durationSeconds / secondHalfDuration) : wordsPerMinute;
  const fluctuation = Math.abs(secondHalfWPM - firstHalfWPM) / firstHalfWPM;

  return {
    saccadeDistribution: {
      short: totalSaccades > 0 ? shortSaccades / totalSaccades : 0,
      medium: totalSaccades > 0 ? mediumSaccades / totalSaccades : 0,
      long: totalSaccades > 0 ? longSaccades / totalSaccades : 0
    },
    fixationDistribution: {
      brief: totalFixations > 0 ? briefFixations / totalFixations : 0,
      normal: totalFixations > 0 ? normalFixations / totalFixations : 0,
      prolonged: totalFixations > 0 ? prolongedFixations / totalFixations : 0
    },
    regressionTypes: {
      interWord,
      intraLine,
      interLine
    },
    readingSpeed: {
      firstHalf: Math.round(firstHalfWPM),
      secondHalf: Math.round(secondHalfWPM),
      fluctuation: Math.round(fluctuation * 100) / 100
    }
  };
}

// ===== Math Utilities =====

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = mean(squaredDiffs);
  return Math.sqrt(variance);
}

function normalizeToRange(value: number, min: number, max: number): number {
  if (value < min) return 0;
  if (value > max) return 100;
  return ((value - min) / (max - min)) * 100;
}

function calculatePathLength(gazePoints: GazePoint[]): number {
  let length = 0;
  for (let i = 1; i < gazePoints.length; i++) {
    const dx = (gazePoints[i].x - gazePoints[i - 1].x) * 1920;
    const dy = (gazePoints[i].y - gazePoints[i - 1].y) * 1080;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}
