import { useEffect, useState } from 'react';

interface SubmissionProgressModalProps {
  isOpen: boolean;
  totalQuestions: number;
  currentQuestion: number;
  stage: 'submitting' | 'grading' | 'calculating' | 'complete' | 'error';
  error?: string;
}

export function SubmissionProgressModal({
  isOpen,
  totalQuestions,
  currentQuestion,
  stage,
  error,
}: SubmissionProgressModalProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (stage === 'error' || stage === 'complete') return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [stage]);

  if (!isOpen) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'submitting':
        return {
          title: '제출 중',
          message: '답안을 서버에 전송하고 있습니다',
          icon: '📤',
          color: 'text-blue-600',
        };
      case 'grading':
        return {
          title: 'AI 채점 중',
          message: `${currentQuestion}/${totalQuestions} 문제 채점 중`,
          icon: '🤖',
          color: 'text-purple-600',
        };
      case 'calculating':
        return {
          title: '결과 계산 중',
          message: '최종 점수와 등급을 계산하고 있습니다',
          icon: '📊',
          color: 'text-green-600',
        };
      case 'complete':
        return {
          title: '완료!',
          message: '채점이 완료되었습니다',
          icon: '✅',
          color: 'text-green-600',
        };
      case 'error':
        return {
          title: '오류 발생',
          message: error || '채점 중 문제가 발생했습니다',
          icon: '❌',
          color: 'text-red-600',
        };
    }
  };

  const stageInfo = getStageInfo();
  const progress = stage === 'grading' ? (currentQuestion / totalQuestions) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          {/* Icon */}
          <div className="text-7xl mb-4 animate-bounce">{stageInfo.icon}</div>

          {/* Title */}
          <h2 className={`text-2xl font-bold mb-2 ${stageInfo.color}`}>
            {stageInfo.title}
            {stage !== 'error' && stage !== 'complete' && dots}
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">{stageInfo.message}</p>

          {/* Progress bar for grading stage */}
          {stage === 'grading' && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round(progress)}% 완료
              </p>
            </div>
          )}

          {/* Spinner for non-grading stages */}
          {stage !== 'grading' && stage !== 'error' && stage !== 'complete' && (
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
            </div>
          )}

          {/* Info text */}
          {stage !== 'error' && stage !== 'complete' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">잠시만 기다려주세요!</span>
                <br />
                AI가 답안을 채점하는 데 최대 2분 정도 소요될 수 있습니다.
              </p>
            </div>
          )}

          {/* Error details */}
          {stage === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
