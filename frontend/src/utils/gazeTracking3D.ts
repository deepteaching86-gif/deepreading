/**
 * 3D Gaze Tracking System
 * Based on JEOresearch/EyeTracker approach with 3D geometric calculations
 */

import { Matrix, EigenvalueDecomposition } from 'ml-matrix';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Ray3D {
  origin: Point3D;
  direction: Vector3D;
}

export interface Matrix3x3 {
  data: number[][];
}

export interface FaceCoordinateSystem {
  center: Point3D;
  axes: Matrix3x3;  // Column vectors are the coordinate axes
  scale: number;    // Nose region scale for distance estimation
  timestamp: number;
}

export interface EyeSphere3D {
  center: Point3D;       // World coordinates
  localOffset: Point3D;  // Head-relative offset (stored during calibration)
  radius: number;
}

export interface VirtualMonitor {
  center: Point3D;    // Monitor center in mm
  normal: Vector3D;   // Normal vector (perpendicular to screen)
  width: number;      // Width in mm
  height: number;     // Height in mm
}

// ============================================================================
// Constants
// ============================================================================

// MediaPipe nose landmark indices for stable coordinate system
export const NOSE_LANDMARK_INDICES = [
  4, 45, 275, 220, 440, 1, 5, 51, 281, 44, 274, 241,
  461, 125, 354, 218, 438, 195, 167, 393, 165, 391, 3, 248
];

// Virtual monitor at 500mm distance
export const DEFAULT_VIRTUAL_MONITOR: VirtualMonitor = {
  center: { x: 0, y: 0, z: 500 },
  normal: { x: 0, y: 0, z: 1 },
  width: 600,  // 60cm
  height: 400  // 40cm
};

// Average inter-pupillary distance in mm
export const INTER_PUPILLARY_DISTANCE = 63;

// Average eye radius in mm (based on JEOresearch)
// Human eye is approximately 24mm diameter, so radius is 12mm
export const EYE_RADIUS = 12;

// Eye sphere model constants (from JEOresearch)
export const EYE_SPHERE_SCALE = 1.0;  // Sphere radius multiplier
export const IRIS_RADIUS_RATIO = 0.5; // Iris is about half the eye diameter

// ============================================================================
// Vector Operations
// ============================================================================

export function addPoints(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}

export function subtractPoints(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
}

export function multiplyScalar(p: Point3D, s: number): Point3D {
  return {
    x: p.x * s,
    y: p.y * s,
    z: p.z * s
  };
}

export function divideScalar(p: Point3D, s: number): Point3D {
  return {
    x: p.x / s,
    y: p.y / s,
    z: p.z / s
  };
}

export function dot(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function magnitude(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function normalize(v: Vector3D): Vector3D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return divideScalar(v, mag);
}

export function distance3D(a: Point3D, b: Point3D): number {
  const diff = subtractPoints(a, b);
  return magnitude(diff);
}

// ============================================================================
// Matrix Operations
// ============================================================================

export function multiplyMatrixVector(m: Matrix3x3, v: Point3D): Point3D {
  return {
    x: m.data[0][0] * v.x + m.data[0][1] * v.y + m.data[0][2] * v.z,
    y: m.data[1][0] * v.x + m.data[1][1] * v.y + m.data[1][2] * v.z,
    z: m.data[2][0] * v.x + m.data[2][1] * v.y + m.data[2][2] * v.z
  };
}

export function transposeMatrix(m: Matrix3x3): Matrix3x3 {
  return {
    data: [
      [m.data[0][0], m.data[1][0], m.data[2][0]],
      [m.data[0][1], m.data[1][1], m.data[2][1]],
      [m.data[0][2], m.data[1][2], m.data[2][2]]
    ]
  };
}

// ============================================================================
// Coordinate System Computation
// ============================================================================

/**
 * Compute stable face coordinate system from nose landmarks using PCA
 */
export function computeFaceCoordinateSystem(
  noseLandmarks: Point3D[],
  previousAxes?: Matrix3x3
): FaceCoordinateSystem {
  // Compute center
  const center = noseLandmarks.reduce(
    (sum, p) => addPoints(sum, p),
    { x: 0, y: 0, z: 0 }
  );
  const n = noseLandmarks.length;
  const centerPoint = divideScalar(center, n);

  // Center the points
  const centered = noseLandmarks.map(p => subtractPoints(p, centerPoint));

  // Compute covariance matrix
  const cov = computeCovariance(centered);

  // Compute eigenvectors (PCA)
  const eigenvectors = computeEigenvectors(cov);

  // Stabilize axes to prevent flipping
  const stabilizedAxes = previousAxes
    ? stabilizeAxes(eigenvectors, previousAxes)
    : eigenvectors;

  // Compute scale (average pairwise distance)
  const scale = computeNoseScale(noseLandmarks);

  return {
    center: centerPoint,
    axes: stabilizedAxes,
    scale,
    timestamp: Date.now()
  };
}

/**
 * Compute covariance matrix for PCA
 */
function computeCovariance(points: Point3D[]): number[][] {
  const n = points.length;
  const cov: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

  for (const p of points) {
    cov[0][0] += p.x * p.x;
    cov[0][1] += p.x * p.y;
    cov[0][2] += p.x * p.z;
    cov[1][0] += p.y * p.x;
    cov[1][1] += p.y * p.y;
    cov[1][2] += p.y * p.z;
    cov[2][0] += p.z * p.x;
    cov[2][1] += p.z * p.y;
    cov[2][2] += p.z * p.z;
  }

  // Normalize
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      cov[i][j] /= n;
    }
  }

  return cov;
}

/**
 * Compute eigenvectors using ml-matrix library
 */
function computeEigenvectors(cov: number[][]): Matrix3x3 {
  // Use ml-matrix for eigendecomposition
  const covMatrix = new Matrix(cov);
  const eigen = new EigenvalueDecomposition(covMatrix);
  const vectors = eigen.eigenvectorMatrix;

  // Convert to our Matrix3x3 format
  return {
    data: [
      [vectors.get(0, 0), vectors.get(0, 1), vectors.get(0, 2)],
      [vectors.get(1, 0), vectors.get(1, 1), vectors.get(1, 2)],
      [vectors.get(2, 0), vectors.get(2, 1), vectors.get(2, 2)]
    ]
  };
}

/**
 * Stabilize axes to prevent flipping between frames
 */
function stabilizeAxes(current: Matrix3x3, previous: Matrix3x3): Matrix3x3 {
  const stabilized: Matrix3x3 = { data: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] };

  // Check each axis and flip if necessary
  for (let i = 0; i < 3; i++) {
    const currentAxis = {
      x: current.data[0][i],
      y: current.data[1][i],
      z: current.data[2][i]
    };
    const previousAxis = {
      x: previous.data[0][i],
      y: previous.data[1][i],
      z: previous.data[2][i]
    };

    // If dot product is negative, flip the axis
    if (dot(currentAxis, previousAxis) < 0) {
      stabilized.data[0][i] = -current.data[0][i];
      stabilized.data[1][i] = -current.data[1][i];
      stabilized.data[2][i] = -current.data[2][i];
    } else {
      stabilized.data[0][i] = current.data[0][i];
      stabilized.data[1][i] = current.data[1][i];
      stabilized.data[2][i] = current.data[2][i];
    }
  }

  return stabilized;
}

/**
 * Compute nose scale for distance estimation
 */
function computeNoseScale(points: Point3D[]): number {
  const n = points.length;
  let totalDistance = 0;
  let count = 0;

  // Average pairwise distance
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalDistance += distance3D(points[i], points[j]);
      count++;
    }
  }

  return count > 0 ? totalDistance / count : 1;
}

// ============================================================================
// Eye Sphere Tracking
// ============================================================================

/**
 * Class for tracking 3D eye spheres
 */
export class EyeSphereTracker {
  private calibrationScale: number = 1;
  private leftEyeOffset: Point3D = { x: -INTER_PUPILLARY_DISTANCE / 2, y: 0, z: 0 };
  private rightEyeOffset: Point3D = { x: INTER_PUPILLARY_DISTANCE / 2, y: 0, z: 0 };
  private isCalibrated: boolean = false;
  
  // JEOresearch-inspired dynamic sphere radius
  private dynamicEyeRadius: number = EYE_RADIUS;

  /**
   * Calibrate eye positions relative to face coordinate system
   * Enhanced with JEOresearch approach
   */
  calibrate(
    faceCoords: FaceCoordinateSystem,
    leftIris3D: Point3D,
    rightIris3D: Point3D
  ): void {
    // Transform iris positions to face-local coordinates
    const transposedAxes = transposeMatrix(faceCoords.axes);
    
    // Left eye offset in face coordinates
    const leftOffset = subtractPoints(leftIris3D, faceCoords.center);
    this.leftEyeOffset = multiplyMatrixVector(transposedAxes, leftOffset);
    
    // Right eye offset in face coordinates
    const rightOffset = subtractPoints(rightIris3D, faceCoords.center);
    this.rightEyeOffset = multiplyMatrixVector(transposedAxes, rightOffset);
    
    // JEOresearch: Calculate dynamic eye radius based on inter-pupillary distance
    const actualIPD = magnitude(subtractPoints(rightIris3D, leftIris3D));
    const ipdRatio = actualIPD / INTER_PUPILLARY_DISTANCE;
    this.dynamicEyeRadius = EYE_RADIUS * ipdRatio * EYE_SPHERE_SCALE;
    
    // Store calibration scale
    this.calibrationScale = faceCoords.scale;
    this.isCalibrated = true;

    console.log('👁️ Eye spheres calibrated (JEO):', {
      leftOffset: this.leftEyeOffset,
      rightOffset: this.rightEyeOffset,
      scale: this.calibrationScale,
      dynamicRadius: this.dynamicEyeRadius,
      actualIPD: actualIPD
    });
  }

  /**
   * Track eye sphere positions in world coordinates
   */
  track(faceCoords: FaceCoordinateSystem): {
    left: EyeSphere3D;
    right: EyeSphere3D;
  } {
    // Scale compensation based on distance
    const scaleRatio = faceCoords.scale / this.calibrationScale;
    
    // Scale the offsets
    const scaledLeftOffset = multiplyScalar(this.leftEyeOffset, scaleRatio);
    const scaledRightOffset = multiplyScalar(this.rightEyeOffset, scaleRatio);
    
    // Transform to world coordinates
    const leftCenter = addPoints(
      faceCoords.center,
      multiplyMatrixVector(faceCoords.axes, scaledLeftOffset)
    );
    
    const rightCenter = addPoints(
      faceCoords.center,
      multiplyMatrixVector(faceCoords.axes, scaledRightOffset)
    );
    
    // JEOresearch: Use dynamic eye radius scaled by distance
    const scaledRadius = this.dynamicEyeRadius * scaleRatio;
    
    return {
      left: {
        center: leftCenter,
        localOffset: scaledLeftOffset,
        radius: scaledRadius
      },
      right: {
        center: rightCenter,
        localOffset: scaledRightOffset,
        radius: scaledRadius
      }
    };
  }

  /**
   * Check if calibration is complete
   */
  isReady(): boolean {
    return this.isCalibrated;
  }

  /**
   * Reset calibration
   */
  reset(): void {
    this.isCalibrated = false;
    this.calibrationScale = 1;
    this.leftEyeOffset = { x: -INTER_PUPILLARY_DISTANCE / 2, y: 0, z: 0 };
    this.rightEyeOffset = { x: INTER_PUPILLARY_DISTANCE / 2, y: 0, z: 0 };
  }
}

// ============================================================================
// Gaze Ray Computation
// ============================================================================

/**
 * Create a ray from eye center through iris center
 * JEOresearch: Enhanced with sphere-based projection
 */
export function createGazeRay(eyeCenter: Point3D, irisCenter: Point3D, eyeRadius: number = EYE_RADIUS): Ray3D {
  // Calculate direction from eye center to iris
  const rawDirection = subtractPoints(irisCenter, eyeCenter);
  
  // JEOresearch: Project iris onto eye sphere surface
  const distanceToIris = magnitude(rawDirection);
  
  // If iris is inside the sphere, project it to the surface
  if (distanceToIris < eyeRadius) {
    const projectionScale = eyeRadius / distanceToIris;
    const projectedIris = addPoints(eyeCenter, multiplyScalar(rawDirection, projectionScale));
    const direction = normalize(subtractPoints(projectedIris, eyeCenter));
    return {
      origin: eyeCenter,
      direction
    };
  }
  
  // Otherwise, use the raw direction
  const direction = normalize(rawDirection);
  return {
    origin: eyeCenter,
    direction
  };
}

/**
 * Compute combined binocular gaze ray
 * JEOresearch: Enhanced with proper sphere radius
 */
export function computeCombinedGaze(
  leftEye: EyeSphere3D,
  rightEye: EyeSphere3D,
  leftIris: Point3D,
  rightIris: Point3D
): Ray3D {
  // Individual gaze rays with sphere radii
  const leftRay = createGazeRay(leftEye.center, leftIris, leftEye.radius);
  const rightRay = createGazeRay(rightEye.center, rightIris, rightEye.radius);
  
  // JEOresearch: Weight combination based on eye dominance (default: equal)
  const leftWeight = 0.5;
  const rightWeight = 0.5;
  
  // Weighted average of directions
  const combinedDirection = normalize(
    addPoints(
      multiplyScalar(leftRay.direction, leftWeight),
      multiplyScalar(rightRay.direction, rightWeight)
    )
  );
  
  // Origin is midpoint between eyes
  const origin = divideScalar(
    addPoints(leftEye.center, rightEye.center),
    2
  );
  
  return {
    origin,
    direction: combinedDirection
  };
}

// ============================================================================
// Ray-Plane Intersection
// ============================================================================

/**
 * Compute intersection of gaze ray with virtual monitor plane
 */
export function computeMonitorIntersection(
  gazeRay: Ray3D,
  monitor: VirtualMonitor
): Point3D | null {
  const O = gazeRay.origin;
  const D = gazeRay.direction;
  const N = monitor.normal;
  const C = monitor.center;
  
  // Check if ray is parallel to plane
  const denom = dot(N, D);
  if (Math.abs(denom) < 0.0001) {
    return null;
  }
  
  // Compute intersection parameter t
  const t = dot(N, subtractPoints(C, O)) / denom;
  
  // Ray only intersects in forward direction
  if (t < 0) {
    return null;
  }
  
  // Compute intersection point
  return addPoints(O, multiplyScalar(D, t));
}

/**
 * Convert 3D intersection point to normalized screen coordinates
 * ✨ FIXED: Correct axis orientation and center recognition
 */
export function intersectionToScreenCoords(
  intersection: Point3D,
  monitor: VirtualMonitor
): { x: number; y: number } {
  const relative = subtractPoints(intersection, monitor.center);

  // Normalize to [0, 1] range
  // ✅ FIX 1: Invert X axis for webcam mirror effect (left looks left)
  // ✅ FIX 2: Invert Y axis (up is up, not down)
  let x = 0.5 - (relative.x / monitor.width);  // Inverted X
  let y = 0.5 - (relative.y / monitor.height); // Inverted Y

  // ✅ FIX 3: Center dead zone for precise center recognition (0.45-0.55 → 0.5)
  const CENTER_DEAD_ZONE = 0.05;  // 5% tolerance
  if (Math.abs(x - 0.5) < CENTER_DEAD_ZONE) {
    x = 0.5;
  }
  if (Math.abs(y - 0.5) < CENTER_DEAD_ZONE) {
    y = 0.5;
  }

  return { x, y };
}

// ============================================================================
// Smoothing and Filtering
// ============================================================================

/**
 * Deque-based smoothing filter for gaze direction
 */
export class GazeSmoother {
  private history: Vector3D[] = [];
  private maxLength: number;

  constructor(filterLength: number = 5) {
    this.maxLength = filterLength;
  }

  /**
   * Add sample and return smoothed result
   */
  addSample(direction: Vector3D): Vector3D {
    this.history.push(direction);
    
    // Maintain maximum length
    if (this.history.length > this.maxLength) {
      this.history.shift();
    }
    
    // Average all samples
    const sum = this.history.reduce(
      (acc, d) => addPoints(acc, d),
      { x: 0, y: 0, z: 0 }
    );
    
    return normalize(divideScalar(sum, this.history.length));
  }

  /**
   * Reset the filter
   */
  reset(): void {
    this.history = [];
  }
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Format 3D point for debugging
 */
export function formatPoint3D(p: Point3D, decimals: number = 2): string {
  return `(${p.x.toFixed(decimals)}, ${p.y.toFixed(decimals)}, ${p.z.toFixed(decimals)})`;
}

/**
 * Format vector for debugging
 */
export function formatVector3D(v: Vector3D, decimals: number = 3): string {
  return `[${v.x.toFixed(decimals)}, ${v.y.toFixed(decimals)}, ${v.z.toFixed(decimals)}]`;
}