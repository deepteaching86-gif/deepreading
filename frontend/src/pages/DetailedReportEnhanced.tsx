import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../lib/axios';
import { A4ReportPage } from '../components/report/A4ReportPage';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Radar, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

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

export default function DetailedReportEnhanced() {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">레포트 생성 중...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-red-600 text-xl font-semibold">레포트를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 레이더 차트 데이터 (또래 비교)
  const literacyCategories = reportData.categoryScores.slice(0, 4);
  const radarData = {
    labels: literacyCategories.map((c) => c.categoryName),
    datasets: [
      {
        label: '학생',
        data: literacyCategories.map((c) => c.percentage),
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: '또래평균',
        data: literacyCategories.map((c) => c.peerAverage),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: {
            size: 12,
          },
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
          },
        },
      },
    },
  };

  // 백분위 막대 차트
  const percentileData = {
    labels: literacyCategories.map((c) => c.categoryName),
    datasets: [
      {
        label: '백분위 (상위 %)',
        data: literacyCategories.map((c) => 100 - c.percentile),
        backgroundColor: literacyCategories.map((c) => {
          const percentile = 100 - c.percentile;
          if (percentile <= 25) return 'rgba(34, 197, 94, 0.8)';
          if (percentile <= 50) return 'rgba(59, 130, 246, 0.8)';
          if (percentile <= 75) return 'rgba(251, 146, 60, 0.8)';
          return 'rgba(239, 68, 68, 0.8)';
        }),
        borderColor: literacyCategories.map((c) => {
          const percentile = 100 - c.percentile;
          if (percentile <= 25) return 'rgb(34, 197, 94)';
          if (percentile <= 50) return 'rgb(59, 130, 246)';
          if (percentile <= 75) return 'rgb(251, 146, 60)';
          return 'rgb(239, 68, 68)';
        }),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const percentileOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return `상위 ${value}%`;
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        ticks: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `상위 ${context.parsed.x.toFixed(1)}%`;
          },
        },
      },
    },
  };

  // 정답/오답 도넛 차트
  const doughnutData = {
    labels: ['정답', '오답'],
    datasets: [
      {
        data: [reportData.overall.correctAnswers, reportData.overall.incorrectAnswers],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.4)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 13,
            weight: 'bold' as const,
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed}개 (${percentage}%)`;
          },
        },
      },
    },
  };

  // 영역별 점수 막대 차트
  const barData = {
    labels: reportData.categoryScores.map((c) => c.categoryName),
    datasets: [
      {
        label: '학생',
        data: reportData.categoryScores.map((c) => c.percentage),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: '또래평균',
        data: reportData.categoryScores.map((c) => c.peerAverage),
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return `${value}%`;
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
            weight: 'bold' as const,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 13,
            weight: 'bold' as const,
          },
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page 1: 종합 성적 & 또래 비교 */}
        <A4ReportPage pageNumber={1} totalPages={3} title="문해력 평가 상세 레포트">
          {/* 학생 정보 - 그라데이션 배경 */}
          <div className="mb-8 bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-xl shadow-md border border-blue-200">
            <h2 className="text-xl font-bold mb-3 text-blue-900 flex items-center">
              <span className="text-2xl mr-2">👤</span> 수험자 정보
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                <span className="font-semibold text-gray-700">이름:</span>{' '}
                <span className="text-blue-900 font-bold">{reportData.student.name}</span>
              </div>
              <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                <span className="font-semibold text-gray-700">학년:</span>{' '}
                <span className="text-blue-900 font-bold">{reportData.student.grade}학년</span>
              </div>
              <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                <span className="font-semibold text-gray-700">반:</span>{' '}
                <span className="text-blue-900 font-bold">{reportData.student.className || '-'}</span>
              </div>
            </div>
            <div className="mt-3 text-sm bg-white bg-opacity-70 p-3 rounded-lg">
              <span className="font-semibold text-gray-700">평가명:</span>{' '}
              <span className="text-blue-900 font-bold">{reportData.test.title}</span>
            </div>
            <div className="mt-2 text-sm bg-white bg-opacity-70 p-3 rounded-lg">
              <span className="font-semibold text-gray-700">평가일:</span>{' '}
              <span className="text-blue-900 font-bold">
                {new Date(reportData.test.date).toLocaleDateString('ko-KR')}
                {reportData.test.duration && ` (소요시간: ${reportData.test.duration}분)`}
              </span>
            </div>
          </div>

          {/* 종합 성적 - 큰 카드 스타일 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <span className="text-2xl mr-2">📊</span> 종합 성적
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                <div className="text-6xl font-extrabold mb-2">{reportData.overall.percentage.toFixed(1)}%</div>
                <div className="text-lg font-medium">정답률</div>
                <div className="text-sm mt-3 opacity-90">
                  {reportData.overall.totalScore} / {reportData.overall.totalPossible}점
                </div>
              </div>
              <div className="col-span-1 bg-gradient-to-br from-purple-500 to-purple-700 text-white p-8 rounded-2xl shadow-xl text-center transform hover:scale-105 transition-transform">
                <div className="text-6xl font-extrabold mb-2">{reportData.overall.gradeLevel}</div>
                <div className="text-lg font-medium">등급</div>
                <div className="text-sm mt-3 opacity-90">9등급 체계</div>
              </div>
              <div className="col-span-1">
                <div className="h-full">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* 레이더 차트 (또래 비교) */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <span className="text-2xl mr-2">📈</span> 영역별 또래 비교
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div style={{ height: '350px' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>
        </A4ReportPage>

        <div className="h-8 print:hidden"></div>

        {/* Page 2: 영역별 상세 분석 */}
        <A4ReportPage pageNumber={2} totalPages={3} title="문해력 평가 상세 레포트">
          {/* 영역별 바 차트 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <span className="text-2xl mr-2">📊</span> 영역별 상세 분석
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div style={{ height: '280px' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* 백분위 차트 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <span className="text-2xl mr-2">🎯</span> 백분위 순위
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div style={{ height: '220px' }}>
                <Bar data={percentileData} options={percentileOptions} />
              </div>
            </div>
          </div>

          {/* 강점/약점 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl shadow-md border-2 border-green-200">
              <h3 className="font-bold text-lg mb-3 text-green-800 flex items-center">
                <span className="text-2xl mr-2">💪</span> 강점
              </h3>
              <ul className="text-sm space-y-2">
                {reportData.analysis.strengths.length > 0 ? (
                  reportData.analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2 font-bold">✓</span>
                      <span className="text-green-700">{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">분석 데이터 없음</li>
                )}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl shadow-md border-2 border-orange-200">
              <h3 className="font-bold text-lg mb-3 text-orange-800 flex items-center">
                <span className="text-2xl mr-2">📚</span> 보완 영역
              </h3>
              <ul className="text-sm space-y-2">
                {reportData.analysis.weaknesses.length > 0 ? (
                  reportData.analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-orange-600 mr-2 font-bold">→</span>
                      <span className="text-orange-700">{w}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">분석 데이터 없음</li>
                )}
              </ul>
            </div>
          </div>
        </A4ReportPage>

        <div className="h-8 print:hidden"></div>

        {/* Page 3: 학습 제안 & 오답 분석 */}
        <A4ReportPage pageNumber={3} totalPages={3} title="문해력 평가 상세 레포트">
          {/* 학습 제안 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <span className="text-2xl mr-2">💡</span> 맞춤형 학습 제안
            </h2>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl shadow-md border-2 border-yellow-200">
              <ul className="space-y-3">
                {reportData.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start bg-white bg-opacity-60 p-3 rounded-lg">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-yellow-500 text-white rounded-full font-bold mr-3 flex-shrink-0 text-sm">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 font-medium">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 오답 분석 */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
              <span className="text-2xl mr-2">❌</span> 오답 분석 (주요 문항)
            </h2>
            <div className="space-y-3">
              {reportData.incorrectAnswers.slice(0, 5).map((ans, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border-l-4 border-red-500 shadow-md"
                >
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full font-bold mr-3 text-sm">
                      {ans.questionNumber}
                    </span>
                    <span className="text-sm font-bold text-red-700">{ans.categoryName}</span>
                  </div>
                  <div className="text-sm text-gray-700 ml-11">
                    <span className="font-semibold">정답:</span> {ans.correctAnswer}
                  </div>
                  {ans.explanation && (
                    <div className="text-sm text-gray-600 mt-2 ml-11 bg-white bg-opacity-70 p-2 rounded">
                      💬 {ans.explanation}
                    </div>
                  )}
                </div>
              ))}
              {reportData.incorrectAnswers.length === 0 && (
                <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 py-8 rounded-xl border-2 border-green-200">
                  <div className="text-6xl mb-3">🎉</div>
                  <p className="text-green-700 font-bold text-lg">모든 문제를 정답으로 맞췄습니다!</p>
                  <p className="text-green-600 text-sm mt-2">완벽한 성과입니다</p>
                </div>
              )}
            </div>
          </div>
        </A4ReportPage>

        {/* 전체 인쇄 버튼 */}
        <div className="text-center mt-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-xl transform hover:scale-105"
          >
            🖨️ 전체 레포트 인쇄
          </button>
        </div>
      </div>
    </div>
  );
}
