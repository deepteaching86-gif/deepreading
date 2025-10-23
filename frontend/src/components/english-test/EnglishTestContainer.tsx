/**
 * English Test Container
 * ======================
 *
 * Main container component that orchestrates the English adaptive test flow.
 */

import React from 'react';
import { useEnglishTest } from '@/hooks/useEnglishTest';
import EnglishTestIntro from './EnglishTestIntro';
import EnglishTestScreen from './EnglishTestScreen';
import EnglishTestReport from './EnglishTestReport';

interface EnglishTestContainerProps {
  userId: string;
}

export const EnglishTestContainer: React.FC<EnglishTestContainerProps> = ({ userId }) => {
  const {
    stage,
    currentItem,
    itemsCompleted,
    totalItems,
    mstStage,
    mstPanel,
    finalResults,
    error,
    isSubmitting,
    startTest,
    submitResponse,
    reset,
    sessionId,
  } = useEnglishTest(userId);

  // Error screen
  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-6">{error || '알 수 없는 오류가 발생했습니다'}</p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">처리 중...</p>
        </div>
      </div>
    );
  }

  // Intro screen
  if (stage === 'intro') {
    return <EnglishTestIntro onStart={startTest} isLoading={false} />;
  }

  // Test screen
  if (stage === 'testing' && currentItem && sessionId) {
    return (
      <EnglishTestScreen
        sessionId={sessionId}
        currentItem={currentItem}
        itemsCompleted={itemsCompleted}
        totalItems={totalItems}
        stage={mstStage}
        panel={mstPanel}
        onSubmitResponse={submitResponse}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Results screen
  if (stage === 'completed' && finalResults) {
    return <EnglishTestReport results={finalResults} onReturnHome={reset} />;
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">초기화 중...</p>
    </div>
  );
};

export default EnglishTestContainer;
