import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from '../../lib/axios';

interface StudentWithStats {
  id: string;
  grade: number;
  schoolName: string | null;
  className: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
  };
}

interface ClassStats {
  overall: {
    totalStudents: number;
    totalSessions: number;
    completedSessions: number;
    scoredSessions: number;
    averageScore: number;
  };
  byGrade: Array<{
    grade: number;
    studentCount: number;
    averageScore: number;
    totalSessions: number;
  }>;
}

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, statsRes] = await Promise.all([
        axios.get('/api/v1/teachers/me/students'),
        axios.get('/api/v1/teachers/me/class-stats'),
      ]);

      setStudents(studentsRes.data.data);
      setClassStats(statsRes.data.data);
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

  const filteredStudents = selectedGradeFilter
    ? students.filter((s) => s.grade === selectedGradeFilter)
    : students;

  const uniqueGrades = Array.from(new Set(students.map((s) => s.grade))).sort((a, b) => a - b);

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

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-primary">선생님 대시보드</h1>
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
            <p className="text-muted-foreground">담당하는 학생이 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-2">
              관리자에게 문의하여 학생을 배정받으세요.
            </p>
          </div>
        </main>
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
              <h1 className="text-2xl font-bold text-primary">선생님 대시보드</h1>
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
        {/* Class Overview Statistics */}
        {classStats && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">전체 학급 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">담당 학생</p>
                    <p className="text-3xl font-bold text-foreground">
                      {classStats.overall.totalStudents}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">총 테스트</p>
                    <p className="text-3xl font-bold text-foreground">
                      {classStats.overall.totalSessions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">완료 테스트</p>
                    <p className="text-3xl font-bold text-foreground">
                      {classStats.overall.completedSessions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">채점 완료</p>
                    <p className="text-3xl font-bold text-foreground">
                      {classStats.overall.scoredSessions}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💯</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">학급 평균</p>
                    <p className="text-3xl font-bold text-foreground">
                      {classStats.overall.averageScore > 0
                        ? `${classStats.overall.averageScore}%`
                        : '-'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Grade-level Statistics */}
        {classStats && classStats.byGrade.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">학년별 통계</h2>
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
                      총 테스트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      평균 점수
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {classStats.byGrade.map((stat) => (
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
                        {stat.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                        {stat.averageScore > 0 ? `${stat.averageScore}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Student List with Filter */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">담당 학생 목록</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedGradeFilter(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedGradeFilter === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-card-foreground hover:bg-muted'
                }`}
              >
                전체
              </button>
              {uniqueGrades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGradeFilter(grade)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGradeFilter === grade
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-card-foreground hover:bg-muted'
                  }`}
                >
                  {getGradeName(grade)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-card rounded-lg shadow-sm p-6 border border-border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{student.user.name}</h3>
                    <p className="text-xs text-muted-foreground">{student.user.email}</p>
                  </div>
                  <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                    {getGradeName(student.grade)}
                  </span>
                </div>

                {student.schoolName && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {student.schoolName}
                    {student.className && ` ${student.className}`}
                  </p>
                )}

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">총 테스트</span>
                    <span className="font-medium text-foreground">
                      {student.stats.totalSessions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">완료 테스트</span>
                    <span className="font-medium text-foreground">
                      {student.stats.completedSessions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">평균 점수</span>
                    <span className="font-medium text-foreground">
                      {student.stats.averageScore > 0 ? `${student.stats.averageScore}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
              <p className="text-muted-foreground">
                {selectedGradeFilter
                  ? `${getGradeName(selectedGradeFilter)} 학생이 없습니다.`
                  : '학생이 없습니다.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
