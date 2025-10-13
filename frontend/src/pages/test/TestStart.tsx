import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from '../../lib/axios';

interface TestTemplate {
  id: string;
  templateCode: string;
  grade: number;
  title: string;
  totalQuestions: number;
  timeLimit: number;
  templateType?: string; // 'standard' | 'vision'
  visionConfig?: any;
}

export default function TestStart() {
  const { templateCode } = useParams<{ templateCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [template, setTemplate] = useState<TestTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [templateCode]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/templates/${templateCode}`);
      setTemplate(response.data.data);
    } catch (error) {
      console.error('템플릿 조회 실패:', error);
      alert('테스트 정보를 불러올 수 없습니다.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!template) return;

    try {
      setStarting(true);
      const response = await axios.post('/api/v1/sessions/start', {
        templateId: template.id,
      });

      const sessionId = response.data.data.sessionId;

      // Vision TEST인 경우 캘리브레이션 페이지로 바로 이동 (설문 생략)
      if (template.templateType === 'vision') {
        navigate(`/student/vision/test/${sessionId}`);
      } else {
        // 일반 테스트는 설문 페이지로 이동
        navigate(`/test/survey/${sessionId}`);
      }
    } catch (error: any) {
      console.error('테스트 시작 실패:', error);
      alert(error.response?.data?.message || '테스트를 시작할 수 없습니다.');
    } finally {
      setStarting(false);
    }
  };

  const getGradeName = (grade: number) => {
    if (grade <= 6) return `초등 ${grade}학년`;
    return `중등 ${grade - 6}학년`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              {template.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {getGradeName(template.grade)}
            </p>
          </div>

          {/* 테스트 정보 */}
          <div className="bg-muted rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              테스트 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">문항 수</div>
                  <div className="text-lg font-semibold text-foreground">
                    {template.totalQuestions}문항
                  </div>
                </div>
              </div>

              {template.templateType !== 'vision' && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">제한 시간</div>
                    <div className="text-lg font-semibold text-foreground">
                      {template.timeLimit}분
                    </div>
                  </div>
                </div>
              )}

              {template.templateType === 'vision' && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👁️</span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">시선 추적</div>
                    <div className="text-lg font-semibold text-foreground">
                      웹캠 필요
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">평가 영역</div>
                  <div className="text-lg font-semibold text-foreground">
                    {template.templateType === 'vision' ? '독해력 + 시선 분석' : '4개 영역'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 안내 사항 */}
          <div className="bg-accent/50 rounded-lg p-6 mb-8 border border-accent">
            <h2 className="text-xl font-semibold mb-4 text-accent-foreground">
              ⚠️ 테스트 전 확인사항
            </h2>
            {template.templateType === 'vision' ? (
              <ul className="space-y-3 text-accent-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>웹캠</strong>을 사용하여 시선 추적이 진행됩니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    먼저 <strong>캘리브레이션</strong> (눈 움직임 보정)을 진행합니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>{template.totalQuestions}개</strong>의 지문을 읽고 문제를 풀어주세요.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    읽는 동안 <strong>시선 추적</strong>이 자동으로 기록됩니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    결과는 독해력 점수와 함께 <strong>15가지 시선 분석 메트릭</strong>을 제공합니다.
                  </span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-3 text-accent-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    테스트는 총 <strong>{template.timeLimit}분</strong> 동안 진행됩니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    <strong>{template.totalQuestions}개</strong>의 문항에 답해주세요.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    테스트는 어휘력, 독해력, 문법, 추론 영역과 독서 습관 설문으로 구성되어 있습니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    한 번 시작하면 <strong>중간 저장이 가능</strong>하며, 나중에 이어서 할 수 있습니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>
                    모든 문항에 성실히 답변해주세요. 결과는 즉시 확인할 수 있습니다.
                  </span>
                </li>
              </ul>
            )}
          </div>

          {/* 평가 영역 안내 */}
          {template.templateType === 'vision' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-600 mb-2">📚 독해력 평가</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 지문 이해력</li>
                  <li>• 내용 파악 능력</li>
                  <li>• 세부 정보 인식</li>
                  <li>• 추론 및 종합</li>
                </ul>
              </div>

              <div className="bg-card border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-600 mb-2">👁️ 시선 분석 (15개 메트릭)</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 시선 도약 패턴 (6개 지표)</li>
                  <li>• 응시 행동 (4개 지표)</li>
                  <li>• 읽기 속도 및 리듬 (3개 지표)</li>
                  <li>• 인지 부하 (2개 지표)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">📚 문해력 평가</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 어휘력 (단어와 한자성어 이해)</li>
                  <li>• 독해력 (글의 내용 파악)</li>
                  <li>• 문법/어법 (언어 규칙 이해)</li>
                  <li>• 추론/사고력 (논리적 사고)</li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">📖 독서 습관 설문</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 읽기/쓰기 동기</li>
                  <li>• 가정 독서 환경</li>
                  <li>• 평소 독서 습관</li>
                  <li>• 선호 장르 파악</li>
                </ul>
              </div>
            </div>
          )}

          {/* 응시자 정보 */}
          <div className="bg-muted rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">응시자</div>
                <div className="font-semibold text-foreground">{user?.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">이메일</div>
                <div className="font-semibold text-foreground">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* 시작 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-border py-3 px-6 rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
            >
              취소
            </button>
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              {starting ? '시작 준비 중...' : '테스트 시작하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
