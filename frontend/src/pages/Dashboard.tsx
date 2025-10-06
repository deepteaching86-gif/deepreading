import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from '../lib/axios';

interface TestTemplate {
  id: string;
  templateCode: string;
  grade: number;
  title: string;
  totalQuestions: number;
  timeLimit: number;
}

interface TestSession {
  id: string;
  sessionCode: string;
  status: string;
  createdAt: string;
  template: {
    title: string;
    grade: number;
  };
  result?: {
    percentage: number;
    gradeLevel: number;
    totalScore: number;
  };
}

interface StudentProfile {
  id: string;
  grade: number;
  schoolName: string | null;
  className: string | null;
  user: {
    name: string;
    email: string;
  };
}

interface StudentStats {
  totalSessions: number;
  completedSessions: number;
  scoredSessions: number;
  averageScore: number;
  recentSessions: TestSession[];
}

export default function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch student profile
      const profileRes = await axios.get('/api/v1/students/me/profile');
      const studentProfile = profileRes.data.data;
      setProfile(studentProfile);

      // Fetch student statistics
      const statsRes = await axios.get('/api/v1/students/me/stats');
      setStats(statsRes.data.data);

      // Fetch templates (filter by student grade)
      const templatesRes = await axios.get('/api/v1/templates');
      const allTemplates = templatesRes.data.data;

      // Filter templates for student's grade
      const gradeTemplates = allTemplates.filter(
        (t: TestTemplate) => t.grade === studentProfile.grade
      );
      setTemplates(gradeTemplates);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (templateCode: string) => {
    navigate(`/test/start/${templateCode}`);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">문해력 진단 평가</h1>
              <p className="text-sm text-muted-foreground mt-1">
                안녕하세요, <span className="font-medium text-foreground">{profile?.user.name}</span>님
                {profile && (
                  <span className="ml-2">
                    ({getGradeName(profile.grade)}
                    {profile.schoolName && `, ${profile.schoolName}`}
                    {profile.className && ` ${profile.className}`})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-card-foreground"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {stats && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">내 학습 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">총 테스트</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalSessions}</p>
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
                    <p className="text-3xl font-bold text-foreground">{stats.completedSessions}</p>
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
                    <p className="text-3xl font-bold text-foreground">{stats.scoredSessions}</p>
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
                      {stats.averageScore > 0 ? `${stats.averageScore}%` : '-'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Test Selection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            내 학년 테스트 ({profile && getGradeName(profile.grade)})
          </h2>
          {templates.length === 0 ? (
            <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
              <p className="text-muted-foreground">현재 학년에 맞는 테스트가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {getGradeName(template.grade)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.title}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                      {template.templateCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>📝</span>
                      <span>{template.totalQuestions}문항</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⏱️</span>
                      <span>{template.timeLimit}분</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTest(template.templateCode)}
                    className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    시작하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Tests */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">최근 테스트 결과</h2>
          {!stats || stats.recentSessions.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {stats.recentSessions.map((session) => (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.status === 'in_progress' && (
                          <button
                            onClick={() => navigate(`/test/session/${session.id}`)}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            계속하기
                          </button>
                        )}
                        {session.status === 'scored' && session.result && (
                          <button
                            onClick={() => navigate(`/test/result/${session.id}`)}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            결과보기
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
