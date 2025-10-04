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
  };
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 테스트 템플릿 조회
      const templatesRes = await axios.get('/api/v1/templates');
      setTemplates(templatesRes.data.data);

      // 최근 테스트 세션 조회
      const sessionsRes = await axios.get('/api/v1/sessions/my');
      setRecentSessions(sessionsRes.data.data.slice(0, 5));
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
                안녕하세요, {user?.name}님
              </p>
            </div>
            <div className="flex gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/questions')}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  문항 관리
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-card-foreground"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 테스트 선택 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">새로운 테스트 시작하기</h2>
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
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors font-medium"
                >
                  시작하기
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 최근 테스트 */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-foreground">최근 테스트 결과</h2>
          {recentSessions.length === 0 ? (
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
                  {recentSessions.map((session) => (
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
