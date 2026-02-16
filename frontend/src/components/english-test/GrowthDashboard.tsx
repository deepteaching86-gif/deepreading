/**
 * English Adaptive Test - Growth Dashboard
 * =========================================
 *
 * Displays student's theta growth over time with domain breakdowns.
 */

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { GrowthData } from '@/api/englishTestApi';

interface GrowthDashboardProps {
  data: GrowthData;
  onBack: () => void;
}

export const GrowthDashboard: React.FC<GrowthDashboardProps> = ({ data, onBack }) => {
  const { sessions, theta_trend, domain_trends, total_tests } = data;

  // Format sessions for chart
  const chartData = sessions
    .filter(s => s.final_theta !== null)
    .map((s, idx) => ({
      name: s.completed_at
        ? new Date(s.completed_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
        : `Test ${idx + 1}`,
      theta: s.final_theta !== null ? Number(s.final_theta.toFixed(2)) : null,
      grammar: s.grammar_score !== null ? Number(s.grammar_score.toFixed(1)) : null,
      vocabulary: s.vocabulary_score !== null ? Number(s.vocabulary_score.toFixed(1)) : null,
      reading: s.reading_score !== null ? Number(s.reading_score.toFixed(1)) : null,
    }));

  const trendLabel = (val: number) => {
    if (val > 0.05) return { text: 'Improving', color: 'text-green-600', bg: 'bg-green-100' };
    if (val < -0.05) return { text: 'Declining', color: 'text-red-600', bg: 'bg-red-100' };
    return { text: 'Stable', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const overallTrend = trendLabel(theta_trend);

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Growth Dashboard</h1>
            <p className="text-muted-foreground">
              {total_tests > 0
                ? `${total_tests}회 테스트 기반 성장 분석`
                : '테스트 기록이 없습니다'}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
          >
            Back
          </button>
        </div>

        {total_tests === 0 ? (
          <div className="bg-card rounded-xl shadow-sm p-12 text-center border border-border">
            <p className="text-lg text-muted-foreground mb-4">
              아직 완료된 테스트가 없습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              영어 적응형 테스트를 완료하면 성장 추이가 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Tests" value={String(total_tests)} />
              <StatCard
                label="Overall Trend"
                value={theta_trend > 0 ? `+${theta_trend.toFixed(3)}` : theta_trend.toFixed(3)}
                badge={overallTrend}
              />
              <StatCard
                label="Latest Theta"
                value={sessions[sessions.length - 1]?.final_theta?.toFixed(2) ?? 'N/A'}
              />
              <StatCard
                label="Latest SE"
                value={sessions[sessions.length - 1]?.standard_error?.toFixed(2) ?? 'N/A'}
              />
            </div>

            {/* Theta Over Time Chart */}
            {chartData.length >= 2 && (
              <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Ability (Theta) Over Time</h2>
                <div aria-label="Theta growth chart showing ability estimate over time">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis domain={['auto', 'auto']} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="theta"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Theta"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Data Table for Screen Readers */}
                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer">
                    View data table
                  </summary>
                  <table className="w-full mt-2 text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Theta</th>
                        <th className="text-right py-2">Grammar</th>
                        <th className="text-right py-2">Vocabulary</th>
                        <th className="text-right py-2">Reading</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1">{row.name}</td>
                          <td className="text-right">{row.theta}</td>
                          <td className="text-right">{row.grammar ?? '-'}</td>
                          <td className="text-right">{row.vocabulary ?? '-'}</td>
                          <td className="text-right">{row.reading ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </div>
            )}

            {/* Domain Trends */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {(['grammar', 'vocabulary', 'reading'] as const).map(domain => {
                const trend = domain_trends[domain];
                const info = trendLabel(trend);
                const labels: Record<string, string> = {
                  grammar: 'Grammar',
                  vocabulary: 'Vocabulary',
                  reading: 'Reading'
                };

                return (
                  <div key={domain} className="bg-card rounded-xl shadow-sm p-5 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{labels[domain]}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${info.bg} ${info.color}`}>
                        {info.text}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {trend > 0 ? '+' : ''}{trend.toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">slope per test</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Sessions */}
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Test Sessions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4 text-right">Theta</th>
                      <th className="py-2 pr-4 text-right">SE</th>
                      <th className="py-2 pr-4 text-right">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sessions].reverse().slice(0, 10).map(s => (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          {s.completed_at
                            ? new Date(s.completed_at).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">
                          {s.final_theta?.toFixed(3) ?? '-'}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">
                          {s.standard_error?.toFixed(3) ?? '-'}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {s.items_completed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Stat Card
interface StatCardProps {
  label: string;
  value: string;
  badge?: { text: string; color: string; bg: string };
}

const StatCard: React.FC<StatCardProps> = ({ label, value, badge }) => (
  <div className="bg-card rounded-xl shadow-sm p-4 border border-border">
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className="text-xl font-bold text-foreground">{value}</p>
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.color} mt-1 inline-block`}>
        {badge.text}
      </span>
    )}
  </div>
);

export default GrowthDashboard;
