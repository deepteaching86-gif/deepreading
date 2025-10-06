import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from '../../lib/axios';

interface PendingSession {
  id: string;
  sessionCode: string;
  createdAt: string;
  completedAt: string;
  student: {
    user: {
      name: string;
      email: string;
    };
  };
  template: {
    templateCode: string;
    title: string;
    grade: number;
  };
  answers: Array<{
    id: string;
    questionNumber: number;
    studentAnswer: string;
    question: {
      questionText: string;
      questionType: string;
      correctAnswer: string;
      points: number;
    };
  }>;
}

export default function GradingManagement() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PendingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PendingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchPendingSessions();
  }, []);

  const fetchPendingSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/admin/grading/sessions/pending');
      setSessions(res.data.data);
    } catch (error) {
      console.error('채점 대기 세션 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGrade = async (sessionId: string) => {
    if (!confirm('자동 채점을 진행하시겠습니까? AI가 서술형 문제를 채점합니다.')) return;

    try {
      setGrading(true);
      const res = await axios.post(`/api/v1/admin/grading/sessions/${sessionId}/auto-grade`);
      alert(`채점 완료!\n총점: ${res.data.data.totalScore}점\n정답률: ${res.data.data.percentage.toFixed(1)}%`);
      fetchPendingSessions();
      setSelectedSession(null);
    } catch (error: any) {
      console.error('자동 채점 실패:', error);
      alert(error.response?.data?.message || '자동 채점에 실패했습니다.');
    } finally {
      setGrading(false);
    }
  };

  const getGradeName = (grade: number) => {
    if (grade <= 6) return `초등 ${grade}학년`;
    return `중등 ${grade - 6}학년`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <h1 className="text-2xl font-bold text-primary">채점 관리</h1>
              <p className="text-sm text-muted-foreground mt-1">
                완료된 테스트를 채점하세요 - <span className="font-medium text-foreground">{user?.name}</span>님
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-card-foreground"
              >
                대시보드
              </button>
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
        {sessions.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-8 text-center border border-border">
            <p className="text-muted-foreground">채점 대기 중인 테스트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Session List */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">채점 대기 목록 ({sessions.length})</h2>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`bg-card rounded-lg shadow-sm p-6 border cursor-pointer transition-all ${
                      selectedSession?.id === session.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{session.student.user.name}</h3>
                        <p className="text-xs text-muted-foreground">{session.student.user.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                        {getGradeName(session.template.grade)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">테스트:</span> {session.template.title}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">완료 시간:</span>{' '}
                        {new Date(session.completedAt).toLocaleString('ko-KR')}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">문항 수:</span> {session.answers.length}문제
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Selected Session Details */}
            {selectedSession && (
              <section>
                <div className="sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">답안 상세</h2>
                    <button
                      onClick={() => handleAutoGrade(selectedSession.id)}
                      disabled={grading}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {grading ? '채점 중...' : '🤖 자동 채점'}
                    </button>
                  </div>

                  <div className="bg-card rounded-lg shadow-sm border border-border max-h-[calc(100vh-12rem)] overflow-y-auto">
                    <div className="p-6 border-b border-border bg-muted/50">
                      <h3 className="font-semibold text-foreground mb-2">{selectedSession.template.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        학생: {selectedSession.student.user.name} ({getGradeName(selectedSession.template.grade)})
                      </p>
                    </div>

                    <div className="divide-y divide-border">
                      {selectedSession.answers.map((answer) => (
                        <div key={answer.id} className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-foreground">
                              문제 {answer.questionNumber}번
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({answer.question.points}점)
                              </span>
                            </h4>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                answer.question.questionType === 'multiple-choice'
                                  ? 'bg-chart-1/10 text-chart-1'
                                  : 'bg-chart-2/10 text-chart-2'
                              }`}
                            >
                              {answer.question.questionType === 'multiple-choice' ? '객관식' : '주관식'}
                            </span>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">문제:</p>
                              <p className="text-foreground">{answer.question.questionText}</p>
                            </div>

                            <div>
                              <p className="text-muted-foreground font-medium mb-1">모범 답안:</p>
                              <p className="text-foreground bg-muted/50 p-2 rounded">
                                {answer.question.correctAnswer}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground font-medium mb-1">학생 답안:</p>
                              <p className="text-foreground bg-primary/5 p-2 rounded border border-primary/20">
                                {answer.studentAnswer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
