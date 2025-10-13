// Vision TEST Admin Controller
// Admin-only features: session management, gaze replay, calibration adjustment

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  GetGazeReplayResponse,
  AdjustCalibrationRequest,
  AdjustCalibrationResponse,
  GazeChunk,
  VisionTestError,
  VisionErrorCode
} from '../../types/vision.types';

const prisma = new PrismaClient();

/**
 * GET /api/v1/vision/admin/sessions
 * List all Vision TEST sessions with filters
 */
export const listVisionSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade, studentId, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (grade) {
      where.session = { student: { grade: parseInt(grade as string) } };
    }
    if (studentId) {
      where.session = { ...where.session, studentId: studentId as string };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const sessions = await prisma.visionTestSession.findMany({
      where,
      include: {
        session: {
          include: {
            student: { include: { user: true } },
            template: true
          }
        },
        metrics: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.visionTestSession.count({ where });

    res.status(200).json({
      sessions: sessions.map(s => ({
        visionSessionId: s.id,
        sessionId: s.sessionId,
        studentName: s.session.student.user.name,
        grade: s.session.student.grade,
        templateTitle: s.session.template.title,
        calibrationScore: s.calibrationScore,
        status: s.session.status,
        testDate: s.session.startedAt || s.session.createdAt,
        metricsCalculated: !!s.metrics,
        overallScore: s.metrics?.overallEyeTrackingScore
      })),
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/admin/session/:sessionId/gaze-replay
 * Get gaze data for replay visualization
 */
export const getGazeReplay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const visionSession = await prisma.visionTestSession.findUnique({
      where: { sessionId },
      include: {
        session: { include: { template: true } },
        gazeData: { orderBy: { startTime: 'asc' } }
      }
    });

    if (!visionSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision session not found',
        404
      );
    }

    const visionConfig = visionSession.session.template.visionConfig as any;

    const gazeChunks: GazeChunk[] = visionSession.gazeData.map(chunk => ({
      passageId: chunk.passageId,
      gazePoints: chunk.gazePoints as any,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      totalPoints: chunk.totalPoints
    }));

    const totalDuration = visionSession.gazeData.length > 0
      ? (visionSession.gazeData[visionSession.gazeData.length - 1].endTime.getTime() -
         visionSession.gazeData[0].startTime.getTime()) / 1000
      : 0;

    const totalGazePoints = visionSession.gazeData.reduce(
      (sum, chunk) => sum + chunk.totalPoints,
      0
    );

    const response: GetGazeReplayResponse = {
      visionSessionId: visionSession.id,
      passages: visionConfig.passages,
      gazeData: gazeChunks,
      totalDuration,
      totalGazePoints
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/admin/session/:sessionId/adjust-calibration
 * Manually adjust calibration for a session
 */
export const adjustCalibration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { visionSessionId, adminId, adjustments, notes } = req.body as AdjustCalibrationRequest;

    // Verify vision session
    const visionSession = await prisma.visionTestSession.findUnique({
      where: { id: visionSessionId }
    });

    if (!visionSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision session not found',
        404
      );
    }

    // Create adjustment record
    const adjustment = await prisma.visionCalibrationAdjustment.create({
      data: {
        visionSessionId,
        adminId,
        adjustments: adjustments as any,
        notes
      }
    });

    res.status(200).json({
      adjustmentId: adjustment.id,
      result: {
        adjustmentId: adjustment.id,
        originalAccuracy: visionSession.calibrationScore || 0,
        improvedAccuracy: visionSession.calibrationScore || 0,
        improvementScore: 0,
        adjustments,
        notes
      } as any,
      updatedGazeData: false
    } as AdjustCalibrationResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/admin/session/:sessionId/heatmap
 * Get attention heatmap data
 */
export const getHeatmapData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const visionSession = await prisma.visionTestSession.findUnique({
      where: { sessionId }
    });

    if (!visionSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision session not found',
        404
      );
    }

    res.status(200).json({
      visionSessionId: visionSession.id,
      heatmapData: visionSession.heatmapData || []
    });
  } catch (error) {
    next(error);
  }
};
