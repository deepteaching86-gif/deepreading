// Vision TEST AI Analysis Controller
// Handles AI-powered reading strategy analysis and report generation

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  AIAnalysisResult,
  GetVisionReportResponse,
  VisionTestError,
  VisionErrorCode
} from '../../types/vision.types';
import { generateAIAnalysis } from '../../services/vision/ai-analysis.service';
import { generateHeatmapData } from '../../services/vision/heatmap.service';

const prisma = new PrismaClient();

/**
 * POST /api/v1/vision/analysis/ai-analyze
 * Generate AI analysis from metrics
 */
export const aiAnalyze = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { visionSessionId } = req.body;

    // 1. Get vision session with metrics
    const visionSession = await prisma.visionTestSession.findUnique({
      where: { id: visionSessionId },
      include: {
        metrics: true,
        session: {
          include: {
            student: true,
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

    if (!visionSession.metrics) {
      throw new VisionTestError(
        VisionErrorCode.METRICS_CALCULATION_FAILED,
        'Metrics must be calculated before AI analysis',
        400
      );
    }

    // 2. Generate AI analysis
    const aiAnalysis: AIAnalysisResult = await generateAIAnalysis(
      visionSession.metrics,
      visionSession.session.student.grade,
      visionSession.session.result?.percentage.toNumber()
    );

    // 3. Generate heatmap data
    const heatmapData = await generateHeatmapData(visionSession.gazeData);

    // 4. Update vision session with AI analysis
    await prisma.visionTestSession.update({
      where: { id: visionSessionId },
      data: {
        aiAnalysis,
        readingStrategy: aiAnalysis.readingStrategy,
        heatmapData
      }
    });

    res.status(200).json({
      success: true,
      analysis: aiAnalysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/analysis/:sessionId/report
 * Get comprehensive Vision TEST report
 */
export const getVisionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const visionSession = await prisma.visionTestSession.findUnique({
      where: { sessionId },
      include: {
        metrics: true,
        session: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            template: true
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

    // Get vision config
    const visionConfig = visionSession.session.template.visionConfig as any;

    const response: GetVisionReportResponse = {
      visionSessionId: visionSession.id,
      studentName: visionSession.session.student.user.name,
      grade: visionSession.session.student.grade,
      testDate: visionSession.session.startedAt || visionSession.session.createdAt,
      calibrationScore: visionSession.calibrationScore || 0,
      metrics: visionSession.metrics as any,
      aiAnalysis: visionSession.aiAnalysis as AIAnalysisResult,
      heatmapData: visionSession.heatmapData as any,
      passages: visionConfig.passages,
      gazeReplayAvailable: visionSession.gazeData.length > 0
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
