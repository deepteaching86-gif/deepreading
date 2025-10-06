import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from '../../lib/axios';

interface Child {
  id: string;
  grade: number;
  schoolName: string | null;
  className: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ChildStats {
  student: {
    id: string;
    name: string;
    grade: number;
    schoolName: string | null;
    className: string | null;
  };
  statistics: {
    totalSessions: number;
    completedSessions: number;
    scoredSessions: number;
    averageScore: number;
  };
  scoreTrend: Array<{
    date: string;
    score: number;
    templateTitle: string;
  }>;
  analysis: {
    strengths: any[];
    weaknesses: any[];
    recommendations: any[];
  };
  recentSessions: Array<{
    id: string;
    sessionCode: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    template: {
      title: string;
      grade: number;
    };
    result: {
      percentage: number;
      gradeLevel: number;
      totalScore: number;
    } | null;
  }>;
}

export default function ParentDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childStats, setChildStats] = useState<ChildStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildStats(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/parents/me/children');
      const childrenData = res.data.data;
      setChildren(childrenData);

      // Auto-select first child if available
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (error) {
      console.error('자녀 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildStats = async (childId: string) => {
    try {
      setStatsLoading(true);
      const res = await axios.get(`/api/v1/parents/children/${childId}/stats`);
      setChildStats(res.data.data);
    } catch (error) {
      console.error('자녀 통계 조회 실패:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGradeName = (grade: number) => {
    if (grade <= 6) return `초등 ${grade}학년`;
    return `중등 ${grade - 6}학년`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: '대기중', className: 'bg-muted text-muted-foreground' },
      in_progress: { text: '진행중', className: 'bg-primary text-primary-foreground' },
      completed: { text: '완료', className: 'bg-accent text-accent-foreground' },
      scored: { text: '채점완료', className: 'bg-chart-1 text-primary-foreground' },
    };

    const badge = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-xl text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary">학부모 대시보드</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  안녕하세요, <span className="font-medium text-foreground">{user?.name}</span>님
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-card-foreground"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
            <p className="text-muted-foreground">등록된 자녀가 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-2">
              관리자에게 문의하여 자녀를 등록해 주세요.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">학부모 대시보드</h1>
              <p className="text-sm text-muted-foreground mt-1">
                안녕하세요, <span className="font-medium text-foreground">{user?.name}</span>님
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-card-foreground"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child Selector */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">자녀 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`text-left p-6 rounded-lg border-2 transition-all ${
                  selectedChildId === child.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{child.user.name}</h3>
                  <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                    {getGradeName(child.grade)}
                  </span>
                </div>
                {child.schoolName && (
                  <p className="text-sm text-muted-foreground">
                    {child.schoolName}
                    {child.className && ` ${child.className}`}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Selected Child Statistics */}
        {selectedChild && (
          <>
            {statsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-xl text-muted-foreground">통계 로딩 중...</div>
              </div>
            ) : childStats ? (
              <>
                {/* Statistics Cards */}
                <section className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-foreground">
                    {childStats.student.name}님의 학습 현황
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">총 테스트</p>
                          <p className="text-3xl font-bold text-foreground">
                            {childStats.statistics.totalSessions}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📝</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">완료한 테스트</p>
                          <p className="text-3xl font-bold text-foreground">
                            {childStats.statistics.completedSessions}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">채점 완료</p>
                          <p className="text-3xl font-bold text-foreground">
                            {childStats.statistics.scoredSessions}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">평균 점수</p>
                          <p className="text-3xl font-bold text-foreground">
                            {childStats.statistics.averageScore > 0
                              ? `${childStats.statistics.averageScore}%`
                              : '-'}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Score Trend */}
                {childStats.scoreTrend.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-foreground">점수 추이</h2>
                    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                      <div className="space-y-4">
                        {childStats.scoreTrend.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-32 text-sm text-muted-foreground">
                              {new Date(item.date).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                                    style={{ width: `${item.score}%` }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-foreground">
                                    {item.score.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="w-48 text-sm text-muted-foreground truncate">
                                  {item.templateTitle}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Recent Tests */}
                <section>
                  <h2 className="text-xl font-bold mb-4 text-foreground">최근 테스트 결과</h2>
                  {childStats.recentSessions.length === 0 ? (
                    <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
                      <p className="text-muted-foreground">아직 진행한 테스트가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              테스트
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              상태
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              점수
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              등급
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              날짜
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {childStats.recentSessions.map((session) => (
                            <tr key={session.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-card-foreground">
                                  {session.template.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getGradeName(session.template.grade)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(session.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                                {session.result ? `${session.result.percentage.toFixed(1)}%` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                                {session.result ? `${session.result.gradeLevel}등급` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
