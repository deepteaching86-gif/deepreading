/**
 * Gaze Analytics Types
 * ====================
 *
 * Data structures for:
 * - Gaze path tracking
 * - Fixation point analysis
 * - Concentration metrics
 * - Reading pattern analysis
 */

/**
 * Single fixation point (when eyes stay still)
 */
export interface FixationPoint {
  x: number;                    // Screen X coordinate (0-1)
  y: number;                    // Screen Y coordinate (0-1)
  timestamp: number;            // Start time (ms)
  duration: number;             // How long eyes stayed (ms)
  pupilDiameter: number;        // Pupil size (concentration metric)
  confidence: number;           // Gaze accuracy (0-1)
}

/**
 * Quick eye movement between fixations
 */
export interface Saccade {
  from: FixationPoint;
  to: FixationPoint;
  duration: number;             // Movement time (ms)
  velocity: number;             // Speed of movement (pixels/ms)
  amplitude: number;            // Distance traveled (pixels)
}

/**
 * Complete gaze path for a reading session
 */
export interface GazePath {
  fixations: FixationPoint[];
  saccades: Saccade[];
  totalDuration: number;        // Total reading time (ms)
  startTime: number;            // Session start timestamp
  endTime: number;              // Session end timestamp
}

/**
 * Concentration metrics derived from gaze data
 */
export interface ConcentrationMetrics {
  // Pupil-based metrics
  avgPupilDiameter: number;     // Average pupil size
  pupilVariability: number;     // Standard deviation (0 = very stable)

  // Fixation quality
  avgFixationDuration: number;  // Average time per fixation (ms)
  fixationStability: number;    // How steady fixations are (0-1)

  // Reading pattern
  regressionCount: number;      // Times eyes went back
  regressionRate: number;       // Regressions per 100 words

  // Blinks (fatigue indicator)
  blinkCount: number;
  blinkRate: number;            // Blinks per minute

  // Overall score
  concentrationScore: number;   // 0-100 composite score
}

/**
 * Reading pattern analysis
 */
export interface ReadingPattern {
  wordsPerMinute: number;       // Reading speed
  comprehensionEstimate: number; // Based on regressions (0-1)
  difficultyLevel: number;      // Estimated text difficulty (0-1)
  focusAreas: FixationPoint[];  // Most concentrated areas
  skippedRegions: { start: Point2D; end: Point2D }[]; // Skipped text
}

interface Point2D {
  x: number;
  y: number;
}

/**
 * Complete gaze session data
 */
export interface GazeSession {
  sessionId: string;
  gazePath: GazePath;
  concentration: ConcentrationMetrics;
  readingPattern: ReadingPattern;
  textContent: string;          // Text that was read
  metadata: {
    userId: string;
    timestamp: number;
    deviceInfo: string;
  };
}
