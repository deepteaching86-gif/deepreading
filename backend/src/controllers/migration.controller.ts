import { Request, Response, NextFunction } from 'express';
import { PrismaClient, QuestionCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Run database migration for peer statistics
 * This endpoint should be protected and only called once during setup
 */
export const runPeerStatisticsMigration = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if peer_statistics table already has data
    const existingCount = await prisma.peerStatistics.count();

    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Peer statistics already exist',
        count: existingCount,
      });
    }

    console.log('🌱 Generating peer statistics simulation...');

    const categories: QuestionCategory[] = [
      'vocabulary',
      'reading',
      'grammar',
      'reasoning',
      'reading_motivation',
      'writing_motivation',
      'reading_environment',
      'reading_habit',
      'reading_preference',
    ];

    const GRADE_DIFFICULTY_BASELINE: Record<number, number> = {
      1: 85,
      2: 82,
      3: 78,
      4: 75,
      5: 72,
      6: 70,
      7: 68,
      8: 66,
      9: 64,
    };

    const CATEGORY_DIFFICULTY_MODIFIER: Record<string, number> = {
      vocabulary: 0,
      reading: -3,
      grammar: -5,
      reasoning: -7,
      reading_motivation: 10,
      writing_motivation: 10,
      reading_environment: 10,
      reading_habit: 10,
      reading_preference: 10,
    };

    const stdDeviation = 12;
    const sampleSize = 100;

    // Helper functions
    function normalRandom(mean: number, stdDev: number): number {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return z0 * stdDev + mean;
    }

    function generateSimulatedScores(
      mean: number,
      stdDev: number,
      sampleSize: number
    ): number[] {
      const scores: number[] = [];
      for (let i = 0; i < sampleSize; i++) {
        const score = normalRandom(mean, stdDev);
        scores.push(Math.max(0, Math.min(100, score)));
      }
      return scores;
    }

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

    function calculateStdDev(scores: number[], mean: number): number {
      const variance =
        scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
        scores.length;
      return Math.sqrt(variance);
    }

    // Generate and insert data
    let insertedCount = 0;

    for (let grade = 1; grade <= 9; grade++) {
      const baseline = GRADE_DIFFICULTY_BASELINE[grade];

      for (const category of categories) {
        const modifier = CATEGORY_DIFFICULTY_MODIFIER[category] || 0;
        const mean = baseline + modifier;

        // Generate simulated scores
        const scores = generateSimulatedScores(mean, stdDeviation, sampleSize);

        // Calculate statistics
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const stdDev = calculateStdDev(scores, avgScore);
        const percentiles = calculatePercentiles(scores);

        // Insert into database
        await prisma.peerStatistics.create({
          data: {
            grade,
            category,
            avgScore: avgScore.toFixed(2),
            avgPercentage: avgScore.toFixed(2),
            stdDeviation: stdDev.toFixed(2),
            sampleSize,
            simulatedSampleSize: sampleSize,
            percentileDistribution: percentiles,
          },
        });

        insertedCount++;
        console.log(
          `✓ Grade ${grade}, ${category}: avg=${avgScore.toFixed(2)}, stdDev=${stdDev.toFixed(2)}`
        );
      }
    }

    console.log(`\n✅ Peer statistics migration completed! (${insertedCount} records)`);

    res.json({
      success: true,
      message: 'Peer statistics migration completed successfully',
      inserted: insertedCount,
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    return next(error);
  }
};

/**
 * Check peer statistics status
 */
export const checkPeerStatisticsStatus = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await prisma.peerStatistics.count();

    if (count === 0) {
      return res.json({
        success: true,
        initialized: false,
        count: 0,
        message: 'Peer statistics not initialized. Call POST /api/v1/admin/migrate/peer-stats to initialize.',
      });
    }

    // Get sample data
    const sample = await prisma.peerStatistics.findMany({
      where: { grade: 5 },
      select: {
        category: true,
        avgScore: true,
        sampleSize: true,
        simulatedSampleSize: true,
      },
      take: 5,
    });

    res.json({
      success: true,
      initialized: true,
      count,
      sample,
    });
  } catch (error) {
    return next(error);
  }
};
