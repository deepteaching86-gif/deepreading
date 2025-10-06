import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';

interface Question {
  id: string;
  questionNumber: number;
  category: string;
  questionType: string;
  questionText: string;
  passage?: string;
  options?: any;
  correctAnswer: string;
  points: number;
  difficulty: string;
  explanation?: string;
  template: {
    templateCode: string;
    title: string;
    grade: number;
  };
}

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // 필터
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
  }, [selectedGrade, selectedCategory]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (selectedGrade) {
        // 학년에 따라 템플릿 코드 생성
        const gradeNum = parseInt(selectedGrade);
        if (gradeNum <= 6) {
          params.templateCode = `ELEM${selectedGrade}-V1`;
        } else {
          params.templateCode = `MIDDLE${gradeNum - 6}-V1`;
        }
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await axios.get('/api/v1/admin/questions', {
        params,
      });

      setQuestions(response.data.data.questions);
    } catch (error) {
      console.error('문항 조회 실패:', error);
      alert('문항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedQuestion) return;

    try {
      await axios.put(
        `/api/v1/admin/questions/${selectedQuestion.id}`,
        selectedQuestion
      );

      alert('문항이 수정되었습니다.');
      setIsEditing(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('문항 수정 실패:', error);
      alert('문항 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 문항을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/v1/admin/questions/${id}`);

      alert('문항이 삭제되었습니다.');
      fetchQuestions();
    } catch (error: any) {
      console.error('문항 삭제 실패:', error);
      alert(error.response?.data?.message || '문항 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">문항 관리</h1>

        {/* 필터 */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
          <div className="flex gap-4">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">전체 학년</option>
              {[1, 2, 3, 4, 5, 6].map((grade) => (
                <option key={grade} value={grade}>
                  초등 {grade}학년
                </option>
              ))}
              {[7, 8, 9].map((grade) => (
                <option key={grade} value={grade}>
                  중등 {grade - 6}학년
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">전체 영역</option>
              <option value="vocabulary">어휘력</option>
              <option value="reading">독해력</option>
              <option value="grammar">문법/어법</option>
              <option value="reasoning">추론/사고력</option>
            </select>
          </div>
        </div>

        {/* 문항 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-xl text-muted-foreground">로딩 중...</div>
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
                    문항번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    영역
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    문제
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    난이도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {question.template.grade}학년
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {question.questionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {question.category}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md truncate text-sm text-card-foreground">
                        {question.questionText}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'easy'
                            ? 'bg-chart-1/20 text-chart-1'
                            : question.difficulty === 'medium'
                            ? 'bg-chart-3/20 text-chart-3'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {question.difficulty === 'easy' ? '쉬움' : question.difficulty === 'medium' ? '보통' : '어려움'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(question)}
                        className="text-primary hover:text-primary/80 font-medium mr-4 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="text-destructive hover:text-destructive/80 font-medium transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 수정 모달 */}
        {isEditing && selectedQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-border">
              <h2 className="text-2xl font-bold mb-6 text-foreground">문항 수정</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    문제 번호
                  </label>
                  <input
                    type="number"
                    value={selectedQuestion.questionNumber}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        questionNumber: parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    문제 텍스트
                  </label>
                  <textarea
                    value={selectedQuestion.questionText}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        questionText: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    지문 (선택)
                  </label>
                  <textarea
                    value={selectedQuestion.passage || ''}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        passage: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                {/* 선택지 (객관식인 경우) */}
                {selectedQuestion.questionType === 'choice' && selectedQuestion.options && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      선택지
                    </label>
                    <div className="space-y-3">
                      {Array.isArray(selectedQuestion.options) &&
                        selectedQuestion.options.map((option: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="font-medium text-muted-foreground w-8">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={typeof option === 'object' ? option.text : option}
                              onChange={(e) => {
                                const newOptions = [...selectedQuestion.options];
                                if (typeof newOptions[index] === 'object') {
                                  newOptions[index] = {
                                    ...newOptions[index],
                                    text: e.target.value,
                                  };
                                } else {
                                  newOptions[index] = e.target.value;
                                }
                                setSelectedQuestion({
                                  ...selectedQuestion,
                                  options: newOptions,
                                });
                              }}
                              className="flex-1 border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder={`선택지 ${index + 1}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    정답
                  </label>
                  <input
                    type="text"
                    value={selectedQuestion.correctAnswer}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      카테고리
                    </label>
                    <select
                      value={selectedQuestion.category}
                      onChange={(e) =>
                        setSelectedQuestion({
                          ...selectedQuestion,
                          category: e.target.value,
                        })
                      }
                      className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="vocabulary">어휘력</option>
                      <option value="reading">독해력</option>
                      <option value="grammar">문법/어법</option>
                      <option value="reasoning">추론/사고력</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      난이도
                    </label>
                    <select
                      value={selectedQuestion.difficulty}
                      onChange={(e) =>
                        setSelectedQuestion({
                          ...selectedQuestion,
                          difficulty: e.target.value,
                        })
                      }
                      className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="easy">쉬움</option>
                      <option value="medium">보통</option>
                      <option value="hard">어려움</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      배점
                    </label>
                    <input
                      type="number"
                      value={selectedQuestion.points}
                      onChange={(e) =>
                        setSelectedQuestion({
                          ...selectedQuestion,
                          points: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-border rounded-lg px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    해설
                  </label>
                  <textarea
                    value={selectedQuestion.explanation || ''}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        explanation: e.target.value,
                      })
                    }
                    className="w-full border border-border rounded-lg px-4 py-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedQuestion(null);
                  }}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManagement;
