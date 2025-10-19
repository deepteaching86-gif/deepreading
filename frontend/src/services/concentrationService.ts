// 집중력 모니터링 서비스
// Concentration Monitoring Service

import {
  ConcentrationScore,
  ConcentrationSession,
  ConcentrationAlert,
  ConcentrationReport,
  ConcentrationConfig,
  ConcentrationState,
  AlertType,
  ConcentrationDimensions,
  DEFAULT_CONCENTRATION_CONFIG
} from '../types/concentration.types';

/**
 * 집중력 알림 생성기
 */
export class AlertGenerator {
  private lastAlertTime = 0;
  private readonly MIN_ALERT_INTERVAL = 30000; // 30초 최소 간격

  /**
   * 집중력 점수 기반 알림 생성
   */
  generateAlerts(score: ConcentrationScore, threshold: number): ConcentrationAlert[] {
    const alerts: ConcentrationAlert[] = [];
    const now = Date.now();

    // 최소 간격 체크
    if (now - this.lastAlertTime < this.MIN_ALERT_INTERVAL) {
      return alerts;
    }

    // 낮은 집중력
    if (score.totalScore < threshold) {
      const primaryDimension = this.findLowestDimension(score.dimensions);
      const alert = this.createAlert(score, primaryDimension);

      if (alert) {
        alerts.push(alert);
        this.lastAlertTime = now;
      }
    }

    // 졸음 감지
    if (score.state === ConcentrationState.DROWSY) {
      alerts.push({
        id: `alert_${now}_drowsy`,
        timestamp: now,
        type: AlertType.DROWSINESS,
        dimension: null,
        message: '졸음이 감지되었습니다',
        recommendation: '잠시 휴식을 취하거나 스트레칭을 해보세요. 충분한 수면이 필요합니다.',
        severity: 3
      });
      this.lastAlertTime = now;
    }

    return alerts;
  }

  /**
   * 가장 낮은 점수의 차원 찾기
   */
  private findLowestDimension(dimensions: ConcentrationDimensions): keyof ConcentrationDimensions {
    const entries = Object.entries(dimensions) as [keyof ConcentrationDimensions, number][];
    const sorted = entries.sort((a, b) => a[1] - b[1]);
    return sorted[0][0];
  }

  /**
   * 차원별 맞춤 알림 생성
   */
  private createAlert(
    score: ConcentrationScore,
    dimension: keyof ConcentrationDimensions
  ): ConcentrationAlert | null {
    const dimensionScore = score.dimensions[dimension];
    const now = Date.now();

    // 알림 매핑
    const alertMap: Record<keyof ConcentrationDimensions, {
      type: AlertType;
      message: string;
      recommendation: string;
      severity: number;
    }> = {
      pupilDynamics: {
        type: AlertType.FATIGUE,
        message: '시각적 피로가 감지되었습니다',
        recommendation: '20-20-20 규칙을 따라보세요: 20분마다 20초간 20피트(6m) 거리를 바라보세요.',
        severity: 2
      },
      blinkPattern: {
        type: AlertType.DROWSINESS,
        message: '비정상적인 깜박임 패턴이 감지되었습니다',
        recommendation: '눈의 피로를 풀기 위해 잠시 눈을 감고 휴식을 취하세요.',
        severity: 2
      },
      gazeStability: {
        type: AlertType.DISTRACTION,
        message: '시선이 불안정합니다',
        recommendation: '한 곳에 집중하려고 노력해보세요. 화면 밝기와 거리를 조정해보세요.',
        severity: 1
      },
      microsaccades: {
        type: AlertType.DROWSINESS,
        message: '미세 안구운동 이상이 감지되었습니다',
        recommendation: '각성도가 낮습니다. 가벼운 운동이나 냉수 세안을 권장합니다.',
        severity: 3
      },
      headMovement: {
        type: AlertType.POOR_POSTURE,
        message: '머리 움직임이 과도합니다',
        recommendation: '바른 자세로 앉아 화면과 적절한 거리를 유지하세요. (40-70cm 권장)',
        severity: 2
      },
      readingRhythm: {
        type: AlertType.DISTRACTION,
        message: '읽기 리듬이 불규칙합니다',
        recommendation: '천천히, 일정한 속도로 읽어보세요. 너무 서두르지 마세요.',
        severity: 1
      },
      taskEngagement: {
        type: AlertType.DISTRACTION,
        message: '과제 몰입도가 낮습니다',
        recommendation: '주변 방해 요소를 제거하고 과제에 집중해보세요.',
        severity: 2
      }
    };

    const config = alertMap[dimension];

    return {
      id: `alert_${now}_${dimension}`,
      timestamp: now,
      type: config.type,
      dimension,
      message: `${config.message} (점수: ${dimensionScore.toFixed(0)}점)`,
      recommendation: config.recommendation,
      severity: config.severity
    };
  }

  reset(): void {
    this.lastAlertTime = 0;
  }
}

/**
 * 집중력 세션 관리자
 */
export class ConcentrationSessionManager {
  private currentSession: ConcentrationSession | null = null;
  private alertGenerator = new AlertGenerator();
  private config: ConcentrationConfig = DEFAULT_CONCENTRATION_CONFIG;

  /**
   * 새 세션 시작
   */
  startSession(sessionId: string): void {
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      endTime: null,
      scoreHistory: [],
      alerts: [],
      averageScore: null,
      peakScore: null,
      lowestScore: null,
      metadata: {
        fps: 30,
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform,
        version: '1.0.0'
      }
    };

    this.alertGenerator.reset();
  }

  /**
   * 집중력 점수 추가
   */
  addScore(score: ConcentrationScore): void {
    if (!this.currentSession) return;

    this.currentSession.scoreHistory.push(score);

    // 통계 업데이트
    this.updateStatistics();

    // 알림 생성
    if (this.config.enableAlerts) {
      const alerts = this.alertGenerator.generateAlerts(score, this.config.alertThreshold);
      this.currentSession.alerts.push(...alerts);
    }
  }

  /**
   * 세션 종료
   */
  endSession(): ConcentrationSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.updateStatistics();

    const session = { ...this.currentSession };
    this.currentSession = null;

    return session;
  }

  /**
   * 현재 세션 조회
   */
  getCurrentSession(): ConcentrationSession | null {
    return this.currentSession;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<ConcentrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(): void {
    if (!this.currentSession || this.currentSession.scoreHistory.length === 0) return;

    const scores = this.currentSession.scoreHistory.map(s => s.totalScore);

    this.currentSession.averageScore = this.calculateMean(scores);
    this.currentSession.peakScore = Math.max(...scores);
    this.currentSession.lowestScore = Math.min(...scores);
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/**
 * 집중력 리포트 생성기
 */
export class ConcentrationReportGenerator {
  /**
   * 세션 데이터로부터 리포트 생성
   */
  generateReport(session: ConcentrationSession): ConcentrationReport {
    const duration = ((session.endTime || Date.now()) - session.startTime) / 1000;

    const dimensionAverages = this.calculateDimensionAverages(session);
    const stateDistribution = this.calculateStateDistribution(session);
    const alertsByType = this.groupAlertsByType(session.alerts);
    const trendAnalysis = this.analyzeTrend(session);
    const recommendations = this.generateRecommendations(session, trendAnalysis);

    return {
      sessionId: session.sessionId,
      duration,
      averageScore: session.averageScore || 0,
      dimensionAverages,
      stateDistribution,
      alertsCount: session.alerts.length,
      alertsByType,
      trendAnalysis,
      recommendations
    };
  }

  /**
   * 차원별 평균 점수 계산
   */
  private calculateDimensionAverages(session: ConcentrationSession): ConcentrationDimensions {
    if (session.scoreHistory.length === 0) {
      return {
        pupilDynamics: 0,
        blinkPattern: 0,
        gazeStability: 0,
        microsaccades: 0,
        headMovement: 0,
        readingRhythm: 0,
        taskEngagement: 0
      };
    }

    const sums: ConcentrationDimensions = {
      pupilDynamics: 0,
      blinkPattern: 0,
      gazeStability: 0,
      microsaccades: 0,
      headMovement: 0,
      readingRhythm: 0,
      taskEngagement: 0
    };

    session.scoreHistory.forEach(score => {
      sums.pupilDynamics += score.dimensions.pupilDynamics;
      sums.blinkPattern += score.dimensions.blinkPattern;
      sums.gazeStability += score.dimensions.gazeStability;
      sums.microsaccades += score.dimensions.microsaccades;
      sums.headMovement += score.dimensions.headMovement;
      sums.readingRhythm += score.dimensions.readingRhythm;
      sums.taskEngagement += score.dimensions.taskEngagement;
    });

    const count = session.scoreHistory.length;

    return {
      pupilDynamics: sums.pupilDynamics / count,
      blinkPattern: sums.blinkPattern / count,
      gazeStability: sums.gazeStability / count,
      microsaccades: sums.microsaccades / count,
      headMovement: sums.headMovement / count,
      readingRhythm: sums.readingRhythm / count,
      taskEngagement: sums.taskEngagement / count
    };
  }

  /**
   * 집중 상태 분포 계산
   */
  private calculateStateDistribution(session: ConcentrationSession): {
    high: number;
    medium: number;
    low: number;
    drowsy: number;
  } {
    const counts = {
      [ConcentrationState.HIGH]: 0,
      [ConcentrationState.MEDIUM]: 0,
      [ConcentrationState.LOW]: 0,
      [ConcentrationState.DROWSY]: 0
    };

    session.scoreHistory.forEach(score => {
      counts[score.state]++;
    });

    const total = session.scoreHistory.length || 1;

    return {
      high: (counts[ConcentrationState.HIGH] / total) * 100,
      medium: (counts[ConcentrationState.MEDIUM] / total) * 100,
      low: (counts[ConcentrationState.LOW] / total) * 100,
      drowsy: (counts[ConcentrationState.DROWSY] / total) * 100
    };
  }

  /**
   * 알림 타입별 그룹화
   */
  private groupAlertsByType(alerts: ConcentrationAlert[]): Record<AlertType, number> {
    const groups: Record<AlertType, number> = {
      [AlertType.LOW_CONCENTRATION]: 0,
      [AlertType.DROWSINESS]: 0,
      [AlertType.FATIGUE]: 0,
      [AlertType.DISTRACTION]: 0,
      [AlertType.POOR_POSTURE]: 0
    };

    alerts.forEach(alert => {
      groups[alert.type]++;
    });

    return groups;
  }

  /**
   * 집중력 추이 분석
   */
  private analyzeTrend(session: ConcentrationSession): {
    improving: boolean;
    declining: boolean;
    stable: boolean;
    fluctuating: boolean;
  } {
    if (session.scoreHistory.length < 10) {
      return { improving: false, declining: false, stable: true, fluctuating: false };
    }

    const scores = session.scoreHistory.map(s => s.totalScore);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = this.calculateMean(firstHalf);
    const secondAvg = this.calculateMean(secondHalf);
    const variance = this.calculateVariance(scores);

    const diff = secondAvg - firstAvg;
    const THRESHOLD = 5;

    return {
      improving: diff > THRESHOLD,
      declining: diff < -THRESHOLD,
      stable: Math.abs(diff) <= THRESHOLD && variance < 100,
      fluctuating: variance >= 100
    };
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(
    session: ConcentrationSession,
    trend: { improving: boolean; declining: boolean; stable: boolean; fluctuating: boolean }
  ): string[] {
    const recommendations: string[] = [];
    const avgScore = session.averageScore || 0;

    // 전반적인 집중력
    if (avgScore < 40) {
      recommendations.push('전반적인 집중력이 낮습니다. 충분한 수면과 휴식이 필요합니다.');
    } else if (avgScore >= 70) {
      recommendations.push('훌륭한 집중력을 보여주고 있습니다. 현재 상태를 유지하세요!');
    }

    // 추이 분석
    if (trend.declining) {
      recommendations.push('집중력이 점차 감소하고 있습니다. 적절한 휴식 시간을 가지세요.');
    }

    if (trend.fluctuating) {
      recommendations.push('집중력 변동이 큽니다. 일정한 리듬으로 학습하는 연습이 필요합니다.');
    }

    // 차원별 분석
    const dimAvgs = this.calculateDimensionAverages(session);

    if (dimAvgs.pupilDynamics < 50) {
      recommendations.push('시각적 피로가 누적되고 있습니다. 화면 밝기를 조절하고 자주 휴식을 취하세요.');
    }

    if (dimAvgs.blinkPattern < 50) {
      recommendations.push('눈 건강에 주의가 필요합니다. 의식적으로 깜박임을 늘리세요.');
    }

    if (dimAvgs.gazeStability < 50) {
      recommendations.push('시선 안정성이 낮습니다. 화면과의 거리와 조명을 확인하세요.');
    }

    if (dimAvgs.headMovement < 50) {
      recommendations.push('자세를 개선하세요. 화면 높이와 의자 높이를 조정하세요.');
    }

    if (dimAvgs.taskEngagement < 50) {
      recommendations.push('과제 몰입도가 낮습니다. 방해 요소를 제거하고 짧은 목표를 설정해보세요.');
    }

    // 알림 빈도
    const duration = ((session.endTime || Date.now()) - session.startTime) / 60000; // 분
    const alertRate = session.alerts.length / duration;

    if (alertRate > 2) {
      recommendations.push('알림이 자주 발생하고 있습니다. 환경을 점검하고 휴식을 고려하세요.');
    }

    return recommendations.length > 0 ? recommendations : ['정상적인 집중 패턴을 보이고 있습니다.'];
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return this.calculateMean(squareDiffs);
  }
}

// 싱글톤 인스턴스
export const concentrationSessionManager = new ConcentrationSessionManager();
export const concentrationReportGenerator = new ConcentrationReportGenerator();
