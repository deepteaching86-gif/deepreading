import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../lib/axios';
import { GradePyramid } from '../../components/GradePyramid';
import { determineLiteracyType, type LiteracyScores } from '../../utils/literacyTypes';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

interface Answer {
  questionNumber: number;
  studentAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  feedback?: string;
  question: {
    questionText: string;
    questionType: string;
    correctAnswer: string;
    category: string;
  };
}

interface SessionResult {
  result: {
    sessionId: string;
    studentId: string;
    totalScore: number;
    grade: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    completedAt: string;
    categoryScores: {
      category: string;
      score: number;
      maxScore: number;
      percentage: number;
    }[];
  };
  template: {
    title: string;
    description: string;
  };
  answers: Answer[];
}

const TestResultEnhanced = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await axios.get(`/api/v1/sessions/${sessionId}/result`);
        if (response.data.success) {
          setResult(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '결과를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error || '결과를 찾을 수 없습니다.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate literacy scores
  const vocabularyScore = result.result.categoryScores.find(c => c.category === 'vocabulary')?.percentage || 0;
  const readingScore = result.result.categoryScores.find(c => c.category === 'reading')?.percentage || 0;
  const grammarScore = result.result.categoryScores.find(c => c.category === 'grammar')?.percentage || 0;
  const reasoningScore = result.result.categoryScores.find(c => c.category === 'reasoning')?.percentage || 0;

  const literacyScores: LiteracyScores = {
    vocabulary: vocabularyScore,
    reading: readingScore,
    grammar: grammarScore,
    reasoning: reasoningScore,
  };

  const literacyType = determineLiteracyType(literacyScores);

  // Radar chart data
  const radarData = {
    labels: ['어휘력', '독해력', '문법/어법', '추론/사고력'],
    datasets: [
      {
        label: '내 점수',
        data: [vocabularyScore, readingScore, grammarScore, reasoningScore],
        backgroundColor: 'oklch(0.7 0.15 270 / 0.2)',
        borderColor: 'oklch(0.6 0.2 270)',
        borderWidth: 3,
        pointBackgroundColor: 'oklch(0.6 0.2 270)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'oklch(0.6 0.2 270)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { size: 12 },
          color: 'oklch(0.4 0.05 270)',
        },
        grid: {
          color: 'oklch(0.9 0.02 270)',
        },
        pointLabels: {
          font: { size: 14, weight: 'bold' as const },
          color: 'oklch(0.3 0.08 270)',
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.r.toFixed(1)}%`,
        },
      },
    },
  };

  // Bar chart data for category comparison
  const barData = {
    labels: ['어휘력', '독해력', '문법/어법', '추론/사고력'],
    datasets: [
      {
        label: '점수 (%)',
        data: [vocabularyScore, readingScore, grammarScore, reasoningScore],
        backgroundColor: [
          'oklch(0.7 0.15 270 / 0.8)',
          'oklch(0.65 0.18 280 / 0.8)',
          'oklch(0.6 0.2 290 / 0.8)',
          'oklch(0.55 0.22 300 / 0.8)',
        ],
        borderColor: [
          'oklch(0.6 0.2 270)',
          'oklch(0.55 0.22 280)',
          'oklch(0.5 0.24 290)',
          'oklch(0.45 0.26 300)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
          font: { size: 12 },
          color: 'oklch(0.4 0.05 270)',
        },
        grid: {
          color: 'oklch(0.9 0.02 270)',
        },
      },
      y: {
        ticks: {
          font: { size: 13, weight: 'bold' as const },
          color: 'oklch(0.3 0.08 270)',
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.x.toFixed(1)}%`,
        },
      },
    },
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      vocabulary: '어휘력',
      reading: '독해력',
      grammar: '문법/어법',
      reasoning: '추론/사고력',
    };
    return names[category] || category;
  };

  const getGradeLabel = (grade: number) => {
    const labels: Record<number, string> = {
      1: '최우수',
      2: '우수',
      3: '양호',
      4: '보통 상',
      5: '보통',
      6: '보통 하',
      7: '노력 요함',
      8: '많은 노력 요함',
      9: '집중 지원 필요',
    };
    return labels[grade] || '미평가';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-purple-600">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">문해력 진단 결과</h1>
              <p className="text-gray-600">{result.template.title}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">완료 일시</div>
              <div className="text-lg font-semibold text-gray-700">
                {new Date(result.result.completedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Overall Score and Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6">
              <div className="text-center">
                <div className="text-sm font-medium text-purple-700 mb-2">종합 점수</div>
                <div className="text-5xl font-bold text-purple-900 mb-2">
                  {result.result.totalScore}점
                </div>
                <div className="text-lg text-purple-700">
                  {result.result.categoryScores.reduce((acc, c) => acc + c.maxScore, 0)}점 만점
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-6">
              <div className="text-center">
                <div className="text-sm font-medium text-indigo-700 mb-2">종합 등급</div>
                <div className="text-5xl font-bold text-indigo-900 mb-2">
                  {result.result.grade}등급
                </div>
                <div className="text-lg text-indigo-700">{getGradeLabel(result.result.grade)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Pyramid */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            등급 분포도
          </h2>
          <p className="text-gray-600 mb-6">
            전체 응시자 중 내 위치를 확인해보세요. 각 등급은 상위 누적 비율을 나타냅니다.
          </p>
          <GradePyramid currentGrade={result.result.grade} className="mx-auto" />
        </div>

        {/* Literacy Type Section */}
        <div
          className="bg-white rounded-2xl shadow-lg p-8 border-l-8"
          style={{ borderColor: literacyType.color }}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl">{literacyType.emoji}</span>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{literacyType.name}</h2>
              <p className="text-lg text-gray-600 mt-1">내 문해력 유형</p>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">{literacyType.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span>💪</span> 강점
              </h3>
              <ul className="space-y-3">
                {literacyType.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                <span>🎯</span> 개선 필요 영역
              </h3>
              <ul className="space-y-3">
                {literacyType.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-orange-600 mt-1">!</span>
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
              <span>📚</span> 맞춤 학습 전략
            </h3>
            <div className="space-y-4">
              {literacyType.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">{idx + 1}.</span>
                  <span className="text-gray-700 leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Career Suggestions */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
              <span>🎓</span> 추천 진로 분야
            </h3>
            <div className="flex flex-wrap gap-3">
              {literacyType.careers.map((career, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-white rounded-full text-purple-700 font-medium shadow-sm border border-purple-200"
                >
                  {career}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Scores - Radar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            영역별 상세 분석
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                종합 분석 차트
              </h3>
              <div className="h-80 flex items-center justify-center">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                영역별 점수 비교
              </h3>
              <div className="h-80 flex items-center justify-center">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            영역별 점수
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-100 to-indigo-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-purple-900">영역</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900">점수</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900">만점</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-900">
                    정답률
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-purple-900">
                    시각화
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.result.categoryScores.map((cat, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {getCategoryName(cat.category)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {cat.score}점
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {cat.maxScore}점
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          cat.percentage >= 80
                            ? 'bg-green-100 text-green-800'
                            : cat.percentage >= 60
                            ? 'bg-blue-100 text-blue-800'
                            : cat.percentage >= 40
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-600"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Feedback Section */}
        {result.answers && result.answers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              AI 맞춤 피드백
            </h2>
            <p className="text-gray-600 mb-6">
              틀린 문제에 대한 AI의 상세한 분석과 개선 방향을 확인하세요.
            </p>
            <div className="space-y-6">
              {result.answers.map((answer, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">💡</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-2">
                        문제 {answer.questionNumber}번 - {getCategoryName(answer.question.category)}
                      </div>
                      <div className="text-sm text-gray-700 mb-3 bg-white rounded p-3">
                        <span className="font-semibold">문제:</span> {answer.question.questionText}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-semibold text-red-600">내 답변:</span>{' '}
                        {answer.studentAnswer || '(미응답)'}
                      </div>
                      <div className="text-sm text-gray-700 mb-3">
                        <span className="font-semibold text-green-600">정답:</span>{' '}
                        {answer.question.correctAnswer}
                      </div>
                      {answer.feedback && (
                        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-600">
                          <div className="font-semibold text-blue-800 mb-2">AI 피드백</div>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {answer.feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strengths */}
          {result.result.strengths.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-3xl">🌟</span>
                주요 강점
              </h2>
              <ul className="space-y-4">
                {result.result.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-500 text-xl mt-0.5">✓</span>
                    <span className="text-gray-700 leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {result.result.weaknesses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-3xl">📈</span>
                개선 포인트
              </h2>
              <ul className="space-y-4">
                {result.result.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-orange-500 text-xl mt-0.5">→</span>
                    <span className="text-gray-700 leading-relaxed">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* General Recommendations */}
        {result.result.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">💡</span>
              종합 학습 가이드
            </h2>
            <div className="space-y-4">
              {result.result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg"
                >
                  <span className="text-purple-600 font-bold text-lg">{idx + 1}</span>
                  <span className="text-gray-700 leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/report/${result.result.sessionId}`}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-center"
          >
            📄 상세 리포트 보기
          </Link>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl border-2 border-purple-200"
          >
            🏠 대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultEnhanced;
