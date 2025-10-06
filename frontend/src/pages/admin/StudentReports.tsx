import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';

interface SessionListItem {
  id: string;
  studentName: string;
  studentEmail: string;
  grade: number;
  templateCode: string;
  completedAt: string;
  score: string;
  percentage: number;
  gradeLevel: number;
}

interface SessionReport {
  student: {
    name: string;
    email: string;
    grade: number;
    schoolName?: string;
    className?: string;
  };
  test: {
    templateCode: string;
    title: string;
    completedAt: string;
  };
  overall: {
    totalScore: number;
    totalPossible: number;
    percentage: number;
    gradeLevel: number;
    correctAnswers: number;
    incorrectAnswers: number;
  };
  categoryScores: Record<string, { earned: number; total: number }>;
  answers: Array<{
    questionNumber: number;
    questionText: string;
    questionType: string;
    category: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    pointsEarned: number;
    totalPoints: number;
    feedback?: string;
  }>;
}

const StudentReports: React.FC = () => {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/reports/sessions');
      setSessions(response.data.data);
    } catch (error) {
      console.error('세션 목록 조회 실패:', error);
      alert('세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionReport = async (sessionId: string) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`/api/v1/admin/reports/sessions/${sessionId}`);
      setSelectedSession(response.data.data);
    } catch (error) {
      console.error('리포트 조회 실패:', error);
      alert('리포트를 불러오는데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
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

  const getGradeLevelText = (level: number) => {
    return `${level}등급`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">학생 리포트</h1>

        {/* 세션 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-xl text-muted-foreground">로딩 중...</div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border mb-6">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    학생명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    학년
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    템플릿
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {session.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {session.studentEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {session.grade}학년
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {session.templateCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {session.score} ({session.percentage?.toFixed(1)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.gradeLevel <= 3
                          ? 'bg-chart-1/20 text-chart-1'
                          : session.gradeLevel <= 6
                          ? 'bg-chart-3/20 text-chart-3'
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {getGradeLevelText(session.gradeLevel)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchSessionReport(session.id)}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 상세 리포트 모달 */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-card rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-border">
              {detailLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <div className="text-xl text-muted-foreground">로딩 중...</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-foreground">학생 리포트 상세</h2>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="text-muted-foreground hover:text-foreground text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {/* 학생 정보 */}
                  <div className="bg-muted/30 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">학생 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-sm">이름:</span>
                        <span className="ml-2 text-foreground font-medium">{selectedSession.student.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">이메일:</span>
                        <span className="ml-2 text-foreground font-medium">{selectedSession.student.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">학년:</span>
                        <span className="ml-2 text-foreground font-medium">{selectedSession.student.grade}학년</span>
                      </div>
                      {selectedSession.student.schoolName && (
                        <div>
                          <span className="text-muted-foreground text-sm">학교:</span>
                          <span className="ml-2 text-foreground font-medium">{selectedSession.student.schoolName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 종합 점수 */}
                  <div className="bg-muted/30 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">종합 점수</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {selectedSession.overall.totalScore}/{selectedSession.overall.totalPossible}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">총점</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-chart-3">
                          {selectedSession.overall.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">정답률</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-chart-1">
                          {getGradeLevelText(selectedSession.overall.gradeLevel)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">등급</div>
                      </div>
                    </div>
                  </div>

                  {/* 영역별 점수 */}
                  <div className="bg-muted/30 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">영역별 점수</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedSession.categoryScores).map(([category, scores]) => (
                        <div key={category} className="flex justify-between items-center p-3 bg-card rounded-lg">
                          <span className="font-medium text-foreground">{getCategoryName(category)}</span>
                          <span className="text-muted-foreground">
                            {scores.earned}/{scores.total} ({((scores.earned / scores.total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 문항별 상세 */}
                  <div className="bg-muted/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">문항별 상세</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {selectedSession.answers.map((answer) => (
                        <div
                          key={answer.questionNumber}
                          className={`p-4 rounded-lg border ${
                            answer.isCorrect
                              ? 'border-chart-1/30 bg-chart-1/5'
                              : 'border-destructive/30 bg-destructive/5'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-foreground">
                              {answer.questionNumber}. {getCategoryName(answer.category)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              answer.isCorrect
                                ? 'bg-chart-1/20 text-chart-1'
                                : 'bg-destructive/20 text-destructive'
                            }`}>
                              {answer.isCorrect ? '정답' : '오답'} ({answer.pointsEarned}/{answer.totalPoints}점)
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{answer.questionText}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">학생 답변:</span>
                              <span className="ml-2 text-foreground">{answer.studentAnswer || '(미제출)'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">정답:</span>
                              <span className="ml-2 text-chart-1">{answer.correctAnswer}</span>
                            </div>
                          </div>
                          {answer.feedback && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">피드백:</span> {answer.feedback}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReports;
