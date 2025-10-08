import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Get current student profile
 */
export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Check if user is a student
    if (req.user?.role !== 'student') {
      return next(new ApiError('Only students can access this endpoint', 403));
    }

    // Get student profile with user info
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!student) {
      return next(new ApiError('Student profile not found', 404));
    }

    res.json({
      success: true,
      data: student,
      message: 'Student profile retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    next(new ApiError('Failed to fetch student profile', 500));
  }
};

/**
 * Get current student statistics
 */
export const getMyStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Check if user is a student
    if (req.user?.role !== 'student') {
      return next(new ApiError('Only students can access this endpoint', 403));
    }

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return next(new ApiError('Student profile not found', 404));
    }

    // Get all test sessions
    const sessions = await prisma.testSession.findMany({
      where: { studentId: student.id },
      include: {
        result: true,
        template: {
          select: {
            grade: true,
            title: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'scored').length;
    const scoredSessions = sessions.filter((s) => s.status === 'scored' && s.result).length;

    const scores = sessions.filter((s) => s.result).map((s) => Number(s.result!.percentage));
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const recentSessions = sessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        scoredSessions,
        averageScore: Math.round(averageScore * 10) / 10,
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          sessionCode: s.sessionCode,
          status: s.status,
          createdAt: s.createdAt,
          completedAt: s.completedAt,
          template: s.template,
          result: s.result
            ? {
                percentage: Number(s.result.percentage),
                gradeLevel: s.result.gradeLevel,
                totalScore: s.result.totalScore,
              }
            : null,
        })),
      },
      message: 'Student statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    next(new ApiError('Failed to fetch student statistics', 500));
  }
};
