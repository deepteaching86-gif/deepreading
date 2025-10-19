/**
 * Enhanced Gaze Calibration System
 * Implements 9-point calibration with polynomial regression and ridge regularization
 * Based on WebGazer.js research and best practices
 */

// ===== TYPES =====

export interface CalibrationPoint {
  screenX: number;  // Screen position (0-1)
  screenY: number;
  rawGazeX: number; // Raw gaze estimate (0-1)
  rawGazeY: number;
  irisOffsetX: number;  // Iris offset data
  irisOffsetY: number;
  headYaw: number;  // Head pose data
  headPitch: number;
}

export interface CalibrationResult {
  points: CalibrationPoint[];
  model: PolynomialRegressionModel;
  accuracy: number;  // Average error in screen coordinates (0-1)
  timestamp: number;
}

export interface PolynomialRegressionModel {
  coefficientsX: number[];  // Coefficients for X prediction
  coefficientsY: number[];  // Coefficients for Y prediction
  order: number;  // Polynomial order (default: 2)
}

// ===== CALIBRATION POINT GRID =====

/**
 * Generate 9-point calibration grid
 * Layout:
 * ┌─────┬─────┬─────┐
 * │  1  │  2  │  3  │
 * ├─────┼─────┼─────┤
 * │  4  │  5  │  6  │
 * ├─────┼─────┼─────┤
 * │  7  │  8  │  9  │
 * └─────┴─────┴─────┘
 */
export function generate9PointGrid(
  margin: number = 0.1  // 10% margin from edges
): Array<{ x: number; y: number; id: number }> {
  const positions = [
    // Corners (critical for periphery accuracy)
    { x: margin, y: margin, id: 0 },                // Top-left
    { x: 1 - margin, y: margin, id: 2 },            // Top-right
    { x: margin, y: 1 - margin, id: 6 },            // Bottom-left
    { x: 1 - margin, y: 1 - margin, id: 8 },        // Bottom-right

    // Edges (improves mid-range accuracy)
    { x: 0.5, y: margin, id: 1 },                   // Top-center
    { x: margin, y: 0.5, id: 3 },                   // Mid-left
    { x: 1 - margin, y: 0.5, id: 5 },               // Mid-right
    { x: 0.5, y: 1 - margin, id: 7 },               // Bottom-center

    // Center (reference point)
    { x: 0.5, y: 0.5, id: 4 }                       // Center
  ];

  return positions;
}

// ===== POLYNOMIAL REGRESSION =====

/**
 * Create polynomial features from raw gaze data
 * For 2nd order polynomial: [1, x, y, x², xy, y²]
 * For 1st order (affine): [1, x, y]
 */
function createPolynomialFeatures(
  irisOffsetX: number,
  irisOffsetY: number,
  headYaw: number,
  headPitch: number,
  order: number = 2
): number[] {
  if (order === 1) {
    // Linear features (affine transformation)
    return [
      1,  // Bias term
      irisOffsetX,
      irisOffsetY,
      headYaw,
      headPitch
    ];
  } else if (order === 2) {
    // Quadratic features (2nd order polynomial)
    return [
      1,  // Bias term

      // First order terms
      irisOffsetX,
      irisOffsetY,
      headYaw,
      headPitch,

      // Second order terms (cross products and squares)
      irisOffsetX * irisOffsetX,  // x²
      irisOffsetY * irisOffsetY,  // y²
      irisOffsetX * irisOffsetY,  // xy
      headYaw * headYaw,          // yaw²
      headPitch * headPitch,      // pitch²
      irisOffsetX * headYaw,      // x * yaw
      irisOffsetY * headPitch     // y * pitch
    ];
  }

  // Default to order 1 if invalid
  return createPolynomialFeatures(irisOffsetX, irisOffsetY, headYaw, headPitch, 1);
}

/**
 * Ridge Regression with L2 regularization
 * Prevents overfitting when calibration data is limited
 *
 * @param X - Feature matrix (n x m)
 * @param y - Target values (n x 1)
 * @param lambda - Regularization strength (default: 0.01)
 * @returns Coefficient vector (m x 1)
 */
function ridgeRegression(
  X: number[][],  // Feature matrix
  y: number[],    // Target values
  lambda: number = 0.01  // Regularization strength
): number[] {
  const n = X.length;  // Number of samples
  const m = X[0].length;  // Number of features

  // Compute X^T * X
  const XtX: number[][] = Array(m).fill(0).map(() => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum;
    }
  }

  // Add regularization: X^T * X + λI
  for (let i = 0; i < m; i++) {
    XtX[i][i] += lambda;
  }

  // Compute X^T * y
  const Xty: number[] = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    Xty[i] = sum;
  }

  // Solve (X^T * X + λI) * β = X^T * y using Gaussian elimination
  const coefficients = gaussianElimination(XtX, Xty);

  return coefficients;
}

/**
 * Gaussian Elimination with partial pivoting
 * Solves Ax = b for x
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;

  // Create augmented matrix [A | b]
  const augmented: number[][] = A.map((row, i) => [...row, b[i]]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }

    // Swap rows
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    // Skip if pivot is zero (singular matrix)
    if (Math.abs(augmented[col][col]) < 1e-10) {
      continue;
    }

    // Eliminate column
    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  // Back substitution
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= augmented[i][j] * x[j];
    }
    x[i] = Math.abs(augmented[i][i]) < 1e-10 ? 0 : sum / augmented[i][i];
  }

  return x;
}

// ===== CALIBRATION MODEL TRAINING =====

/**
 * Train polynomial regression model from calibration points
 */
export function trainCalibrationModel(
  points: CalibrationPoint[],
  order: number = 2,
  lambda: number = 0.01
): PolynomialRegressionModel {
  console.log(`🎓 Training ${order === 2 ? 'polynomial' : 'linear'} regression model with ${points.length} points`);

  // Create feature matrix X and target vectors yX, yY
  const X: number[][] = [];
  const yX: number[] = [];
  const yY: number[] = [];

  for (const point of points) {
    const features = createPolynomialFeatures(
      point.irisOffsetX,
      point.irisOffsetY,
      point.headYaw,
      point.headPitch,
      order
    );
    X.push(features);
    yX.push(point.screenX);
    yY.push(point.screenY);
  }

  // Train separate models for X and Y using ridge regression
  const coefficientsX = ridgeRegression(X, yX, lambda);
  const coefficientsY = ridgeRegression(X, yY, lambda);

  console.log('✅ Model trained:', {
    order,
    featuresCount: X[0].length,
    coefficientsX: coefficientsX.map(c => c.toFixed(4)),
    coefficientsY: coefficientsY.map(c => c.toFixed(4))
  });

  return {
    coefficientsX,
    coefficientsY,
    order
  };
}

/**
 * Apply trained model to predict screen gaze position
 */
export function applyCalibrationModel(
  model: PolynomialRegressionModel,
  irisOffsetX: number,
  irisOffsetY: number,
  headYaw: number,
  headPitch: number
): { x: number; y: number } {
  // Create feature vector
  const features = createPolynomialFeatures(
    irisOffsetX,
    irisOffsetY,
    headYaw,
    headPitch,
    model.order
  );

  // Compute dot product: prediction = features · coefficients
  let predX = 0;
  let predY = 0;

  for (let i = 0; i < features.length; i++) {
    predX += features[i] * model.coefficientsX[i];
    predY += features[i] * model.coefficientsY[i];
  }

  // Clamp to valid range
  return {
    x: Math.max(0, Math.min(1, predX)),
    y: Math.max(0, Math.min(1, predY))
  };
}

// ===== ACCURACY EVALUATION =====

/**
 * Calculate calibration accuracy (average Euclidean distance error)
 */
export function evaluateCalibrationAccuracy(
  model: PolynomialRegressionModel,
  points: CalibrationPoint[]
): number {
  let totalError = 0;

  for (const point of points) {
    const predicted = applyCalibrationModel(
      model,
      point.irisOffsetX,
      point.irisOffsetY,
      point.headYaw,
      point.headPitch
    );

    const dx = predicted.x - point.screenX;
    const dy = predicted.y - point.screenY;
    const error = Math.sqrt(dx * dx + dy * dy);

    totalError += error;
  }

  return totalError / points.length;
}

// ===== CALIBRATION STORAGE =====

const CALIBRATION_STORAGE_KEY = 'vision-test-calibration-v1';

/**
 * Save calibration to localStorage
 */
export function saveCalibration(result: CalibrationResult): void {
  try {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(result));
    console.log('✅ Calibration saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save calibration:', error);
  }
}

/**
 * Load calibration from localStorage
 */
export function loadCalibration(): CalibrationResult | null {
  try {
    const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!stored) {
      console.log('ℹ️ No stored calibration found');
      return null;
    }

    const result: CalibrationResult = JSON.parse(stored);

    // Check if calibration is expired (24 hours)
    const age = Date.now() - result.timestamp;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

    if (age > MAX_AGE) {
      console.log('⚠️ Stored calibration expired');
      localStorage.removeItem(CALIBRATION_STORAGE_KEY);
      return null;
    }

    console.log('✅ Calibration loaded:', {
      points: result.points.length,
      accuracy: result.accuracy.toFixed(4),
      age: `${Math.round(age / 1000 / 60)} minutes`
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to load calibration:', error);
    return null;
  }
}

/**
 * Clear stored calibration
 */
export function clearCalibration(): void {
  localStorage.removeItem(CALIBRATION_STORAGE_KEY);
  console.log('🗑️ Calibration cleared');
}

// ===== ONLINE CALIBRATION REFINEMENT =====

/**
 * Online calibration refinement
 * Updates model incrementally with new calibration points
 * Maintains a sliding window of recent calibration data
 */
export class OnlineCalibration {
  private points: CalibrationPoint[] = [];
  private readonly maxPoints: number = 50;  // Keep last 50 points
  private model: PolynomialRegressionModel | null = null;

  constructor(
    private readonly order: number = 2,
    private readonly lambda: number = 0.01
  ) {}

  /**
   * Add a new calibration point and retrain model
   */
  addPoint(point: CalibrationPoint): void {
    this.points.push(point);

    // Remove oldest points if exceeded max
    if (this.points.length > this.maxPoints) {
      this.points = this.points.slice(-this.maxPoints);
    }

    // Retrain model if we have enough points
    if (this.points.length >= 9) {
      this.model = trainCalibrationModel(this.points, this.order, this.lambda);
    }
  }

  /**
   * Get current model
   */
  getModel(): PolynomialRegressionModel | null {
    return this.model;
  }

  /**
   * Get current accuracy
   */
  getAccuracy(): number {
    if (!this.model || this.points.length === 0) {
      return 0;
    }
    return evaluateCalibrationAccuracy(this.model, this.points);
  }

  /**
   * Reset calibration
   */
  reset(): void {
    this.points = [];
    this.model = null;
  }
}
