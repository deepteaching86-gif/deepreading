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
    totalItems: 40,
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

  // Submit response
  const handleSubmitResponse = useCallback(
    async (selectedAnswer: string, responseTime: number) => {
      if (!state.sessionId || !state.currentItem) {
        console.error('No active session or current item');
        return;
      }

      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const response: SubmitResponseResponse = await submitResponse(
          state.sessionId,
          state.currentItem.id,
          selectedAnswer,
          responseTime
        );

        // Check if test completed
        if (response.test_completed) {
          // Finalize test
          setState((prev) => ({ ...prev, stage: 'loading' }));

          const apiResults: FinalResults = await finalizeTest(state.sessionId!);

          // Transform snake_case API response to camelCase for React
          const finalResults: TestResults = {
            sessionId: apiResults.session_id,
            finalTheta: apiResults.final_theta,
            standardError: apiResults.standard_error,
            proficiencyLevel: apiResults.proficiency_level,
            lexileScore: apiResults.lexile_score ?? undefined,
            arLevel: apiResults.ar_level ?? undefined,
            vocabularySize: apiResults.vocabulary_size ?? undefined,
            vocabularyBands: apiResults.vocabulary_bands ?? undefined,
            totalItems: apiResults.total_items,
            correctCount: apiResults.correct_count,
            accuracyPercentage: apiResults.accuracy_percentage,
            completedAt: apiResults.completed_at,
          };

          setState((prev) => ({
            ...prev,
            stage: 'completed',
            finalResults,
            isSubmitting: false,
          }));
        } else {
          // Continue to next item
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
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          stage: 'error',
          error: error.message || 'Failed to submit response',
          isSubmitting: false,
        }));
      }
    },
    [state.sessionId, state.currentItem]
  );

  // Reset test
  const handleReset = useCallback(() => {
    isStartingRef.current = false;
    setState({
      stage: 'intro',
      sessionId: null,
      currentItem: null,
      itemsCompleted: 0,
      totalItems: 40,
      mstStage: 1,
      mstPanel: 'routing',
      currentTheta: null,
      standardError: null,
      finalResults: null,
      error: null,
      isSubmitting: false,
    });
  }, []);

  // Auto-save session (network error recovery)
  const saveSessionToLocalStorage = useCallback(() => {
    if (state.sessionId) {
      localStorage.setItem(
        'english_test_session',
        JSON.stringify({
          sessionId: state.sessionId,
          itemsCompleted: state.itemsCompleted,
          timestamp: Date.now(),
        })
      );
    }
  }, [state.sessionId, state.itemsCompleted]);

  // Load saved session
  const loadSessionFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem('english_test_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Check if session is recent (< 24 hours)
        const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          return data;
        }
      } catch (error) {
        console.error('Failed to load saved session:', error);
      }
    }
    return null;
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
    saveSession: saveSessionToLocalStorage,
    loadSession: loadSessionFromLocalStorage,

    // Computed
    progress: state.totalItems > 0 ? (state.itemsCompleted / state.totalItems) * 100 : 0,
    isLoading: state.stage === 'loading',
    isComplete: state.stage === 'completed',
    hasError: state.stage === 'error',
  };
};

export default useEnglishTest;
