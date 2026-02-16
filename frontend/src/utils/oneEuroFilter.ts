/**
 * 1-Euro Filter for adaptive signal smoothing
 *
 * Optimized for human input signals (mouse, touch, gaze tracking).
 * Provides jitter reduction at low speeds and low latency at high speeds.
 *
 * Reference: Casiez, Roussel, Vogel (2012)
 * "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
 * https://cristal.univ-lille.fr/~casiez/1euro/
 *
 * Algorithm: Public domain
 */

export interface OneEuroFilterConfig {
  /** Minimum cutoff frequency in Hz. Lower = smoother but more lag. Default: 1.0 */
  minCutoff: number;
  /** Speed coefficient. Higher = less lag during fast movements. Default: 0.007 */
  beta: number;
  /** Derivative cutoff frequency in Hz. Default: 1.0 */
  dCutoff: number;
}

const DEFAULT_CONFIG: OneEuroFilterConfig = {
  minCutoff: 1.0,
  beta: 0.007,
  dCutoff: 1.0,
};

/**
 * Low-pass filter using exponential smoothing
 */
class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.s === null) {
      this.s = value;
    } else {
      this.s = alpha * value + (1 - alpha) * this.s;
    }
    this.y = value;
    return this.s;
  }

  lastValue(): number {
    return this.y ?? 0;
  }

  lastSmoothed(): number {
    return this.s ?? 0;
  }

  reset(): void {
    this.y = null;
    this.s = null;
  }
}

/**
 * Compute smoothing factor alpha from cutoff frequency and time interval
 */
function smoothingFactor(tE: number, cutoff: number): number {
  const r = 2 * Math.PI * cutoff * tE;
  return r / (r + 1);
}

/**
 * 1-Euro Filter for 1D signal
 */
export class OneEuroFilter {
  private config: OneEuroFilterConfig;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTimestamp: number | null = null;
  private frequency: number = 30; // Initial estimated frequency

  constructor(config?: Partial<OneEuroFilterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  /**
   * Filter a value at the given timestamp (in seconds or milliseconds)
   * @param value - The raw input value
   * @param timestamp - Timestamp in seconds
   * @returns Filtered value
   */
  filter(value: number, timestamp: number): number {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.dxFilter.filter(0, smoothingFactor(1 / this.frequency, this.config.dCutoff));
      return this.xFilter.filter(value, smoothingFactor(1 / this.frequency, this.config.minCutoff));
    }

    const dt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Guard against zero or negative dt
    if (dt <= 0) {
      return this.xFilter.lastSmoothed();
    }

    // Update frequency estimate
    this.frequency = 1 / dt;

    // Estimate derivative (speed)
    const dValue = (value - this.xFilter.lastSmoothed()) / dt;
    const edValue = this.dxFilter.filter(dValue, smoothingFactor(dt, this.config.dCutoff));

    // Adaptive cutoff frequency: faster movement = higher cutoff = less smoothing
    const cutoff = this.config.minCutoff + this.config.beta * Math.abs(edValue);

    // Filter the value
    return this.xFilter.filter(value, smoothingFactor(dt, cutoff));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTimestamp = null;
    this.frequency = 30;
  }
}

/**
 * 1-Euro Filter for 2D signal (e.g. screen coordinates)
 */
export class OneEuroFilter2D {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(config?: Partial<OneEuroFilterConfig>) {
    this.xFilter = new OneEuroFilter(config);
    this.yFilter = new OneEuroFilter(config);
  }

  /**
   * Filter 2D coordinates at the given timestamp
   * @param x - Raw X coordinate
   * @param y - Raw Y coordinate
   * @param timestamp - Timestamp in seconds
   * @returns Filtered coordinates
   */
  filter(x: number, y: number, timestamp: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(x, timestamp),
      y: this.yFilter.filter(y, timestamp),
    };
  }

  reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}
