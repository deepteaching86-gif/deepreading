// Vision TEST Report Page - Results visualization with metrics, AI analysis, and heatmap
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getVisionReport } from '../../services/vision.service';
import {
  VisionMetrics,
  AIAnalysisResult,
  HeatmapData,
  HeatmapCell,
  PeerComparison
} from '../../types/vision.types';

export const VisionTestReport: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Report data
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [peerComparison, setPeerComparison] = useState<PeerComparison | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [testDate, setTestDate] = useState<Date | null>(null);

  // Load report data
  useEffect(() => {
    const loadReportData = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);

        // Load vision report
        const reportResponse = await getVisionReport(sessionId);
        setMetrics(reportResponse.metrics);
        setAiAnalysis(reportResponse.aiAnalysis);
        setHeatmapData(reportResponse.heatmapData);
        setStudentName(reportResponse.studentName);
        setTestDate(reportResponse.testDate);

        // Peer comparison is in metrics.comparisonWithPeers
        if (reportResponse.metrics.comparisonWithPeers) {
          setPeerComparison(reportResponse.metrics.comparisonWithPeers);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load report:', err);
        setError('리포트를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    loadReportData();
  }, [sessionId]);

  // Render heatmap on canvas
  useEffect(() => {
    if (heatmapData.length === 0 || !heatmapCanvasRef.current) return;

    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use first passage heatmap data
    const firstHeatmap = heatmapData[0];
    const { resolution, cells } = firstHeatmap;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find max intensity for normalization
    const maxIntensity = Math.max(...cells.map(cell => cell.intensity));

    // Create grid based on resolution
    const gridWidth = resolution.width;
    const gridHeight = resolution.height;
    const cellWidth = canvas.width / gridWidth;
    const cellHeight = canvas.height / gridHeight;

    // Draw heatmap cells
    cells.forEach((cell: HeatmapCell) => {
      const normalizedIntensity = maxIntensity > 0 ? cell.intensity / maxIntensity : 0;

      // Purple gradient (low to high intensity)
      const hue = 270; // Purple
      const saturation = 70;
      const lightness = 90 - normalizedIntensity * 50; // 90% to 40%

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(cell.x * cellWidth, cell.y * cellHeight, cellWidth, cellHeight);
    });

    // Draw grid lines (optional)
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= gridHeight; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(canvas.width, i * cellHeight);
      ctx.stroke();
    }
  }, [heatmapData]);

  // Prepare chart data for metrics
  const getEyeMovementData = () => {
    if (!metrics) return [];
    return [
      { name: '도약폭', value: metrics.averageSaccadeAmplitude, unit: 'px', optimal: 200 },
      { name: '도약 변동성', value: metrics.saccadeVariability, unit: 'px', optimal: 50 },
      { name: '도약 속도', value: metrics.averageSaccadeVelocity, unit: 'px/s', optimal: 1000 },
      { name: '최적 착지율', value: metrics.optimalLandingRate, unit: '%', optimal: 70 },
      { name: '줄바꿈 정확도', value: metrics.returnSweepAccuracy, unit: '%', optimal: 80 },
      { name: '경로 효율성', value: metrics.scanPathEfficiency * 100, unit: '%', optimal: 70 }
    ];
  };

  const getFixationData = () => {
    if (!metrics) return [];
    return [
      { name: '평균 응시시간', value: metrics.averageFixationDuration, unit: 'ms', optimal: 250 },
      { name: '단어당 응시', value: metrics.fixationsPerWord, unit: '회', optimal: 1.2 },
      { name: '역행률', value: metrics.regressionRate, unit: '%', optimal: 15 },
      { name: '어휘 격차', value: metrics.vocabularyGapScore, unit: '점', optimal: 30 }
    ];
  };

  const getReadingSpeedData = () => {
    if (!metrics) return [];
    return [
      { name: '읽기 속도', value: metrics.wordsPerMinute, unit: 'WPM', optimal: 150 },
      { name: '리듬 규칙성', value: metrics.rhythmRegularity * 100, unit: '%', optimal: 70 },
      { name: '체력 점수', value: metrics.staminaScore, unit: '점', optimal: 70 }
    ];
  };

  const getRadarData = () => {
    if (!metrics) return [];
    return [
      { category: '도약 품질', value: (metrics.averageSaccadeAmplitude / 300) * 100, fullMark: 100 },
      { category: '응시 효율', value: (250 / metrics.averageFixationDuration) * 100, fullMark: 100 },
      { category: '읽기 속도', value: (metrics.wordsPerMinute / 200) * 100, fullMark: 100 },
      { category: '경로 효율', value: metrics.scanPathEfficiency * 100, fullMark: 100 },
      { category: '이해도', value: (metrics.gazeComprehensionCorrelation + 1) * 50, fullMark: 100 }
    ];
  };

  // Export to PDF (future implementation)
  const handleExportPDF = () => {
    alert('PDF 내보내기 기능은 곧 추가될 예정입니다.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">리포트를 생성하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!metrics || !aiAnalysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">리포트 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Vision TEST 결과
              </h1>
              <p className="text-muted-foreground">
                {studentName} | {testDate ? new Date(testDate).toLocaleDateString('ko-KR') : ''}
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              PDF 내보내기
            </button>
          </div>

          {/* Overall Score Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">종합 시선 추적 점수</p>
              <div className="text-6xl font-bold text-primary mb-2">
                {metrics.overallEyeTrackingScore.toFixed(1)}
              </div>
              <p className="text-muted-foreground">/ 100점</p>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">AI 분석 결과</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                강점
              </h3>
              <ul className="space-y-2">
                {aiAnalysis.strengths.map((strength, idx) => (
                  <li key={idx} className="text-foreground text-sm flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <span className="text-yellow-500 mr-2">⚠</span>
                개선점
              </h3>
              <ul className="space-y-2">
                {aiAnalysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-foreground text-sm flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <span className="text-blue-500 mr-2">💡</span>
                추천 사항
              </h3>
              <ul className="space-y-2">
                {aiAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-foreground text-sm flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reading Strategy */}
          <div className="mt-6 bg-card rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">읽기 전략 분석</h3>
            <p className="text-foreground">{aiAnalysis.readingStrategy}</p>
          </div>
        </div>

        {/* Metrics Visualization */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">세부 메트릭</h2>

          {/* Radar Chart - Overall Performance */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">종합 성능 레이더</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={getRadarData()}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--foreground))' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Radar
                  name="내 점수"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Eye Movement Metrics */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">A. 눈 움직임 패턴</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getEyeMovementData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value.toFixed(1)} ${props.payload.unit}`,
                    '현재 값'
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="현재 값" />
                <Bar dataKey="optimal" fill="hsl(var(--muted))" name="목표 값" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fixation Metrics */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">B. 응시 행동</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getFixationData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value.toFixed(1)} ${props.payload.unit}`,
                    '현재 값'
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="현재 값" />
                <Bar dataKey="optimal" fill="hsl(var(--muted))" name="목표 값" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reading Speed Metrics */}
          <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">C. 읽기 속도 & 리듬</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getReadingSpeedData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value.toFixed(1)} ${props.payload.unit}`,
                    '현재 값'
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name="현재 값" />
                <Bar dataKey="optimal" fill="hsl(var(--muted))" name="목표 값" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attention Heatmap */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">집중도 히트맵</h2>
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <p className="text-muted-foreground mb-4">
              밝은 영역일수록 더 오래 응시한 부분입니다.
            </p>
            <div className="flex justify-center">
              <canvas
                ref={heatmapCanvasRef}
                width={1280}
                height={720}
                className="max-w-full h-auto border border-border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Peer Comparison */}
        {peerComparison && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">또래 비교 (학년: {peerComparison.grade})</h2>
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <p className="text-sm text-muted-foreground mb-4">
                백분위: {peerComparison.percentileRank}% | 비교 대상: {peerComparison.sampleSize}명
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={Object.entries(peerComparison.metricsComparison).map(([key, value]) => ({
                  metric: key,
                  myValue: value.studentValue,
                  peerAverage: value.peerAverage
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="metric" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="myValue" fill="hsl(var(--primary))" name="내 점수" />
                  <Bar dataKey="peerAverage" fill="hsl(var(--muted))" name="또래 평균" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            대시보드로
          </button>
          <button
            onClick={handleExportPDF}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            PDF 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};
