/**
 * Iris Tracking Utilities
 * =======================
 *
 * Enhanced iris tracking using ellipse fitting on MediaPipe iris landmarks
 * - Precise iris center calculation
 * - Pupil diameter estimation
 * - Confidence scoring
 */

import { fitEllipseToPoints, type EllipseParams } from './ellipseFitting';

export interface IrisData {
  center: { x: number; y: number; z: number };
  diameter: number;          // Pupil diameter in pixels
  confidence: number;        // 0-1, ellipse fit quality
  majorAxis: number;         // Ellipse major axis length
  minorAxis: number;         // Ellipse minor axis length
  angle: number;            // Ellipse rotation angle
}

export interface MediaPipeLandmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * Extract precise iris data from MediaPipe iris landmarks using ellipse fitting
 *
 * MediaPipe provides 5 iris landmarks per eye:
 * - Left iris: indices 468-472
 * - Right iris: indices 473-477
 *
 * @param irisLandmarks - 5 iris landmarks from MediaPipe
 * @param videoWidth - Video width for denormalization
 * @param videoHeight - Video height for denormalization
 * @returns Precise iris data with center, diameter, and confidence
 */
export function extractIrisData(
  irisLandmarks: MediaPipeLandmark[],
  videoWidth: number,
  videoHeight: number
): IrisData {
  if (irisLandmarks.length < 5) {
    // Fallback: Use first landmark as center
    const fallbackCenter = irisLandmarks[0];
    return {
      center: {
        x: fallbackCenter.x * videoWidth,
        y: fallbackCenter.y * videoHeight,
        z: (fallbackCenter.z || 0) * videoWidth
      },
      diameter: 10, // Default diameter
      confidence: 0.3, // Low confidence
      majorAxis: 10,
      minorAxis: 10,
      angle: 0
    };
  }

  // Convert normalized coordinates to pixel coordinates
  const points2D = irisLandmarks.map(lm => ({
    x: lm.x * videoWidth,
    y: lm.y * videoHeight
  }));

  // Fit ellipse to 5 iris landmarks
  const ellipse: EllipseParams = fitEllipseToPoints(points2D);

  // Calculate average Z coordinate
  const avgZ = irisLandmarks.reduce((sum, lm) => sum + (lm.z || 0), 0) / irisLandmarks.length;

  // Estimate pupil diameter as average of major and minor axes
  // In reality, pupil is roughly circular, so we average the two axes
  const diameter = (ellipse.majorAxis + ellipse.minorAxis) / 2;

  return {
    center: {
      x: ellipse.center.x,
      y: ellipse.center.y,
      z: avgZ * videoWidth
    },
    diameter,
    confidence: ellipse.confidence,
    majorAxis: ellipse.majorAxis,
    minorAxis: ellipse.minorAxis,
    angle: ellipse.angle
  };
}

/**
 * Extract iris data for both eyes
 *
 * @param landmarks - All MediaPipe face landmarks
 * @param videoWidth - Video width
 * @param videoHeight - Video height
 * @returns Left and right iris data
 */
export function extractBothEyesIrisData(
  landmarks: MediaPipeLandmark[],
  videoWidth: number,
  videoHeight: number
): {
  left: IrisData | null;
  right: IrisData | null;
} {
  let left: IrisData | null = null;
  let right: IrisData | null = null;

  // Check if iris landmarks are available (indices 468-477)
  if (landmarks.length > 477) {
    const leftIrisLandmarks = landmarks.slice(468, 473); // 468-472
    const rightIrisLandmarks = landmarks.slice(473, 478); // 473-477

    left = extractIrisData(leftIrisLandmarks, videoWidth, videoHeight);
    right = extractIrisData(rightIrisLandmarks, videoWidth, videoHeight);
  }

  return { left, right };
}

/**
 * Calculate pupil dilation ratio (for concentration analysis)
 *
 * @param currentDiameter - Current pupil diameter
 * @param baselineDiameter - Baseline diameter (average at rest)
 * @returns Dilation ratio (1.0 = normal, >1.0 = dilated, <1.0 = constricted)
 */
export function calculatePupilDilation(
  currentDiameter: number,
  baselineDiameter: number
): number {
  if (baselineDiameter <= 0) return 1.0;
  return currentDiameter / baselineDiameter;
}

/**
 * Update baseline pupil diameter with exponential moving average
 *
 * @param currentBaseline - Current baseline diameter
 * @param newMeasurement - New diameter measurement
 * @param alpha - Smoothing factor (0.01 = slow update, 0.1 = fast update)
 * @returns Updated baseline
 */
export function updatePupilBaseline(
  currentBaseline: number,
  newMeasurement: number,
  alpha: number = 0.05
): number {
  if (currentBaseline <= 0) return newMeasurement;
  return currentBaseline * (1 - alpha) + newMeasurement * alpha;
}

/**
 * Detect blink from iris confidence
 *
 * When user blinks, iris landmarks become unreliable and confidence drops
 *
 * @param leftIris - Left iris data
 * @param rightIris - Right iris data
 * @param threshold - Confidence threshold for blink detection (default: 0.5)
 * @returns True if blink detected
 */
export function detectBlinkFromIris(
  leftIris: IrisData | null,
  rightIris: IrisData | null,
  threshold: number = 0.5
): boolean {
  // Blink if either eye has low confidence or is missing
  const leftBlink = !leftIris || leftIris.confidence < threshold;
  const rightBlink = !rightIris || rightIris.confidence < threshold;

  return leftBlink || rightBlink;
}
