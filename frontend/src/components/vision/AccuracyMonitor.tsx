/**
 * Accuracy Monitor Component
 * Displays real-time gaze tracking accuracy and refinement status
 */

import React, { useEffect, useState } from 'react';
import { ClickBasedRefinement, EnvironmentMetrics } from '../../utils/gazeRefinement';

interface AccuracyMonitorProps {
  clickRefinement: ClickBasedRefinement | null;
  environmentMetrics: EnvironmentMetrics | null;
  isVisible?: boolean;
}

export const AccuracyMonitor: React.FC<AccuracyMonitorProps> = ({
  clickRefinement,
  environmentMetrics,
  isVisible = true
}) => {
  const [stats, setStats] = useState({ totalClicks: 0, avgError: 0, recentError: 0 });
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    if (!clickRefinement) return;

    // Update stats every second
    const interval = setInterval(() => {
      const newStats = clickRefinement.getStats();
      const newAccuracy = clickRefinement.getAccuracy();

      setStats(newStats);
      setAccuracy(newAccuracy);
    }, 1000);

    return () => clearInterval(interval);
  }, [clickRefinement]);

  if (!isVisible) return null;

  // Calculate accuracy percentage (0-100%)
  const accuracyPercent = accuracy > 0 ? Math.max(0, Math.min(100, (1 - accuracy) * 100)) : 0;

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityEmoji = (quality: string) => {
    switch (quality) {
      case 'excellent': return '✨';
      case 'good': return '👍';
      case 'fair': return '⚡';
      case 'poor': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg shadow-2xl z-50 min-w-[280px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/20">
        <div className="text-lg">📊</div>
        <h3 className="font-bold text-sm">시선 추적 정확도</h3>
      </div>

      {/* Accuracy Score */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-300">정확도</span>
          <span className="text-sm font-bold text-green-400">
            {accuracyPercent.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${accuracyPercent}%` }}
          />
        </div>
      </div>

      {/* Click Stats */}
      {stats.totalClicks > 0 && (
        <div className="mb-3 p-2 bg-white/5 rounded">
          <div className="text-xs text-gray-400 mb-1">클릭 기반 개선</div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-300">수집된 클릭:</span>
            <span className="font-mono">{stats.totalClicks}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-300">평균 오차:</span>
            <span className="font-mono">{(stats.avgError * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-300">최근 오차:</span>
            <span className={`font-mono ${stats.recentError < stats.avgError ? 'text-green-400' : 'text-yellow-400'}`}>
              {(stats.recentError * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Environment Quality */}
      {environmentMetrics && (
        <div className="p-2 bg-white/5 rounded">
          <div className="text-xs text-gray-400 mb-1">환경 조명</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {getQualityEmoji(environmentMetrics.lightingQuality)}
            </span>
            <span className={`text-sm font-semibold ${getQualityColor(environmentMetrics.lightingQuality)}`}>
              {environmentMetrics.lightingQuality === 'excellent' && '훌륭함'}
              {environmentMetrics.lightingQuality === 'good' && '좋음'}
              {environmentMetrics.lightingQuality === 'fair' && '보통'}
              {environmentMetrics.lightingQuality === 'poor' && '개선 필요'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">밝기:</span>
              <span className="ml-1 font-mono">{(environmentMetrics.brightness * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-400">대비:</span>
              <span className="ml-1 font-mono">{(environmentMetrics.contrast * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {stats.totalClicks === 0 && (
        <div className="mt-3 text-xs text-gray-400 italic">
          💡 단어나 아이콘을 클릭하면 자동으로 정확도가 개선됩니다
        </div>
      )}
    </div>
  );
};
