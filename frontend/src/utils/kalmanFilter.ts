/**
 * Kalman Filter for Gaze Tracking
 * Reduces noise and improves tracking of fast eye movements
 * Based on constant velocity model with process and measurement noise
 */

export interface KalmanState {
  // State vector: [x, y, vx, vy] - position and velocity
  x: number[];

  // State covariance matrix (4x4)
  P: number[][];

  // Last update timestamp
  timestamp: number;
}

export interface KalmanFilterConfig {
  // Process noise covariance (how much we trust the model)
  processNoise: number;

  // Measurement noise covariance (how much we trust the measurements)
  measurementNoise: number;

  // Initial state covariance
  initialCovariance: number;
}

/**
 * Kalman Filter for 2D gaze position tracking
 * Uses constant velocity model: x(t+1) = x(t) + vx(t) * dt
 */
export class GazeKalmanFilter {
  private state: KalmanState | null = null;
  protected config: KalmanFilterConfig;

  constructor(config?: Partial<KalmanFilterConfig>) {
    this.config = {
      processNoise: config?.processNoise ?? 0.001,        // Low process noise (trust model)
      measurementNoise: config?.measurementNoise ?? 0.05, // Higher measurement noise (noisy sensors)
      initialCovariance: config?.initialCovariance ?? 1.0
    };
  }

  /**
   * Initialize filter with first measurement
   */
  initialize(x: number, y: number, timestamp: number): void {
    this.state = {
      x: [x, y, 0, 0], // Initial position, zero velocity
      P: [
        [this.config.initialCovariance, 0, 0, 0],
        [0, this.config.initialCovariance, 0, 0],
        [0, 0, this.config.initialCovariance, 0],
        [0, 0, 0, this.config.initialCovariance]
      ],
      timestamp
    };
  }

  /**
   * Predict next state based on constant velocity model
   */
  private predict(dt: number): void {
    if (!this.state) return;

    // State transition matrix F (constant velocity model)
    // [x']   [1 0 dt 0 ] [x ]
    // [y'] = [0 1 0  dt] [y ]
    // [vx']  [0 0 1  0 ] [vx]
    // [vy']  [0 0 0  1 ] [vy]
    const F = [
      [1, 0, dt, 0],
      [0, 1, 0, dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    // Process noise covariance Q (scaled by dt)
    const Q = [
      [this.config.processNoise * dt, 0, 0, 0],
      [0, this.config.processNoise * dt, 0, 0],
      [0, 0, this.config.processNoise, 0],
      [0, 0, 0, this.config.processNoise]
    ];

    // Predict state: x = F * x
    const x_pred = this.matrixVectorMultiply(F, this.state.x);

    // Predict covariance: P = F * P * F^T + Q
    const FP = this.matrixMultiply(F, this.state.P);
    const FPFT = this.matrixMultiply(FP, this.transpose(F));
    const P_pred = this.matrixAdd(FPFT, Q);

    this.state.x = x_pred;
    this.state.P = P_pred;
  }

  /**
   * Update state with new measurement
   */
  private update(z: number[]): void {
    if (!this.state) return;

    // Measurement matrix H (we only measure position, not velocity)
    // [z_x]   [1 0 0 0] [x ]
    // [z_y] = [0 1 0 0] [y ]
    //                    [vx]
    //                    [vy]
    const H = [
      [1, 0, 0, 0],
      [0, 1, 0, 0]
    ];

    // Measurement noise covariance R
    const R = [
      [this.config.measurementNoise, 0],
      [0, this.config.measurementNoise]
    ];

    // Innovation: y = z - H * x
    const Hx = this.matrixVectorMultiply(H, this.state.x);
    const y = [z[0] - Hx[0], z[1] - Hx[1]];

    // Innovation covariance: S = H * P * H^T + R
    const HP = this.matrixMultiply(H, this.state.P);
    const HPHT = this.matrixMultiply(HP, this.transpose(H));
    const S = this.matrixAdd(HPHT, R);

    // Kalman gain: K = P * H^T * S^-1
    const PHT = this.matrixMultiply(this.state.P, this.transpose(H));
    const S_inv = this.invert2x2(S);
    const K = this.matrixMultiply(PHT, S_inv);

    // Update state: x = x + K * y
    const Ky = this.matrixVectorMultiply(K, y);
    this.state.x = this.state.x.map((xi, i) => xi + Ky[i]);

    // Update covariance: P = (I - K * H) * P
    const I = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
    const KH = this.matrixMultiply(K, H);
    const I_KH = this.matrixSubtract(I, KH);
    this.state.P = this.matrixMultiply(I_KH, this.state.P);
  }

  /**
   * Process new measurement and return filtered estimate
   */
  filter(x: number, y: number, timestamp: number): { x: number; y: number } {
    // Initialize on first measurement
    if (!this.state) {
      this.initialize(x, y, timestamp);
      return { x, y };
    }

    // Calculate time delta
    const dt = (timestamp - this.state.timestamp) / 1000; // Convert to seconds

    // Skip if dt is invalid or too large (>1 second = tracking lost)
    if (dt <= 0 || dt > 1.0) {
      this.initialize(x, y, timestamp);
      return { x, y };
    }

    // Predict
    this.predict(dt);

    // Update with measurement
    this.update([x, y]);

    // Update timestamp
    this.state.timestamp = timestamp;

    // Return filtered position
    return {
      x: this.state.x[0],
      y: this.state.x[1]
    };
  }

  /**
   * Reset filter state
   */
  reset(): void {
    this.state = null;
  }

  /**
   * Get current velocity estimate
   */
  getVelocity(): { vx: number; vy: number } | null {
    if (!this.state) return null;
    return {
      vx: this.state.x[2],
      vy: this.state.x[3]
    };
  }

  // ===== Matrix Operations =====

  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < A.length; i++) {
      let sum = 0;
      for (let j = 0; j < v.length; j++) {
        sum += A[i][j] * v[j];
      }
      result.push(sum);
    }
    return result;
  }

  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const result: number[][] = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < inner; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private matrixAdd(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < A[i].length; j++) {
        row.push(A[i][j] + B[i][j]);
      }
      result.push(row);
    }
    return result;
  }

  private matrixSubtract(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < A[i].length; j++) {
        row.push(A[i][j] - B[i][j]);
      }
      result.push(row);
    }
    return result;
  }

  private transpose(A: number[][]): number[][] {
    const rows = A.length;
    const cols = A[0].length;
    const result: number[][] = Array(cols)
      .fill(0)
      .map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = A[i][j];
      }
    }
    return result;
  }

  private invert2x2(A: number[][]): number[][] {
    // Only works for 2x2 matrices
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];

    if (Math.abs(det) < 1e-10) {
      // Singular matrix - return identity
      return [
        [1, 0],
        [0, 1]
      ];
    }

    return [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det]
    ];
  }
}

/**
 * Adaptive Kalman Filter
 * Automatically adjusts noise parameters based on measurement consistency
 */
export class AdaptiveKalmanFilter extends GazeKalmanFilter {
  private measurementHistory: Array<{ x: number; y: number; timestamp: number }> = [];
  private readonly historySize = 10;

  filter(x: number, y: number, timestamp: number): { x: number; y: number } {
    // Add to history
    this.measurementHistory.push({ x, y, timestamp });
    if (this.measurementHistory.length > this.historySize) {
      this.measurementHistory.shift();
    }

    // Estimate measurement noise from recent variance
    if (this.measurementHistory.length >= 5) {
      const recentMeasurements = this.measurementHistory.slice(-5);
      const variance = this.calculateVariance(recentMeasurements);

      // Adapt measurement noise (higher variance = trust measurements less)
      const adaptedNoise = Math.max(0.01, Math.min(0.2, variance * 10));

      // Update config (this affects next prediction)
      this.config.measurementNoise = adaptedNoise;
    }

    // Call parent filter
    return super.filter(x, y, timestamp);
  }

  private calculateVariance(measurements: Array<{ x: number; y: number }>): number {
    if (measurements.length < 2) return 0.05; // Default

    // Calculate mean
    const meanX = measurements.reduce((sum, m) => sum + m.x, 0) / measurements.length;
    const meanY = measurements.reduce((sum, m) => sum + m.y, 0) / measurements.length;

    // Calculate variance
    const varianceX = measurements.reduce((sum, m) => sum + (m.x - meanX) ** 2, 0) / measurements.length;
    const varianceY = measurements.reduce((sum, m) => sum + (m.y - meanY) ** 2, 0) / measurements.length;

    return (varianceX + varianceY) / 2;
  }

  reset(): void {
    super.reset();
    this.measurementHistory = [];
  }
}
