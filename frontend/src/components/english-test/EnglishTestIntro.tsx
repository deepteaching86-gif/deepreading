/**
 * English Adaptive Test - Introduction Screen
 * ===========================================
 *
 * Displays test overview and starts the test session.
 * Based on PRD Section 4: UI/UX Specification
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { checkHealth } from '@/api/englishTestApi';

interface EnglishTestIntroProps {
  onStart: () => void;
  isLoading?: boolean;
}

export const EnglishTestIntro: React.FC<EnglishTestIntroProps> = ({
  onStart,
  isLoading = false
}) => {
  // 🔥 Wake up backend with retry logic (prevent cold start timeout)
  useEffect(() => {
    const wakeUpBackend = async () => {
      const maxRetries = 3;
      const retryDelays = [2000, 5000, 10000]; // 2s, 5s, 10s (exponential backoff)

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`⏳ [Attempt ${attempt + 1}/${maxRetries}] Waking up backend server...`);
          await checkHealth();
          console.log('✅ Backend server is ready');
          return; // Success - exit retry loop
        } catch (error) {
          const isLastAttempt = attempt === maxRetries - 1;
          if (isLastAttempt) {
            console.warn('⚠️  Backend wake-up failed after 3 attempts. Will retry on test start.', error);
          } else {
            const delay = retryDelays[attempt];
            console.log(`⏳ Retry in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    };

    wakeUpBackend();
  }, []);
  return (
    <div lang="en" role="main" aria-label="English Proficiency Test Introduction" className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-border"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            English Adaptive Test
          </h1>
          <p className="text-muted-foreground">
            무학년제 영어 능력 진단 평가
          </p>
        </div>

        {/* Test Information */}
        <div className="space-y-4 mb-8">
          <InfoCard
            icon="📝"
            title="총 문항 수"
            description="40문항 (난이도 적응형)"
          />
          <InfoCard
            icon="⏱️"
            title="소요 시간"
            description="약 30-40분"
          />
          <InfoCard
            icon="🎯"
            title="평가 영역"
            description="문법, 어휘, 독해"
          />
          <InfoCard
            icon="📊"
            title="결과 제공"
            description="10단계 숙련도 + Lexile/AR 점수"
          />
        </div>

        {/* Instructions */}
        <div className="bg-muted rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-3 flex items-center">
            <span className="text-primary mr-2">ℹ️</span>
            시험 안내
          </h2>
          <ul role="list" aria-label="Test instructions" className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>문제의 난이도는 답변에 따라 자동으로 조정됩니다</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>각 문항은 시간 제한이 없으니 신중히 답변하세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>한 번 제출한 답은 수정할 수 없습니다</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>모든 문항을 완료해야 정확한 결과를 받을 수 있습니다</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          disabled={isLoading}
          aria-label="Start English proficiency test"
          className={`
            w-full py-4 rounded-xl font-semibold text-lg
            ${isLoading
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
            }
            transition-all duration-200
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              시험 준비 중...
            </span>
          ) : (
            '시험 시작하기'
          )}
        </motion.button>

        {/* Privacy Notice */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          시험 결과는 개인정보 보호 정책에 따라 안전하게 저장됩니다
        </p>
      </motion.div>
    </div>
  );
};

// Info Card Component
interface InfoCardProps {
  icon: string;
  title: string;
  description: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, description }) => (
  <div className="flex items-center p-4 bg-muted rounded-lg">
    <span className="text-3xl mr-4">{icon}</span>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default EnglishTestIntro;
