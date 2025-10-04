import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        params.templateCode = `ELEM${selectedGrade}-V1`;
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await axios.get('/api/v1/admin/questions', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
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
        selectedQuestion,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
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
      await axios.delete(`/api/v1/admin/questions/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      alert('문항이 삭제되었습니다.');
      fetchQuestions();
    } catch (error: any) {
      console.error('문항 삭제 실패:', error);
      alert(error.response?.data?.message || '문항 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">문항 관리</h1>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">전체 학년</option>
            {[1, 2, 3, 4, 5, 6].map((grade) => (
              <option key={grade} value={grade}>
                초등 {grade}학년
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-3 py-2"
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
        <div className="text-center py-12">로딩 중...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  학년
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  문항번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  영역
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  문제
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  난이도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question) => (
                <tr key={question.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {question.template.grade}학년
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {question.questionNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {question.category}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate">
                      {question.questionText}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        question.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : question.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(question)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="text-red-600 hover:text-red-900"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">문항 수정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="vocabulary">어휘력</option>
                    <option value="reading">독해력</option>
                    <option value="grammar">문법/어법</option>
                    <option value="reasoning">추론/사고력</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="easy">쉬움</option>
                    <option value="medium">보통</option>
                    <option value="hard">어려움</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedQuestion(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
