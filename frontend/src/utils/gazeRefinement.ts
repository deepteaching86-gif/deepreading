/**
 * Gaze Tracking Refinement and Environment Adaptation
 * Phase 3: Click-based calibration improvement and lighting adaptation
 */

import {
  CalibrationPoint,
  CalibrationResult,
  OnlineCalibration,
  PolynomialRegressionModel
} from './gazeCalibration';

// ===== CLICK-BASED CALIBRATION REFINEMENT =====

/**
 * Click-based calibration refinement
 * Collects user click data to improve calibration accuracy over time
 */
export class ClickBasedRefinement {
  private onlineCalibration: OnlineCalibration;
  private clickHistory: Array<{
    screenX: number;
    screenY: number;
    gazeX: number;
    gazeY: number;
    timestamp: number;
  }> = [];
  private readonly maxHistory = 100;

  constructor(initialCalibration?: CalibrationResult) {
    this.onlineCalibration = new OnlineCalibration(2, 0.01);

    if (initialCalibration) {
      this.onlineCalibration.loadInitialCalibration(initialCalibration);
    }
  }

  /**
   * Record a user click event for refinement
   * @param screenX - Click position X (0-1)
   * @param screenY - Click position Y (0-1)
   * @param gazeX - Gaze estimate X at click time (0-1)
   * @param gazeY - Gaze estimate Y at click time (0-1)
   * @param irisOffsetX - Raw iris offset X
   * @param irisOffsetY - Raw iris offset Y
   * @param headYaw - Head yaw at click time
   * @param headPitch - Head pitch at click time
   */
  recordClick(
    screenX: number,
    screenY: number,
    gazeX: number,
    gazeY: number,
    irisOffsetX: number,
    irisOffsetY: number,
    headYaw: number,
    headPitch: number
  ): void {
    const timestamp = Date.now();

    // Calculate error (distance between gaze and click)
    const dx = gazeX - screenX;
    const dy = gazeY - screenY;
    const error = Math.sqrt(dx * dx + dy * dy);

    // Only use clicks with reasonable error (<0.3 screen diagonal)
    if (error > 0.3) {
      console.warn('⚠️ Click refinement: Large error, skipping', {
        error: error.toFixed(3),
        gaze: `${gazeX.toFixed(2)}, ${gazeY.toFixed(2)}`,
        click: `${screenX.toFixed(2)}, ${screenY.toFixed(2)}`
      });
      return;
    }

    // Add to click history
    this.clickHistory.push({
      screenX,
      screenY,
      gazeX,
      gazeY,
      timestamp
    });

    // Keep only recent clicks
    if (this.clickHistory.length > this.maxHistory) {
      this.clickHistory.shift();
    }

    // Add calibration point to online calibration
    const calibrationPoint: CalibrationPoint = {
      screenX,
      screenY,
      rawGazeX: gazeX,
      rawGazeY: gazeY,
      irisOffsetX,
      irisOffsetY,
      headYaw,
      headPitch
    };

    this.onlineCalibration.addPoint(calibrationPoint);

    console.log('✅ Click refinement added:', {
      clicks: this.clickHistory.length,
      error: error.toFixed(3),
      accuracy: this.onlineCalibration.getAccuracy().toFixed(3)
    });
  }

  /**
   * Get current refined calibration model
   */
  getModel(): PolynomialRegressionModel | null {
    return this.onlineCalibration.getModel();
  }

  /**
   * Get current accuracy
   */
  getAccuracy(): number {
    return this.onlineCalibration.getAccuracy();
  }

  /**
   * Get click statistics
   */
  getStats(): {
    totalClicks: number;
    avgError: number;
    recentError: number;
  } {
    if (this.clickHistory.length === 0) {
      return { totalClicks: 0, avgError: 0, recentError: 0 };
    }

    // Calculate average error
    let totalError = 0;
    for (const click of this.clickHistory) {
      const dx = click.gazeX - click.screenX;
      const dy = click.gazeY - click.screenY;
      totalError += Math.sqrt(dx * dx + dy * dy);
    }
    const avgError = totalError / this.clickHistory.length;

    // Calculate recent error (last 10 clicks)
    const recentClicks = this.clickHistory.slice(-10);
    let recentTotalError = 0;
    for (const click of recentClicks) {
      const dx = click.gazeX - click.screenX;
      const dy = click.gazeY - click.screenY;
      recentTotalError += Math.sqrt(dx * dx + dy * dy);
    }
    const recentError = recentTotalError / recentClicks.length;

    return {
      totalClicks: this.clickHistory.length,
      avgError,
      recentError
    };
  }

  /**
   * Reset refinement data
   */
  reset(): void {
    this.clickHistory = [];
    this.onlineCalibration.reset();
  }
}

// ===== ENVIRONMENT ADAPTATION =====

export interface EnvironmentMetrics {
  brightness: number;     // 0-1, from video analysis
  contrast: number;       // 0-1, from video analysis
  lightingQuality: 'poor' | 'fair' | 'good' | 'excellent';
  timestamp: number;
}

/**
 * Analyze environment lighting from video frame
 */
export function analyzeEnvironment(
  videoElement: HTMLVideoElement,
  canvasElement?: HTMLCanvasElement
): EnvironmentMetrics {
  // Create temporary canvas if not provided
  const canvas = canvasElement || document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      brightness: 0.5,
      contrast: 0.5,
      lightingQuality: 'fair',
      timestamp: Date.now()
    };
  }

  // Set canvas size to match video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw current video frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Get image data (sample center region to avoid edges)
  const centerX = Math.floor(canvas.width * 0.25);
  const centerY = Math.floor(canvas.height * 0.25);
  const sampleWidth = Math.floor(canvas.width * 0.5);
  const sampleHeight = Math.floor(canvas.height * 0.5);

  const imageData = ctx.getImageData(centerX, centerY, sampleWidth, sampleHeight);
  const pixels = imageData.data;

  // Calculate brightness (average luminance)
  let totalLuminance = 0;
  let minLuminance = 255;
  let maxLuminance = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Calculate luminance (weighted RGB)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    totalLuminance += luminance;
    minLuminance = Math.min(minLuminance, luminance);
    maxLuminance = Math.max(maxLuminance, luminance);
  }

  const pixelCount = pixels.length / 4;
  const avgLuminance = totalLuminance / pixelCount;
  const brightness = avgLuminance / 255;

  // Calculate contrast (range / average)
  const contrast = (maxLuminance - minLuminance) / 255;

  // Determine lighting quality
  let lightingQuality: 'poor' | 'fair' | 'good' | 'excellent';
  if (brightness < 0.3 || brightness > 0.85) {
    lightingQuality = 'poor';  // Too dark or too bright
  } else if (contrast < 0.3) {
    lightingQuality = 'poor';  // Low contrast
  } else if (brightness >= 0.4 && brightness <= 0.7 && contrast >= 0.5) {
    lightingQuality = 'excellent';
  } else if (brightness >= 0.35 && brightness <= 0.75 && contrast >= 0.4) {
    lightingQuality = 'good';
  } else {
    lightingQuality = 'fair';
  }

  return {
    brightness,
    contrast,
    lightingQuality,
    timestamp: Date.now()
  };
}

/**
 * Get recommended calibration parameters based on environment
 */
export function getAdaptiveParameters(environment: EnvironmentMetrics): {
  measurementNoise: number;
  processNoise: number;
  sensitivityMultiplier: number;
} {
  // Poor lighting: increase noise tolerance, reduce sensitivity
  if (environment.lightingQuality === 'poor') {
    return {
      measurementNoise: 0.1,   // High noise (don't trust measurements)
      processNoise: 0.002,     // Higher process noise
      sensitivityMultiplier: 0.8  // Reduce sensitivity
    };
  }

  // Fair lighting: moderate parameters
  if (environment.lightingQuality === 'fair') {
    return {
      measurementNoise: 0.05,
      processNoise: 0.001,
      sensitivityMultiplier: 0.9
    };
  }

  // Good lighting: standard parameters
  if (environment.lightingQuality === 'good') {
    return {
      measurementNoise: 0.03,
      processNoise: 0.001,
      sensitivityMultiplier: 1.0
    };
  }

  // Excellent lighting: trust measurements, increase sensitivity
  return {
    measurementNoise: 0.02,  // Low noise (trust measurements)
    processNoise: 0.0005,    // Lower process noise
    sensitivityMultiplier: 1.1  // Increase sensitivity
  };
}

/**
 * Continuous environment monitoring
 * Periodically checks lighting conditions and updates adaptive parameters
 */
export class EnvironmentMonitor {
  private currentMetrics: EnvironmentMetrics | null = null;
  private intervalId: number | null = null;
  private readonly checkInterval = 5000; // Check every 5 seconds

  constructor(
    private readonly videoElement: HTMLVideoElement,
    private readonly canvasElement?: HTMLCanvasElement,
    private readonly onMetricsUpdate?: (metrics: EnvironmentMetrics) => void
  ) {}

  /**
   * Start monitoring environment
   */
  start(): void {
    if (this.intervalId !== null) {
      console.warn('⚠️ Environment monitor already running');
      return;
    }

    // Initial check
    this.check();

    // Set up periodic checks
    this.intervalId = window.setInterval(() => {
      this.check();
    }, this.checkInterval);

    console.log('✅ Environment monitor started');
  }

  /**
   * Stop monitoring environment
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Environment monitor stopped');
    }
  }

  /**
   * Perform environment check
   */
  private check(): void {
    this.currentMetrics = analyzeEnvironment(this.videoElement, this.canvasElement);

    console.log('📊 Environment metrics:', {
      brightness: this.currentMetrics.brightness.toFixed(2),
      contrast: this.currentMetrics.contrast.toFixed(2),
      quality: this.currentMetrics.lightingQuality
    });

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(this.currentMetrics);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): EnvironmentMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Get current adaptive parameters
   */
  getAdaptiveParameters(): {
    measurementNoise: number;
    processNoise: number;
    sensitivityMultiplier: number;
  } | null {
    if (!this.currentMetrics) {
      return null;
    }
    return getAdaptiveParameters(this.currentMetrics);
  }
}
