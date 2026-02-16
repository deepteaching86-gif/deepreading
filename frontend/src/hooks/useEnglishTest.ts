/**
 * useEnglishTest Hook
 * ===================
 *
 * Manages English adaptive test state and API interactions.
 */

import { useState, useCallback, useRef } from 'react';
import {
  startEnglishTest,
  submitResponse,
  finalizeTest,
  Item,
  StartTestResponse,
  SubmitResponseResponse,
  FinalResults,
} from '@/api/englishTestApi';
import { TestResults } from '@/components/english-test/EnglishTestReport';

export type TestStage = 'intro' | 'testing' | 'loading' | 'completed' | 'error';

interface TestState {
  stage: TestStage;
  sessionId: number | null;
  currentItem: Item | null;
  itemsCompleted: number;
  totalItems: number;
  mstStage: number;
  mstPanel: string;
  currentTheta: number | null;
  standardError: number | null;
  finalResults: TestResults | null;
  error: string | null;
  isSubmitting: boolean;
}

export const useEnglishTest = (userId: string) => {
  const [state, setState] = useState<TestState>({
    stage: 'intro',
    sessionId: null,
    currentItem: null,
    itemsCompleted: 0,
    totalItems: 45,
    mstStage: 1,
    mstPanel: 'routing',
    currentTheta: null,
    standardError: null,
    finalResults: null,
    error: null,
    isSubmitting: false,
  });

  // Prevent duplicate API calls (429 Too Many Requests)
  const isStartingRef = useRef(false);

  // Start test (with retry logic for cold start)
  const handleStartTest = useCallback(async () => {
    // Prevent duplicate calls
    if (isStartingRef.current) {
      console.warn('Test already starting, ignoring duplicate call');
      return;
    }

    isStartingRef.current = true;

    setState((prev) => ({ ...prev, stage: 'loading', error: null }));

    const maxRetries = 2; // Try 3 times total (initial + 2 retries)
    const retryDelays = [3000, 10000]; // 3s, 10s

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎯 [Attempt ${attempt + 1}/${maxRetries + 1}] Starting English test...`);
        const response: StartTestResponse = await startEnglishTest(userId);

        setState((prev) => ({
          ...prev,
          stage: 'testing',
          sessionId: response.session_id,
          currentItem: response.item,
          mstStage: response.stage,
          mstPanel: response.panel,
          totalItems: response.total_items_planned,
          itemsCompleted: 0,
        }));

        console.log('✅ Test started successfully');
        isStartingRef.current = false;
        return; // Success - exit retry loop
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;

        if (isLastAttempt) {
          // Final failure - show error
          console.error('❌ Failed to start test after all retries:', error);
          setState((prev) => ({
            ...prev,
            stage: 'error',
            error: error.response?.data?.detail || error.message || '서버 연결 실패. 잠시 후 다시 시도해주세요.',
          }));
          isStartingRef.current = false;
        } else {
          // Retry with exponential backoff
          const delay = retryDelays[attempt];
          console.log(`⚠️  Attempt ${attempt + 1} failed, retrying in ${delay / 1000}s...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }, [userId]);

  // Submit response (with retry on network errors)
  const handleSubmitResponse = useCallback(
    async (selectedAnswer: string, responseTime: number) => {
      if (!state.sessionId || !state.currentItem) {
        console.error('No active session or current item');
        return;
      }

      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      const maxRetries = 1;
      const retryDelay = 2000;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response: SubmitResponseResponse = await submitResponse(
            state.sessionId,
            state.currentItem.id,
            selectedAnswer,
            responseTime
          );

          // Save session progress on each successful response
          if (state.sessionId) {
            localStorage.setItem(
              'english_test_session',
              JSON.stringify({
                sessionId: state.sessionId,
                itemsCompleted: response.items_completed,
                timestamp: Date.now(),
              })
            );
          }

          // Check if test completed
          if (response.test_completed) {
            setState((prev) => ({ ...prev, stage: 'loading' }));

            const apiResults: FinalResults = await finalizeTest(state.sessionId!);

            const finalResults: TestResults = {
              sessionId: apiResults.session_id,
              finalTheta: apiResults.final_theta,
              standardError: apiResults.standard_error,
              proficiencyLevel: apiResults.proficiency_level,
              lexileScore: apiResults.lexile_score ?? undefined,
              lexileDetails: apiResults.lexile_details ?? undefined,
              arLevel: apiResults.ar_level ?? undefined,
              vocabularySize: apiResults.vocabulary_size ?? undefined,
              vocabularyBands: apiResults.vocabulary_bands ?? undefined,
              domainScores: apiResults.domain_scores ?? undefined,
              totalItems: apiResults.total_items,
              correctCount: apiResults.correct_count,
              accuracyPercentage: apiResults.accuracy_percentage,
              completedAt: apiResults.completed_at,
              scoreDisclaimer: apiResults.score_disclaimer ?? undefined,
            };

            // Clear saved session on completion
            localStorage.removeItem('english_test_session');

            setState((prev) => ({
              ...prev,
              stage: 'completed',
              finalResults,
              isSubmitting: false,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              currentItem: response.next_item,
              itemsCompleted: response.items_completed,
              mstStage: response.stage,
              mstPanel: response.panel,
              currentTheta: response.current_theta,
              standardError: response.standard_error,
              isSubmitting: false,
            }));
          }
          return; // Success - exit retry loop
        } catch (error: any) {
          const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
          const isLastAttempt = attempt === maxRetries;

          if (isNetworkError && !isLastAttempt) {
            console.warn(`⚠️ Submit attempt ${attempt + 1} failed (network), retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }

          setState((prev) => ({
            ...prev,
            stage: 'error',
            error: isNetworkError
              ? '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
              : (error.response?.data?.detail || error.message || '응답 제출에 실패했습니다.'),
            isSubmitting: false,
          }));
          return;
        }
      }
    },
    [state.sessionId, state.currentItem]
  );

  // Reset test
  const handleReset = useCallback(() => {
    isStartingRef.current = false;
    localStorage.removeItem('english_test_session');
    setState({
      stage: 'intro',
      sessionId: null,
      currentItem: null,
      itemsCompleted: 0,
      totalItems: 45,
      mstStage: 1,
      mstPanel: 'routing',
      currentTheta: null,
      standardError: null,
      finalResults: null,
      error: null,
      isSubmitting: false,
    });
  }, []);

  return {
    // State
    stage: state.stage,
    sessionId: state.sessionId,
    currentItem: state.currentItem,
    itemsCompleted: state.itemsCompleted,
    totalItems: state.totalItems,
    mstStage: state.mstStage,
    mstPanel: state.mstPanel,
    currentTheta: state.currentTheta,
    standardError: state.standardError,
    finalResults: state.finalResults,
    error: state.error,
    isSubmitting: state.isSubmitting,

    // Actions
    startTest: handleStartTest,
    submitResponse: handleSubmitResponse,
    reset: handleReset,

    // Computed
    progress: state.totalItems > 0 ? (state.itemsCompleted / state.totalItems) * 100 : 0,
    isLoading: state.stage === 'loading',
    isComplete: state.stage === 'completed',
    hasError: state.stage === 'error',
  };
};

export default useEnglishTest;
