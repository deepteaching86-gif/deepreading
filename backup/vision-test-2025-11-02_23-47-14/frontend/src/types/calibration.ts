/**
 * Calibration System Types
 * Hybrid Quick + Adaptive Calibration
 */

export interface Point {
  x: number;
  y: number;
}

export interface GazeData {
  irisOffsetX: number;
  irisOffsetY: number;
  headYaw: number;
  headPitch: number;
  timestamp: number;
}

export interface CornerData {
  target: Point;
  measuredSamples: GazeData[];
  avgMeasured: {
    irisX: number;
    irisY: number;
    headYaw: number;
    headPitch: number;
  };
}

export interface SensitivityMatrix {
  baseX: number;
  baseY: number;
  headYawMultiplier: number;
  headPitchMultiplier: number;
}

export interface QuickCalibrationData {
  cameraPosition: Point;
  naturalCenter: GazeData;
  corners: CornerData[];
  sensitivity: SensitivityMatrix;
  verificationScore: number;
}

export interface ErrorSample {
  timestamp: number;
  clickPosition: Point;
  estimatedGaze: Point;
  error: Point;
  irisOffset: Point;
  headPose: {
    yaw: number;
    pitch: number;
  };
}

export interface AdaptiveLearningData {
  totalClicks: number;
  errorSamples: ErrorSample[];
  refinementHistory: {
    timestamp: number;
    sensitivityAdjustment: Point;
  }[];
  currentAccuracy: number;
}

export interface CalibrationProfile {
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
  quickCalibration: QuickCalibrationData;
  adaptiveLearning: AdaptiveLearningData;
}

export enum CalibrationStage {
  CAMERA_MARKING = 'CAMERA_MARKING',
  NATURAL_CENTER = 'NATURAL_CENTER',
  CORNER_CALIBRATION = 'CORNER_CALIBRATION',
  AUTO_CALCULATE = 'AUTO_CALCULATE',
  VERIFICATION = 'VERIFICATION',
  COMPLETED = 'COMPLETED'
}

export interface CalibrationState {
  stage: CalibrationStage;
  progress: number; // 0.0 ~ 1.0
  currentCornerIndex?: number;
  isFixating: boolean;
  fixationProgress: number;
  message: string;
}

export interface CalibrationPoint {
  id: number;
  x: number;
  y: number;
  label: string;
}

// Stage 3: 4-Corner Points
export const CORNER_POINTS: CalibrationPoint[] = [
  { id: 1, x: 0.15, y: 0.15, label: '좌측 상단' },
  { id: 2, x: 0.85, y: 0.15, label: '우측 상단' },
  { id: 3, x: 0.85, y: 0.85, label: '우측 하단' },
  { id: 4, x: 0.15, y: 0.85, label: '좌측 하단' }
];

// Stage 5: Verification Points (랜덤 생성 함수)
export function generateVerificationPoints(count: number = 3): CalibrationPoint[] {
  const points: CalibrationPoint[] = [];

  for (let i = 0; i < count; i++) {
    points.push({
      id: i + 1,
      x: 0.3 + Math.random() * 0.4, // 0.3 ~ 0.7
      y: 0.3 + Math.random() * 0.4,
      label: `검증 포인트 ${i + 1}`
    });
  }

  return points;
}

// Constants
export const CALIBRATION_CONSTANTS = {
  // Stage 2: Natural Center
  NATURAL_CENTER_DURATION: 2000, // 2초

  // Stage 3: Corner Calibration
  CORNER_FIXATION_DURATION: 2000, // 2초 응시
  CORNER_DISTANCE_THRESHOLD: 0.2, // 완화된 임계값

  // Stage 5: Verification
  VERIFICATION_FIXATION_DURATION: 1500, // 1.5초
  VERIFICATION_DISTANCE_THRESHOLD: 0.15,
  VERIFICATION_REQUIRED_SUCCESSES: 2, // 3개 중 2개 성공

  // Adaptive Learning
  ADAPTIVE_MIN_SAMPLES: 10, // 최소 10번 클릭 후 보정
  ADAPTIVE_ADJUSTMENT_RATE: 0.1, // 10% 보정

  // Camera Parallax
  PARALLAX_FACTOR: 0.05
};
