import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';

interface Question {
  id: string;
  questionNumber: number;
  category: string;
  questionType: string;
  questionText: string;
  passage?: string;
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

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/sessions/${sessionId}`);
      const session = response.data.data;

      // Fix: Access questions from session.template.questions
      if (!session.template?.questions || session.template.questions.length === 0) {
        throw new Error('테스트 문제를 찾을 수 없습니다.');
      }

      setQuestions(session.template.questions);

      // 기존 답안 불러오기
      const existingAnswers: Record<string, string> = {};
      session.answers?.forEach((answer: any) => {
        existingAnswers[answer.questionId] = answer.studentAnswer || '';
      });
      setAnswers(existingAnswers);

      // 남은 시간 계산
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
      const answersArray: Answer[] = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      await axios.post(`/api/v1/sessions/${sessionId}/answers`, {
        answers: answersArray,
      });

      alert('답안이 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('답안 저장에 실패했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!confirm('테스트를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) {
      return;
    }

    try {
      setSubmitting(true);

      const answersArray: Answer[] = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      await axios.post(`/api/v1/sessions/${sessionId}/submit`, {
        answers: answersArray,
      });

      alert('테스트가 제출되었습니다. 채점 중입니다...');
      navigate(`/test/result/${sessionId}`);
    } catch (error) {
      console.error('제출 실패:', error);
      alert('테스트 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
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
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm"
              >
                임시저장
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
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>

            <div className="flex gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                    idx === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : answers[q.id]
                      ? 'bg-accent text-accent-foreground'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
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
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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
        </div>
      </main>
    </div>
  );
}
