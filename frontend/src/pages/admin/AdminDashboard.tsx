import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from '../../lib/axios';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    parents: number;
    teachers: number;
    recentRegistrations: number;
  };
  templates: {
    total: number;
  };
  sessions: {
    total: number;
    completed: number;
    scored: number;
    averageScore: number;
    recentSessions: number;
  };
}

interface RecentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface GradeStats {
  grade: number;
  studentCount: number;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, gradeStatsRes] = await Promise.all([
        axios.get('/api/v1/admin/dashboard/stats'),
        axios.get('/api/v1/admin/users/recent?limit=5'),
        axios.get('/api/v1/admin/stats/by-grade'),
      ]);

      setStats(statsRes.data.data);
      setRecentUsers(usersRes.data.data);
      setGradeStats(gradeStatsRes.data.data);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
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

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { text: string; className: string }> = {
      student: { text: '학생', className: 'bg-primary text-primary-foreground' },
      parent: { text: '학부모', className: 'bg-chart-2 text-primary-foreground' },
      teacher: { text: '교사', className: 'bg-chart-3 text-primary-foreground' },
      admin: { text: '관리자', className: 'bg-destructive text-destructive-foreground' },
    };

    const badge = roleMap[role] || roleMap.student;
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
              <h1 className="text-2xl font-bold text-primary">관리자 대시보드</h1>
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
        {/* Overview Statistics */}
        {stats && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">시스템 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">전체 사용자</p>
                    <p className="text-3xl font-bold text-foreground">{stats.users.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      최근 7일: +{stats.users.recentRegistrations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              {/* Students */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">학생</p>
                    <p className="text-3xl font-bold text-foreground">{stats.users.students}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      학부모: {stats.users.parents}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">테스트 템플릿</p>
                    <p className="text-3xl font-bold text-foreground">{stats.templates.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">총 테스트 세션</p>
                    <p className="text-3xl font-bold text-foreground">{stats.sessions.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      최근 7일: {stats.sessions.recentSessions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Test Statistics */}
        {stats && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">테스트 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">완료된 테스트</p>
                    <p className="text-3xl font-bold text-foreground">{stats.sessions.completed}</p>
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
                    <p className="text-3xl font-bold text-foreground">{stats.sessions.scored}</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💯</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">평균 점수</p>
                    <p className="text-3xl font-bold text-foreground">
                      {stats.sessions.averageScore > 0 ? `${stats.sessions.averageScore}%` : '-'}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">최근 가입 사용자</h2>
            {recentUsers.length === 0 ? (
              <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
                <p className="text-muted-foreground">최근 가입한 사용자가 없습니다.</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        가입일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-card-foreground">
                            {user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Grade-level Statistics */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">학년별 통계</h2>
            {gradeStats.length === 0 ? (
              <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
                <p className="text-muted-foreground">학년별 통계 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        학년
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        학생 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        완료 테스트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        평균 점수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {gradeStats.map((stat) => (
                      <tr key={stat.grade} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-card-foreground">
                            {getGradeName(stat.grade)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                          {stat.studentCount}명
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                          {stat.completedSessions} / {stat.totalSessions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                          {stat.averageScore > 0 ? `${stat.averageScore}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">빠른 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/questions"
              className="bg-card rounded-lg shadow-sm p-6 border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">문제 관리</h3>
                  <p className="text-sm text-muted-foreground">문제 추가 및 수정</p>
                </div>
              </div>
            </Link>

            <Link
              to="/templates"
              className="bg-card rounded-lg shadow-sm p-6 border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">템플릿 관리</h3>
                  <p className="text-sm text-muted-foreground">테스트 템플릿 확인</p>
                </div>
              </div>
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="bg-card rounded-lg shadow-sm p-6 border border-border hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">통계 새로고침</h3>
                  <p className="text-sm text-muted-foreground">최신 데이터 불러오기</p>
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
