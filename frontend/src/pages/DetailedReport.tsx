import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../lib/axios';
import { A4ReportPage } from '../components/report/A4ReportPage';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ReportData {
  student: {
    name: string;
    grade: number;
    className: string | null;
  };
  test: {
    title: string;
    date: string;
    duration: number | null;
  };
  overall: {
    totalScore: number;
    totalPossible: number;
    percentage: number;
    gradeLevel: number;
    correctAnswers: number;
    incorrectAnswers: number;
  };
  categoryScores: Array<{
    category: string;
    categoryName: string;
    score: number;
    maxScore: number;
    percentage: number;
    peerAverage: number;
    percentile: number;
  }>;
  peerComparison: Record<string, any>;
  analysis: {
    strengths: string[];
    weaknesses: string[];
  };
  recommendations: string[];
  incorrectAnswers: any[];
}

export default function DetailedReport() {
  const { resultId } = useParams<{ resultId: string }>();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [resultId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/reports/results/${resultId}/detailed`);
      setReportData(res.data.data);
    } catch (error) {
      console.error('레포트 조회 실패:', error);
      alert('레포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">레포트 생성 중...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg">레포트를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 레이더 차트 데이터 (또래 비교)
  const radarData = reportData.categoryScores.slice(0, 4).map(cat => ({
    subject: cat.categoryName,
    학생: cat.percentage,
    또래평균: cat.peerAverage,
  }));

  // 바 차트 데이터 (영역별 점수)
  const barData = reportData.categoryScores.map(cat => ({
    name: cat.categoryName,
    학생: cat.percentage,
    또래평균: cat.peerAverage,
  }));

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page 1: 종합 성적 & 또래 비교 */}
        <A4ReportPage pageNumber={1} totalPages={3} title="문해력 평가 상세 레포트">
          {/* 학생 정보 */}
          <div className="mb-8 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">수험자 정보</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="font-semibold">이름:</span> {reportData.student.name}</div>
              <div><span className="font-semibold">학년:</span> {reportData.student.grade}학년</div>
              <div><span className="font-semibold">반:</span> {reportData.student.className || '-'}</div>
            </div>
            <div className="mt-2 text-sm">
              <span className="font-semibold">평가명:</span> {reportData.test.title}
            </div>
            <div className="mt-1 text-sm">
              <span className="font-semibold">평가일:</span> {new Date(reportData.test.date).toLocaleDateString('ko-KR')}
              {reportData.test.duration && ` (소요시간: ${reportData.test.duration}분)`}
            </div>
          </div>

          {/* 종합 성적 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">📊 종합 성적</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg text-center">
                <div className="text-4xl font-bold">{reportData.overall.percentage.toFixed(1)}%</div>
                <div className="text-sm mt-2">총점: {reportData.overall.totalScore} / {reportData.overall.totalPossible}점</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg text-center">
                <div className="text-4xl font-bold">{reportData.overall.gradeLevel}등급</div>
                <div className="text-sm mt-2">정답: {reportData.overall.correctAnswers}개 / 오답: {reportData.overall.incorrectAnswers}개</div>
              </div>
            </div>
          </div>

          {/* 레이더 차트 (또래 비교) */}
          <div>
            <h2 className="text-lg font-bold mb-3">📈 영역별 또래 비교</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="학생" dataKey="학생" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="또래평균" dataKey="또래평균" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </A4ReportPage>

        <div className="h-8"></div>

        {/* Page 2: 영역별 상세 분석 */}
        <A4ReportPage pageNumber={2} totalPages={3} title="문해력 평가 상세 레포트">
          {/* 영역별 바 차트 */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">📊 영역별 상세 분석</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="학생" fill="#3b82f6" />
                <Bar dataKey="또래평균" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 영역별 백분위 */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">백분위 순위</h3>
            <div className="grid grid-cols-2 gap-2">
              {reportData.categoryScores.slice(0, 4).map(cat => (
                <div key={cat.category} className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-semibold">{cat.categoryName}</div>
                  <div className="text-2xl font-bold text-blue-600">상위 {100 - cat.percentile}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* 강점/약점 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2 text-green-700">💪 강점</h3>
              <ul className="text-sm space-y-1">
                {reportData.analysis.strengths.length > 0 ? (
                  reportData.analysis.strengths.map((s, i) => (
                    <li key={i} className="text-green-600">• {s}</li>
                  ))
                ) : (
                  <li className="text-gray-400">분석 데이터 없음</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-orange-700">📚 보완 영역</h3>
              <ul className="text-sm space-y-1">
                {reportData.analysis.weaknesses.length > 0 ? (
                  reportData.analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-orange-600">• {w}</li>
                  ))
                ) : (
                  <li className="text-gray-400">분석 데이터 없음</li>
                )}
              </ul>
            </div>
          </div>
        </A4ReportPage>

        <div className="h-8"></div>

        {/* Page 3: 학습 제안 & 오답 분석 */}
        <A4ReportPage pageNumber={3} totalPages={3} title="문해력 평가 상세 레포트">
          {/* 학습 제안 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">💡 학습 제안</h2>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <ul className="text-sm space-y-2">
                {reportData.recommendations.map((rec, i) => (
                  <li key={i} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 오답 분석 (최대 5개) */}
          <div>
            <h2 className="text-lg font-bold mb-3">❌ 오답 분석 (주요 문항)</h2>
            <div className="space-y-3">
              {reportData.incorrectAnswers.slice(0, 5).map((ans, i) => (
                <div key={i} className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                  <div className="text-sm font-semibold text-red-700">
                    문제 {ans.questionNumber}: {ans.categoryName}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    정답: {ans.correctAnswer}
                  </div>
                  {ans.explanation && (
                    <div className="text-xs text-gray-500 mt-1">
                      💬 {ans.explanation}
                    </div>
                  )}
                </div>
              ))}
              {reportData.incorrectAnswers.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  🎉 모든 문제를 정답으로 맞췄습니다!
                </div>
              )}
            </div>
          </div>
        </A4ReportPage>

        {/* 전체 인쇄 버튼 */}
        <div className="text-center mt-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            🖨️ 전체 레포트 인쇄
          </button>
        </div>
      </div>
    </div>
  );
}
