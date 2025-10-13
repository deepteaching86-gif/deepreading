// Vision TEST Frontend Types
// Matches backend types from backend/src/types/vision.types.ts

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

// Calibration Types
export interface CalibrationPoint {
  id: number; // 1-9
  screenX: number; // Expected position x (normalized 0-1)
  screenY: number; // Expected position y (normalized 0-1)
  actualX: number; // User's gaze x (normalized 0-1)
  actualY: number; // User's gaze y (normalized 0-1)
  error: number; // Euclidean distance in pixels
  attempts: number;
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

export interface CalibrationResult {
  calibrationId: string;
  overallAccuracy: number; // 0-100 percentage
  points: CalibrationPoint[];
  transformMatrix: number[][]; // 3x3 affine transformation
  deviceInfo: DeviceInfo;
  expiresAt: Date;
}

// Vision Config
export interface VisionPassage {
  id: string;
  text: string;
  fontSize: number;
  lineHeight: number;
  difficulty: number;
  expectedWPM: number;
  showPassageWithQuestions: boolean;
  wordCount: number;
  estimatedReadingTime: number;
}

export interface ExpectedMetrics {
  saccade: [number, number];
  fixation: [number, number];
  regression: number;
  wpm: [number, number];
}

export interface VisionConfig {
  enableEyeTracking: boolean;
  targetGrade: number;
  calibrationPoints: number;
  passages: VisionPassage[];
  expectedMetrics: ExpectedMetrics;
}

// Metrics
export interface VisionMetrics {
  // A. Eye Movement Patterns (6 metrics)
  averageSaccadeAmplitude: number;
  saccadeVariability: number;
  averageSaccadeVelocity: number;
  optimalLandingRate: number;
  returnSweepAccuracy: number;
  scanPathEfficiency: number;

  // B. Fixation Behavior (4 metrics)
  averageFixationDuration: number;
  fixationsPerWord: number;
  regressionRate: number;
  vocabularyGapScore: number;

  // C. Reading Speed & Rhythm (3 metrics)
  wordsPerMinute: number;
  rhythmRegularity: number;
  staminaScore: number;

  // D. Comprehension & Cognitive (2 metrics)
  gazeComprehensionCorrelation: number;
  cognitiveLoadIndex: number;

  // Overall
  overallEyeTrackingScore: number;

  detailedAnalysis?: MetricDetailedAnalysis;
  comparisonWithPeers?: PeerComparison;
}

export interface MetricDetailedAnalysis {
  saccadeDistribution: {
    short: number;
    medium: number;
    long: number;
  };
  fixationDistribution: {
    brief: number;
    normal: number;
    prolonged: number;
  };
  regressionTypes: {
    interWord: number;
    intraLine: number;
    interLine: number;
  };
  readingSpeed: {
    firstHalf: number;
    secondHalf: number;
    fluctuation: number;
  };
}

export interface PeerComparison {
  grade: number;
  sampleSize: number;
  percentileRank: number;
  metricsComparison: {
    [key: string]: {
      studentValue: number;
      peerAverage: number;
      peerStdDev: number;
      zScore: number;
    };
  };
}

// AI Analysis
export interface AIAnalysisResult {
  readingStrategy: 'fluent' | 'struggling' | 'developing' | 'advanced';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  confidenceScore: number;
  narrative: string;
  detectedPatterns: {
    pattern: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    explanation: string;
  }[];
}

// Heatmap
export interface HeatmapData {
  passageId: string;
  resolution: {
    width: number;
    height: number;
  };
  cells: HeatmapCell[];
}

export interface HeatmapCell {
  x: number;
  y: number;
  intensity: number; // 0-1 normalized
  fixationCount: number;
  averageFixationDuration: number;
}

// API Request/Response Types
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

export interface ValidateCalibrationResponse {
  valid: boolean;
  accuracy: number;
  calibrationResult: CalibrationResult;
  message: string;
}

export interface StartVisionSessionRequest {
  sessionId: string;
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

export interface GetGazeReplayResponse {
  visionSessionId: string;
  passages: VisionPassage[];
  gazeData: GazeChunk[];
  totalDuration: number;
  totalGazePoints: number;
}

// UI State Types
export interface CalibrationState {
  stage: 'idle' | 'instructions' | 'calibrating' | 'validating' | 'completed' | 'failed';
  currentPointIndex: number;
  recordedPoints: CalibrationPoint[];
  accuracy?: number;
  error?: string;
}

export interface VisionTestState {
  stage: 'idle' | 'calibration' | 'testing' | 'completed';
  visionSessionId?: string;
  currentPassageIndex: number;
  gazeTracking: boolean;
  error?: string;
}

// MediaPipe Types
export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  leftIris: { x: number; y: number };
  rightIris: { x: number; y: number };
  noseTip: { x: number; y: number };
}

export interface GazeEstimation {
  x: number; // Screen x (normalized 0-1)
  y: number; // Screen y (normalized 0-1)
  confidence: number; // 0-1
  landmarks: FaceLandmarks;
}
