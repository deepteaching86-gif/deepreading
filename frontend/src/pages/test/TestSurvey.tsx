import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';

interface SurveyQuestion {
  id: string;
  questionNumber: number;
  category: string;
  questionType: string;
  questionText: string;
  options: Array<{ id: number; text: string }>;
}

interface SurveyResponse {
  questionId: string;
  questionNumber: number;
  response: string;
}

export default function TestSurvey() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSurveyQuestions();
  }, [sessionId]);

  const fetchSurveyQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/sessions/${sessionId}/survey`);
      setQuestions(response.data.data.questions);
    } catch (error) {
      console.error('설문 조회 실패:', error);
      alert('설문을 불러올 수 없습니다.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    // 모든 문항에 답했는지 확인
    const unanswered = questions.filter((q) => !responses[q.id]);
    if (unanswered.length > 0) {
      alert(`모든 질문에 답해주세요. (남은 문항: ${unanswered.length}개)`);
      return;
    }

    try {
      setSubmitting(true);

      const surveyResponses: SurveyResponse[] = questions.map((q) => ({
        questionId: q.id,
        questionNumber: q.questionNumber,
        response: responses[q.id],
      }));

      await axios.post(`/api/v1/sessions/${sessionId}/survey`, {
        responses: surveyResponses,
      });

      alert('설문이 완료되었습니다. 이제 테스트를 시작합니다.');
      // 실제 테스트 페이지로 이동
      navigate(`/test/session/${sessionId}`);
    } catch (error) {
      console.error('설문 제출 실패:', error);
      alert('설문 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      reading_motivation: '읽기 동기',
      reading_environment: '독서 환경',
      reading_habit: '독서 습관',
      writing_motivation: '글쓰기 동기',
      reading_preference: '선호 장르',
    };
    return names[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      reading_motivation: 'from-blue-500 to-blue-600',
      reading_environment: 'from-green-500 to-green-600',
      reading_habit: 'from-purple-500 to-purple-600',
      writing_motivation: 'from-orange-500 to-orange-600',
      reading_preference: 'from-pink-500 to-pink-600',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">설문 문항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 카테고리별로 그룹화
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, SurveyQuestion[]>);

  const answeredCount = Object.keys(responses).length;
  const totalCount = questions.length;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 독서 습관 및 환경 설문</h1>
            <p className="text-gray-600">
              테스트 시작 전에 여러분의 독서 습관과 환경에 대해 알려주세요.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              이 설문은 <strong>시간 제한이 없으며</strong>, 설문 완료 후 실제 테스트가 시작됩니다.
            </p>
          </div>

          {/* 진행률 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>진행률</span>
              <span className="font-semibold">
                {answeredCount} / {totalCount} 문항
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 설문 문항 */}
        <div className="space-y-6">
          {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
            <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div
                className={`bg-gradient-to-r ${getCategoryColor(category)} text-white px-6 py-4`}
              >
                <h2 className="text-xl font-bold flex items-center">
                  <span className="text-2xl mr-2">
                    {category === 'reading_motivation'
                      ? '📖'
                      : category === 'reading_environment'
                      ? '🏠'
                      : category === 'reading_habit'
                      ? '⏰'
                      : category === 'writing_motivation'
                      ? '✍️'
                      : '🎯'}
                  </span>
                  {getCategoryName(category)}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {categoryQuestions.map((q, idx) => (
                  <div key={q.id} className="pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                    <div className="mb-4">
                      <div className="flex items-start mb-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm mr-3 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-gray-800 font-medium text-lg flex-1">{q.questionText}</p>
                      </div>
                    </div>

                    {/* 리커트 척도 */}
                    {q.questionType === 'likert_scale' && (
                      <div className="grid grid-cols-5 gap-2">
                        {q.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleResponseChange(q.id, String(option.id))}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              responses[q.id] === String(option.id)
                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="text-2xl mb-1">
                              {option.id === 1
                                ? '😞'
                                : option.id === 2
                                ? '😐'
                                : option.id === 3
                                ? '🙂'
                                : option.id === 4
                                ? '😊'
                                : '😄'}
                            </div>
                            <div className="text-sm">{option.text}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 선택형 */}
                    {q.questionType === 'choice' && (
                      <div className="space-y-2">
                        {q.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleResponseChange(q.id, String(option.id))}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                              responses[q.id] === String(option.id)
                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                  responses[q.id] === String(option.id)
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-gray-300'
                                }`}
                              >
                                {responses[q.id] === String(option.id) && (
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span>{option.text}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 제출 버튼 */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <button
            onClick={handleSubmit}
            disabled={answeredCount < totalCount || submitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              answeredCount < totalCount || submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg transform hover:scale-105'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                제출 중...
              </span>
            ) : answeredCount < totalCount ? (
              `모든 질문에 답해주세요 (${answeredCount}/${totalCount})`
            ) : (
              '설문 완료하고 테스트 시작하기 →'
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            설문 완료 후 즉시 테스트가 시작됩니다. (타이머 작동)
          </p>
        </div>
      </div>
    </div>
  );
}
