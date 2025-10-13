// Vision TEST TypeScript Types
// Based on VISION_TEST_PRD.md specifications

// ===== Gaze Data Types =====

export enum GazeType {
  FIXATION = 'fixation',
  SACCADE = 'saccade',
  BLINK = 'blink',
  OFF_PAGE = 'off_page'
}

export interface GazePoint {
  timestamp: number; // Unix timestamp in milliseconds
  x: number; // Screen x coordinate (0-1 normalized)
  y: number; // Screen y coordinate (0-1 normalized)
  confidence: number; // 0-1 confidence score
  type: GazeType;
  pupilDiameter?: number; // For cognitive load analysis
}

export interface GazeChunk {
  passageId: string;
  gazePoints: GazePoint[];
  startTime: Date;
  endTime: Date;
  totalPoints: number;
}

// ===== Calibration Types =====

export interface CalibrationPoint {
  id: number; // 1-9
  screenX: number; // Expected position x (normalized 0-1)
  screenY: number; // Expected position y (normalized 0-1)
  actualX: number; // User's gaze x (normalized 0-1)
  actualY: number; // User's gaze y (normalized 0-1)
  error: number; // Euclidean distance in pixels
  attempts: number; // Number of times user tried this point
}

export interface CalibrationResult {
  calibrationId: string;
  overallAccuracy: number; // 0-100 percentage
  points: CalibrationPoint[];
  transformMatrix: number[][]; // 3x3 affine transformation matrix
  deviceInfo: DeviceInfo;
  expiresAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  platform: string;
  cameraResolution?: {
    width: number;
    height: number;
  };
}

// ===== Vision Config (TestTemplate.visionConfig) =====

export interface VisionPassage {
  id: string;
  text: string;
  fontSize: number; // px
  lineHeight: number; // unitless multiplier
  difficulty: number; // 1-10
  expectedWPM: number;
  showPassageWithQuestions: boolean; // TOGGLE: true = show passage with questions, false = memory test
  wordCount: number;
  estimatedReadingTime: number; // seconds
}

export interface ExpectedMetrics {
  saccade: [number, number]; // [min, max] in pixels
  fixation: [number, number]; // [min, max] in milliseconds
  regression: number; // max acceptable percentage
  wpm: [number, number]; // [min, max] words per minute
}

export interface VisionConfig {
  enableEyeTracking: boolean;
  targetGrade: number; // 1-9
  calibrationPoints: number; // Default 9
  passages: VisionPassage[];
  expectedMetrics: ExpectedMetrics;
}

// ===== Metrics Types =====

export interface VisionMetrics {
  // A. Eye Movement Patterns (6 metrics)
  averageSaccadeAmplitude: number; // pixels
  saccadeVariability: number; // standard deviation
  averageSaccadeVelocity: number; // pixels/second
  optimalLandingRate: number; // percentage 0-100
  returnSweepAccuracy: number; // percentage 0-100
  scanPathEfficiency: number; // 0-1 score

  // B. Fixation Behavior (4 metrics)
  averageFixationDuration: number; // milliseconds
  fixationsPerWord: number; // count
  regressionRate: number; // percentage 0-100
  vocabularyGapScore: number; // 0-100 score

  // C. Reading Speed & Rhythm (3 metrics)
  wordsPerMinute: number; // WPM
  rhythmRegularity: number; // 0-1 score
  staminaScore: number; // 0-100 score

  // D. Comprehension & Cognitive (2 metrics)
  gazeComprehensionCorrelation: number; // -1 to 1 correlation
  cognitiveLoadIndex: number; // 0-100 index

  // Overall Score
  overallEyeTrackingScore: number; // 0-100 score

  // Detailed breakdown
  detailedAnalysis?: MetricDetailedAnalysis;
  comparisonWithPeers?: PeerComparison;
}

export interface MetricDetailedAnalysis {
  saccadeDistribution: {
    short: number; // < 4 characters
    medium: number; // 4-8 characters
    long: number; // > 8 characters
  };
  fixationDistribution: {
    brief: number; // < 150ms
    normal: number; // 150-300ms
    prolonged: number; // > 300ms
  };
  regressionTypes: {
    interWord: number; // Within same word
    intraLine: number; // Same line
    interLine: number; // Different lines
  };
  readingSpeed: {
    firstHalf: number; // WPM in first half
    secondHalf: number; // WPM in second half
    fluctuation: number; // Variability score
  };
}

export interface PeerComparison {
  grade: number;
  sampleSize: number;
  percentileRank: number; // 0-100
  metricsComparison: {
    [key: string]: {
      studentValue: number;
      peerAverage: number;
      peerStdDev: number;
      zScore: number;
    };
  };
}

// ===== AI Analysis Types =====

export interface AIAnalysisResult {
  readingStrategy: 'fluent' | 'struggling' | 'developing' | 'advanced';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  confidenceScore: number; // 0-1
  narrative: string; // Human-readable analysis
  detectedPatterns: {
    pattern: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    explanation: string;
  }[];
}

// ===== Heatmap Types =====

export interface HeatmapData {
  passageId: string;
  resolution: {
    width: number;
    height: number;
  };
  cells: HeatmapCell[];
}

export interface HeatmapCell {
  x: number; // Grid x coordinate
  y: number; // Grid y coordinate
  intensity: number; // 0-1 normalized fixation time
  fixationCount: number;
  averageFixationDuration: number; // milliseconds
}

// ===== Calibration Adjustment Types =====

export interface CalibrationAdjustment {
  offsetX: number; // pixels
  offsetY: number; // pixels
  scaleX: number; // multiplier (0.8 - 1.2)
  scaleY: number; // multiplier (0.8 - 1.2)
  rotation: number; // degrees (-5 to 5)
}

export interface AdjustmentResult {
  adjustmentId: string;
  originalAccuracy: number;
  improvedAccuracy: number;
  improvementScore: number; // percentage improvement
  adjustments: CalibrationAdjustment;
  notes?: string;
}

// ===== API Request/Response Types =====

// Calibration
export interface CheckEnvironmentRequest {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
}

export interface CheckEnvironmentResponse {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
  requiredPermissions: string[];
}

export interface StartCalibrationRequest {
  userId: string;
  deviceInfo: DeviceInfo;
}

export interface StartCalibrationResponse {
  calibrationId: string;
  points: Array<{ id: number; x: number; y: number }>;
  instructions: string;
}

export interface RecordCalibrationPointRequest {
  calibrationId: string;
  pointId: number;
  gazeX: number;
  gazeY: number;
}

export interface ValidateCalibrationRequest {
  calibrationId: string;
}

export interface ValidateCalibrationResponse {
  valid: boolean;
  accuracy: number;
  calibrationResult: CalibrationResult;
  message: string;
}

// Session
export interface StartVisionSessionRequest {
  sessionId: string; // From existing TestSession
  calibrationId: string;
}

export interface StartVisionSessionResponse {
  visionSessionId: string;
  passages: VisionPassage[];
  calibrationScore: number;
}

export interface SaveGazeDataRequest {
  visionSessionId: string;
  gazeChunk: GazeChunk;
}

export interface SubmitVisionSessionRequest {
  visionSessionId: string;
  finalGazeData?: GazeChunk;
}

export interface SubmitVisionSessionResponse {
  success: boolean;
  metricsCalculated: boolean;
  aiAnalysisScheduled: boolean;
}

// Metrics & Analysis
export interface CalculateMetricsRequest {
  visionSessionId: string;
  correctAnswers?: number;
  totalQuestions?: number;
}

export interface GetVisionReportResponse {
  visionSessionId: string;
  studentName: string;
  grade: number;
  testDate: Date;
  calibrationScore: number;
  metrics: VisionMetrics;
  aiAnalysis: AIAnalysisResult;
  heatmapData: HeatmapData[];
  passages: VisionPassage[];
  gazeReplayAvailable: boolean;
}

// Admin
export interface GetGazeReplayRequest {
  visionSessionId: string;
}

export interface GetGazeReplayResponse {
  visionSessionId: string;
  passages: VisionPassage[];
  gazeData: GazeChunk[];
  totalDuration: number; // seconds
  totalGazePoints: number;
}

export interface AdjustCalibrationRequest {
  visionSessionId: string;
  adminId: string;
  adjustments: CalibrationAdjustment;
  notes?: string;
}

export interface AdjustCalibrationResponse {
  adjustmentId: string;
  result: AdjustmentResult;
  updatedGazeData: boolean;
}

// ===== Error Types =====

export class VisionTestError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'VisionTestError';
  }
}

export enum VisionErrorCode {
  CALIBRATION_EXPIRED = 'CALIBRATION_EXPIRED',
  CALIBRATION_NOT_FOUND = 'CALIBRATION_NOT_FOUND',
  CALIBRATION_ACCURACY_LOW = 'CALIBRATION_ACCURACY_LOW',
  INCOMPATIBLE_DEVICE = 'INCOMPATIBLE_DEVICE',
  INVALID_GAZE_DATA = 'INVALID_GAZE_DATA',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  METRICS_CALCULATION_FAILED = 'METRICS_CALCULATION_FAILED',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  UNAUTHORIZED_ADJUSTMENT = 'UNAUTHORIZED_ADJUSTMENT'
}
