// Vision TEST Metrics Calculation Controller
// Calculates 15 core metrics from gaze data

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CalculateMetricsRequest,
  GazePoint,
  VisionTestError,
  VisionErrorCode
} from '../../types/vision.types';
import { calculateMetricsFromGazeData } from '../../services/vision/metrics.service';

const prisma = new PrismaClient();

/**
 * POST /api/v1/vision/metrics/calculate
 * Calculate 15 core metrics from gaze data
 */
export const calculateMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { visionSessionId, correctAnswers, totalQuestions } = req.body as CalculateMetricsRequest;

    // 1. Verify VisionTestSession exists
    const visionSession = await prisma.visionTestSession.findUnique({
      where: { id: visionSessionId },
      include: {
        session: {
          include: {
            template: true,
            result: true
          }
        },
        gazeData: true
      }
    });

    if (!visionSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision session not found',
        404
      );
    }

    // 2. Check if gaze data exists
    if (visionSession.gazeData.length === 0) {
      throw new VisionTestError(
        VisionErrorCode.INVALID_GAZE_DATA,
        'No gaze data available for metrics calculation',
        400
      );
    }

    // 3. Get Vision config
    const visionConfig = visionSession.session.template.visionConfig as any;

    // 4. Aggregate all gaze points from chunks
    const allGazePoints: GazePoint[] = [];
    visionSession.gazeData.forEach(chunk => {
      const points = chunk.gazePoints as unknown as GazePoint[];
      allGazePoints.push(...points);
    });

    // 5. Get comprehension data (if available)
    let comprehensionAccuracy: number | undefined;
    if (visionSession.session.result) {
      comprehensionAccuracy = visionSession.session.result.percentage.toNumber();
    } else if (correctAnswers !== undefined && totalQuestions !== undefined) {
      comprehensionAccuracy = (correctAnswers / totalQuestions) * 100;
    }

    // 6. Calculate metrics using service
    const metrics = await calculateMetricsFromGazeData(
      allGazePoints,
      visionConfig,
      comprehensionAccuracy
    );

    // 7. Save metrics to database
    const savedMetrics = await prisma.visionMetrics.create({
      data: {
        visionSessionId,
        ...metrics,
        detailedAnalysis: metrics.detailedAnalysis as any,
        comparisonWithPeers: metrics.comparisonWithPeers as any
      }
    });

    res.status(200).json({
      success: true,
      metricsId: savedMetrics.id,
      metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/metrics/:sessionId
 * Get calculated metrics for a session
 */
export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const visionSession = await prisma.visionTestSession.findUnique({
      where: { sessionId },
      include: {
        metrics: true
      }
    });

    if (!visionSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision session not found',
        404
      );
    }

    if (!visionSession.metrics) {
      throw new VisionTestError(
        VisionErrorCode.METRICS_CALCULATION_FAILED,
        'Metrics not yet calculated for this session',
        404
      );
    }

    res.status(200).json({
      metricsId: visionSession.metrics.id,
      visionSessionId: visionSession.id,
      calculatedAt: visionSession.metrics.createdAt,
      metrics: {
        // A. Eye Movement Patterns
        averageSaccadeAmplitude: visionSession.metrics.averageSaccadeAmplitude,
        saccadeVariability: visionSession.metrics.saccadeVariability,
        averageSaccadeVelocity: visionSession.metrics.averageSaccadeVelocity,
        optimalLandingRate: visionSession.metrics.optimalLandingRate,
        returnSweepAccuracy: visionSession.metrics.returnSweepAccuracy,
        scanPathEfficiency: visionSession.metrics.scanPathEfficiency,

        // B. Fixation Behavior
        averageFixationDuration: visionSession.metrics.averageFixationDuration,
        fixationsPerWord: visionSession.metrics.fixationsPerWord,
        regressionRate: visionSession.metrics.regressionRate,
        vocabularyGapScore: visionSession.metrics.vocabularyGapScore,

        // C. Reading Speed & Rhythm
        wordsPerMinute: visionSession.metrics.wordsPerMinute,
        rhythmRegularity: visionSession.metrics.rhythmRegularity,
        staminaScore: visionSession.metrics.staminaScore,

        // D. Comprehension & Cognitive
        gazeComprehensionCorrelation: visionSession.metrics.gazeComprehensionCorrelation,
        cognitiveLoadIndex: visionSession.metrics.cognitiveLoadIndex,

        // Overall
        overallEyeTrackingScore: visionSession.metrics.overallEyeTrackingScore,

        // Additional
        detailedAnalysis: visionSession.metrics.detailedAnalysis,
        comparisonWithPeers: visionSession.metrics.comparisonWithPeers
      }
    });
  } catch (error) {
    next(error);
  }
};
