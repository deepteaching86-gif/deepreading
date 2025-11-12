import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type alias for QuestionCategory
type QuestionCategory = 'vocabulary' | 'reading' | 'grammar' | 'reasoning' | 'reading_motivation' | 'writing_motivation' | 'reading_environment' | 'reading_habit' | 'reading_preference' | 'digital_literacy' | 'critical_thinking' | 'reading_attitude';

/**
 * 실제 학생 데이터로 또래 평균 업데이트
 */
export async function updatePeerStatistics(
  grade: number,
  category: QuestionCategory,
  newScore: number
): Promise<void> {
  const existing = await prisma.peerStatistics.findUnique({
    where: { grade_category: { grade, category } },
  });

  if (!existing) {
    // 첫 실제 데이터인 경우 - 시뮬레이션 데이터로 초기화되어 있어야 함
    console.warn(`No peer statistics found for grade ${grade}, category ${category}`);
    return;
  }

  // 기존 평균과 새로운 점수로 가중 평균 계산
  const simulatedWeight = existing.simulatedSampleSize;
  const realWeight = existing.sampleSize - existing.simulatedSampleSize + 1; // 새로운 실제 데이터 1개 추가

  const totalWeight = simulatedWeight + realWeight;
  const simulatedAvg = parseFloat(existing.avgScore.toString());

  // 가중 평균: (시뮬 평균 * 시뮬 샘플수 + 실제 점수) / (총 샘플수)
  const newAvg =
    (simulatedAvg * simulatedWeight + newScore * realWeight) / totalWeight;

  // 표준편차 업데이트 (근사값)
  const oldStdDev = parseFloat(existing.stdDeviation.toString());
  const newStdDev = Math.sqrt(
    (oldStdDev * oldStdDev * (existing.sampleSize - 1) +
      Math.pow(newScore - newAvg, 2)) /
      existing.sampleSize
  );

  await prisma.peerStatistics.update({
    where: { grade_category: { grade, category } },
    data: {
      avgScore: newAvg.toFixed(2),
      avgPercentage: newAvg.toFixed(2),
      stdDeviation: newStdDev.toFixed(2),
      sampleSize: existing.sampleSize + 1,
      // simulatedSampleSize는 유지 (실제 데이터 비중 추적용)
    },
  });

  console.log(
    `Updated peer stats: grade=${grade}, category=${category}, newAvg=${newAvg.toFixed(1)}%`
  );
}

/**
 * 영역별 점수 계산 후 또래 평균 업데이트
 */
export async function updatePeerStatisticsFromResult(
  studentGrade: number,
  sessionId: string
): Promise<void> {
  // 세션의 모든 답변 가져오기
  const answers = await prisma.answer.findMany({
    where: { sessionId },
    include: { question: true },
  });

  // 영역별 점수 집계
  const categoryScores: Record<string, { total: number; max: number }> = {};

  for (const answer of answers) {
    const category = answer.question.category;
    if (!categoryScores[category]) {
      categoryScores[category] = { total: 0, max: 0 };
    }
    categoryScores[category].total += answer.pointsEarned;
    categoryScores[category].max += answer.question.points;
  }

  // 각 영역별로 또래 평균 업데이트
  for (const [category, scores] of Object.entries(categoryScores)) {
    if (scores.max > 0) {
      const percentage = (scores.total / scores.max) * 100;
      await updatePeerStatistics(
        studentGrade,
        category as QuestionCategory,
        percentage
      );
    }
  }
}

/**
 * 또래 평균 데이터 조회
 */
export async function getPeerStatistics(grade: number) {
  return await prisma.peerStatistics.findMany({
    where: { grade },
    orderBy: { category: 'asc' },
  });
}

/**
 * 학생 백분위 계산
 */
export async function calculateStudentPercentile(
  grade: number,
  category: QuestionCategory,
  studentScore: number
): Promise<number> {
  // Use raw query to avoid TEXT vs enum comparison error
  const results: any[] = await prisma.$queryRaw`
    SELECT * FROM peer_statistics
    WHERE grade = ${grade} AND category = ${category}::text
    LIMIT 1
  `;

  const peerStats = results.length > 0 ? results[0] : null;

  if (!peerStats) return 50; // 기본값

  const mean = parseFloat(peerStats.avg_score.toString());
  const stdDev = parseFloat(peerStats.std_deviation.toString());

  // Z-score 계산
  const zScore = (studentScore - mean) / stdDev;

  // Z-score를 백분위로 변환 (근사 공식)
  const percentile = normalCDF(zScore) * 100;

  return Math.max(1, Math.min(99, Math.round(percentile)));
}

/**
 * 정규분포 누적 분포 함수 (CDF) 근사
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d =
    0.3989423 *
    Math.exp((-z * z) / 2) *
    ((((1.330274429 * t - 1.821255978) * t + 1.781477937) * t -
      0.356563782) *
      t +
      0.319381530);
  return z > 0 ? 1 - d : d;
}
