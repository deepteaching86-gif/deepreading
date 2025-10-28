/**
 * English Adaptive Test - Main Test Screen
 * =========================================
 *
 * Displays adaptive test items and handles user responses.
 * Based on PRD Section 4: UI/UX Specification
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: number;
  stem: string;
  passage?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  difficulty?: number;
}

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

export const EnglishTestScreen: React.FC<EnglishTestScreenProps> = ({
  currentItem,
  itemsCompleted,
  totalItems,
  stage,
  panel,
  currentTheta,
  standardError,
  onSubmitResponse,
  isSubmitting = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showPassage, setShowPassage] = useState(true);

  // Reset state when item changes
  useEffect(() => {
    setSelectedAnswer(null);
    setStartTime(Date.now());
    setShowPassage(true);
  }, [currentItem.id]);

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const responseTime = Date.now() - startTime;
    onSubmitResponse(selectedAnswer, responseTime);
  };

  const progress = (itemsCompleted / totalItems) * 100;

  // Stage labels
  const stageLabels = {
    1: '라우팅 단계',
    2: `${panel.toUpperCase()} 패널`,
    3: `${panel.toUpperCase()} 서브트랙`
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Progress */}
      <div className="bg-card shadow-sm sticky top-0 z-10 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                English Adaptive Test
              </h2>
              <p className="text-sm text-muted-foreground">
                {stageLabels[stage as keyof typeof stageLabels]} • 문항 {itemsCompleted + 1}/{totalItems}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {itemsCompleted}/{totalItems}
              </div>
              <div className="text-xs text-muted-foreground">완료</div>
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

          {/* Ability & Difficulty Visualization */}
          {(currentTheta !== null && currentTheta !== undefined) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between gap-4 text-sm"
            >
              {/* Ability Estimate */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">능력 추정치:</span>
                <motion.div
                  key={currentTheta}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <span className="font-semibold text-primary">θ = {currentTheta.toFixed(2)}</span>
                  {standardError && (
                    <span className="text-xs text-muted-foreground">(±{standardError.toFixed(2)})</span>
                  )}
                </motion.div>
              </div>

              {/* Item Difficulty */}
              {currentItem.difficulty !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">문항 난이도:</span>
                  <motion.div
                    key={currentItem.id}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1"
                  >
                    <span className="font-semibold text-foreground">
                      b = {currentItem.difficulty.toFixed(2)}
                    </span>
                    {/* Difficulty Comparison Indicator */}
                    {currentTheta !== null && (
                      <span className="text-lg">
                        {currentItem.difficulty > currentTheta + 0.5 ? '📈' :
                         currentItem.difficulty < currentTheta - 0.5 ? '📉' : '➡️'}
                      </span>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

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
              <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-foreground flex items-center">
                    <span className="text-primary mr-2">📖</span>
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
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex-1">
                  {currentItem.stem}
                </h3>
                {/* Source Badge */}
                {currentItem.source && (
                  <span className={`ml-3 mt-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                    currentItem.source === 'ai_generated'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {currentItem.source === 'ai_generated' ? '🤖 AI 생성' : '✏️ 수동'}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(currentItem.options).map(([key, value]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedAnswer(key)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${selectedAnswer === key
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                      }
                    `}
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
                  ${!selectedAnswer || isSubmitting
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
                  }
                  transition-all duration-200
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
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
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">
            💡 정답을 선택한 후 "다음 문제" 버튼을 클릭하세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnglishTestScreen;
