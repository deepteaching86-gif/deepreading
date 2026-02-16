/**
 * English Adaptive Test - Main Test Screen
 * =========================================
 *
 * Displays adaptive test items and handles user responses.
 * Based on PRD Section 4: UI/UX Specification
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item } from '@/api/englishTestApi';

interface EnglishTestScreenProps {
  sessionId: number;
  currentItem: Item;
  itemsCompleted: number;
  totalItems: number;
  stage: number;
  panel: string;
  currentTheta?: number | null;
  standardError?: number | null;
  onSubmitResponse: (answer: string, responseTime: number) => void;
  isSubmitting?: boolean;
}

// Stage transition encouragement messages
const STAGE_MESSAGES: Record<number, string> = {
  2: '잘하고 있어요! 다음 단계로 넘어갑니다 🎯',
  3: '거의 다 왔어요! 마지막 단계입니다 💪',
};

export const EnglishTestScreen: React.FC<EnglishTestScreenProps> = ({
  currentItem,
  itemsCompleted,
  totalItems,
  stage,
  onSubmitResponse,
  isSubmitting = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showPassage, setShowPassage] = useState(true);
  const [testStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [stageMessage, setStageMessage] = useState<string | null>(null);
  const [previousStage, setPreviousStage] = useState(stage);

  // Reset state when item changes
  useEffect(() => {
    setSelectedAnswer(null);
    setStartTime(Date.now());
    setShowPassage(true);
  }, [currentItem.id]);

  // Detect stage transitions and show encouragement
  useEffect(() => {
    if (stage !== previousStage && stage > previousStage) {
      const message = STAGE_MESSAGES[stage];
      if (message) {
        setStageMessage(message);
        const timer = setTimeout(() => setStageMessage(null), 3000);
        return () => clearTimeout(timer);
      }
    }
    setPreviousStage(stage);
  }, [stage, previousStage]);

  // Elapsed time timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      setElapsedTime(`${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [testStartTime]);

  const handleSubmit = useCallback(() => {
    if (!selectedAnswer) return;
    const responseTime = Date.now() - startTime;
    onSubmitResponse(selectedAnswer, responseTime);
  }, [selectedAnswer, startTime, onSubmitResponse]);

  // Keyboard shortcuts: 1-4 for options, Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      const keyMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      if (keyMap[e.key]) {
        setSelectedAnswer(keyMap[e.key]);
      } else if (e.key === 'Enter' && selectedAnswer) {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setSelectedAnswer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, selectedAnswer, handleSubmit]);

  const progress = (itemsCompleted / totalItems) * 100;

  // Stage labels (user-friendly, no technical terms)
  const stageLabels: Record<number, string> = {
    1: '기초 평가',
    2: '실력 측정',
    3: '정밀 진단'
  };

  return (
    <div lang="en" role="main" aria-label="English Proficiency Test" className="min-h-screen bg-background flex flex-col">
      {/* Screen reader announcement for question changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Question {itemsCompleted + 1} of {totalItems}. {currentItem.domain} question.
      </div>

      {/* Header with Progress */}
      <div className="bg-card shadow-sm sticky top-0 z-10 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                English Adaptive Test
              </h2>
              <p className="text-sm text-muted-foreground" aria-current="step">
                {stageLabels[stage] || `단계 ${stage}`} • 문항 {itemsCompleted + 1}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Elapsed Timer */}
              <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded-md">
                {elapsedTime}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {itemsCompleted}/{totalItems}
                </div>
                <div className="text-xs text-muted-foreground">완료</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-primary h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Stage Transition Encouragement */}
      <AnimatePresence>
        {stageMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-primary/10 border-b border-primary/20 px-6 py-3 text-center"
          >
            <p className="text-primary font-medium">{stageMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Passage (if exists) */}
            {currentItem.passage && (
              <div className="bg-card rounded-xl shadow-sm p-6 border border-border" role="region" aria-label="Reading passage">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-foreground flex items-center">
                    <span className="text-primary mr-2" aria-hidden="true">📖</span>
                    지문
                  </h3>
                  <button
                    onClick={() => setShowPassage(!showPassage)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    {showPassage ? '접기' : '펼치기'}
                  </button>
                </div>
                <AnimatePresence>
                  {showPassage && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="prose prose-sm max-w-none"
                    >
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {currentItem.passage}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Question */}
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                {currentItem.stem}
              </h3>

              {/* Options with keyboard shortcut hints */}
              <div className="space-y-3" role="radiogroup" aria-label="Answer choices">
                {Object.entries(currentItem.options).map(([key, value], idx) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedAnswer(key)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                      ${selectedAnswer === key
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                      }
                    `}
                    aria-label={`선택지 ${key}: ${value}`}
                    role="radio"
                    aria-checked={selectedAnswer === key}
                  >
                    <div className="flex items-start">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                        ${selectedAnswer === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {key}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-foreground">{value}</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 mt-2 hidden sm:inline">
                        {idx + 1}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitting}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-lg
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${!selectedAnswer || isSubmitting
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                  }
                  transition-all duration-200
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    제출 중...
                  </span>
                ) : (
                  '다음 문제'
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Help */}
      <div className="bg-card border-t border-border py-4">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            정답을 선택한 후 "다음 문제" 버튼을 클릭하세요 • 키보드: 1~4 선택, Enter 제출, Esc 선택 해제
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnglishTestScreen;
