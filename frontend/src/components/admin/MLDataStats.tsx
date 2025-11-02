/**
 * ML Data Statistics Component
 *
 * ML 학습 데이터셋 통계 표시
 */

import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';

interface MLStats {
  totalSamples: number;
  qualityDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
  avgQualityScore: number;
  estimatedSize: {
    kb: number;
    mb: string;
    samples: number;
  };
}

export const MLDataStats: React.FC = () => {
  const [stats, setStats] = useState<MLStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/ml/stats');
      setStats(response.data.stats);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load ML stats');
      console.error('Failed to load ML stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">ML 학습 데이터셋</h3>
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">ML 학습 데이터셋</h3>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!stats || stats.totalSamples === 0) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">ML 학습 데이터셋</h3>
        <div className="text-muted-foreground">아직 수집된 데이터가 없습니다.</div>
        <div className="mt-4 bg-secondary/10 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Vision Test 캘리브레이션 완료 시 자동으로 ML 학습 데이터가 수집됩니다.
          </p>
        </div>
      </div>
    );
  }

  const qualityColors: Record<string, string> = {
    EXCELLENT: 'text-green-600 bg-green-100',
    GOOD: 'text-blue-600 bg-blue-100',
    FAIR: 'text-yellow-600 bg-yellow-100',
    POOR: 'text-red-600 bg-red-100'
  };

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">ML 학습 데이터셋</h3>
        <button
          onClick={loadStats}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          새로고침
        </button>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary/10 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">총 샘플 수</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats.totalSamples.toLocaleString()}</div>
        </div>
        <div className="bg-secondary/10 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">평균 품질 점수</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {(stats.avgQualityScore * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-secondary/10 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">저장 용량</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats.estimatedSize.mb} MB</div>
        </div>
      </div>

      {/* 품질별 분포 */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">품질별 분포</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.qualityDistribution).map(([quality, count]) => (
            <div
              key={quality}
              className={`${qualityColors[quality] || 'text-gray-600 bg-gray-100'} rounded-lg p-3`}
            >
              <div className="text-xs font-medium">{quality}</div>
              <div className="text-lg font-bold mt-1">{count.toLocaleString()}</div>
              <div className="text-xs mt-1">
                {((count / stats.totalSamples) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 연령대별 분포 */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">연령대별 분포</h4>
        <div className="space-y-2">
          {Object.entries(stats.ageDistribution).map(([age, count]) => (
            <div key={age} className="flex items-center">
              <div className="w-24 text-sm text-muted-foreground">{age}</div>
              <div className="flex-1 bg-secondary/20 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${(count / stats.totalSamples) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                  {count} ({((count / stats.totalSamples) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 정보 */}
      <div className="mt-6 bg-primary/10 rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          💡 <strong>경량 저장:</strong> 이미지 없이 특징 벡터만 저장 (샘플당 2-5KB)
          <br />
          📊 <strong>자동 수집:</strong> Vision Test 캘리브레이션 완료 시 자동 수집
          <br />
          🎯 <strong>품질 보장:</strong> 품질 점수 70% 이상만 수집
        </p>
      </div>
    </div>
  );
};

export default MLDataStats;
