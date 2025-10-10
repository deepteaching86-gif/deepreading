import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';
import { SubmissionProgressModal } from '../../components/SubmissionProgressModal';

interface Question {
  id: string;
  questionNumber: number;
  category: string;
  questionType: string;
  questionText: string;
  passage?: string;
  imageUrl?: string;
  options?: { id: number; text: string }[];
  points: number;
  difficulty: string;
}

interface Answer {
  questionId: string;
  answer: string;
}

export default function TestInProgress() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<'submitting' | 'grading' | 'calculating' | 'complete' | 'error'>('submitting');
  const [gradingProgress, setGradingProgress] = useState(0);
  const [submissionError, setSubmissionError] = useState<string>('');

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Timer starts immediately when timeRemaining is set and auto-submits when expired
  useEffect(() => {
    if (timeRemaining === 0 && !loading && questions.length > 0 && !submitting) {
      // Auto-submit when time expires
      handleSubmitForce();
      return;
    }

    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0; // Will trigger auto-submit
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, loading, questions.length, submitting]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/sessions/${sessionId}`);
      let session = response.data.data;

      // 설문 완료 여부 확인
      if (!session.surveyCompletedAt) {
        alert('먼저 설문을 완료해주세요.');
        navigate(`/test/survey/${sessionId}`);
        return;
      }

      // Fix: Access questions from session.template.questions
      if (!session.template?.questions || session.template.questions.length === 0) {
        throw new Error('테스트 문제를 찾을 수 없습니다.');
      }

      // 설문 문항 제외 (실제 테스트 문항만) - 총 25문항 설문 제외
      const testQuestions = session.template.questions.filter((q: Question) => {
        return !['reading_motivation', 'reading_environment', 'reading_habit', 'writing_motivation', 'reading_preference', 'digital_literacy', 'critical_thinking', 'reading_attitude'].includes(q.category);
      });

      setQuestions(testQuestions);

      // 기존 답안 불러오기
      const existingAnswers: Record<string, string> = {};
      session.answers?.forEach((answer: any) => {
        existingAnswers[answer.questionId] = answer.studentAnswer || '';
      });
      setAnswers(existingAnswers);

      // If session hasn't started actual test yet, start it now (타이머 시작)
      if (!session.startedAt || session.status === 'pending') {
        const startResponse = await axios.patch(`/api/v1/sessions/${sessionId}/status`, {
          status: 'in_progress',
        });
        session = startResponse.data.data;
      }

      // 남은 시간 계산 - 타이머는 실제 테스트 시작 시간부터 자동으로 시작
      const startedAt = new Date(session.startedAt);
      const now = new Date();
      const elapsedMinutes = (now.getTime() - startedAt.getTime()) / 1000 / 60;
      const remainingMinutes = Math.max(0, session.template.timeLimit - elapsedMinutes);
      setTimeRemaining(Math.floor(remainingMinutes * 60));
    } catch (error) {
      console.error('세션 조회 실패:', error);
      alert('테스트 정보를 불러올 수 없습니다.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSave = async () => {
    try {
      // Only save non-empty answers
      const answersArray: Answer[] = Object.entries(answers)
        .filter(([_, answer]) => answer && answer.trim() !== '')
        .map(([questionId, answer]) => ({
          questionId,
          answer,
        }));

      console.log('Attempting to save answers:', answersArray);
      console.log('Session ID:', sessionId);

      if (answersArray.length === 0) {
        alert('저장할 답안이 없습니다.');
        return;
      }

      const response = await axios.post(`/api/v1/sessions/${sessionId}/answers`, {
        answers: answersArray,
      }, {
        timeout: 150000, // 150 seconds for save operation
      });

      console.log('Save response:', response.data);
      alert(`✅ ${answersArray.length}개의 답안이 저장되었습니다.`);
    } catch (error: any) {
      console.error('저장 실패:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error details:', error.response?.data);

      let errorMessage = '답안 저장에 실패했습니다.';
      if (error.code === 'ECONNABORTED') {
        errorMessage += '\n\n⏱️ 시간 초과: 네트워크 연결을 확인해주세요.';
      } else if (error.response?.data?.message) {
        errorMessage += `\n\n${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `\n\n${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('테스트를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
      return;
    }

    await submitTest();
  };

  const handleExit = () => {
    if (confirm('테스트를 종료하시겠습니까?\n\n⚠️ 경고: 모든 문제 풀이 내용이 삭제되며 복구할 수 없습니다.\n\n임시저장 버튼을 눌러 답안을 저장한 후 나가는 것을 권장합니다.')) {
      navigate('/dashboard');
    }
  };

  // Force submit without confirmation (for timeout)
  const handleSubmitForce = async () => {
    alert('시간이 종료되었습니다. 테스트가 자동 제출됩니다.');
    await submitTest();
  };

  const submitTest = async () => {
    try {
      setSubmitting(true);
      setSubmissionStage('submitting');
      setSubmissionError('');

      // Include all questions, even unanswered ones (empty string)
      const answersArray: Answer[] = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '', // Empty string for unanswered
      }));

      // Stage 1: Submitting answers
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UI feedback

      // Stage 2: Grading
      setSubmissionStage('grading');

      // Simulate grading progress (actual grading happens on server)
      const progressInterval = setInterval(() => {
        setGradingProgress((prev) => {
          if (prev >= questions.length) {
            clearInterval(progressInterval);
            return questions.length;
          }
          return prev + 1;
        });
      }, (120000 / questions.length)); // Distribute over 120 seconds max

      // Submit to server with extended timeout for AI grading
      await axios.post(`/api/v1/sessions/${sessionId}/submit`, {
        answers: answersArray,
      }, {
        timeout: 150000, // 150 seconds (2.5 minutes) to allow for AI grading
      });

      clearInterval(progressInterval);
      setGradingProgress(questions.length);

      // Stage 3: Calculating
      setSubmissionStage('calculating');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 4: Complete
      setSubmissionStage('complete');
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate(`/test/result/${sessionId}`);
    } catch (error: any) {
      console.error('제출 실패:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error details:', error.response?.data);

      setSubmissionStage('error');
      setSubmissionError(error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다');

      // Allow retry after 3 seconds
      setTimeout(() => {
        setSubmitting(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      vocabulary: '어휘력',
      reading: '독해력',
      grammar: '문법/어법',
      reasoning: '추론/사고력',
      reading_motivation: '읽기 동기',
      writing_motivation: '글쓰기 동기',
      reading_environment: '독서 환경',
      reading_habit: '독서 습관',
      reading_preference: '선호 장르',
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // Check if questions array exists and has items
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">문제를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      {/* Submission Progress Modal */}
      <SubmissionProgressModal
        isOpen={submitting}
        totalQuestions={questions.length}
        currentQuestion={gradingProgress}
        stage={submissionStage}
        error={submissionError}
      />

      <div className="min-h-screen bg-background">
      {/* 상단 헤더 */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary">문해력 진단 평가</h1>
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                답변: {answeredCount} / {questions.length}
              </div>
              <div
                className={`text-lg font-bold ${
                  timeRemaining < 300 ? 'text-destructive' : 'text-primary'
                }`}
              >
                ⏱️ {formatTime(timeRemaining)}
              </div>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm disabled:opacity-50"
              >
                💾 임시저장
              </button>
              <button
                onClick={handleExit}
                disabled={submitting}
                className="px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm disabled:opacity-50"
              >
                🚪 나가기
              </button>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {/* 문제 정보 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {getCategoryName(currentQuestion.category)}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentQuestion.points}점
              </span>
            </div>
            <div className="text-2xl font-bold text-primary">
              문제 {currentQuestion.questionNumber}
            </div>
          </div>

          {/* 지문 (있는 경우) */}
          {currentQuestion.passage && (
            <div className="bg-muted rounded-lg p-6 mb-6">
              <div className="text-sm text-muted-foreground mb-2">지문</div>
              <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                {currentQuestion.passage}
              </div>
            </div>
          )}

          {/* 이미지 (있는 경우) */}
          {currentQuestion.imageUrl && (
            <div className="mb-6">
              <img
                src={currentQuestion.imageUrl.startsWith('http')
                  ? currentQuestion.imageUrl
                  : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${currentQuestion.imageUrl}`}
                alt="문제 이미지"
                className="max-w-full h-auto rounded-lg border border-border"
                onError={(e) => {
                  console.error('Image failed to load:', currentQuestion.imageUrl);
                  // Hide broken image
                  (e.target as HTMLImageElement).style.display = 'none';
                  // Show a placeholder message
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.image-error-message')) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'image-error-message p-4 bg-muted rounded-lg text-muted-foreground text-sm';
                    errorMsg.textContent = '📷 이미지를 불러올 수 없습니다.';
                    parent.appendChild(errorMsg);
                  }
                }}
              />
            </div>
          )}

          {/* 문제 */}
          <div className="mb-8">
            <div className="text-lg font-semibold text-foreground mb-6">
              {currentQuestion.questionText}
            </div>

            {/* 선택형/리커트 척도 */}
            {(currentQuestion.questionType === 'choice' ||
              currentQuestion.questionType === 'likert_scale') &&
              currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answers[currentQuestion.id] === option.id.toString()
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option.id}
                        checked={answers[currentQuestion.id] === option.id.toString()}
                        onChange={(e) =>
                          handleAnswer(currentQuestion.id, e.target.value)
                        }
                        className="mt-1 accent-primary"
                      />
                      <span className="text-foreground">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

            {/* 단답형 */}
            {currentQuestion.questionType === 'short_answer' && (
              <input
                type="text"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="답을 입력하세요"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-primary bg-input text-foreground"
              />
            )}

            {/* 서술형 */}
            {currentQuestion.questionType === 'essay' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="답을 입력하세요"
                rows={6}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-primary bg-input text-foreground resize-none"
              />
            )}
          </div>

          {/* 네비게이션 */}
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0 || submitting}
              className="px-6 py-2 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>

            {/* 문제 번호 드롭다운 선택 */}
            <div className="flex items-center gap-3">
              <label htmlFor="question-select" className="text-sm text-muted-foreground">
                문제 이동:
              </label>
              <select
                id="question-select"
                value={currentQuestionIndex}
                onChange={(e) => setCurrentQuestionIndex(Number(e.target.value))}
                disabled={submitting}
                className="px-4 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
              >
                {questions.map((q, idx) => (
                  <option key={q.id} value={idx}>
                    문제 {idx + 1} {answers[q.id] ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                disabled={submitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                다음 →
              </button>
            )}
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>모든 문항에 답변한 후 '제출하기' 버튼을 눌러주세요.</p>
          <p className="mt-1">임시저장을 하면 나중에 이어서 풀 수 있습니다.</p>
          {timeRemaining < 300 && (
            <p className="mt-2 text-destructive font-bold">
              ⚠️ 남은 시간이 5분 미만입니다!
            </p>
          )}
        </div>
      </main>
    </div>
    </>
  );
}
