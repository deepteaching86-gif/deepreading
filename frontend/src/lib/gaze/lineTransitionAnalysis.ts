/**
 * Line Transition Analysis
 * ========================
 *
 * Analyzes how readers move between text lines to detect:
 * - Normal line breaks (natural reading progression)
 * - Regressions (re-reading previous lines)
 * - Skips (jumping over lines)
 * - Deviations (unexpected jumps)
 */

import {
  FixationPoint,
  LineTransition,
  LineTransitionType
} from '@/types/gazeAnalytics';

/**
 * Text layout information for line detection
 */
export interface TextLayout {
  lineHeight: number;           // Height of one text line (pixels)
  lines: TextLine[];            // All text lines
  screenHeight: number;         // Total screen height
  screenWidth: number;          // Total screen width
}

export interface TextLine {
  lineNumber: number;           // 0-indexed line number
  y: number;                    // Y coordinate of line center (0-1)
  yStart: number;              // Y coordinate of line top (0-1)
  yEnd: number;                // Y coordinate of line bottom (0-1)
  text: string;                // Line content
}

/**
 * Determine which line a fixation point belongs to
 */
export function getLineNumber(
  fixation: FixationPoint,
  textLayout: TextLayout
): number {
  const { lines } = textLayout;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fixation.y >= line.yStart && fixation.y <= line.yEnd) {
      return line.lineNumber;
    }
  }

  // If not found, return closest line
  const distances = lines.map(line => Math.abs(fixation.y - line.y));
  const closestIndex = distances.indexOf(Math.min(...distances));
  return lines[closestIndex].lineNumber;
}

/**
 * Classify transition between two fixations
 */
export function classifyLineTransition(
  fromFixation: FixationPoint,
  toFixation: FixationPoint,
  textLayout: TextLayout
): LineTransition {
  const fromLine = getLineNumber(fromFixation, textLayout);
  const toLine = getLineNumber(toFixation, textLayout);
  const lineDiff = toLine - fromLine;

  let type: LineTransitionType;
  let linesSkipped: number | undefined;

  if (lineDiff === 1) {
    // Normal forward progression to next line
    type = LineTransitionType.NORMAL_LINE_BREAK;
  } else if (lineDiff === 0) {
    // Staying on same line (not a line transition, but track it)
    type = LineTransitionType.NORMAL_LINE_BREAK;
  } else if (lineDiff < 0) {
    // Backward movement = regression
    type = LineTransitionType.REGRESSION;
    linesSkipped = Math.abs(lineDiff);
  } else if (lineDiff > 1 && lineDiff <= 3) {
    // Skipped 1-2 lines (might be intentional or careless)
    type = LineTransitionType.SKIP;
    linesSkipped = lineDiff - 1; // Lines actually skipped
  } else {
    // Large jump = deviation (possible distraction or page navigation)
    type = LineTransitionType.DEVIATION;
    linesSkipped = lineDiff;
  }

  return {
    type,
    fromLine,
    toLine,
    fromFixation,
    toFixation,
    linesSkipped,
    timestamp: toFixation.timestamp
  };
}

/**
 * Analyze all line transitions in a reading session
 */
export function analyzeLineTransitions(
  fixations: FixationPoint[],
  textLayout: TextLayout
): LineTransition[] {
  const transitions: LineTransition[] = [];

  for (let i = 1; i < fixations.length; i++) {
    const prevFixation = fixations[i - 1];
    const currFixation = fixations[i];

    const transition = classifyLineTransition(
      prevFixation,
      currFixation,
      textLayout
    );

    // Only add if actually changed lines
    if (transition.fromLine !== transition.toLine) {
      transitions.push(transition);
    }
  }

  return transitions;
}

/**
 * Calculate line transition metrics for reading pattern
 */
export function calculateLineTransitionMetrics(
  transitions: LineTransition[]
): {
  normalLineBreaks: number;
  regressionLines: number;
  skippedLines: number;
  deviations: number;
  lineTransitionAccuracy: number;
} {
  let normalLineBreaks = 0;
  let regressionLines = 0;
  let skippedLines = 0;
  let deviations = 0;

  transitions.forEach(transition => {
    switch (transition.type) {
      case LineTransitionType.NORMAL_LINE_BREAK:
        normalLineBreaks++;
        break;
      case LineTransitionType.REGRESSION:
        regressionLines++;
        break;
      case LineTransitionType.SKIP:
        skippedLines++;
        break;
      case LineTransitionType.DEVIATION:
        deviations++;
        break;
    }
  });

  const totalTransitions = transitions.length;
  const lineTransitionAccuracy = totalTransitions > 0
    ? normalLineBreaks / totalTransitions
    : 1.0;

  return {
    normalLineBreaks,
    regressionLines,
    skippedLines,
    deviations,
    lineTransitionAccuracy
  };
}

/**
 * Generate text layout from content and screen dimensions
 */
export function generateTextLayout(
  textContent: string,
  screenWidth: number,
  screenHeight: number,
  fontSize: number = 16,
  lineHeightMultiplier: number = 1.5
): TextLayout {
  const lines = textContent.split('\n');
  const lineHeight = fontSize * lineHeightMultiplier;
  const lineHeightNormalized = lineHeight / screenHeight;

  const textLines: TextLine[] = lines.map((text, index) => {
    const yCenter = (index + 0.5) * lineHeightNormalized;
    const yStart = index * lineHeightNormalized;
    const yEnd = (index + 1) * lineHeightNormalized;

    return {
      lineNumber: index,
      y: yCenter,
      yStart,
      yEnd,
      text
    };
  });

  return {
    lineHeight,
    lines: textLines,
    screenHeight,
    screenWidth
  };
}

/**
 * Detect reading comprehension issues from line transitions
 */
export function detectComprehensionIssues(
  transitions: LineTransition[]
): {
  hasComprehensionIssues: boolean;
  issueScore: number;  // 0-1 (higher = more issues)
  reasons: string[];
} {
  const metrics = calculateLineTransitionMetrics(transitions);
  const reasons: string[] = [];
  let issueScore = 0;

  // High regression rate indicates difficulty understanding
  const regressionRate = metrics.regressionLines / transitions.length;
  if (regressionRate > 0.2) {
    issueScore += 0.3;
    reasons.push(`High regression rate: ${(regressionRate * 100).toFixed(1)}% (>20% threshold)`);
  }

  // Too many skipped lines = not reading carefully
  const skipRate = metrics.skippedLines / transitions.length;
  if (skipRate > 0.15) {
    issueScore += 0.25;
    reasons.push(`Skipping lines: ${(skipRate * 100).toFixed(1)}% (>15% threshold)`);
  }

  // Deviations indicate distraction or confusion
  const deviationRate = metrics.deviations / transitions.length;
  if (deviationRate > 0.1) {
    issueScore += 0.2;
    reasons.push(`Frequent deviations: ${(deviationRate * 100).toFixed(1)}% (>10% threshold)`);
  }

  // Low accuracy = poor reading flow
  if (metrics.lineTransitionAccuracy < 0.6) {
    issueScore += 0.25;
    reasons.push(`Low line transition accuracy: ${(metrics.lineTransitionAccuracy * 100).toFixed(1)}% (<60% threshold)`);
  }

  return {
    hasComprehensionIssues: issueScore > 0.3,
    issueScore: Math.min(1.0, issueScore),
    reasons
  };
}
