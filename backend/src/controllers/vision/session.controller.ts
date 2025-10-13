// Vision TEST Session Management Controller
// Handles Vision TEST session lifecycle and gaze data storage

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  StartVisionSessionRequest,
  StartVisionSessionResponse,
  SaveGazeDataRequest,
  SubmitVisionSessionRequest,
  SubmitVisionSessionResponse,
  VisionConfig,
  VisionTestError,
  VisionErrorCode
} from '../../types/vision.types';

const prisma = new PrismaClient();

/**
 * POST /api/v1/vision/session/start
 * Start a new Vision TEST session
 */
export const startVisionSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, calibrationId } = req.body as StartVisionSessionRequest;

    // 1. Verify TestSession exists
    const testSession = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        template: true,
        student: true
      }
    });

    if (!testSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Test session not found',
        404
      );
    }

    // 2. Verify template is Vision type
    if (testSession.template.templateType !== 'vision') {
      throw new VisionTestError(
        VisionErrorCode.INVALID_GAZE_DATA,
        'Template is not a Vision TEST template',
        400
      );
    }

    // 3. Verify calibration exists and is valid
    const calibration = await prisma.visionCalibration.findUnique({
      where: { id: calibrationId }
    });

    if (!calibration) {
      throw new VisionTestError(
        VisionErrorCode.CALIBRATION_NOT_FOUND,
        'Calibration not found',
        404
      );
    }

    // Check if calibration expired
    if (calibration.expiresAt < new Date()) {
      throw new VisionTestError(
        VisionErrorCode.CALIBRATION_EXPIRED,
        'Calibration has expired. Please recalibrate.',
        400
      );
    }

    // Check if calibration belongs to same user
    if (calibration.userId !== testSession.student.userId) {
      throw new VisionTestError(
        VisionErrorCode.CALIBRATION_NOT_FOUND,
        'Calibration does not belong to this user',
        403
      );
    }

    // 4. Check if VisionTestSession already exists
    const existingVisionSession = await prisma.visionTestSession.findUnique({
      where: { sessionId }
    });

    if (existingVisionSession) {
      throw new VisionTestError(
        VisionErrorCode.INVALID_GAZE_DATA,
        'Vision session already started for this test session',
        400
      );
    }

    // 5. Create VisionTestSession
    const visionSession = await prisma.visionTestSession.create({
      data: {
        sessionId,
        calibrationId,
        calibrationScore: calibration.overallAccuracy
      }
    });

    // 6. Get Vision config from template
    const visionConfig = testSession.template.visionConfig as unknown as VisionConfig;

    // 7. Update TestSession to in_progress
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'in_progress',
        startedAt: new Date()
      }
    });

    const response: StartVisionSessionResponse = {
      visionSessionId: visionSession.id,
      passages: visionConfig.passages,
      calibrationScore: calibration.overallAccuracy
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/session/save-gaze-data
 * Save a chunk of gaze data (real-time chunked storage)
 */
export const saveGazeData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { visionSessionId, gazeChunk } = req.body as SaveGazeDataRequest;

    // 1. Verify VisionTestSession exists
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

    // 2. Validate gaze chunk data
    if (!gazeChunk.gazePoints || gazeChunk.gazePoints.length === 0) {
      throw new VisionTestError(
        VisionErrorCode.INVALID_GAZE_DATA,
        'Gaze chunk contains no data points',
        400
      );
    }

    // 3. Filter out blinks (low confidence)
    const validGazePoints = gazeChunk.gazePoints.filter(point => {
      return point.type !== 'blink' && point.confidence >= 0.5;
    });

    if (validGazePoints.length === 0) {
      // All points were blinks or low confidence - skip saving
      res.status(200).json({
        success: true,
        saved: false,
        message: 'No valid gaze points (all blinks or low confidence)',
        totalPoints: 0
      });
      return;
    }

    // 4. Save gaze data chunk to database
    const gazeData = await prisma.visionGazeData.create({
      data: {
        visionSessionId,
        passageId: gazeChunk.passageId,
        gazePoints: validGazePoints as any,
        totalPoints: validGazePoints.length,
        startTime: gazeChunk.startTime,
        endTime: gazeChunk.endTime
      }
    });

    res.status(200).json({
      success: true,
      saved: true,
      gazeDataId: gazeData.id,
      totalPoints: validGazePoints.length,
      filteredBlinks: gazeChunk.gazePoints.length - validGazePoints.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/session/submit
 * Submit final gaze data and complete session
 */
export const submitVisionSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { visionSessionId, finalGazeData } = req.body as SubmitVisionSessionRequest;

    // 1. Verify VisionTestSession exists
    const visionSession = await prisma.visionTestSession.findUnique({
      where: { id: visionSessionId },
      include: {
        session: true
      }
    });

    if (!visionSession) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision session not found',
        404
      );
    }

    // 2. Save final gaze data if provided
    if (finalGazeData && finalGazeData.gazePoints.length > 0) {
      const validGazePoints = finalGazeData.gazePoints.filter(point => {
        return point.type !== 'blink' && point.confidence >= 0.5;
      });

      if (validGazePoints.length > 0) {
        await prisma.visionGazeData.create({
          data: {
            visionSessionId,
            passageId: finalGazeData.passageId,
            gazePoints: validGazePoints as any,
            totalPoints: validGazePoints.length,
            startTime: finalGazeData.startTime,
            endTime: finalGazeData.endTime
          }
        });
      }
    }

    // 3. Check if all gaze data has been saved
    const gazeDataCount = await prisma.visionGazeData.count({
      where: { visionSessionId }
    });

    if (gazeDataCount === 0) {
      throw new VisionTestError(
        VisionErrorCode.INVALID_GAZE_DATA,
        'No gaze data recorded for this session',
        400
      );
    }

    // 4. Update VisionTestSession
    await prisma.visionTestSession.update({
      where: { id: visionSessionId },
      data: {
        updatedAt: new Date()
      }
    });

    // 5. Update TestSession to completed
    await prisma.testSession.update({
      where: { id: visionSession.sessionId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // 6. Schedule metrics calculation (will be done after answers are submitted)
    // Note: Metrics calculation happens after test grading in the regular flow

    const response: SubmitVisionSessionResponse = {
      success: true,
      metricsCalculated: false,
      aiAnalysisScheduled: false
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/session/:sessionId
 * Get Vision TEST session details
 */
export const getVisionSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const visionSession = await prisma.visionTestSession.findUnique({
      where: { sessionId },
      include: {
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
        calibration: true,
        gazeData: true,
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

    // Get total gaze points
    const totalGazePoints = visionSession.gazeData.reduce(
      (sum, chunk) => sum + chunk.totalPoints,
      0
    );

    // Get test duration
    const duration = visionSession.session.completedAt && visionSession.session.startedAt
      ? (visionSession.session.completedAt.getTime() - visionSession.session.startedAt.getTime()) / 1000
      : null;

    res.status(200).json({
      visionSessionId: visionSession.id,
      sessionId: visionSession.sessionId,
      studentName: visionSession.session.student.user.name,
      grade: visionSession.session.student.grade,
      templateTitle: visionSession.session.template.title,
      calibrationScore: visionSession.calibrationScore,
      status: visionSession.session.status,
      startedAt: visionSession.session.startedAt,
      completedAt: visionSession.session.completedAt,
      duration,
      totalGazePoints,
      gazeDataChunks: visionSession.gazeData.length,
      metricsCalculated: !!visionSession.metrics,
      aiAnalysisAvailable: !!visionSession.aiAnalysis
    });
  } catch (error) {
    next(error);
  }
};
