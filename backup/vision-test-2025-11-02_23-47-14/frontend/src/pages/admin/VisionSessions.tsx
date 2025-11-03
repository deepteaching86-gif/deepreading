// Admin Vision Sessions List Page - View all Vision TEST sessions
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { MLDataStats } from '../../components/admin/MLDataStats';

interface VisionSessionListItem {
  id: string;
  sessionId: string;
  studentName: string;
  studentGrade: number;
  testDate: Date;
  overallScore: number;
  calibrationScore: number;
  status: 'completed' | 'in_progress' | 'failed';
}

export const VisionSessions: React.FC = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<VisionSessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filters
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API call
        const response = await axios.get('/api/v1/vision/admin/sessions');
        setSessions(response.data.sessions);

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load sessions:', err);
        setError('세션 목록을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    // Grade filter
    if (gradeFilter !== 'all' && session.studentGrade !== parseInt(gradeFilter, 10)) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && session.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery && !session.studentName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">세션 목록을 로딩하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            대시보드로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Vision TEST 세션 관리
              </h1>
              <p className="text-muted-foreground">
                전체 {sessions.length}개 세션
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              대시보드로
            </button>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  학생 이름 검색
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 입력..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                />
              </div>

              {/* Grade Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  학년
                </label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                >
                  <option value="all">전체</option>
                  <option value="1">초등 1학년</option>
                  <option value="2">초등 2학년</option>
                  <option value="3">초등 3학년</option>
                  <option value="4">초등 4학년</option>
                  <option value="5">초등 5학년</option>
                  <option value="6">초등 6학년</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  상태
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                >
                  <option value="all">전체</option>
                  <option value="completed">완료</option>
                  <option value="in_progress">진행중</option>
                  <option value="failed">실패</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="w-full px-4 py-2 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">검색 결과</p>
                  <p className="text-xl font-bold text-foreground">
                    {filteredSessions.length}개
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ML Dataset Statistics */}
        <div className="mb-8">
          <MLDataStats />
        </div>

        {/* Sessions Table */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    학생
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    학년
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    테스트 날짜
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    종합 점수
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    캘리브레이션
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/vision-session/${session.sessionId}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {session.studentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          초등 {session.studentGrade}학년
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {new Date(session.testDate).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-bold ${
                              session.overallScore >= 80
                                ? 'text-green-500'
                                : session.overallScore >= 60
                                ? 'text-yellow-500'
                                : 'text-red-500'
                            }`}
                          >
                            {session.overallScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">/ 100</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {session.calibrationScore.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {session.status === 'completed'
                            ? '완료'
                            : session.status === 'in_progress'
                            ? '진행중'
                            : '실패'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/vision-session/${session.sessionId}`);
                          }}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
