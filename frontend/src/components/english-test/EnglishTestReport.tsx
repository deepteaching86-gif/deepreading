/**
 * English Adaptive Test - Final Report Screen
 * ===========================================
 *
 * Displays comprehensive test results with domain-specific analysis.
 * Based on PRD Section 4.4: Report Screen
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DomainScore {
  correct: number;
  total: number;
  percentage: number;
}

interface LexileDetails {
  score: number;
  confidence_low: number;
  confidence_high: number;
  grade_context: string;
  is_estimated: boolean;
}

export interface TestResults {
  sessionId: number;
  finalTheta: number;
  standardError: number;
  proficiencyLevel: number;
  lexileScore?: number;
  lexileDetails?: LexileDetails;
  arLevel?: number;
  vocabularySize?: number;
  vocabularyBands?: {
    bands: Record<string, { correct: number; total: number; percentage: number }>;
    pseudowords: { correct: number; total: number; accuracy: number };
    confidence: string;
  };
  domainScores?: {
    grammar: DomainScore;
    vocabulary: DomainScore;
    reading: DomainScore;
  };
  totalItems: number;
  correctCount: number;
  accuracyPercentage: number;
  completedAt: string;
  scoreDisclaimer?: string;
}

interface EnglishTestReportProps {
  results: TestResults;
  onReturnHome: () => void;
}

export const EnglishTestReport: React.FC<EnglishTestReportProps> = ({
  results,
  onReturnHome
}) => {
  const navigate = useNavigate();
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

  const colorClasses = {
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600'
  };

  const domainLabels: Record<string, { label: string; icon: string }> = {
    grammar: { label: '문법', icon: '📝' },
    vocabulary: { label: '어휘', icon: '📚' },
    reading: { label: '독해', icon: '📖' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br bg-white py-12 px-6">
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
            className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full mx-auto mb-4 flex items-center justify-center"
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
                subvalue={results.lexileDetails?.grade_context || '독서 지수'}
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

          {/* Lexile Confidence Range */}
          {results.lexileDetails && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 font-medium text-sm">Lexile 추정 범위</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{results.lexileDetails.confidence_low}L</span>
                <div className="flex-1 bg-blue-200 rounded-full h-3 relative">
                  <motion.div
                    className="absolute bg-blue-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((results.lexileDetails.score - results.lexileDetails.confidence_low) / (results.lexileDetails.confidence_high - results.lexileDetails.confidence_low)) * 100}%`,
                      left: '0%'
                    }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-700 rounded-full top-0"
                    style={{
                      left: `${((results.lexileDetails.score - results.lexileDetails.confidence_low) / (results.lexileDetails.confidence_high - results.lexileDetails.confidence_low)) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">{results.lexileDetails.confidence_high}L</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {results.lexileDetails.grade_context} 수준 (약 {results.lexileDetails.score}L)
              </p>
            </div>
          )}
        </motion.div>

        {/* Domain-Specific Analysis */}
        {results.domainScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-6"
          >
            <h3 className="font-semibold text-gray-800 mb-6 flex items-center text-xl">
              <span className="text-purple-600 mr-2">📊</span>
              영역별 분석
            </h3>

            <div className="space-y-4">
              {(Object.entries(results.domainScores) as [string, DomainScore][]).map(([domain, score]) => {
                const info = domainLabels[domain];
                if (!info || score.total === 0) return null;

                const barColor = score.percentage >= 70
                  ? 'bg-green-500'
                  : score.percentage >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500';

                const strengthLabel = score.percentage >= 70
                  ? '강점'
                  : score.percentage >= 40
                    ? '보통'
                    : '보완 필요';

                return (
                  <div key={domain}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="font-medium text-gray-700">{info.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          score.percentage >= 70 ? 'bg-green-100 text-green-700' :
                          score.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {strengthLabel}
                        </span>
                        <span className="text-sm text-gray-600">
                          {score.correct}/{score.total} ({score.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full ${barColor} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${score.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Vocabulary Bands (if available) */}
        {results.vocabularyBands && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <span className="text-purple-600 mr-2">📊</span>
                어휘 밴드별 분석
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                results.vocabularyBands.confidence === 'High'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                신뢰도: {results.vocabularyBands.confidence === 'High' ? '높음' : '낮음'}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(results.vocabularyBands.bands).map(([band, stats]) => (
                <div key={band} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">{band}</div>
                  <div className="text-lg font-bold text-gray-800">{stats.percentage}%</div>
                  <div className="text-xs text-gray-500">{stats.correct}/{stats.total} 정답</div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    가짜 단어 탐지 정확도
                  </div>
                  <div className="text-xs text-gray-600">
                    과대평가 방지를 위한 검증
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">
                    {results.vocabularyBands.pseudowords.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {results.vocabularyBands.pseudowords.correct}/{results.vocabularyBands.pseudowords.total}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center text-xl">
            <span className="text-purple-600 mr-2">💡</span>
            맞춤 학습 제안
          </h3>
          <div className="space-y-3">
            {getRecommendations(results.proficiencyLevel, results.domainScores).map((rec, idx) => (
              <div key={idx} className="flex items-start p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-600 mr-3 mt-1">•</span>
                <p className="text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Score Disclaimer */}
        {(results.scoreDisclaimer || results.lexileDetails?.is_estimated) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
          >
            <p className="text-sm text-amber-800">
              ⚠️ {results.scoreDisclaimer || '본 점수는 IRT 능력 추정치 기반 통계 추정값이며, 공식 Lexile/AR 평가 결과가 아닙니다.'}
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnHome}
            className="flex-1 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:shadow-lg transition-all"
          >
            홈으로 돌아가기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/test/english/growth')}
            className="px-6 py-4 rounded-xl font-semibold text-lg border-2 border-purple-600 text-purple-700 hover:bg-purple-50 transition-all"
          >
            성장 추이 보기
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.print()}
            className="px-6 py-4 rounded-xl font-semibold text-lg border-2 border-gray-400 text-gray-600 hover:bg-gray-50 transition-all"
          >
            인쇄
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

// Domain-aware recommendation engine
const getRecommendations = (
  level: number,
  domainScores?: { grammar: DomainScore; vocabulary: DomainScore; reading: DomainScore }
): string[] => {
  const recommendations: string[] = [];

  // Domain-specific recommendations (priority: weakest domain first)
  if (domainScores) {
    const domains = [
      { key: 'grammar', ...domainScores.grammar },
      { key: 'vocabulary', ...domainScores.vocabulary },
      { key: 'reading', ...domainScores.reading },
    ].sort((a, b) => a.percentage - b.percentage);

    for (const domain of domains) {
      if (domain.total === 0) continue;

      if (domain.key === 'grammar') {
        if (domain.percentage < 40) {
          recommendations.push('문법이 가장 보완이 필요합니다. 기본 시제(현재, 과거, 미래)와 문장 구조부터 체계적으로 학습하세요.');
        } else if (domain.percentage < 70) {
          recommendations.push('문법 실력을 높이려면 관계사, 가정법, 분사구문 등 중급 문법을 연습하세요.');
        } else {
          recommendations.push('문법은 강점입니다! 고급 문법(도치, 강조구문, 혼합가정법)으로 도전하세요.');
        }
      } else if (domain.key === 'vocabulary') {
        if (domain.percentage < 40) {
          recommendations.push('어휘력 강화가 시급합니다. 빈도 높은 일상 단어 1000개부터 익히고, 플래시카드 앱을 활용하세요.');
        } else if (domain.percentage < 70) {
          recommendations.push('어휘력을 넓히려면 주제별(과학, 사회, 문학) 어휘를 문맥 속에서 학습하세요.');
        } else {
          recommendations.push('어휘력이 우수합니다! 학술 어휘(Academic Word List)나 전문 분야 용어로 확장하세요.');
        }
      } else if (domain.key === 'reading') {
        if (domain.percentage < 40) {
          recommendations.push('독해력 향상을 위해 짧은 글부터 읽고 주제문(main idea) 찾기 연습을 시작하세요.');
        } else if (domain.percentage < 70) {
          recommendations.push('독해력을 키우려면 다양한 장르의 글을 읽고 요약, 추론, 비판적 사고 연습을 하세요.');
        } else {
          recommendations.push('독해력이 뛰어납니다! 학술 논문이나 원서 읽기로 심화 독해에 도전하세요.');
        }
      }
    }
  }

  // Level-based general recommendations (fallback or supplement)
  if (level <= 2) {
    recommendations.push('매일 10분씩 영어 동화책이나 그림책을 소리 내어 읽어보세요.');
  } else if (level <= 4) {
    recommendations.push('영어 일기를 간단한 문장으로 매일 3줄씩 써보세요.');
  } else if (level <= 6) {
    recommendations.push('영어 뉴스나 팟캐스트를 듣고 핵심 내용을 요약하는 연습을 하세요.');
  } else if (level <= 8) {
    recommendations.push('관심 분야의 영어 원서나 TED 강연으로 학습 범위를 넓혀보세요.');
  } else {
    recommendations.push('영어 토론, 에세이 작성, 프레젠테이션으로 실전 표현력을 다듬으세요.');
  }

  return recommendations;
};

export default EnglishTestReport;
