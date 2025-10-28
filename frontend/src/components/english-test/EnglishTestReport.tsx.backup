/**
 * English Adaptive Test - Final Report Screen
 * ===========================================
 *
 * Displays comprehensive test results with visualizations.
 * Based on PRD Section 4.4: Report Screen
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface TestResults {
  sessionId: number;
  finalTheta: number;
  standardError: number;
  proficiencyLevel: number;
  lexileScore?: number;
  arLevel?: number;
  vocabularySize?: number;
  vocabularyBands?: Record<string, number>;
  totalItems: number;
  correctCount: number;
  accuracyPercentage: number;
  completedAt: string;
}

interface EnglishTestReportProps {
  results: TestResults;
  onReturnHome: () => void;
}

export const EnglishTestReport: React.FC<EnglishTestReportProps> = ({
  results,
  onReturnHome
}) => {
  // Proficiency level descriptions
  const proficiencyDescriptions = {
    1: { label: '기초 단계 1', color: 'red', description: '알파벳과 기본 단어 학습 필요' },
    2: { label: '기초 단계 2', color: 'red', description: '간단한 문장 이해 연습 필요' },
    3: { label: '초급 1', color: 'orange', description: '일상 대화 기본 표현 학습 중' },
    4: { label: '초급 2', color: 'orange', description: '기본 문법 구조 이해 중' },
    5: { label: '중급 1', color: 'yellow', description: '일반적인 주제 이해 가능' },
    6: { label: '중급 2', color: 'yellow', description: '다양한 맥락에서 의사소통 가능' },
    7: { label: '중상급 1', color: 'green', description: '복잡한 텍스트 이해 가능' },
    8: { label: '중상급 2', color: 'green', description: '전문적인 내용 이해 가능' },
    9: { label: '고급 1', color: 'blue', description: '학술적 텍스트 이해 가능' },
    10: { label: '고급 2', color: 'blue', description: '원어민 수준의 이해력' }
  };

  const profInfo = proficiencyDescriptions[results.proficiencyLevel as keyof typeof proficiencyDescriptions];

  // Color mapping
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center"
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            테스트 완료!
          </h1>
          <p className="text-gray-600">
            영어 능력 진단 결과를 확인하세요
          </p>
        </motion.div>

        {/* Main Results Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          {/* Proficiency Level */}
          <div className="text-center mb-8">
            <div className={`inline-block px-6 py-3 rounded-full bg-gradient-to-r ${colorClasses[profInfo.color as keyof typeof colorClasses]} text-white font-bold text-2xl mb-3`}>
              {profInfo.label}
            </div>
            <p className="text-gray-600 text-lg">{profInfo.description}</p>
            <div className="mt-4 text-sm text-gray-500">
              숙련도 점수: {results.finalTheta.toFixed(2)} (SE: {results.standardError.toFixed(2)})
            </div>
          </div>

          {/* Level Visual */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">숙련도 레벨</span>
              <span className="text-sm text-gray-600">Level {results.proficiencyLevel}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${colorClasses[profInfo.color as keyof typeof colorClasses]}`}
                initial={{ width: 0 }}
                animate={{ width: `${results.proficiencyLevel * 10}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="정답률"
              value={`${results.accuracyPercentage}%`}
              subvalue={`${results.correctCount}/${results.totalItems}`}
              icon="✅"
            />
            {results.lexileScore && (
              <MetricCard
                label="Lexile"
                value={`${results.lexileScore}L`}
                subvalue="독서 지수"
                icon="📚"
              />
            )}
            {results.arLevel && (
              <MetricCard
                label="AR Level"
                value={results.arLevel.toFixed(1)}
                subvalue="학년 수준"
                icon="📖"
              />
            )}
            {results.vocabularySize && (
              <MetricCard
                label="어휘 크기"
                value={results.vocabularySize.toLocaleString()}
                subvalue="단어"
                icon="💬"
              />
            )}
          </div>

          {/* Vocabulary Bands (if available) */}
          {results.vocabularyBands && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-blue-500 mr-2">📊</span>
                어휘 밴드별 분석
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(results.vocabularyBands).map(([band, count]) => (
                  <div key={band} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">{band}</div>
                    <div className="text-lg font-bold text-gray-800">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center text-xl">
            <span className="text-blue-500 mr-2">💡</span>
            학습 제안
          </h3>
          <div className="space-y-3">
            {getRecommendations(results.proficiencyLevel).map((rec, idx) => (
              <div key={idx} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <p className="text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnHome}
            className="flex-1 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all"
          >
            홈으로 돌아가기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.print()}
            className="px-6 py-4 rounded-xl font-semibold text-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all"
          >
            결과 인쇄
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subvalue, icon }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {subvalue && <div className="text-xs text-gray-500 mt-1">{subvalue}</div>}
  </div>
);

// Get recommendations based on proficiency level
const getRecommendations = (level: number): string[] => {
  if (level <= 2) {
    return [
      '기초 알파벳과 파닉스 학습에 집중하세요',
      '간단한 그림책으로 읽기 연습을 시작하세요',
      '일상 생활 기본 단어부터 차근차근 익히세요'
    ];
  } else if (level <= 4) {
    return [
      '기본 문법 패턴(현재시제, 과거시제)을 학습하세요',
      '초급 리더스북으로 독해 연습을 하세요',
      '일상 대화 표현을 반복해서 연습하세요'
    ];
  } else if (level <= 6) {
    return [
      '다양한 주제의 글을 읽고 요약 연습을 하세요',
      '중급 문법(시제, 조동사, 관계사)을 심화 학습하세요',
      '영어 뉴스나 팟캐스트로 듣기 연습을 병행하세요'
    ];
  } else if (level <= 8) {
    return [
      '학술적 텍스트나 소설을 읽으며 고급 어휘를 익히세요',
      '에세이 작성 연습으로 표현력을 향상시키세요',
      '토론이나 프레젠테이션으로 실전 영어를 연습하세요'
    ];
  } else {
    return [
      '전문 분야 영어(비즈니스, 학술)를 학습하세요',
      '원서나 영자 신문을 꾸준히 읽으세요',
      '원어민과의 토론이나 글쓰기로 표현력을 더욱 발전시키세요'
    ];
  }
};

export default EnglishTestReport;
