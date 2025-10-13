// Vision TEST Calibration Controller
// Handles device compatibility checking, calibration session management, and validation

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  CheckEnvironmentRequest,
  CheckEnvironmentResponse,
  StartCalibrationRequest,
  StartCalibrationResponse,
  RecordCalibrationPointRequest,
  ValidateCalibrationRequest,
  ValidateCalibrationResponse,
  CalibrationResult,
  CalibrationPoint,
  DeviceInfo,
  VisionTestError,
  VisionErrorCode
} from '../../types/vision.types';

const prisma = new PrismaClient();

// Temporary in-memory storage for active calibration sessions
// In production, use Redis for distributed systems
const activeCalibrations = new Map<string, {
  userId: string;
  deviceInfo: DeviceInfo;
  points: CalibrationPoint[];
  startTime: Date;
}>();

/**
 * POST /api/v1/vision/calibration/check-environment
 * Check if device is compatible with Vision TEST
 */
export const checkEnvironment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userAgent, screenWidth, screenHeight, devicePixelRatio } = req.body as CheckEnvironmentRequest;

    const issues: string[] = [];
    const recommendations: string[] = [];
    const requiredPermissions = ['camera'];

    // Check 1: Screen size (minimum 768x1024 for tablets)
    if (screenWidth < 768 || screenHeight < 1024) {
      issues.push('Screen size too small. Minimum 768x1024 required.');
      recommendations.push('Use a tablet device (iPad, Android tablet) for optimal experience.');
    }

    // Check 2: Browser compatibility (check for MediaPipe support)
    const browserRegex = /(Chrome|Safari|Edge)\/(\d+)/;
    const match = userAgent.match(browserRegex);

    if (!match) {
      issues.push('Browser not supported. Chrome, Safari, or Edge required.');
      recommendations.push('Please use Chrome 90+, Safari 14+, or Edge 90+.');
    } else {
      const [, browser, versionStr] = match;
      const version = parseInt(versionStr, 10);

      if (browser === 'Chrome' && version < 90) {
        issues.push('Chrome version too old. Please update to Chrome 90 or later.');
      } else if (browser === 'Safari' && version < 14) {
        issues.push('Safari version too old. Please update to Safari 14 or later.');
      } else if (browser === 'Edge' && version < 90) {
        issues.push('Edge version too old. Please update to Edge 90 or later.');
      }
    }

    // Check 3: Check if mobile/tablet (required for front camera)
    const isMobile = /Mobile|Android|iPad|iPhone/i.test(userAgent);
    if (!isMobile) {
      issues.push('Desktop device detected. Vision TEST requires tablet with front camera.');
      recommendations.push('Please use an iPad or Android tablet.');
    }

    // Check 4: Device pixel ratio (for high DPI screens)
    if (devicePixelRatio < 1.5) {
      recommendations.push('Low resolution screen detected. Higher resolution recommended for better accuracy.');
    }

    const compatible = issues.length === 0;

    const response: CheckEnvironmentResponse = {
      compatible,
      issues,
      recommendations,
      requiredPermissions
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/calibration/start
 * Start a new calibration session
 */
export const startCalibration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, deviceInfo } = req.body as StartCalibrationRequest;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Generate calibration ID
    const calibrationId = `calib_${Date.now()}_${userId.substring(0, 8)}`;

    // Generate 9-point calibration grid (3x3)
    const points: Array<{ id: number; x: number; y: number }> = [];
    const gridPositions = [
      [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
      [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
      [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
    ];

    gridPositions.forEach(([x, y], index) => {
      points.push({ id: index + 1, x, y });
    });

    // Store in temporary session storage
    activeCalibrations.set(calibrationId, {
      userId,
      deviceInfo,
      points: [],
      startTime: new Date()
    });

    const response: StartCalibrationResponse = {
      calibrationId,
      points,
      instructions: '각 점을 응시하고 화면을 탭하세요. 총 9개의 점을 측정합니다.'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/calibration/record-point
 * Record a single calibration point
 */
export const recordCalibrationPoint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { calibrationId, pointId, gazeX, gazeY } = req.body as RecordCalibrationPointRequest;

    // Get active calibration session
    const session = activeCalibrations.get(calibrationId);
    if (!session) {
      throw new VisionTestError(
        VisionErrorCode.CALIBRATION_NOT_FOUND,
        'Calibration session not found or expired',
        404
      );
    }

    // Get expected point position (from 9-point grid)
    const gridPositions = [
      [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
      [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
      [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
    ];
    const [expectedX, expectedY] = gridPositions[pointId - 1];

    // Calculate error (Euclidean distance in pixels)
    const { screenWidth, screenHeight } = session.deviceInfo;
    const errorX = (gazeX - expectedX) * screenWidth;
    const errorY = (gazeY - expectedY) * screenHeight;
    const error = Math.sqrt(errorX * errorX + errorY * errorY);

    // Create calibration point
    const calibrationPoint: CalibrationPoint = {
      id: pointId,
      screenX: expectedX,
      screenY: expectedY,
      actualX: gazeX,
      actualY: gazeY,
      error,
      attempts: 1
    };

    // Check if point already exists (user retrying)
    const existingPointIndex = session.points.findIndex(p => p.id === pointId);
    if (existingPointIndex >= 0) {
      calibrationPoint.attempts = session.points[existingPointIndex].attempts + 1;
      session.points[existingPointIndex] = calibrationPoint;
    } else {
      session.points.push(calibrationPoint);
    }

    // Update session
    activeCalibrations.set(calibrationId, session);

    res.status(200).json({
      success: true,
      pointId,
      error,
      recordedPoints: session.points.length,
      totalPoints: 9
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/calibration/validate
 * Validate calibration accuracy and create reusable calibration
 */
export const validateCalibration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { calibrationId } = req.body as ValidateCalibrationRequest;

    // Get active calibration session
    const session = activeCalibrations.get(calibrationId);
    if (!session) {
      throw new VisionTestError(
        VisionErrorCode.CALIBRATION_NOT_FOUND,
        'Calibration session not found or expired',
        404
      );
    }

    // Check if all 9 points are recorded
    if (session.points.length < 9) {
      throw new VisionTestError(
        VisionErrorCode.INVALID_GAZE_DATA,
        `Only ${session.points.length}/9 points recorded`,
        400
      );
    }

    // Calculate overall accuracy (average error in pixels)
    const totalError = session.points.reduce((sum, p) => sum + p.error, 0);
    const averageError = totalError / session.points.length;

    // Accuracy score: 100% at 0px error, 0% at 200px error
    const accuracyPercentage = Math.max(0, Math.min(100, 100 - (averageError / 200) * 100));

    // Calculate affine transformation matrix (simplified - just offset and scale)
    const transformMatrix = calculateTransformMatrix(session.points);

    // Validation threshold: 70% accuracy required
    const ACCURACY_THRESHOLD = 70;
    const valid = accuracyPercentage >= ACCURACY_THRESHOLD;

    if (valid) {
      // Save to database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      const calibration = await prisma.visionCalibration.create({
        data: {
          userId: session.userId,
          calibrationPoints: session.points as any,
          overallAccuracy: accuracyPercentage,
          transformMatrix: transformMatrix as any,
          deviceInfo: session.deviceInfo as any,
          expiresAt
        }
      });

      const calibrationResult: CalibrationResult = {
        calibrationId: calibration.id,
        overallAccuracy: accuracyPercentage,
        points: session.points,
        transformMatrix,
        deviceInfo: session.deviceInfo,
        expiresAt
      };

      // Clean up temporary session
      activeCalibrations.delete(calibrationId);

      const response: ValidateCalibrationResponse = {
        valid: true,
        accuracy: accuracyPercentage,
        calibrationResult,
        message: `캘리브레이션 성공! 정확도: ${accuracyPercentage.toFixed(1)}%`
      };

      res.status(200).json(response);
    } else {
      throw new VisionTestError(
        VisionErrorCode.CALIBRATION_ACCURACY_LOW,
        `Calibration accuracy too low: ${accuracyPercentage.toFixed(1)}%. Required: ${ACCURACY_THRESHOLD}%`,
        400,
        {
          accuracy: accuracyPercentage,
          threshold: ACCURACY_THRESHOLD,
          averageError,
          points: session.points
        }
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/calibration/active/:userId
 * Get active (non-expired) calibration for user
 */
export const getActiveCalibration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const calibration = await prisma.visionCalibration.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!calibration) {
      res.status(404).json({
        found: false,
        message: 'No active calibration found. Please calibrate before testing.'
      });
      return;
    }

    res.status(200).json({
      found: true,
      calibration: {
        calibrationId: calibration.id,
        overallAccuracy: calibration.overallAccuracy,
        createdAt: calibration.createdAt,
        expiresAt: calibration.expiresAt,
        daysRemaining: Math.ceil((calibration.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Calculate affine transformation matrix
 * Simplified version - computes offset and scale
 */
function calculateTransformMatrix(points: CalibrationPoint[]): number[][] {
  // Calculate average offset
  let sumOffsetX = 0;
  let sumOffsetY = 0;
  let sumScaleX = 0;
  let sumScaleY = 0;

  points.forEach(point => {
    sumOffsetX += point.actualX - point.screenX;
    sumOffsetY += point.actualY - point.screenY;

    // Scale: ratio of actual to expected
    if (point.screenX !== 0.5) { // Avoid division by center point
      sumScaleX += point.actualX / point.screenX;
    }
    if (point.screenY !== 0.5) {
      sumScaleY += point.actualY / point.screenY;
    }
  });

  const avgOffsetX = sumOffsetX / points.length;
  const avgOffsetY = sumOffsetY / points.length;
  const avgScaleX = sumScaleX / (points.length - 3); // Exclude 3 center points
  const avgScaleY = sumScaleY / (points.length - 3);

  // 3x3 affine transformation matrix
  // [scaleX, 0,      offsetX]
  // [0,      scaleY, offsetY]
  // [0,      0,      1      ]
  return [
    [avgScaleX, 0, avgOffsetX],
    [0, avgScaleY, avgOffsetY],
    [0, 0, 1]
  ];
}
