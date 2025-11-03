// Hybrid Gaze Estimator
// Fuses multiple gaze tracking algorithms (MediaPipe, OpenCV, 3D Model) for improved accuracy

export interface GazeEstimate {
  x: number;        // Screen X coordinate (pixels or normalized)
  y: number;        // Screen Y coordinate (pixels or normalized)
  confidence: number; // 0-1, algorithm confidence
  source: 'mediapipe' | 'opencv' | '3d-model' | 'hybrid';
}

export interface HybridGazeInput {
  mediapipe: GazeEstimate | null;
  opencv: GazeEstimate | null;
  model3d: GazeEstimate | null;
}

export interface HybridWeights {
  mediapipe: number; // Default: 0.6 (60%)
  opencv: number;    // Default: 0.25 (25%)
  model3d: number;   // Default: 0.15 (15%)
}

export interface HybridConfig {
  // Weight configuration
  baseWeights: HybridWeights;

  // Dynamic weighting based on confidence
  useDynamicWeighting: boolean;

  // Minimum confidence threshold to use an algorithm
  minConfidence: number; // Default: 0.3

  // Outlier detection
  outlierThreshold: number; // Default: 100 pixels (deviation from median)

  // Enable specific algorithms
  enableMediaPipe: boolean;
  enableOpenCV: boolean;
  enable3DModel: boolean;
}

const DEFAULT_CONFIG: HybridConfig = {
  baseWeights: {
    mediapipe: 0.6,
    opencv: 0.25,
    model3d: 0.15
  },
  useDynamicWeighting: true,
  minConfidence: 0.3,
  outlierThreshold: 100,
  enableMediaPipe: true,
  enableOpenCV: true,
  enable3DModel: true
};

export class HybridGazeEstimator {
  private config: HybridConfig;

  // Statistics for performance monitoring
  private stats = {
    totalEstimates: 0,
    mediapipeUsed: 0,
    opencvUsed: 0,
    model3dUsed: 0,
    hybridUsed: 0,
    averageConfidence: 0
  };

  constructor(config: Partial<HybridConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fuse multiple gaze estimates into a single hybrid estimate
   */
  estimate(input: HybridGazeInput): GazeEstimate {
    this.stats.totalEstimates++;

    // Filter out disabled or low-confidence algorithms
    const validEstimates = this.filterValidEstimates(input);

    // No valid estimates - return null estimate
    if (validEstimates.length === 0) {
      console.warn('⚠️ No valid gaze estimates available');
      return {
        x: 0,
        y: 0,
        confidence: 0,
        source: 'hybrid'
      };
    }

    // Single valid estimate - return it directly
    if (validEstimates.length === 1) {
      const estimate = validEstimates[0];
      this.updateStats(estimate.source);
      return estimate;
    }

    // Multiple estimates - perform hybrid fusion
    const fusedEstimate = this.fuseEstimates(validEstimates);
    this.stats.hybridUsed++;

    // Update average confidence
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (this.stats.totalEstimates - 1) +
        fusedEstimate.confidence) /
      this.stats.totalEstimates;

    // Log stats periodically (every 100 estimates)
    if (this.stats.totalEstimates % 100 === 0) {
      this.logStats();
    }

    return fusedEstimate;
  }

  /**
   * Filter valid estimates based on configuration and confidence
   */
  private filterValidEstimates(input: HybridGazeInput): GazeEstimate[] {
    const valid: GazeEstimate[] = [];

    // Check MediaPipe
    if (
      this.config.enableMediaPipe &&
      input.mediapipe &&
      input.mediapipe.confidence >= this.config.minConfidence
    ) {
      valid.push(input.mediapipe);
    }

    // Check OpenCV
    if (
      this.config.enableOpenCV &&
      input.opencv &&
      input.opencv.confidence >= this.config.minConfidence
    ) {
      valid.push(input.opencv);
    }

    // Check 3D Model
    if (
      this.config.enable3DModel &&
      input.model3d &&
      input.model3d.confidence >= this.config.minConfidence
    ) {
      valid.push(input.model3d);
    }

    // Outlier detection: Remove estimates far from median
    if (valid.length > 2) {
      return this.removeOutliers(valid);
    }

    return valid;
  }

  /**
   * Remove outliers using median absolute deviation
   */
  private removeOutliers(estimates: GazeEstimate[]): GazeEstimate[] {
    // Calculate median X and Y
    const xValues = estimates.map(e => e.x).sort((a, b) => a - b);
    const yValues = estimates.map(e => e.y).sort((a, b) => a - b);

    const medianX = xValues[Math.floor(xValues.length / 2)];
    const medianY = yValues[Math.floor(yValues.length / 2)];

    // Filter out estimates far from median
    return estimates.filter(estimate => {
      const distanceX = Math.abs(estimate.x - medianX);
      const distanceY = Math.abs(estimate.y - medianY);
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      return distance <= this.config.outlierThreshold;
    });
  }

  /**
   * Fuse multiple estimates using weighted average
   */
  private fuseEstimates(
    validEstimates: GazeEstimate[]
  ): GazeEstimate {
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let totalConfidence = 0;

    // Calculate weights for each estimate
    validEstimates.forEach(estimate => {
      let weight = this.getBaseWeight(estimate.source);

      // Apply dynamic weighting based on confidence
      if (this.config.useDynamicWeighting) {
        weight *= estimate.confidence;
      }

      weightedX += estimate.x * weight;
      weightedY += estimate.y * weight;
      totalWeight += weight;
      totalConfidence += estimate.confidence;
    });

    // Normalize
    const fusedX = weightedX / totalWeight;
    const fusedY = weightedY / totalWeight;
    const averageConfidence = totalConfidence / validEstimates.length;

    return {
      x: fusedX,
      y: fusedY,
      confidence: averageConfidence,
      source: 'hybrid'
    };
  }

  /**
   * Get base weight for an algorithm source
   */
  private getBaseWeight(
    source: 'mediapipe' | 'opencv' | '3d-model' | 'hybrid'
  ): number {
    switch (source) {
      case 'mediapipe':
        return this.config.baseWeights.mediapipe;
      case 'opencv':
        return this.config.baseWeights.opencv;
      case '3d-model':
        return this.config.baseWeights.model3d;
      default:
        return 1.0;
    }
  }

  /**
   * Update usage statistics
   */
  private updateStats(source: 'mediapipe' | 'opencv' | '3d-model' | 'hybrid'): void {
    switch (source) {
      case 'mediapipe':
        this.stats.mediapipeUsed++;
        break;
      case 'opencv':
        this.stats.opencvUsed++;
        break;
      case '3d-model':
        this.stats.model3dUsed++;
        break;
    }
  }

  /**
   * Log statistics to console
   */
  private logStats(): void {
    const total = this.stats.totalEstimates;
    console.log('📊 Hybrid Gaze Estimator Stats:', {
      total,
      mediapipe: `${((this.stats.mediapipeUsed / total) * 100).toFixed(1)}%`,
      opencv: `${((this.stats.opencvUsed / total) * 100).toFixed(1)}%`,
      model3d: `${((this.stats.model3dUsed / total) * 100).toFixed(1)}%`,
      hybrid: `${((this.stats.hybridUsed / total) * 100).toFixed(1)}%`,
      avgConfidence: this.stats.averageConfidence.toFixed(3)
    });
  }

  /**
   * Get current statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalEstimates: 0,
      mediapipeUsed: 0,
      opencvUsed: 0,
      model3dUsed: 0,
      hybridUsed: 0,
      averageConfidence: 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HybridConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Hybrid configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): HybridConfig {
    return { ...this.config };
  }
}

/**
 * Utility: Convert pupil position to gaze estimate
 * Used to convert OpenCV pupil detection to gaze coordinates
 */
export function pupilToGaze(
  pupilLeft: { x: number; y: number } | null,
  pupilRight: { x: number; y: number } | null,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } | null {
  if (!pupilLeft && !pupilRight) {
    return null;
  }

  // Use average of both eyes if both available
  if (pupilLeft && pupilRight) {
    return {
      x: ((pupilLeft.x + pupilRight.x) / 2) * screenWidth,
      y: ((pupilLeft.y + pupilRight.y) / 2) * screenHeight
    };
  }

  // Use single eye if only one available
  const pupil = pupilLeft || pupilRight;
  if (!pupil) return null;

  return {
    x: pupil.x * screenWidth,
    y: pupil.y * screenHeight
  };
}
