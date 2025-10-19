/**
 * Calibration Utility Functions
 */

import {
  Point,
  GazeData,
  CornerData,
  SensitivityMatrix,
  CalibrationProfile,
  CALIBRATION_CONSTANTS
} from '../types/calibration';

/**
 * Calculate distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate median of number array
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate average GazeData from samples
 */
export function averageGazeData(samples: GazeData[]): GazeData {
  if (samples.length === 0) {
    return {
      irisOffsetX: 0,
      irisOffsetY: 0,
      headYaw: 0,
      headPitch: 0,
      timestamp: Date.now()
    };
  }

  return {
    irisOffsetX: median(samples.map(s => s.irisOffsetX)),
    irisOffsetY: median(samples.map(s => s.irisOffsetY)),
    headYaw: median(samples.map(s => s.headYaw)),
    headPitch: median(samples.map(s => s.headPitch)),
    timestamp: Date.now()
  };
}

/**
 * Calculate optimal sensitivity from corner calibration data
 */
export function calculateOptimalSensitivity(
  naturalCenter: GazeData,
  corners: CornerData[]
): SensitivityMatrix {
  // Find corners by position
  const leftCorner = corners.find(c => c.target.x < 0.5);
  const rightCorner = corners.find(c => c.target.x > 0.5);
  const topCorner = corners.find(c => c.target.y < 0.5);
  const bottomCorner = corners.find(c => c.target.y > 0.5);

  if (!leftCorner || !rightCorner || !topCorner || !bottomCorner) {
    console.warn('⚠️ Missing corner data, using default sensitivity');
    return {
      baseX: 80,
      baseY: 50,
      headYawMultiplier: 15,
      headPitchMultiplier: 10
    };
  }

  // Calculate X-axis sensitivity
  const irisRangeX = Math.abs(
    (rightCorner.avgMeasured.irisX - naturalCenter.irisOffsetX) -
    (leftCorner.avgMeasured.irisX - naturalCenter.irisOffsetX)
  );
  const screenRangeX = Math.abs(rightCorner.target.x - leftCorner.target.x); // 0.7

  const sensitivityX = irisRangeX > 0 ? screenRangeX / irisRangeX : 80;

  // Calculate Y-axis sensitivity
  const irisRangeY = Math.abs(
    (bottomCorner.avgMeasured.irisY - naturalCenter.irisOffsetY) -
    (topCorner.avgMeasured.irisY - naturalCenter.irisOffsetY)
  );
  const screenRangeY = Math.abs(bottomCorner.target.y - topCorner.target.y); // 0.7

  const sensitivityY = irisRangeY > 0 ? screenRangeY / irisRangeY : 50;

  // Calculate head pose multipliers
  const headYawRange = Math.abs(
    (rightCorner.avgMeasured.headYaw - naturalCenter.headYaw) -
    (leftCorner.avgMeasured.headYaw - naturalCenter.headYaw)
  );
  const headYawMult = headYawRange > 0 ? screenRangeX / headYawRange : 15;

  const headPitchRange = Math.abs(
    (bottomCorner.avgMeasured.headPitch - naturalCenter.headPitch) -
    (topCorner.avgMeasured.headPitch - naturalCenter.headPitch)
  );
  const headPitchMult = headPitchRange > 0 ? screenRangeY / headPitchRange : 10;

  console.log('📊 Calculated Sensitivity:', {
    baseX: sensitivityX.toFixed(2),
    baseY: sensitivityY.toFixed(2),
    headYawMult: headYawMult.toFixed(2),
    headPitchMult: headPitchMult.toFixed(2),
    irisRangeX: irisRangeX.toFixed(4),
    irisRangeY: irisRangeY.toFixed(4)
  });

  return {
    baseX: sensitivityX,
    baseY: sensitivityY,
    headYawMultiplier: headYawMult,
    headPitchMultiplier: headPitchMult
  };
}

/**
 * Apply camera parallax correction
 */
export function applyCameraParallax(gaze: Point, cameraPos: Point): Point {
  const { PARALLAX_FACTOR } = CALIBRATION_CONSTANTS;

  return {
    x: gaze.x + (cameraPos.x - 0.5) * PARALLAX_FACTOR * (gaze.y - 0.5),
    y: gaze.y + (cameraPos.y - 0.5) * PARALLAX_FACTOR
  };
}

/**
 * Calculate gaze point with calibration data
 */
export function calculateCalibratedGaze(
  irisOffset: Point,
  headPose: { yaw: number; pitch: number },
  calibration: CalibrationProfile
): Point {
  const { naturalCenter, sensitivity, cameraPosition } = calibration.quickCalibration;

  // 1. Normalize relative to user's natural center
  const relativeIris = {
    x: irisOffset.x - naturalCenter.irisOffsetX,
    y: irisOffset.y - naturalCenter.irisOffsetY
  };

  const relativeHead = {
    yaw: headPose.yaw - naturalCenter.headYaw,
    pitch: headPose.pitch - naturalCenter.headPitch
  };

  // 2. Apply user-specific sensitivity
  const rawGazeX = 0.5 + (relativeIris.x * sensitivity.baseX) + (relativeHead.yaw * sensitivity.headYawMultiplier);
  const rawGazeY = 0.5 + (relativeIris.y * sensitivity.baseY) + (relativeHead.pitch * sensitivity.headPitchMultiplier);

  // 2.5. Apply mirror flip for horizontal axis (matching useGazeTracking behavior)
  const mirroredGazeX = 1.0 - rawGazeX;

  // 3. Apply camera parallax correction
  const correctedGaze = applyCameraParallax(
    { x: mirroredGazeX, y: rawGazeY },
    cameraPosition
  );

  // 4. Apply adaptive learning correction (if available)
  const finalGaze = applyAdaptiveCorrection(correctedGaze, calibration);

  return finalGaze;
}

/**
 * Apply adaptive learning correction
 */
function applyAdaptiveCorrection(gaze: Point, calibration: CalibrationProfile): Point {
  const { errorSamples } = calibration.adaptiveLearning;

  if (errorSamples.length < CALIBRATION_CONSTANTS.ADAPTIVE_MIN_SAMPLES) {
    return gaze; // Not enough data
  }

  // Calculate average error from recent samples
  const recentSamples = errorSamples.slice(-20); // Last 20 samples
  const avgErrorX = median(recentSamples.map(s => s.error.x));
  const avgErrorY = median(recentSamples.map(s => s.error.y));

  // Apply correction with adjustment rate
  const { ADAPTIVE_ADJUSTMENT_RATE } = CALIBRATION_CONSTANTS;

  return {
    x: gaze.x + (avgErrorX * ADAPTIVE_ADJUSTMENT_RATE),
    y: gaze.y + (avgErrorY * ADAPTIVE_ADJUSTMENT_RATE)
  };
}

/**
 * Record user click for adaptive learning
 * Call this when user clicks during reading activity
 */
export function recordUserClick(
  clickPosition: Point,
  currentGaze: Point,
  rawGaze: { irisOffset: Point; headPose: { yaw: number; pitch: number } },
  profile: CalibrationProfile
): CalibrationProfile {
  const error: Point = {
    x: clickPosition.x - currentGaze.x,
    y: clickPosition.y - currentGaze.y
  };

  const errorSample = {
    timestamp: Date.now(),
    clickPosition,
    estimatedGaze: currentGaze,
    error,
    irisOffset: rawGaze.irisOffset,
    headPose: rawGaze.headPose
  };

  const updatedProfile: CalibrationProfile = {
    ...profile,
    lastUpdated: new Date(),
    adaptiveLearning: {
      ...profile.adaptiveLearning,
      totalClicks: profile.adaptiveLearning.totalClicks + 1,
      errorSamples: [
        ...profile.adaptiveLearning.errorSamples,
        errorSample
      ].slice(-100), // Keep last 100 samples
      currentAccuracy: calculateAccuracy([...profile.adaptiveLearning.errorSamples, errorSample])
    }
  };

  // Auto-refine sensitivity if enough samples collected
  if (updatedProfile.adaptiveLearning.totalClicks % 20 === 0) {
    return refineSensitivity(updatedProfile);
  }

  return updatedProfile;
}

/**
 * Calculate current accuracy from error samples
 */
function calculateAccuracy(errorSamples: any[]): number {
  if (errorSamples.length === 0) return 0;

  const recentSamples = errorSamples.slice(-20);
  const avgError = median(recentSamples.map(s =>
    Math.sqrt(s.error.x * s.error.x + s.error.y * s.error.y)
  ));

  // Convert error to accuracy (lower error = higher accuracy)
  // 0.1 error = 90% accuracy, 0.2 error = 80% accuracy
  return Math.max(0, Math.min(100, 100 - (avgError * 500)));
}

/**
 * Refine sensitivity based on accumulated error data
 */
function refineSensitivity(profile: CalibrationProfile): CalibrationProfile {
  const { errorSamples } = profile.adaptiveLearning;

  if (errorSamples.length < CALIBRATION_CONSTANTS.ADAPTIVE_MIN_SAMPLES) {
    return profile; // Not enough data
  }

  const recentSamples = errorSamples.slice(-20);

  // Calculate average errors
  const avgErrorX = median(recentSamples.map(s => s.error.x));
  const avgErrorY = median(recentSamples.map(s => s.error.y));

  // Calculate sensitivity adjustments
  const { ADAPTIVE_ADJUSTMENT_RATE } = CALIBRATION_CONSTANTS;
  const adjustmentX = avgErrorX * ADAPTIVE_ADJUSTMENT_RATE;
  const adjustmentY = avgErrorY * ADAPTIVE_ADJUSTMENT_RATE;

  console.log('🔧 Refining sensitivity:', {
    avgErrorX: avgErrorX.toFixed(4),
    avgErrorY: avgErrorY.toFixed(4),
    adjustmentX: adjustmentX.toFixed(4),
    adjustmentY: adjustmentY.toFixed(4)
  });

  const updatedProfile: CalibrationProfile = {
    ...profile,
    lastUpdated: new Date(),
    quickCalibration: {
      ...profile.quickCalibration,
      sensitivity: {
        ...profile.quickCalibration.sensitivity,
        baseX: profile.quickCalibration.sensitivity.baseX * (1 + adjustmentX),
        baseY: profile.quickCalibration.sensitivity.baseY * (1 + adjustmentY)
      }
    },
    adaptiveLearning: {
      ...profile.adaptiveLearning,
      refinementHistory: [
        ...profile.adaptiveLearning.refinementHistory,
        {
          timestamp: Date.now(),
          sensitivityAdjustment: { x: adjustmentX, y: adjustmentY }
        }
      ]
    }
  };

  // Save updated profile
  saveCalibrationProfile(updatedProfile);

  return updatedProfile;
}

/**
 * Save calibration profile to localStorage
 */
export function saveCalibrationProfile(profile: CalibrationProfile): void {
  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem('calibrationProfile', serialized);
    console.log('✅ Calibration profile saved');
  } catch (error) {
    console.error('❌ Failed to save calibration profile:', error);
  }
}

/**
 * Load calibration profile from localStorage
 */
export function loadCalibrationProfile(): CalibrationProfile | null {
  try {
    const serialized = localStorage.getItem('calibrationProfile');
    if (!serialized) return null;

    const profile = JSON.parse(serialized);
    console.log('✅ Calibration profile loaded');
    return profile;
  } catch (error) {
    console.error('❌ Failed to load calibration profile:', error);
    return null;
  }
}

/**
 * Create empty calibration profile
 */
export function createEmptyCalibrationProfile(userId: string): CalibrationProfile {
  return {
    userId,
    createdAt: new Date(),
    lastUpdated: new Date(),
    quickCalibration: {
      cameraPosition: { x: 0.5, y: 0.05 },
      naturalCenter: {
        irisOffsetX: 0,
        irisOffsetY: 0,
        headYaw: 0,
        headPitch: 0,
        timestamp: Date.now()
      },
      corners: [],
      sensitivity: {
        baseX: 35,  // Updated to match useGazeTracking values
        baseY: 35,  // Updated to match useGazeTracking values
        headYawMultiplier: 8,   // Updated to match useGazeTracking values
        headPitchMultiplier: 0  // Not used in current implementation
      },
      verificationScore: 0
    },
    adaptiveLearning: {
      totalClicks: 0,
      errorSamples: [],
      refinementHistory: [],
      currentAccuracy: 0
    }
  };
}
