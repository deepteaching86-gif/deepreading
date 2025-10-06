import { PrismaClient, QuestionCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 또래 평균 통계 시뮬레이션
 * - 학년별, 영역별 평균 점수 생성
 * - 정규분포 기반 시뮬레이션 데이터
 * - 실제 학생 데이터 누적 시 자동 업데이트
 */

// 학년별 기본 난이도 (1-9학년)
const GRADE_DIFFICULTY_BASELINE = {
  1: 85, // 초1 - 쉬움
  2: 82,
  3: 78,
  4: 75,
  5: 72,
  6: 70, // 초6
  7: 68, // 중1
  8: 66,
  9: 64, // 중3 - 어려움
};

// 영역별 난이도 조정 계수
const CATEGORY_DIFFICULTY_MODIFIER = {
  vocabulary: 0, // 기준
  reading: -3, // 조금 더 어려움
  grammar: -5, // 더 어려움
  reasoning: -7, // 가장 어려움
  reading_motivation: +10, // 설문은 높게
  writing_motivation: +10,
  reading_environment: +10,
  reading_habit: +10,
  reading_preference: +10,
};

/**
 * 정규분포 랜덤 생성 (Box-Muller transform)
 */
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * 시뮬레이션된 학생 점수 생성
 */
function generateSimulatedScores(
  mean: number,
  stdDev: number,
  sampleSize: number
): number[] {
  const scores: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    const score = normalRandom(mean, stdDev);
    // 0-100 범위로 제한
    scores.push(Math.max(0, Math.min(100, score)));
  }
  return scores;
}

/**
 * 백분위 계산
 */
function calculatePercentiles(scores: number[]): Record<string, number> {
  const sorted = [...scores].sort((a, b) => a - b);
  const getPercentile = (p: number) => {
    const idx = Math.floor((p / 100) * sorted.length);
    return sorted[idx] || 0;
  };

  return {
    p10: Math.round(getPercentile(10)),
    p25: Math.round(getPercentile(25)),
    p50: Math.round(getPercentile(50)),
    p75: Math.round(getPercentile(75)),
    p90: Math.round(getPercentile(90)),
  };
}

/**
 * 또래 평균 통계 생성
 */
async function seedPeerStatistics() {
  console.log('🌱 Generating peer statistics simulation...');

  const categories = [
    'vocabulary',
    'reading',
    'grammar',
    'reasoning',
    'reading_motivation',
    'writing_motivation',
    'reading_environment',
    'reading_habit',
    'reading_preference',
  ] as QuestionCategory[];

  for (let grade = 1; grade <= 9; grade++) {
    const baselineScore = GRADE_DIFFICULTY_BASELINE[grade as keyof typeof GRADE_DIFFICULTY_BASELINE];

    for (const category of categories) {
      const modifier = CATEGORY_DIFFICULTY_MODIFIER[category as keyof typeof CATEGORY_DIFFICULTY_MODIFIER] || 0;
      const meanScore = baselineScore + modifier;

      // 표준편차 (학년이 높을수록 분산 증가)
      const stdDev = 10 + grade * 0.5;

      // 시뮬레이션 샘플 사이즈 (학년당 100명 가정)
      const simulatedSampleSize = 100;

      // 시뮬레이션 점수 생성
      const scores = generateSimulatedScores(meanScore, stdDev, simulatedSampleSize);

      // 통계 계산
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const percentiles = calculatePercentiles(scores);

      // DB에 저장
      await prisma.peerStatistics.upsert({
        where: {
          grade_category: {
            grade,
            category,
          },
        },
        update: {
          avgScore: avgScore.toFixed(2),
          avgPercentage: avgScore.toFixed(2),
          stdDeviation: stdDev.toFixed(2),
          sampleSize: simulatedSampleSize,
          simulatedSampleSize,
          percentileDistribution: percentiles,
        },
        create: {
          grade,
          category,
          avgScore: avgScore.toFixed(2),
          avgPercentage: avgScore.toFixed(2),
          stdDeviation: stdDev.toFixed(2),
          sampleSize: simulatedSampleSize,
          simulatedSampleSize,
          percentileDistribution: percentiles,
        },
      });

      console.log(
        `✅ Grade ${grade} - ${category}: avg=${avgScore.toFixed(1)}%, p50=${percentiles.p50}%`
      );
    }
  }

  console.log('✅ Peer statistics seeded successfully!');
}

seedPeerStatistics()
  .catch((e) => {
    console.error('Error seeding peer statistics:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
