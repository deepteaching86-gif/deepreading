import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';

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

export default function TestResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);
  const [templateInfo, setTemplateInfo] = useState<any>(null);
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
    if (grade <= 2) return 'bg-chart-1 text-primary-foreground';
    if (grade <= 4) return 'bg-primary text-primary-foreground';
    if (grade <= 6) return 'bg-chart-3 text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getSurveyScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-chart-1';
    if (score >= 3.0) return 'text-primary';
    if (score >= 2.0) return 'text-chart-3';
    return 'text-destructive';
  };

  const getSurveyScoreLabel = (score: number) => {
    if (score >= 4.0) return '매우 우수';
    if (score >= 3.0) return '우수';
    if (score >= 2.0) return '보통';
    return '보충 필요';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">결과 불러오는 중...</div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const literacyCategories = [
    { key: 'vocabulary', label: '어휘력', score: result.vocabularyScore },
    { key: 'reading', label: '독해력', score: result.readingScore },
    { key: 'grammar', label: '문법/어법', score: result.grammarScore },
    { key: 'reasoning', label: '추론/사고력', score: result.reasoningScore },
  ];

  const surveyCategories = [
    {
      key: 'readingMotivation',
      label: '읽기 동기',
      score: result.readingMotivationScore,
    },
    {
      key: 'writingMotivation',
      label: '글쓰기 동기',
      score: result.writingMotivationScore,
    },
    {
      key: 'readingEnvironment',
      label: '독서 환경',
      score: result.readingEnvironmentScore,
    },
    {
      key: 'readingHabit',
      label: '독서 습관',
      score: result.readingHabitScore,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">진단 결과 리포트</h1>
              {templateInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  {templateInfo.title} - {getGradeName(templateInfo.grade)}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              대시보드로
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 종합 점수 */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8 mb-8 border border-primary/20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">종합 점수</h2>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <div className="text-6xl font-bold text-primary">
                  {result.percentage.toFixed(1)}
                  <span className="text-3xl">%</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {result.totalScore}점 / {result.totalPossible}점
                </div>
              </div>

              <div className="h-20 w-px bg-border"></div>

              <div>
                <div
                  className={`text-5xl font-bold px-6 py-3 rounded-lg ${getGradeBadgeColor(
                    result.gradeLevel
                  )}`}
                >
                  {result.gradeLevel}등급
                </div>
                {result.percentile !== null && (
                  <div className="text-sm text-muted-foreground mt-2">
                    상위 {(100 - result.percentile).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 문해력 영역별 점수 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h3 className="text-xl font-bold mb-6 text-foreground">
              📚 문해력 영역별 점수
            </h3>
            <div className="space-y-4">
              {literacyCategories.map((category) => {
                const maxScore = Math.ceil((result.totalPossible / 4) * 1.2);
                const percentage = (category.score / maxScore) * 100;

                return (
                  <div key={category.key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">
                        {category.label}
                      </span>
                      <span className="text-primary font-bold">
                        {category.score}점
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 독서 습관 설문 점수 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h3 className="text-xl font-bold mb-6 text-foreground">
              📖 독서 습관 설문 점수
            </h3>
            <div className="space-y-4">
              {surveyCategories.map((category) => {
                if (category.score === null) return null;

                return (
                  <div key={category.key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">
                        {category.label}
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-bold ${getSurveyScoreColor(
                            category.score
                          )}`}
                        >
                          {category.score.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {getSurveyScoreLabel(category.score)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          category.score >= 4.0
                            ? 'bg-chart-1'
                            : category.score >= 3.0
                            ? 'bg-primary'
                            : category.score >= 2.0
                            ? 'bg-chart-3'
                            : 'bg-destructive'
                        }`}
                        style={{ width: `${(category.score / 5) * 100}%` }}
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
          <div className="bg-card rounded-lg shadow-md p-6 mt-8 border border-border">
            <h3 className="text-xl font-bold mb-4 text-chart-1 flex items-center gap-2">
              <span>✨</span> 강점
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.strengths.map((strength, idx) => (
                <div
                  key={idx}
                  className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4"
                >
                  <div className="font-semibold text-chart-1 mb-1">
                    {strength.category === 'reading_motivation' && '읽기 동기'}
                    {strength.category === 'vocabulary' && '어휘력'}
                    {strength.category === 'reading' && '독해력'}
                    {strength.category === 'grammar' && '문법/어법'}
                    {strength.category === 'reasoning' && '추론/사고력'}
                  </div>
                  <div className="text-sm text-foreground">
                    {strength.description}
                  </div>
                  {strength.percentage && (
                    <div className="text-xs text-muted-foreground mt-2">
                      정답률: {strength.percentage}%
                    </div>
                  )}
                  {strength.score && (
                    <div className="text-xs text-muted-foreground mt-2">
                      점수: {strength.score}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 약점 및 개선 방안 */}
        {result.weaknesses.length > 0 && (
          <div className="bg-card rounded-lg shadow-md p-6 mt-8 border border-border">
            <h3 className="text-xl font-bold mb-4 text-chart-3 flex items-center gap-2">
              <span>💡</span> 개선이 필요한 영역
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.weaknesses.map((weakness, idx) => (
                <div
                  key={idx}
                  className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-4"
                >
                  <div className="font-semibold text-chart-3 mb-1">
                    {weakness.category === 'reading_motivation' && '읽기 동기'}
                    {weakness.category === 'reading_environment' && '독서 환경'}
                    {weakness.category === 'vocabulary' && '어휘력'}
                    {weakness.category === 'reading' && '독해력'}
                    {weakness.category === 'grammar' && '문법/어법'}
                    {weakness.category === 'reasoning' && '추론/사고력'}
                  </div>
                  <div className="text-sm text-foreground">
                    {weakness.description}
                  </div>
                  {weakness.percentage && (
                    <div className="text-xs text-muted-foreground mt-2">
                      정답률: {weakness.percentage}%
                    </div>
                  )}
                  {weakness.score && (
                    <div className="text-xs text-muted-foreground mt-2">
                      점수: {weakness.score}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 학습 제안 */}
        {result.recommendations.length > 0 && (
          <div className="bg-card rounded-lg shadow-md p-6 mt-8 border border-border">
            <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
              <span>📌</span> 맞춤형 학습 제안
            </h3>
            <div className="space-y-4">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {rec.priority === 'high' ? '우선순위 높음' : '중요'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground mb-2">
                        {rec.category === 'vocabulary' && '어휘력 향상'}
                        {rec.category === 'reading' && '독해력 향상'}
                        {rec.category === 'grammar' && '문법 학습'}
                        {rec.category === 'reasoning' && '사고력 향상'}
                        {rec.category === 'reading_motivation' && '독서 동기 부여'}
                        {rec.category === 'reading_environment' && '독서 환경 개선'}
                        {rec.category === 'reading_habit' && '독서 습관 형성'}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.suggestion}
                      </p>
                      {rec.resources && rec.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rec.resources.map((resource: string, ridx: number) => (
                            <span
                              key={ridx}
                              className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs"
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            다른 테스트 보기
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            결과 인쇄하기
          </button>
        </div>
      </main>
    </div>
  );
}
