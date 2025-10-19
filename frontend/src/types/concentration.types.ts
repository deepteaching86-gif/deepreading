// 다차원 집중력 모니터링 시스템 타입 정의
// Multi-dimensional Concentration Monitoring System Type Definitions

/**
 * 7차원 집중력 지표
 * 각 차원은 0-100 점수로 정규화됨
 */
export interface ConcentrationDimensions {
  /** 동공 역학 (Pupil Dynamics): TEPR, FFT 분석 */
  pupilDynamics: number;

  /** 깜박임 패턴 (Blink Pattern): 억제율, 규칙성 */
  blinkPattern: number;

  /** 시선 안정성 (Gaze Stability): 드리프트, 분산도 */
  gazeStability: number;

  /** 미세 단속운동 (Microsaccades): 빈도, 방향 엔트로피 */
  microsaccades: number;

  /** 머리 움직임 (Head Movement): 안정성, VOR */
  headMovement: number;

  /** 읽기 리듬 (Reading Rhythm): 일관성, 변동계수 */
  readingRhythm: number;

  /** 과제 몰입도 (Task Engagement): 체류 시간, 이탈 패턴 */
  taskEngagement: number;
}

/**
 * 집중력 점수 데이터
 */
export interface ConcentrationScore {
  /** 총 집중력 점수 (0-100) */
  totalScore: number;

  /** 차원별 점수 */
  dimensions: ConcentrationDimensions;

  /** 측정 타임스탬프 */
  timestamp: number;

  /** 집중 상태 분류 */
  state: ConcentrationState;
}

/**
 * 집중 상태 분류
 */
export enum ConcentrationState {
  /** 높은 집중 (70-100점) */
  HIGH = 'HIGH',

  /** 보통 집중 (40-69점) */
  MEDIUM = 'MEDIUM',

  /** 낮은 집중 (0-39점) */
  LOW = 'LOW',

  /** 졸음/피로 */
  DROWSY = 'DROWSY'
}

/**
 * 집중력 알림 데이터
 */
export interface ConcentrationAlert {
  /** 알림 ID */
  id: string;

  /** 발생 타임스탬프 */
  timestamp: number;

  /** 알림 타입 */
  type: AlertType;

  /** 문제가 된 차원 */
  dimension: keyof ConcentrationDimensions | null;

  /** 알림 메시지 */
  message: string;

  /** 개선 제안 */
  recommendation: string;

  /** 심각도 (1-3) */
  severity: number;
}

/**
 * 알림 타입
 */
export enum AlertType {
  /** 낮은 집중력 */
  LOW_CONCENTRATION = 'LOW_CONCENTRATION',

  /** 졸음 감지 */
  DROWSINESS = 'DROWSINESS',

  /** 피로 감지 */
  FATIGUE = 'FATIGUE',

  /** 주의 분산 */
  DISTRACTION = 'DISTRACTION',

  /** 자세 불량 */
  POOR_POSTURE = 'POOR_POSTURE'
}

/**
 * 차원별 가중치 설정
 */
export interface DimensionWeights {
  pupilDynamics: number;
  blinkPattern: number;
  gazeStability: number;
  microsaccades: number;
  headMovement: number;
  readingRhythm: number;
  taskEngagement: number;
}

/**
 * 집중력 분석을 위한 원시 데이터
 */
export interface ConcentrationRawData {
  /** 동공 크기 (정규화된 값) */
  pupilSize: number;

  /** 눈 종횡비 (Eye Aspect Ratio) */
  eyeAspectRatio: number;

  /** 시선 벡터 (x, y) */
  gazeVector: { x: number; y: number };

  /** 눈 움직임 속도 */
  eyeMovementVelocity: number;

  /** 머리 자세 (yaw, pitch, roll) */
  headPose: { yaw: number; pitch: number; roll: number };

  /** 주시점 위치 */
  fixationPoint: { x: number; y: number } | null;

  /** 타임스탬프 */
  timestamp: number;
}

/**
 * 집중력 세션 데이터
 */
export interface ConcentrationSession {
  /** 세션 ID */
  sessionId: string;

  /** 시작 시간 */
  startTime: number;

  /** 종료 시간 */
  endTime: number | null;

  /** 실시간 점수 기록 (1초 단위) */
  scoreHistory: ConcentrationScore[];

  /** 발생한 알림 목록 */
  alerts: ConcentrationAlert[];

  /** 평균 점수 */
  averageScore: number | null;

  /** 최고 점수 */
  peakScore: number | null;

  /** 최저 점수 */
  lowestScore: number | null;

  /** 메타데이터 */
  metadata: {
    fps: number;
    resolution: string;
    platform: string;
    version: string;
  };
}

/**
 * 집중력 리포트
 */
export interface ConcentrationReport {
  /** 세션 ID */
  sessionId: string;

  /** 총 지속 시간 (초) */
  duration: number;

  /** 평균 집중력 점수 */
  averageScore: number;

  /** 차원별 평균 점수 */
  dimensionAverages: ConcentrationDimensions;

  /** 집중 상태 분포 (%) */
  stateDistribution: {
    high: number;
    medium: number;
    low: number;
    drowsy: number;
  };

  /** 총 알림 수 */
  alertsCount: number;

  /** 알림 타입별 분포 */
  alertsByType: Record<AlertType, number>;

  /** 집중력 추이 분석 */
  trendAnalysis: {
    improving: boolean;
    declining: boolean;
    stable: boolean;
    fluctuating: boolean;
  };

  /** 개선 권장사항 */
  recommendations: string[];
}

/**
 * 집중력 모니터링 설정
 */
export interface ConcentrationConfig {
  /** 알림 임계값 (0-100) */
  alertThreshold: number;

  /** 차원별 가중치 */
  weights: DimensionWeights;

  /** 알림 활성화 여부 */
  enableAlerts: boolean;

  /** 점수 업데이트 간격 (ms) */
  updateInterval: number;

  /** 데이터 로깅 활성화 */
  enableLogging: boolean;
}

/**
 * 기본 가중치 (합계 = 1.0)
 */
export const DEFAULT_WEIGHTS: DimensionWeights = {
  pupilDynamics: 0.15,
  blinkPattern: 0.15,
  gazeStability: 0.20,
  microsaccades: 0.10,
  headMovement: 0.15,
  readingRhythm: 0.15,
  taskEngagement: 0.10
};

/**
 * 기본 설정
 */
export const DEFAULT_CONCENTRATION_CONFIG: ConcentrationConfig = {
  alertThreshold: 40,
  weights: DEFAULT_WEIGHTS,
  enableAlerts: true,
  updateInterval: 1000, // 1초
  enableLogging: true
};
