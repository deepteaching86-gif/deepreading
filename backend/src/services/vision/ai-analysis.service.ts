// AI Analysis Service
// Generate reading strategy analysis based on metrics

import { AIAnalysisResult } from '../../types/vision.types';

export async function generateAIAnalysis(
  metrics: any,
  grade: number,
  _comprehensionAccuracy?: number
): Promise<AIAnalysisResult> {
  // Determine reading strategy based on metrics
  let readingStrategy: 'fluent' | 'struggling' | 'developing' | 'advanced';
  const overallScore = metrics.overallEyeTrackingScore;

  if (overallScore >= 85) {
    readingStrategy = 'advanced';
  } else if (overallScore >= 70) {
    readingStrategy = 'fluent';
  } else if (overallScore >= 50) {
    readingStrategy = 'developing';
  } else {
    readingStrategy = 'struggling';
  }

  // Identify strengths
  const strengths: string[] = [];
  if (metrics.wordsPerMinute > 120) strengths.push('빠른 읽기 속도');
  if (metrics.regressionRate < 10) strengths.push('적은 역행 횟수');
  if (metrics.scanPathEfficiency > 0.7) strengths.push('효율적인 시선 이동');
  if (metrics.rhythmRegularity > 0.7) strengths.push('안정적인 읽기 리듬');

  // Identify weaknesses
  const weaknesses: string[] = [];
  if (metrics.wordsPerMinute < 80) weaknesses.push('느린 읽기 속도');
  if (metrics.regressionRate > 20) weaknesses.push('잦은 역행');
  if (metrics.fixationsPerWord > 1.5) weaknesses.push('단어당 응시 횟수 과다');
  if (metrics.vocabularyGapScore > 50) weaknesses.push('어휘력 부족 징후');

  // Generate recommendations
  const recommendations: string[] = [];
  if (weaknesses.includes('느린 읽기 속도')) {
    recommendations.push('매일 10-15분 소리내어 읽기 연습');
  }
  if (weaknesses.includes('잦은 역행')) {
    recommendations.push('손가락으로 줄을 따라가며 읽기 연습');
  }
  if (weaknesses.includes('어휘력 부족 징후')) {
    recommendations.push('모르는 단어 메모하고 사전 찾기');
  }

  // Generate narrative
  const narrative = generateNarrative(readingStrategy, metrics, grade);

  return {
    readingStrategy,
    strengths,
    weaknesses,
    recommendations,
    confidenceScore: 0.85,
    narrative,
    detectedPatterns: []
  };
}

function generateNarrative(
  strategy: string,
  _metrics: any,
  grade: number
): string {
  const templates = {
    advanced: `${grade}학년 평균보다 우수한 읽기 능력을 보입니다. 효율적인 시선 이동과 안정적인 읽기 리듬이 관찰됩니다.`,
    fluent: `${grade}학년 평균 수준의 양호한 읽기 능력을 보입니다. 전반적으로 안정적인 읽기 패턴이 관찰됩니다.`,
    developing: `${grade}학년 평균에 약간 미치지 못하는 읽기 능력을 보입니다. 꾸준한 연습이 필요합니다.`,
    struggling: `${grade}학년 평균보다 낮은 읽기 능력을 보입니다. 집중적인 지도가 필요합니다.`
  };

  return templates[strategy as keyof typeof templates] || templates.developing;
}
