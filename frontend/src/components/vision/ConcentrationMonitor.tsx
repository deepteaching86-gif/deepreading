// 집중력 모니터링 UI 컴포넌트
// Real-time Concentration Monitoring Component

import React from 'react';
import {
  ConcentrationScore,
  ConcentrationState,
  ConcentrationAlert
} from '../../types/concentration.types';

interface ConcentrationMonitorProps {
  /** 현재 집중력 점수 */
  currentScore: ConcentrationScore | null;

  /** 최근 알림 (최대 3개) */
  recentAlerts: ConcentrationAlert[];

  /** 컴팩트 모드 (작은 크기) */
  compact?: boolean;

  /** 알림 클릭 핸들러 */
  onAlertClick?: (alert: ConcentrationAlert) => void;
}

export const ConcentrationMonitor: React.FC<ConcentrationMonitorProps> = ({
  currentScore,
  recentAlerts,
  compact = false,
  onAlertClick
}) => {
  if (!currentScore) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-muted-foreground text-sm text-center">
          ⏳ 집중력 분석 준비 중...
        </div>
      </div>
    );
  }

  // 집중 상태별 색상 및 라벨
  const stateConfig = {
    [ConcentrationState.HIGH]: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      label: '높은 집중',
      emoji: '🎯'
    },
    [ConcentrationState.MEDIUM]: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      label: '보통 집중',
      emoji: '👀'
    },
    [ConcentrationState.LOW]: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-300',
      label: '낮은 집중',
      emoji: '⚠️'
    },
    [ConcentrationState.DROWSY]: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      label: '졸음 감지',
      emoji: '😴'
    }
  };

  const config = stateConfig[currentScore.state];

  // 차원별 한글 라벨 매핑
  const dimensionLabels: Record<keyof typeof currentScore.dimensions, string> = {
    pupilDynamics: '동공 역학',
    blinkPattern: '깜박임',
    gazeStability: '시선 안정',
    microsaccades: '미세운동',
    headMovement: '머리 안정',
    readingRhythm: '읽기 리듬',
    taskEngagement: '과제 몰입'
  };

  // 차원별 점수 색상 (점수 범위에 따라)
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (compact) {
    // 컴팩트 모드: 총점만 표시
    return (
      <div className={`bg-card border ${config.borderColor} rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.emoji}</span>
            <div>
              <div className={`font-semibold ${config.color}`}>
                {currentScore.totalScore}점
              </div>
              <div className="text-xs text-muted-foreground">
                {config.label}
              </div>
            </div>
          </div>

          {recentAlerts.length > 0 && (
            <div className="text-xs text-muted-foreground">
              🔔 {recentAlerts.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 전체 모드
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* 헤더: 총점 및 상태 */}
      <div className={`${config.bgColor} border-b ${config.borderColor} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <div className={`text-3xl font-bold ${config.color}`}>
                {currentScore.totalScore}
                <span className="text-xl ml-1">점</span>
              </div>
              <div className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </div>
            </div>
          </div>

          {/* 점수 바 */}
          <div className="w-32">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreBgColor(currentScore.totalScore)} transition-all duration-500`}
                style={{ width: `${currentScore.totalScore}%` }}
              />
            </div>
            <div className="text-xs text-right text-muted-foreground mt-1">
              0 → 100
            </div>
          </div>
        </div>
      </div>

      {/* 차원별 점수 */}
      <div className="p-4 space-y-2">
        <div className="text-sm font-semibold text-foreground mb-3">
          📊 차원별 분석
        </div>

        {Object.entries(currentScore.dimensions).map(([key, score]) => {
          const dimensionKey = key as keyof typeof currentScore.dimensions;
          const label = dimensionLabels[dimensionKey];

          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                  {score.toFixed(0)}점
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBgColor(score)} transition-all duration-300`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 최근 알림 */}
      {recentAlerts.length > 0 && (
        <div className="border-t border-border p-4 bg-muted/30">
          <div className="text-sm font-semibold text-foreground mb-2">
            🔔 최근 알림
          </div>
          <div className="space-y-2">
            {recentAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="bg-card border border-border rounded p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {alert.severity === 3 ? '🚨' : alert.severity === 2 ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">
                      {alert.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 집중력 알림 모달 컴포넌트
 */
interface ConcentrationAlertModalProps {
  alert: ConcentrationAlert | null;
  onClose: () => void;
}

export const ConcentrationAlertModal: React.FC<ConcentrationAlertModalProps> = ({
  alert,
  onClose
}) => {
  if (!alert) return null;

  const severityConfig = {
    1: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'ℹ️' },
    2: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '⚠️' },
    3: { color: 'text-red-600', bgColor: 'bg-red-100', icon: '🚨' }
  };

  const config = severityConfig[alert.severity as 1 | 2 | 3] || severityConfig[1];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className={`${config.bgColor} border-b border-border p-4`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div className="flex-1">
              <h2 className={`font-bold text-lg ${config.color}`}>
                집중력 알림
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date(alert.timestamp).toLocaleTimeString('ko-KR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">문제 상황</h3>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">개선 방법</h3>
            <p className="text-sm text-muted-foreground">{alert.recommendation}</p>
          </div>

          {alert.dimension && (
            <div>
              <h3 className="font-semibold text-foreground mb-1">영향 받은 차원</h3>
              <p className="text-sm text-muted-foreground">
                {alert.dimension === 'pupilDynamics' && '동공 역학'}
                {alert.dimension === 'blinkPattern' && '깜박임 패턴'}
                {alert.dimension === 'gazeStability' && '시선 안정성'}
                {alert.dimension === 'microsaccades' && '미세 단속운동'}
                {alert.dimension === 'headMovement' && '머리 움직임'}
                {alert.dimension === 'readingRhythm' && '읽기 리듬'}
                {alert.dimension === 'taskEngagement' && '과제 몰입도'}
              </p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
