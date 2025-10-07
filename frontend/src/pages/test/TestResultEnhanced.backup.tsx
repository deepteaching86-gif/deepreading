import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement
);

interface TestResult {
  totalScore: number;
  totalPossible: number;
  percentage: number;
  gradeLevel: number;
  percentile: number | null;
  vocabularyScore: number;
  readingScore: number;
  grammarScore: number;
  reasoningScore: number;
  readingMotivationScore: number | null;
  writingMotivationScore: number | null;
  readingEnvironmentScore: number | null;
  readingHabitScore: number | null;
  readingPreferenceData: any | null;
  strengths: any[];
  weaknesses: any[];
  recommendations: any[];
}

interface Answer {
  questionNumber: number;
  studentAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  feedback: string | null;
  question: {
    questionText: string;
    questionType: string;
    correctAnswer: string;
    category: string;
  };
}

export default function TestResultEnhanced() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);
  const [templateInfo, setTemplateInfo] = useState<any>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [sessionId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/sessions/${sessionId}/result`);
      setResult(response.data.data.result);
      setTemplateInfo(response.data.data.template);

      // Get answers with feedback
      if (response.data.data.answers) {
        setAnswers(response.data.data.answers);
      }
    } catch (error) {
      console.error('결과 조회 실패:', error);
      alert('결과를 불러올 수 없습니다.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getGradeName = (grade: number) => {
    if (grade <= 6) return `초등 ${grade}학년`;
    return `중등 ${grade - 6}학년`;
  };

  const getGradeBadgeColor = (grade: number) => {
    if (grade <= 2) return 'bg-red-100 text-red-800';
    if (grade <= 4) return 'bg-orange-100 text-orange-800';
    if (grade <= 6) return 'bg-yellow-100 text-yellow-800';
    if (grade <= 8) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">결과 분석 중...</div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Radar chart data - 영역별 성취도
  const literacyCategories = [
    { key: 'vocabulary', label: '어휘력', score: result.vocabularyScore },
    { key: 'reading', label: '독해력', score: result.readingScore },
    { key: 'grammar', label: '문법/어법', score: result.grammarScore },
    { key: 'reasoning', label: '추론/사고력', score: result.reasoningScore },
  ];

  const maxScore = Math.ceil(result.totalPossible / 4);

  const radarData = {
    labels: literacyCategories.map((c) => c.label),
    datasets: [
      {
        label: '내 점수',
        data: literacyCategories.map((c) => (c.score / maxScore) * 100),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
      {
        label: '평균 (80%)',
        data: [80, 80, 80, 80],
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgb(156, 163, 175)',
        pointBorderColor: '#fff',
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
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Percentile bar chart data
  const percentileData = result.percentile !== null ? {
    labels: ['하위 25%', '하위 50%', '하위 75%', '상위 10%', '내 위치'],
    datasets: [
      {
        label: '백분위 분포',
        data: [25, 50, 75, 90, 100 - result.percentile],
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(251, 146, 60, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  const percentileOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  // Doughnut chart - 정답률
  const doughnutData = {
    labels: ['정답', '오답'],
    datasets: [
      {
        data: [result.percentage, 100 - result.percentage],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.3)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📊 문해력 진단 결과 리포트
              </h1>
              {templateInfo && (
                <p className="text-sm text-gray-600 mt-1">
                  {templateInfo.title} · {getGradeName(templateInfo.grade)}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              대시보드로
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 종합 점수 - 대형 히어로 섹션 */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-12 mb-8 text-white shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-8 opacity-90">종합 평가</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-6xl font-bold mb-2">
                  {result.percentage.toFixed(1)}
                  <span className="text-3xl">%</span>
                </div>
                <div className="text-sm opacity-80 mb-4">정답률</div>
                <div className="text-lg opacity-90">
                  {result.totalScore}점 / {result.totalPossible}점
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className={`inline-block px-8 py-4 rounded-2xl text-5xl font-bold ${getGradeBadgeColor(result.gradeLevel)} text-gray-800`}>
                  {result.gradeLevel}등급
                </div>
                <div className="text-sm opacity-80 mt-4">9등급 척도 평가</div>
              </div>

              {result.percentile !== null && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="text-6xl font-bold mb-2">
                    상위 {(100 - result.percentile).toFixed(0)}%
                  </div>
                  <div className="text-sm opacity-80">또래 비교</div>
                  <div className="text-sm opacity-70 mt-2">
                    같은 학년 수험생 중
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 시각화 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 레이더 차트 - 영역별 성취도 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              영역별 성취도 분석
            </h3>
            <div className="relative h-80">
              <Radar data={radarData} options={radarOptions} />
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              각 영역별 성취도를 시각화한 차트입니다
            </p>
          </div>

          {/* 도넛 차트 - 정답률 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              정답률 분포
            </h3>
            <div className="relative h-80 flex items-center justify-center">
              <div className="w-64 h-64">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{result.totalScore}</div>
                <div className="text-sm text-gray-600">정답 문항</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-3xl font-bold text-red-600">
                  {result.totalPossible - result.totalScore}
                </div>
                <div className="text-sm text-gray-600">오답 문항</div>
              </div>
            </div>
          </div>

          {/* 백분위 차트 */}
          {percentileData && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 lg:col-span-2">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">👥</span>
                또래 비교 분석
              </h3>
              <div className="relative h-64">
                <Bar data={percentileData} options={percentileOptions} />
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                같은 학년 수험생들과의 상대적 위치를 보여줍니다
              </p>
            </div>
          )}

          {/* 영역별 상세 점수 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 lg:col-span-2">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              문해력 영역별 상세 분석
            </h3>
            <div className="space-y-6">
              {literacyCategories.map((category) => {
                const percentage = (category.score / maxScore) * 100;
                const isStrong = percentage >= 80;
                const isWeak = percentage < 60;

                return (
                  <div key={category.key}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800 min-w-[100px]">
                          {category.label}
                        </span>
                        {isStrong && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            우수
                          </span>
                        )}
                        {isWeak && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            보완필요
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {category.score}점 / {maxScore}점
                        </span>
                        <span className="font-bold text-blue-600 min-w-[60px] text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                          isStrong
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : isWeak
                            ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                            : 'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 강점 */}
        {result.strengths.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 mb-8 border border-green-100">
            <h3 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
              <span>✨</span> 강점 영역
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.strengths.map((strength, idx) => {
                const getCategoryName = (cat: string) => {
                  const names: Record<string, string> = {
                    reading_motivation: '읽기 동기',
                    vocabulary: '어휘력',
                    reading: '독해력',
                    grammar: '문법/어법',
                    reasoning: '추론/사고력',
                  };
                  return names[cat] || cat;
                };

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                        💪
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-green-800 text-lg mb-1">
                          {getCategoryName(strength.category)}
                        </div>
                        <div className="text-sm text-gray-700">
                          {strength.description}
                        </div>
                      </div>
                    </div>
                    {strength.percentage && (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <span>정답률:</span>
                        <span className="text-lg">{strength.percentage}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 개선 영역 */}
        {result.weaknesses.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg p-8 mb-8 border border-orange-100">
            <h3 className="text-2xl font-bold mb-6 text-orange-800 flex items-center gap-2">
              <span>💡</span> 개선이 필요한 영역
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.weaknesses.map((weakness, idx) => {
                const getCategoryName = (cat: string) => {
                  const names: Record<string, string> = {
                    reading_motivation: '읽기 동기',
                    reading_environment: '독서 환경',
                    vocabulary: '어휘력',
                    reading: '독해력',
                    grammar: '문법/어법',
                    reasoning: '추론/사고력',
                  };
                  return names[cat] || cat;
                };

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                        📝
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-orange-800 text-lg mb-1">
                          {getCategoryName(weakness.category)}
                        </div>
                        <div className="text-sm text-gray-700">
                          {weakness.description}
                        </div>
                      </div>
                    </div>
                    {weakness.percentage && (
                      <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                        <span>정답률:</span>
                        <span className="text-lg">{weakness.percentage}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 맞춤형 학습 제안 */}
        {result.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span>🎓</span> 맞춤형 학습 제안
            </h3>
            <div className="space-y-6">
              {result.recommendations.map((rec, idx) => {
                const getRecommendationTitle = (cat: string) => {
                  const titles: Record<string, string> = {
                    vocabulary: '어휘력 향상',
                    reading: '독해력 향상',
                    grammar: '문법 학습',
                    reasoning: '사고력 향상',
                    reading_motivation: '독서 동기 부여',
                    reading_environment: '독서 환경 개선',
                    reading_habit: '독서 습관 형성',
                  };
                  return titles[cat] || cat;
                };

                return (
                  <div
                    key={idx}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {rec.priority === 'high' ? '🔴 우선순위 높음' : '🔵 권장'}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-lg font-bold text-gray-800 mb-2">
                        {getRecommendationTitle(rec.category)}
                      </div>
                      <p className="text-gray-700 mb-4">{rec.suggestion}</p>
                      {rec.resources && rec.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-gray-600 mr-2">추천 학습자료:</span>
                          {rec.resources.map((resource: string, ridx: number) => (
                            <span
                              key={ridx}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI 피드백 섹션 */}
        {answers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span>🤖</span> AI 채점 피드백
            </h3>
            <div className="space-y-6">
              {answers.map((ans, idx) => {
                const getCategoryName = (cat: string) => {
                  const names: Record<string, string> = {
                    vocabulary: '어휘력',
                    reading: '독해력',
                    grammar: '문법/어법',
                    reasoning: '추론/사고력',
                  };
                  return names[cat] || cat;
                };

                return (
                  <div
                    key={idx}
                    className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                        {ans.questionNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                            {getCategoryName(ans.question.category)}
                          </span>
                          <span className="text-sm text-gray-600">
                            획득 점수: {ans.pointsEarned}점
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 font-medium mb-3">
                          {ans.question.questionText}
                        </div>
                      </div>
                    </div>

                    <div className="ml-13 space-y-3">
                      <div className="bg-white bg-opacity-60 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">학생 답변</div>
                        <div className="text-sm text-gray-800">{ans.studentAnswer}</div>
                      </div>

                      <div className="bg-green-50 bg-opacity-60 rounded-lg p-3">
                        <div className="text-xs text-green-600 mb-1">정답</div>
                        <div className="text-sm text-green-900 font-medium">{ans.question.correctAnswer}</div>
                      </div>

                      {ans.feedback && (
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">💬</span>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-blue-900 mb-2">AI 피드백</div>
                              <div className="text-sm text-blue-800 leading-relaxed">{ans.feedback}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex justify-center gap-4 mt-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            다른 테스트 보기
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            결과 인쇄하기
          </button>
        </div>
      </main>
    </div>
  );
}
