import { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface QuestionStats {
  id: string;
  questionNumber: number;
  questionText: string;
  category: string;
  difficulty: string;
  templateCode: string;
  templateTitle: string;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  avgScore: number;
  discrimination: number; // 변별도
  qualityFlag: 'excellent' | 'good' | 'review' | 'revise';
  topStudentsCorrectRate: number;
  bottomStudentsCorrectRate: number;
  commonWrongAnswers: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
  lastUsed: string | null;
}

interface TemplateStats {
  templateCode: string;
  title: string;
  totalQuestions: number;
  avgCorrectRate: number;
  avgDiscrimination: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    review: number;
    revise: number;
  };
}

const QuestionAnalytics = () => {
  const [questions, setQuestions] = useState<QuestionStats[]>([]);
  const [templates, setTemplates] = useState<TemplateStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'correctRate' | 'discrimination' | 'attempts'>('correctRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsRes, templatesRes] = await Promise.all([
        axios.get('/api/v1/admin/question-analytics'),
        axios.get('/api/v1/admin/question-analytics/templates'),
      ]);

      console.log('Questions response:', questionsRes.data);
      console.log('Templates response:', templatesRes.data);

      setQuestions(questionsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);

      // Mock data fallback for development
      /* const mockQuestions: QuestionStats[] = [
        {
          id: '1',
          questionNumber: 1,
          questionText: '다음 중 바르게 쓰인 문장은?',
          category: 'grammar',
          difficulty: 'medium',
          templateCode: 'ELEM3-V1',
          templateTitle: '초등 3학년 진단평가',
          totalAttempts: 150,
          correctAttempts: 135,
          correctRate: 90,
          avgScore: 9.0,
          discrimination: 0.25,
          qualityFlag: 'review',
          topStudentsCorrectRate: 95,
          bottomStudentsCorrectRate: 70,
          commonWrongAnswers: [
            { answer: '오답1', count: 10, percentage: 6.7 },
            { answer: '오답2', count: 5, percentage: 3.3 },
          ],
          lastUsed: '2024-10-08',
        },
        {
          id: '2',
          questionNumber: 15,
          questionText: '다음 글의 중심 생각을 고르세요.',
          category: 'reading',
          difficulty: 'hard',
          templateCode: 'ELEM3-V1',
          templateTitle: '초등 3학년 진단평가',
          totalAttempts: 148,
          correctAttempts: 22,
          correctRate: 14.9,
          avgScore: 1.5,
          discrimination: 0.65,
          qualityFlag: 'revise',
          topStudentsCorrectRate: 45,
          bottomStudentsCorrectRate: 5,
          commonWrongAnswers: [
            { answer: '오답A', count: 80, percentage: 54.1 },
            { answer: '오답B', count: 46, percentage: 31.1 },
          ],
          lastUsed: '2024-10-09',
        },
      ];

      const mockTemplates: TemplateStats[] = [
        {
          templateCode: 'ELEM3-V1',
          title: '초등 3학년 진단평가',
          totalQuestions: 30,
          avgCorrectRate: 65.5,
          avgDiscrimination: 0.42,
          qualityDistribution: {
            excellent: 8,
            good: 15,
            review: 5,
            revise: 2,
          },
        },
      ];

      // setQuestions(mockQuestions);
      // setTemplates(mockTemplates); */
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Use empty arrays on error
      setQuestions([]);
      setTemplates([]);

      alert('데이터를 불러오는데 실패했습니다. 콘솔을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadge = (flag: string) => {
    const badges = {
      excellent: { bg: 'bg-green-100', text: 'text-green-800', label: '우수' },
      good: { bg: 'bg-blue-100', text: 'text-blue-800', label: '양호' },
      review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '검토' },
      revise: { bg: 'bg-red-100', text: 'text-red-800', label: '수정필요' },
    };
    const badge = badges[flag as keyof typeof badges] || badges.good;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
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

  const filteredQuestions = questions
    .filter((q) => selectedTemplate === 'all' || q.templateCode === selectedTemplate)
    .filter((q) => filterQuality === 'all' || q.qualityFlag === filterQuality)
    .sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortBy === 'attempts') {
        aVal = a.totalAttempts;
        bVal = b.totalAttempts;
      } else if (sortBy === 'correctRate') {
        aVal = a.correctRate;
        bVal = b.correctRate;
      } else {
        aVal = a.discrimination;
        bVal = b.discrimination;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Chart data
  const qualityDistributionData = {
    labels: ['우수', '양호', '검토', '수정필요'],
    datasets: [
      {
        label: '문항 수',
        data: templates.length > 0
          ? [
              templates[0].qualityDistribution.excellent,
              templates[0].qualityDistribution.good,
              templates[0].qualityDistribution.review,
              templates[0].qualityDistribution.revise,
            ]
          : [0, 0, 0, 0],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-xl text-muted-foreground">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">📊 문항 품질 분석</h1>
          <p className="text-muted-foreground">
            문항별 통계 데이터를 기반으로 품질을 분석하고 개선점을 확인하세요.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">전체 문항 수</div>
            <div className="text-3xl font-bold text-foreground">{questions.length}</div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">평균 정답률</div>
            <div className="text-3xl font-bold text-chart-1">
              {questions.length > 0
                ? (questions.reduce((sum, q) => sum + q.correctRate, 0) / questions.length).toFixed(1)
                : 0}
              %
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">평균 변별도</div>
            <div className="text-3xl font-bold text-chart-2">
              {questions.length > 0
                ? (questions.reduce((sum, q) => sum + q.discrimination, 0) / questions.length).toFixed(2)
                : 0}
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <div className="text-sm text-muted-foreground mb-1">수정 필요</div>
            <div className="text-3xl font-bold text-destructive">
              {questions.filter((q) => q.qualityFlag === 'revise').length}
            </div>
          </div>
        </div>

        {/* Quality Distribution Chart */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">품질 분포</h2>
          <div className="h-64">
            <Bar
              data={qualityDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">테스트 템플릿</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">전체</option>
                {templates.map((t) => (
                  <option key={t.templateCode} value={t.templateCode}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">품질 필터</label>
              <select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">전체</option>
                <option value="excellent">우수</option>
                <option value="good">양호</option>
                <option value="review">검토</option>
                <option value="revise">수정필요</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">정렬 기준</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="correctRate">정답률</option>
                <option value="discrimination">변별도</option>
                <option value="attempts">응시 횟수</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">정렬 순서</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="asc">오름차순</option>
                <option value="desc">내림차순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    문항
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    영역
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    응시수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    정답률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    변별도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    품질
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      #{question.questionNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground max-w-md truncate">
                      {question.questionText}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {getCategoryName(question.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {question.totalAttempts}회
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            question.correctRate >= 70
                              ? 'text-green-600'
                              : question.correctRate >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {question.correctRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span
                        className={`font-semibold ${
                          question.discrimination >= 0.4
                            ? 'text-green-600'
                            : question.discrimination >= 0.2
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {question.discrimination.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getQualityBadge(question.qualityFlag)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary hover:text-primary/80 font-medium">
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📖 품질 지표 설명</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div>
              <strong>정답률:</strong> 해당 문항을 맞춘 학생의 비율. 90% 이상이면 너무 쉽고, 10% 이하면 너무 어렵습니다.
            </div>
            <div>
              <strong>변별도:</strong> 상위권과 하위권 학생의 정답률 차이. 0.4 이상이면 우수, 0.2 미만이면 변별력이 낮습니다.
            </div>
            <div>
              <strong>품질 플래그:</strong>
              <ul className="ml-6 mt-1 space-y-1">
                <li>• 우수: 정답률 40-80%, 변별도 0.4 이상</li>
                <li>• 양호: 정답률 30-90%, 변별도 0.2 이상</li>
                <li>• 검토: 정답률이 너무 높거나(90% 이상) 낮음(30% 이하)</li>
                <li>• 수정필요: 변별도 0.2 미만 또는 극단적 정답률(10% 이하, 95% 이상)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalytics;
