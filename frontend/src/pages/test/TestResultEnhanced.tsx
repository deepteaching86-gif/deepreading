import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [showCopySuccess, setShowCopySuccess] = useState(false);

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

  const handleCopyUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 3000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-700 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-200">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error || '결과를 찾을 수 없습니다.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-violet-700 text-white rounded-lg hover:bg-violet-800 transition-colors"
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
        backgroundColor: 'rgba(109, 40, 217, 0.2)',
        borderColor: 'rgb(109, 40, 217)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(109, 40, 217)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(109, 40, 217)',
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
          font: { size: 11 },
          color: '#6b7280',
        },
        grid: {
          color: '#e5e7eb',
        },
        pointLabels: {
          font: { size: 13, weight: 'bold' as const },
          color: '#374151',
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

  // Bar chart data
  const barData = {
    labels: ['어휘력', '독해력', '문법/어법', '추론/사고력'],
    datasets: [
      {
        label: '점수 (%)',
        data: [vocabularyScore, readingScore, grammarScore, reasoningScore],
        backgroundColor: 'rgba(109, 40, 217, 0.8)',
        borderColor: 'rgb(109, 40, 217)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
          font: { size: 11 },
          color: '#6b7280',
        },
        grid: {
          color: '#f3f4f6',
        },
      },
      y: {
        ticks: {
          font: { size: 12, weight: 'bold' as const },
          color: '#374151',
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
      1: '최우수 (상위 4%)',
      2: '우수 (상위 11%)',
      3: '양호 (상위 23%)',
      4: '보통 상 (상위 40%)',
      5: '보통 (중위 50%)',
      6: '보통 하 (하위 40%)',
      7: '노력 요함 (하위 23%)',
      8: '많은 노력 (하위 11%)',
      9: '특별 지도 (하위 4%)',
    };
    return labels[grade] || `${grade}등급`;
  };

  const getDifficulties = () => {
    const difficulties: { title: string; description: string }[] = [];

    if (vocabularyScore < 60) {
      difficulties.push({
        title: '어휘 이해의 어려움',
        description: '새로운 단어를 만났을 때 의미를 파악하기 어렵고, 문장 속 낯선 어휘 때문에 전체 내용을 이해하는 데 막힘을 느낍니다. 이는 학습 자료 이해와 시험 문제 해석에 직접적인 영향을 줍니다.',
      });
    }

    if (readingScore < 60) {
      difficulties.push({
        title: '긴 글 이해의 어려움',
        description: '여러 문단으로 이루어진 긴 지문을 읽을 때 앞부분 내용을 잊어버리거나, 글의 전체 흐름을 파악하기 어렵습니다. 교과서나 참고서를 읽을 때 쉽게 지치고 집중력이 떨어질 수 있습니다.',
      });
    }

    if (grammarScore < 60) {
      difficulties.push({
        title: '문장 구조 파악의 어려움',
        description: '복잡한 문장 구조를 만났을 때 주어와 서술어, 수식 관계를 정확히 파악하기 어렵습니다. 이로 인해 글쓰기에서도 문법적 오류가 자주 발생하고, 자신의 생각을 명확하게 표현하는 데 어려움을 겪을 수 있습니다.',
      });
    }

    if (reasoningScore < 60) {
      difficulties.push({
        title: '논리적 사고의 어려움',
        description: '글에서 직접적으로 드러나지 않은 내용을 추론하거나, 원인과 결과를 연결하여 이해하기 어렵습니다. 수학 문장제나 과학 실험 결과 해석 등에서 어려움을 겪으며, 비판적으로 글을 읽고 판단하는 능력이 부족할 수 있습니다.',
      });
    }

    if (difficulties.length === 0) {
      difficulties.push({
        title: '균형 잡힌 문해력',
        description: '전반적으로 양호한 문해력을 보이고 있습니다. 현재 수준을 유지하면서 더 다양한 글을 접하고 깊이 있는 사고를 연습한다면 더욱 향상될 수 있습니다.',
      });
    }

    return difficulties;
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .chart-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .grid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Copy Success Alert */}
        {showCopySuccess && (
          <div className="fixed top-4 right-4 bg-violet-700 text-white px-6 py-3 rounded-lg shadow-lg z-50 no-print">
            ✅ URL이 클립보드에 복사되었습니다!
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 page-break">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">문해력 진단 결과</h1>
              <p className="text-sm text-gray-600">{result.template.title}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">완료 일시</div>
              <div className="text-sm font-medium text-gray-700">
                {new Date(result.result.completedAt).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Score and Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
              <div className="text-center">
                <div className="text-xs font-medium text-violet-700 mb-1">종합 점수</div>
                <div className="text-3xl font-bold text-violet-900 mb-1">
                  {result.result.totalScore}점
                </div>
                <div className="text-sm text-violet-700">
                  {result.result.categoryScores.reduce((acc, c) => acc + c.maxScore, 0)}점 만점
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-700 mb-1">종합 등급</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {result.result.grade}등급
                </div>
                <div className="text-sm text-gray-600">{getGradeLabel(result.result.grade)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Pyramid */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 page-break">
          <h2 className="text-lg font-bold text-gray-900 mb-4">등급 분포도</h2>
          <p className="text-sm text-gray-600 mb-4">
            전체 응시자 중 내 위치를 확인해보세요.
          </p>
          <GradePyramid currentGrade={result.result.grade} className="mx-auto" />
        </div>

        {/* Literacy Type */}
        <div className="bg-violet-50 rounded-xl shadow-sm p-6 border border-violet-200 page-break">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{literacyType.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{literacyType.name}</h2>
              <p className="text-sm text-gray-600">내 문해력 유형</p>
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {literacyType.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Strengths */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">💪 강점</h3>
              <ul className="space-y-2">
                {literacyType.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-violet-700 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">🎯 개선 영역</h3>
              <ul className="space-y-2">
                {literacyType.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">📚 맞춤 학습 전략</h3>
            <div className="space-y-2">
              {literacyType.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-violet-700 font-semibold">{idx + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty Challenges */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 page-break">
          <h2 className="text-lg font-bold text-gray-900 mb-4">⚠️ 약점으로 인한 어려움</h2>
          <p className="text-sm text-gray-600 mb-4">
            현재 문해력 수준에서 겪을 수 있는 구체적인 어려움입니다.
          </p>
          <div className="space-y-3">
            {getDifficulties().map((difficulty, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2">{difficulty.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{difficulty.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 chart-container page-break">
          <h2 className="text-lg font-bold text-gray-900 mb-4">영역별 분석</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                종합 분석
              </h3>
              <div className="h-64 flex items-center justify-center">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                점수 비교
              </h3>
              <div className="h-64 flex items-center justify-center">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 page-break">
          <h2 className="text-lg font-bold text-gray-900 mb-4">영역별 점수</h2>
          <div className="space-y-3">
            {result.result.categoryScores.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {getCategoryName(cat.category)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600">
                      {cat.score}점 / {cat.maxScore}점
                    </span>
                    <span className="text-sm font-bold text-violet-700 min-w-[50px] text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-violet-700 transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Feedback */}
        {result.answers && result.answers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 page-break">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🤖 AI 피드백</h2>
            <p className="text-sm text-gray-600 mb-4">
              틀린 문제에 대한 AI의 분석입니다.
            </p>
            <div className="space-y-4">
              {result.answers.map((answer, idx) => (
                <div
                  key={idx}
                  className="bg-violet-50 rounded-lg p-4 border border-violet-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        문제 {answer.questionNumber}번 - {getCategoryName(answer.question.category)}
                      </div>
                      <div className="text-xs text-gray-700 mb-2 bg-white rounded p-2 border border-gray-200">
                        <span className="font-semibold">문제:</span> {answer.question.questionText}
                      </div>
                      <div className="text-xs text-gray-700 mb-1">
                        <span className="font-semibold">내 답변:</span>{' '}
                        {answer.studentAnswer || '(미응답)'}
                      </div>
                      <div className="text-xs text-gray-700 mb-2">
                        <span className="font-semibold">정답:</span>{' '}
                        {answer.question.correctAnswer}
                      </div>
                      {answer.feedback && (
                        <div className="bg-white rounded p-3 border border-violet-300">
                          <div className="text-xs font-semibold text-violet-900 mb-1">AI 피드백</div>
                          <div className="text-xs text-gray-700 leading-relaxed">
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

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 page-break">
          {/* Improvement Points */}
          {result.result.weaknesses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📈 개선 포인트</h2>
              <ul className="space-y-3">
                {result.result.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-500 mt-0.5">→</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Guide */}
          {result.result.recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">💡 학습 가이드</h2>
              <div className="space-y-3">
                {result.result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-violet-700 font-semibold">{idx + 1}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 no-print">
          <button
            onClick={handleCopyUrl}
            className="px-8 py-3 bg-white text-violet-700 rounded-lg font-semibold hover:bg-violet-50 transition-colors shadow-sm border-2 border-violet-700"
          >
            🔗 학부모에게 URL 공유
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-white text-violet-700 rounded-lg font-semibold hover:bg-violet-50 transition-colors shadow-sm border-2 border-violet-700"
          >
            📄 인쇄하기
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-violet-700 text-white rounded-lg font-semibold hover:bg-violet-800 transition-colors shadow-sm"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultEnhanced;
