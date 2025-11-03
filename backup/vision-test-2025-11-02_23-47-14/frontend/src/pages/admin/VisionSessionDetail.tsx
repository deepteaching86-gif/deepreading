// Admin Vision Session Detail Page - View student's Vision TEST session with gaze replay
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GazeReplayPlayer } from '../../components/vision/GazeReplayPlayer';
import { getVisionReport, getVisionSessionGazeData } from '../../services/vision.service';
import {
  VisionMetrics,
  AIAnalysisResult,
  GazePoint
} from '../../types/vision.types';

export const VisionSessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Session data
  const [metrics, setMetrics] = useState<VisionMetrics | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [gazeData, setGazeData] = useState<GazePoint[]>([]);
  const [studentName, setStudentName] = useState<string>('');
  const [testDate, setTestDate] = useState<Date | null>(null);
  const [passageText, setPassageText] = useState<string>('');

  // Active tab
  const [activeTab, setActiveTab] = useState<'replay' | 'metrics' | 'analysis'>('replay');

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);

        // Load vision report
        const reportResponse = await getVisionReport(sessionId);
        setMetrics(reportResponse.metrics);
        setAiAnalysis(reportResponse.aiAnalysis);
        setStudentName(reportResponse.studentName);
        setTestDate(reportResponse.testDate);

        // Load gaze data for replay
        const gazeResponse = await getVisionSessionGazeData(sessionId);
        setGazeData(gazeResponse.gazePoints);
        setPassageText(gazeResponse.passageText || '샘플 지문 텍스트입니다...');

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load session:', err);
        setError('세션 데이터를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">세션 데이터를 로딩하는 중...</p>
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
            onClick={() => navigate('/admin/vision-sessions')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/vision-sessions')}
            className="mb-4 text-primary hover:text-primary/80 flex items-center gap-2"
          >
            ← 목록으로
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Vision TEST 세션 상세
              </h1>
              <p className="text-muted-foreground">
                {studentName} | {testDate ? new Date(testDate).toLocaleDateString('ko-KR') : ''}
              </p>
            </div>

            {/* Overall Score Badge */}
            {metrics && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl px-6 py-4 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">종합 점수</p>
                <p className="text-3xl font-bold text-primary">
                  {metrics.overallEyeTrackingScore.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('replay')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'replay'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              시선 재생
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'metrics'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              메트릭
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'analysis'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              AI 분석
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'replay' && gazeData.length > 0 && (
          <GazeReplayPlayer
            gazeData={gazeData}
            passageText={passageText}
            width={1280}
            height={720}
          />
        )}

        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            {/* Eye Movement Metrics */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">A. 눈 움직임 패턴</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  label="평균 도약폭"
                  value={metrics.averageSaccadeAmplitude}
                  unit="px"
                  optimal={200}
                />
                <MetricCard
                  label="도약 변동성"
                  value={metrics.saccadeVariability}
                  unit="px"
                  optimal={50}
                />
                <MetricCard
                  label="도약 속도"
                  value={metrics.averageSaccadeVelocity}
                  unit="px/s"
                  optimal={1000}
                />
                <MetricCard
                  label="최적 착지율"
                  value={metrics.optimalLandingRate}
                  unit="%"
                  optimal={70}
                />
                <MetricCard
                  label="줄바꿈 정확도"
                  value={metrics.returnSweepAccuracy}
                  unit="%"
                  optimal={80}
                />
                <MetricCard
                  label="경로 효율성"
                  value={metrics.scanPathEfficiency * 100}
                  unit="%"
                  optimal={70}
                />
              </div>
            </div>

            {/* Fixation Metrics */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">B. 응시 행동</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="평균 응시시간"
                  value={metrics.averageFixationDuration}
                  unit="ms"
                  optimal={250}
                />
                <MetricCard
                  label="단어당 응시"
                  value={metrics.fixationsPerWord}
                  unit="회"
                  optimal={1.2}
                />
                <MetricCard
                  label="역행률"
                  value={metrics.regressionRate}
                  unit="%"
                  optimal={15}
                />
                <MetricCard
                  label="어휘 격차"
                  value={metrics.vocabularyGapScore}
                  unit="점"
                  optimal={30}
                />
              </div>
            </div>

            {/* Reading Speed Metrics */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">C. 읽기 속도 & 리듬</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  label="읽기 속도"
                  value={metrics.wordsPerMinute}
                  unit="WPM"
                  optimal={150}
                />
                <MetricCard
                  label="리듬 규칙성"
                  value={metrics.rhythmRegularity * 100}
                  unit="%"
                  optimal={70}
                />
                <MetricCard
                  label="체력 점수"
                  value={metrics.staminaScore}
                  unit="점"
                  optimal={70}
                />
              </div>
            </div>

            {/* Comprehension Metrics */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">D. 이해도 & 인지</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard
                  label="시선-이해 상관"
                  value={(metrics.gazeComprehensionCorrelation + 1) * 50}
                  unit="%"
                  optimal={70}
                />
                <MetricCard
                  label="인지 부하"
                  value={metrics.cognitiveLoadIndex}
                  unit="점"
                  optimal={50}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && aiAnalysis && (
          <div className="space-y-6">
            {/* Reading Strategy */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-2">읽기 전략</h3>
              <p className="text-foreground">{aiAnalysis.readingStrategy}</p>
            </div>

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
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  optimal: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, optimal }) => {
  // Calculate performance (how close to optimal)
  const difference = Math.abs(value - optimal);
  const percentDiff = (difference / optimal) * 100;

  let statusColor = '';
  let statusText = '';

  if (percentDiff < 10) {
    statusColor = 'text-green-500';
    statusText = '우수';
  } else if (percentDiff < 30) {
    statusColor = 'text-yellow-500';
    statusText = '보통';
  } else {
    statusColor = 'text-red-500';
    statusText = '개선 필요';
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">
          {value.toFixed(1)}
        </p>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-muted-foreground">목표: {optimal} {unit}</span>
        <span className={`font-medium ${statusColor}`}>{statusText}</span>
      </div>
    </div>
  );
};
