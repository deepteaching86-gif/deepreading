/**
 * FaceMesh Gaze Service
 *
 * Client-side gaze tracking using MediaPipe Face Landmarker.
 * - 478 landmarks with iris detection (landmarks 468-477)
 * - Ridge Regression calibration with 13-feature vector
 * - 1-Euro adaptive filtering for smoothing
 * - Head pose as first-class regression feature
 * - Distance-aware gaze mapping
 * - East Asian eye optimizations (outer corner preference, adaptive EAR)
 * - Iris-diameter-based distance estimation
 */

import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { Matrix, inverse } from 'ml-matrix';
import { OneEuroFilter2D } from '../utils/oneEuroFilter';

// --- Landmark Indices ---
// NOTE: MediaPipe iris indices 468-472 appear on LEFT of image = subject's RIGHT eye
//       Iris indices 473-477 appear on RIGHT of image = subject's LEFT eye
const LEFT_IRIS_CENTER = 473;   // Subject's left iris
const RIGHT_IRIS_CENTER = 468;  // Subject's right iris
const LEFT_IRIS = [473, 474, 475, 476, 477];   // Subject's left iris ring
// Right iris: [468, 469, 470, 471, 472] - Subject's right iris ring

// Eye corners (outer preferred for East Asian eyes - epicanthic fold avoidance)
const RIGHT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 263;
const LEFT_EYE_INNER = 362;

// Precise EAR landmarks
const RIGHT_EYE_TOP = [159, 158, 157]; // upper eyelid
const RIGHT_EYE_BOTTOM = [145, 153, 154]; // lower eyelid
const LEFT_EYE_TOP = [386, 385, 384]; // upper eyelid
const LEFT_EYE_BOTTOM = [374, 380, 381]; // lower eyelid

// Average human iris diameter in mm
const IRIS_DIAMETER_MM = 11.7;

// --- Types ---
export interface GazePrediction {
  x: number;
  y: number;
  confidence: number;
  timestamp: number;
  headPose?: { pitch: number; yaw: number; roll: number };
  irisLeft?: { x: number; y: number };
  irisRight?: { x: number; y: number };
  earLeft: number;
  earRight: number;
}

interface CalibrationSample {
  ratioX: number;
  ratioY: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  distanceCm: number;
  leftRatioX: number;
  rightRatioX: number;
  leftRatioY: number;
  rightRatioY: number;
  screenX: number;
  screenY: number;
  timestamp: number;
}

interface RidgeCalibration {
  xWeights: number[];
  yWeights: number[];
  featureMeans: number[];
  featureStds: number[];
  refDistanceCm: number;
}

type GazeListener = (prediction: GazePrediction) => void;
type LandmarkListener = (landmarks: NormalizedLandmark[], videoElement: HTMLVideoElement) => void;

export type { NormalizedLandmark };
export { FaceLandmarker };

export class FaceMeshGazeService {
  private faceLandmarker: FaceLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private running = false;
  private paused = false;

  // Gaze estimation
  private smoothFilter: OneEuroFilter2D;
  private calibration: RidgeCalibration | null = null;
  private calibrationSamples: CalibrationSample[] = [];
  private gazeListener: GazeListener | null = null;
  private landmarkListener: LandmarkListener | null = null;

  // Confidence calculation
  private recentPredictions: Array<{ x: number; y: number }> = [];
  private readonly CONFIDENCE_WINDOW = 5;

  // EAR baseline (per-user, set during calibration)
  private earBaseline: number = 0.25;
  private earSamples: number[] = [];
  private readonly BLINK_THRESHOLD_RATIO = 0.6; // 60% of baseline = blink

  // Distance estimation
  private lastDistanceCm: number | null = null;

  // Frame rate control
  private lastFrameTime = 0;
  private readonly FRAME_INTERVAL = 1000 / 30;

  // Current raw iris ratios (for calibration sample collection)
  private currentIrisRatioX: number = 0.5;
  private currentIrisRatioY: number = 0.5;
  private currentLeftRatioX: number = 0.5;
  private currentRightRatioX: number = 0.5;
  private currentLeftRatioY: number = 0.5;
  private currentRightRatioY: number = 0.5;
  private currentHeadYaw: number = 0;
  private currentHeadPitch: number = 0;
  private currentHeadRoll: number = 0;
  private _debugFrameCount: number = 0;

  constructor() {
    this.smoothFilter = new OneEuroFilter2D({
      minCutoff: 1.0,
      beta: 0.007,
      dCutoff: 1.0,
    });
  }

  /**
   * Initialize MediaPipe Face Landmarker and webcam
   */
  async initialize(): Promise<boolean> {
    try {
      // Load MediaPipe Vision WASM
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      // Create Face Landmarker with iris detection
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });

      // Initialize webcam
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 },
        },
      });

      // Create hidden video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.setAttribute('playsinline', 'true');
      this.videoElement.setAttribute('autoplay', 'true');
      this.videoElement.muted = true;
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);
      await this.videoElement.play();

      const track = this.stream.getVideoTracks()[0];
      const settings = track.getSettings();
      console.log(`📹 Camera: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);

      return true;
    } catch (error) {
      console.error('FaceMeshGazeService initialization failed:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Start the tracking frame loop
   */
  async startTracking(): Promise<void> {
    if (!this.faceLandmarker || !this.videoElement) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    this.running = true;
    this.paused = false;
    this.lastFrameTime = 0;
    this.processFrame();
  }

  pauseTracking(): void {
    this.paused = true;
  }

  resumeTracking(): void {
    this.paused = false;
    if (this.running && this.animationFrameId === null) {
      this.processFrame();
    }
  }

  async stopTracking(): Promise<void> {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanup();
  }

  /**
   * Register gaze prediction callback
   */
  onGaze(listener: GazeListener): void {
    this.gazeListener = listener;
  }

  removeGazeListener(): void {
    this.gazeListener = null;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  onLandmarks(listener: LandmarkListener): void {
    this.landmarkListener = listener;
  }

  removeLandmarkListener(): void {
    this.landmarkListener = null;
  }

  isRunning(): boolean {
    return this.running && !this.paused;
  }

  /**
   * Reset the 1-Euro smooth filter.
   * Call this before starting verification or when switching gaze targets,
   * so the filter doesn't carry residual state from the previous position.
   */
  resetSmoothFilter(): void {
    this.smoothFilter.reset();
    this.recentPredictions = [];
  }

  /**
   * Get estimated distance to camera in cm (iris-diameter based)
   */
  getDistanceCm(): number | null {
    return this.lastDistanceCm;
  }

  // --- Calibration ---

  /**
   * Collect a calibration sample at the given screen position.
   * Call this while the user is looking at a known screen point.
   * Collects multiple iris ratio readings over time.
   */
  collectCalibrationSample(screenX: number, screenY: number): void {
    this.calibrationSamples.push({
      ratioX: this.currentIrisRatioX,
      ratioY: this.currentIrisRatioY,
      headYaw: this.currentHeadYaw,
      headPitch: this.currentHeadPitch,
      headRoll: this.currentHeadRoll,
      distanceCm: this.lastDistanceCm ?? 50,
      leftRatioX: this.currentLeftRatioX,
      rightRatioX: this.currentRightRatioX,
      leftRatioY: this.currentLeftRatioY,
      rightRatioY: this.currentRightRatioY,
      screenX,
      screenY,
      timestamp: performance.now(),
    });
  }

  /**
   * Train Ridge Regression from collected calibration samples.
   * Uses 13-feature vector with head pose and distance as first-class features.
   * Automatic lambda selection via Generalized Cross-Validation (GCV).
   */
  trainCalibration(): { accuracy: number; meanError?: number } {
    if (this.calibrationSamples.length < 9) {
      console.warn(`Not enough calibration samples: ${this.calibrationSamples.length}/9`);
      return { accuracy: 0 };
    }

    try {
      const n = this.calibrationSamples.length;

      // Reference distance = mean distance during calibration
      const refDistanceCm =
        this.calibrationSamples.reduce((s, sample) => s + sample.distanceCm, 0) / n;

      // Build raw feature matrix (before normalization)
      const rawFeatures: number[][] = [];
      const screenXValues: number[] = [];
      const screenYValues: number[] = [];

      for (const sample of this.calibrationSamples) {
        rawFeatures.push(this.buildFeatureVector(sample, refDistanceCm));
        screenXValues.push(sample.screenX);
        screenYValues.push(sample.screenY);
      }

      const numFeatures = rawFeatures[0].length;

      // Feature normalization: z-score (skip bias term at index 0)
      const featureMeans = new Array(numFeatures).fill(0);
      const featureStds = new Array(numFeatures).fill(1);

      for (let j = 1; j < numFeatures; j++) {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += rawFeatures[i][j];
        featureMeans[j] = sum / n;

        let varSum = 0;
        for (let i = 0; i < n; i++) {
          varSum += Math.pow(rawFeatures[i][j] - featureMeans[j], 2);
        }
        featureStds[j] = Math.sqrt(varSum / n);
        if (featureStds[j] < 1e-10) featureStds[j] = 1; // Prevent division by zero
      }

      // Normalize features
      const normalizedFeatures: number[][] = [];
      for (let i = 0; i < n; i++) {
        const row = [...rawFeatures[i]];
        for (let j = 1; j < numFeatures; j++) {
          row[j] = (row[j] - featureMeans[j]) / featureStds[j];
        }
        normalizedFeatures.push(row);
      }

      const X = new Matrix(normalizedFeatures);
      const yX = Matrix.columnVector(screenXValues);
      const yY = Matrix.columnVector(screenYValues);

      // GCV-based lambda selection
      const lambdaCandidates = [0.01, 0.1, 0.5, 1.0, 5.0, 10.0];
      let bestLambda = 1.0;
      let bestGCV = Infinity;

      const Xt = X.transpose();
      const XtX = Xt.mmul(X);

      for (const lambda of lambdaCandidates) {
        const reg = Matrix.eye(numFeatures).mul(lambda);
        reg.set(0, 0, 0); // Don't regularize bias term
        const XtX_reg = XtX.clone().add(reg);
        let XtX_reg_inv: Matrix;
        try {
          XtX_reg_inv = inverse(XtX_reg);
        } catch {
          continue;
        }

        // Hat matrix H = X * (X^T X + λI)^-1 * X^T
        const H = X.mmul(XtX_reg_inv).mmul(Xt);
        const trH = H.trace();
        const denominator = Math.pow(1 - trH / n, 2);
        if (denominator < 1e-10) continue;

        // Predictions
        const wX = XtX_reg_inv.mmul(Xt).mmul(yX);
        const wY = XtX_reg_inv.mmul(Xt).mmul(yY);
        const predX = X.mmul(wX).getColumn(0);
        const predY = X.mmul(wY).getColumn(0);

        // GCV score
        let residualSum = 0;
        for (let i = 0; i < n; i++) {
          residualSum +=
            Math.pow(screenXValues[i] - predX[i], 2) +
            Math.pow(screenYValues[i] - predY[i], 2);
        }
        const gcv = residualSum / (n * denominator);

        if (gcv < bestGCV) {
          bestGCV = gcv;
          bestLambda = lambda;
        }
      }

      // Train final model with best lambda
      const reg = Matrix.eye(numFeatures).mul(bestLambda);
      reg.set(0, 0, 0);
      const XtX_reg = XtX.clone().add(reg);
      const XtX_reg_inv = inverse(XtX_reg);
      const xWeights = XtX_reg_inv.mmul(Xt).mmul(yX).getColumn(0);
      const yWeights = XtX_reg_inv.mmul(Xt).mmul(yY).getColumn(0);

      this.calibration = {
        xWeights,
        yWeights,
        featureMeans,
        featureStds,
        refDistanceCm,
      };

      // Compute per-point training error (more stable than per-sample LOO-CV)
      // Group predictions by unique screen points, then average per-point error
      const predictions = X.mmul(Matrix.columnVector(xWeights)).getColumn(0);
      const predictionsY = X.mmul(Matrix.columnVector(yWeights)).getColumn(0);

      // Group samples by unique screen point (using screenX+screenY as key)
      const pointMap = new Map<string, { predXs: number[]; predYs: number[]; trueX: number; trueY: number }>();
      for (let i = 0; i < n; i++) {
        const key = `${screenXValues[i]},${screenYValues[i]}`;
        if (!pointMap.has(key)) {
          pointMap.set(key, { predXs: [], predYs: [], trueX: screenXValues[i], trueY: screenYValues[i] });
        }
        const group = pointMap.get(key)!;
        group.predXs.push(predictions[i]);
        group.predYs.push(predictionsY[i]);
      }

      let totalPointError = 0;
      const pointErrors: number[] = [];
      for (const [, group] of pointMap) {
        const avgPredX = group.predXs.reduce((s, v) => s + v, 0) / group.predXs.length;
        const avgPredY = group.predYs.reduce((s, v) => s + v, 0) / group.predYs.length;
        const err = Math.sqrt(
          Math.pow(avgPredX - group.trueX, 2) + Math.pow(avgPredY - group.trueY, 2)
        );
        pointErrors.push(err);
        totalPointError += err;
      }
      const meanError = totalPointError / pointMap.size;
      // Use screen diagonal as reference for accuracy (more forgiving than fixed 200px)
      const screenDiag = Math.sqrt(
        Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
      );
      const accuracy = Math.max(0, 1 - meanError / (screenDiag * 0.15));

      // Diagnostic: iris ratio range
      const rxMin = Math.min(...this.calibrationSamples.map(s => s.ratioX));
      const rxMax = Math.max(...this.calibrationSamples.map(s => s.ratioX));
      const ryMin = Math.min(...this.calibrationSamples.map(s => s.ratioY));
      const ryMax = Math.max(...this.calibrationSamples.map(s => s.ratioY));
      console.log(`   Iris ratio range: X=[${rxMin.toFixed(3)}, ${rxMax.toFixed(3)}], Y=[${ryMin.toFixed(3)}, ${ryMax.toFixed(3)}]`);
      console.log(`   Per-point errors: [${pointErrors.map(e => e.toFixed(0)).join(', ')}]px`);

      // Finalize EAR baseline
      if (this.earSamples.length > 0) {
        this.earBaseline = this.earSamples.reduce((a, b) => a + b, 0) / this.earSamples.length;
      }

      console.log(`🎯 Ridge Calibration: λ=${bestLambda}, per-point error=${meanError.toFixed(1)}px, accuracy=${accuracy.toFixed(2)}`);
      console.log(`   Features: ${numFeatures}, Samples: ${n}, RefDist: ${refDistanceCm.toFixed(1)}cm`);
      console.log(`   EAR baseline: ${this.earBaseline.toFixed(3)}`);

      // Reset filter for fresh tracking
      this.smoothFilter.reset();
      this.recentPredictions = [];

      return { accuracy, meanError };
    } catch (error) {
      console.error('Calibration training failed:', error);
      return { accuracy: 0 };
    }
  }

  clearCalibration(): void {
    this.calibration = null;
    this.calibrationSamples = [];
    this.earSamples = [];
    this.smoothFilter.reset();
    this.recentPredictions = [];
  }

  // --- Private Methods ---

  private processFrame(): void {
    if (!this.running) return;

    this.animationFrameId = requestAnimationFrame((timestamp) => {
      if (!this.running) return;

      // Frame rate limiting
      const elapsed = timestamp - this.lastFrameTime;
      if (elapsed < this.FRAME_INTERVAL) {
        this.processFrame();
        return;
      }
      this.lastFrameTime = timestamp;

      if (this.paused || !this.faceLandmarker || !this.videoElement) {
        this.processFrame();
        return;
      }

      // Skip if video not ready
      if (this.videoElement.readyState < 2) {
        this.processFrame();
        return;
      }

      try {
        const result = this.faceLandmarker.detectForVideo(this.videoElement, timestamp);

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          const transformMatrix = result.facialTransformationMatrixes?.[0];

          this.processFaceLandmarks(landmarks, transformMatrix, timestamp);
        } else {
          // No face detected
          if (this.gazeListener) {
            this.gazeListener({
              x: 0,
              y: 0,
              confidence: 0.0,
              timestamp,
              earLeft: 0,
              earRight: 0,
            });
          }
          if (this.landmarkListener && this.videoElement) {
            this.landmarkListener([], this.videoElement);
          }
        }
      } catch (error) {
        // Silently continue on frame processing errors
      }

      this.processFrame();
    });
  }

  private processFaceLandmarks(
    landmarks: any[],
    transformMatrix: any,
    timestamp: number
  ): void {
    // Extract iris centers
    const leftIrisCenter = landmarks[LEFT_IRIS_CENTER];
    const rightIrisCenter = landmarks[RIGHT_IRIS_CENTER];

    // Extract eye corners
    const leftOuter = landmarks[LEFT_EYE_OUTER];
    const leftInner = landmarks[LEFT_EYE_INNER];
    const rightOuter = landmarks[RIGHT_EYE_OUTER];
    const rightInner = landmarks[RIGHT_EYE_INNER];

    // Calculate iris-eye corner ratios (using outer corners for East Asian optimization)
    const leftRatioX = this.computeIrisRatio(
      leftIrisCenter.x, leftOuter.x, leftInner.x
    );
    const rightRatioX = this.computeIrisRatio(
      rightIrisCenter.x, rightOuter.x, rightInner.x
    );

    // DEBUG: Log raw coordinates every 60 frames
    if (!this._debugFrameCount) this._debugFrameCount = 0;
    this._debugFrameCount++;
    if (this._debugFrameCount % 60 === 1) {
      console.log(`🔍 LEFT eye: iris(${LEFT_IRIS_CENTER})=${leftIrisCenter.x.toFixed(4)}, outer(${LEFT_EYE_OUTER})=${leftOuter.x.toFixed(4)}, inner(${LEFT_EYE_INNER})=${leftInner.x.toFixed(4)} → ratio=${leftRatioX.toFixed(3)}`);
      console.log(`🔍 RIGHT eye: iris(${RIGHT_IRIS_CENTER})=${rightIrisCenter.x.toFixed(4)}, outer(${RIGHT_EYE_OUTER})=${rightOuter.x.toFixed(4)}, inner(${RIGHT_EYE_INNER})=${rightInner.x.toFixed(4)} → ratio=${rightRatioX.toFixed(3)}`);
    }

    // Vertical iris ratio
    const leftEyeTop = this.averageY(landmarks, LEFT_EYE_TOP);
    const leftEyeBottom = this.averageY(landmarks, LEFT_EYE_BOTTOM);
    const rightEyeTop = this.averageY(landmarks, RIGHT_EYE_TOP);
    const rightEyeBottom = this.averageY(landmarks, RIGHT_EYE_BOTTOM);

    const leftRatioY = this.computeVerticalRatio(
      leftIrisCenter.y, leftEyeTop, leftEyeBottom
    );
    const rightRatioY = this.computeVerticalRatio(
      rightIrisCenter.y, rightEyeTop, rightEyeBottom
    );

    // Average both eyes (more stable)
    // NOTE: Left eye ratio goes 0→1 as iris moves outer→inner (left→right gaze)
    //       Right eye ratio goes 0→1 as iris moves outer→inner (right→left gaze)
    //       They are INVERTED horizontally, so we flip rightRatioX to make both
    //       go in the same direction: 0 = looking left, 1 = looking right
    const ratioX = (leftRatioX + (1 - rightRatioX)) / 2;
    const ratioY = (leftRatioY + rightRatioY) / 2;

    // Store current ratios (for calibration sample collection)
    this.currentIrisRatioX = ratioX;
    this.currentIrisRatioY = ratioY;
    this.currentLeftRatioX = leftRatioX;
    this.currentRightRatioX = rightRatioX;
    this.currentLeftRatioY = leftRatioY;
    this.currentRightRatioY = rightRatioY;

    // Calculate EAR (Eye Aspect Ratio) for blink detection
    const earLeft = this.computeEAR(landmarks, 'left');
    const earRight = this.computeEAR(landmarks, 'right');
    const avgEAR = (earLeft + earRight) / 2;

    // Collect EAR samples during calibration
    if (!this.calibration && avgEAR > 0.1) {
      this.earSamples.push(avgEAR);
    }

    // Extract head pose from transformation matrix
    let headPose = { pitch: 0, yaw: 0, roll: 0 };
    if (transformMatrix) {
      headPose = this.extractHeadPose(transformMatrix);
    }
    this.currentHeadYaw = headPose.yaw;
    this.currentHeadPitch = headPose.pitch;
    this.currentHeadRoll = headPose.roll;

    // Estimate distance from iris diameter
    this.estimateDistance(landmarks);

    // Blink detection: EAR below threshold → confidence = 0
    const blinkThreshold = this.earBaseline * this.BLINK_THRESHOLD_RATIO;
    const isBlinking = avgEAR < blinkThreshold || avgEAR < 0.15;

    if (isBlinking) {
      if (this.gazeListener) {
        this.gazeListener({
          x: 0,
          y: 0,
          confidence: 0.0,
          timestamp,
          headPose,
          irisLeft: { x: leftIrisCenter.x, y: leftIrisCenter.y },
          irisRight: { x: rightIrisCenter.x, y: rightIrisCenter.y },
          earLeft,
          earRight,
        });
      }
      if (this.landmarkListener && this.videoElement) {
        this.landmarkListener(landmarks, this.videoElement);
      }
      return;
    }

    // Map to screen coordinates (only if calibrated)
    let screenX: number;
    let screenY: number;

    if (this.calibration) {
      const mapped = this.mapToScreen({
        ratioX, ratioY,
        headYaw: headPose.yaw, headPitch: headPose.pitch, headRoll: headPose.roll,
        distanceCm: this.lastDistanceCm ?? 50,
        leftRatioX, rightRatioX, leftRatioY, rightRatioY,
        screenX: 0, screenY: 0, timestamp,
      });
      screenX = mapped.x;
      screenY = mapped.y;
    } else {
      // Before calibration: rough linear mapping for preview
      screenX = ratioX * window.innerWidth;
      screenY = ratioY * window.innerHeight;
    }

    // Apply 1-Euro adaptive filter
    const filtered = this.smoothFilter.filter(screenX, screenY, timestamp / 1000);

    // Clamp to screen bounds
    const clampedX = Math.max(0, Math.min(window.innerWidth, filtered.x));
    const clampedY = Math.max(0, Math.min(window.innerHeight, filtered.y));

    // Compute confidence from prediction stability
    const confidence = this.computeConfidence(clampedX, clampedY);

    if (this.gazeListener) {
      this.gazeListener({
        x: clampedX,
        y: clampedY,
        confidence,
        timestamp,
        headPose,
        irisLeft: { x: leftIrisCenter.x, y: leftIrisCenter.y },
        irisRight: { x: rightIrisCenter.x, y: rightIrisCenter.y },
        earLeft,
        earRight,
      });
    }
    if (this.landmarkListener && this.videoElement) {
      this.landmarkListener(landmarks, this.videoElement);
    }
  }

  /**
   * Compute horizontal iris ratio: position of iris between outer and inner eye corners.
   * Uses outer corner as reference (East Asian optimization).
   */
  private computeIrisRatio(irisX: number, outerX: number, innerX: number): number {
    const range = innerX - outerX;
    if (Math.abs(range) < 0.001) return 0.5;
    let ratio = (irisX - outerX) / range;
    // Extended normalization range for East Asian eyes (0.15-0.85)
    ratio = Math.max(0.0, Math.min(1.0, ratio));
    return ratio;
  }

  /**
   * Compute vertical iris ratio
   */
  private computeVerticalRatio(irisY: number, topY: number, bottomY: number): number {
    const range = bottomY - topY;
    if (Math.abs(range) < 0.001) return 0.5;
    let ratio = (irisY - topY) / range;
    ratio = Math.max(0.0, Math.min(1.0, ratio));
    return ratio;
  }

  /**
   * Compute Eye Aspect Ratio (EAR)
   * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
   */
  private computeEAR(landmarks: any[], eye: 'left' | 'right'): number {
    const topIndices = eye === 'left' ? LEFT_EYE_TOP : RIGHT_EYE_TOP;
    const bottomIndices = eye === 'left' ? LEFT_EYE_BOTTOM : RIGHT_EYE_BOTTOM;
    const outerIdx = eye === 'left' ? LEFT_EYE_OUTER : RIGHT_EYE_OUTER;
    const innerIdx = eye === 'left' ? LEFT_EYE_INNER : RIGHT_EYE_INNER;

    // Vertical distances
    let verticalSum = 0;
    for (let i = 0; i < topIndices.length; i++) {
      const top = landmarks[topIndices[i]];
      const bottom = landmarks[bottomIndices[i]];
      verticalSum += Math.abs(top.y - bottom.y);
    }
    const avgVertical = verticalSum / topIndices.length;

    // Horizontal distance
    const outer = landmarks[outerIdx];
    const inner = landmarks[innerIdx];
    const horizontal = Math.sqrt(
      Math.pow(outer.x - inner.x, 2) + Math.pow(outer.y - inner.y, 2)
    );

    if (horizontal < 0.001) return 0;
    return avgVertical / (2 * horizontal);
  }

  /**
   * Get average Y coordinate of multiple landmark indices
   */
  private averageY(landmarks: any[], indices: number[]): number {
    let sum = 0;
    for (const idx of indices) {
      sum += landmarks[idx].y;
    }
    return sum / indices.length;
  }

  /**
   * Map iris ratios to screen coordinates using Ridge Regression with normalized features
   */
  private mapToScreen(sample: CalibrationSample): { x: number; y: number } {
    if (!this.calibration) {
      return { x: sample.ratioX * window.innerWidth, y: sample.ratioY * window.innerHeight };
    }

    const { xWeights, yWeights, featureMeans, featureStds, refDistanceCm } = this.calibration;

    // Build and normalize feature vector
    const raw = this.buildFeatureVector(sample, refDistanceCm);
    const features = [...raw];
    for (let j = 1; j < features.length; j++) {
      features[j] = (features[j] - featureMeans[j]) / featureStds[j];
    }

    // Dot product: screen = features · weights
    let screenX = 0;
    let screenY = 0;
    for (let i = 0; i < features.length; i++) {
      screenX += xWeights[i] * features[i];
      screenY += yWeights[i] * features[i];
    }

    return { x: screenX, y: screenY };
  }

  /**
   * Build 13-feature vector for Ridge Regression.
   * Features: [bias, rx, ry, rx², ry², rx*ry, headYaw_rad, headPitch_rad, headRoll_rad,
   *            rx*headYaw_rad, ry*headPitch_rad, distRatio, distRatio*rx]
   */
  private buildFeatureVector(sample: CalibrationSample, refDistanceCm?: number): number[] {
    const { ratioX: rx, ratioY: ry, headYaw, headPitch, headRoll, distanceCm } = sample;
    const toRad = Math.PI / 180;

    const distRatio = refDistanceCm && refDistanceCm > 0
      ? distanceCm / refDistanceCm
      : 1.0;

    return [
      1,                          // bias
      rx,                         // iris ratio X
      ry,                         // iris ratio Y
      rx * rx,                    // rx²
      ry * ry,                    // ry²
      rx * ry,                    // interaction
      headYaw * toRad,            // head yaw (radians)
      headPitch * toRad,          // head pitch (radians)
      headRoll * toRad,           // head roll (radians)
      rx * headYaw * toRad,       // iris-head interaction X
      ry * headPitch * toRad,     // iris-head interaction Y
      distRatio,                  // distance normalization
      distRatio * rx,             // distance-iris interaction
    ];
  }

  /**
   * Extract head pose (pitch, yaw, roll) from facial transformation matrix
   */
  private extractHeadPose(matrix: { data: Float32Array } | Float32Array): {
    pitch: number;
    yaw: number;
    roll: number;
  } {
    try {
      const data = 'data' in matrix ? matrix.data : matrix;
      if (!data || data.length < 16) {
        return { pitch: 0, yaw: 0, roll: 0 };
      }

      // 4x4 transformation matrix in column-major order
      const r00 = data[0];
      const r10 = data[1], r11 = data[5], r12 = data[9];
      const r20 = data[2], r21 = data[6], r22 = data[10];

      // Convert rotation matrix to Euler angles (degrees)
      const sy = Math.sqrt(r00 * r00 + r10 * r10);
      const singular = sy < 1e-6;

      let pitch: number, yaw: number, roll: number;
      if (!singular) {
        pitch = Math.atan2(r21, r22) * (180 / Math.PI);
        yaw = Math.atan2(-r20, sy) * (180 / Math.PI);
        roll = Math.atan2(r10, r00) * (180 / Math.PI);
      } else {
        pitch = Math.atan2(-r12, r11) * (180 / Math.PI);
        yaw = Math.atan2(-r20, sy) * (180 / Math.PI);
        roll = 0;
      }

      return { pitch, yaw, roll };
    } catch {
      return { pitch: 0, yaw: 0, roll: 0 };
    }
  }

  /**
   * Estimate camera distance using iris diameter
   * Real iris diameter ≈ 11.7mm
   * focal_length_px ≈ frame_width (approximation for standard webcam ~60° FOV)
   * distance = (IRIS_DIAMETER_MM * focal_length_px) / iris_diameter_px
   */
  private estimateDistance(landmarks: any[]): void {
    try {
      // Use left iris (indices 469-472 = cardinal points)
      const irisPoints = LEFT_IRIS.slice(1); // exclude center
      if (irisPoints.length < 4) return;

      // Calculate iris diameter in normalized coordinates
      const p1 = landmarks[irisPoints[0]]; // right
      const p2 = landmarks[irisPoints[1]]; // top
      const p3 = landmarks[irisPoints[2]]; // left
      const p4 = landmarks[irisPoints[3]]; // bottom

      const horizDiameter = Math.sqrt(
        Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2)
      );
      const vertDiameter = Math.sqrt(
        Math.pow(p2.x - p4.x, 2) + Math.pow(p2.y - p4.y, 2)
      );
      const avgDiameterNorm = (horizDiameter + vertDiameter) / 2;

      // Convert from normalized to pixels
      const frameWidth = this.videoElement?.videoWidth || 1280;
      const irisDiameterPx = avgDiameterNorm * frameWidth;

      if (irisDiameterPx > 1) {
        // Approximate focal length (standard webcam ~60° FOV)
        const focalLengthPx = frameWidth; // rough approximation
        const distanceMm = (IRIS_DIAMETER_MM * focalLengthPx) / irisDiameterPx;
        this.lastDistanceCm = distanceMm / 10;
      }
    } catch {
      // Distance estimation is non-critical
    }
  }

  /**
   * Compute confidence from recent prediction stability
   */
  private computeConfidence(x: number, y: number): number {
    this.recentPredictions.push({ x, y });
    if (this.recentPredictions.length > this.CONFIDENCE_WINDOW) {
      this.recentPredictions.shift();
    }

    if (this.recentPredictions.length < 3) return 0.5;

    // Standard deviation of recent predictions
    const meanX = this.recentPredictions.reduce((s, p) => s + p.x, 0) / this.recentPredictions.length;
    const meanY = this.recentPredictions.reduce((s, p) => s + p.y, 0) / this.recentPredictions.length;

    const varX = this.recentPredictions.reduce((s, p) => s + Math.pow(p.x - meanX, 2), 0) / this.recentPredictions.length;
    const varY = this.recentPredictions.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0) / this.recentPredictions.length;

    const stdDev = Math.sqrt((varX + varY) / 2);

    // Map stdDev to confidence: low stdDev = high confidence
    const confidence = Math.max(0, Math.min(1, 1 - stdDev / 150));
    return confidence;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }

    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }

    this.running = false;
    this.paused = false;
  }
}
