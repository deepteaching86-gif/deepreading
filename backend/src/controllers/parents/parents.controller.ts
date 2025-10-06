// Parent controller
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';

const prisma = new PrismaClient();

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Get parent's children list
 */
export const getMyChildren = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'parent') {
      return next(new ApiError('Only parents can access this endpoint', 403));
    }

    // Find all students where this user is the parent
    const children = await prisma.student.findMany({
      where: {
        parentId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        grade: 'asc',
      },
    });

    res.json({
      success: true,
      data: children,
      message: 'Children list retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching children list:', error);
    next(new ApiError('Failed to fetch children list', 500));
  }
};

/**
 * Get specific child's statistics
 */
export const getChildStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { studentId } = req.params;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'parent') {
      return next(new ApiError('Only parents can access this endpoint', 403));
    }

    // Verify that this student is actually the parent's child
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      return next(new ApiError('Student not found or not authorized to view this student', 404));
    }

    // Get test sessions for this student
    const sessions = await prisma.testSession.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        result: true,
        template: {
          select: {
            grade: true,
            title: true,
            templateCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === 'completed' || s.status === 'scored'
    ).length;
    const scoredSessions = sessions.filter((s) => s.status === 'scored' && s.result).length;

    const scores = sessions.filter((s) => s.result).map((s) => Number(s.result!.percentage));
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Calculate score trend (last 5 tests)
    const recentScores = sessions
      .filter((s) => s.result)
      .slice(0, 5)
      .map((s) => ({
        date: s.completedAt || s.createdAt,
        score: Number(s.result!.percentage),
        templateTitle: s.template.title,
      }))
      .reverse();

    // Get strengths and weaknesses from latest result
    const latestResult = sessions.find((s) => s.result && s.status === 'scored');
    const strengths = latestResult?.result?.strengths || [];
    const weaknesses = latestResult?.result?.weaknesses || [];
    const recommendations = latestResult?.result?.recommendations || [];

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.user.name,
          grade: student.grade,
          schoolName: student.schoolName,
          className: student.className,
        },
        statistics: {
          totalSessions,
          completedSessions,
          scoredSessions,
          averageScore: Math.round(averageScore * 10) / 10,
        },
        scoreTrend: recentScores,
        analysis: {
          strengths,
          weaknesses,
          recommendations,
        },
        recentSessions: sessions.slice(0, 5).map((s) => ({
          id: s.id,
          sessionCode: s.sessionCode,
          status: s.status,
          createdAt: s.createdAt,
          completedAt: s.completedAt,
          template: {
            title: s.template.title,
            grade: s.template.grade,
            templateCode: s.template.templateCode,
          },
          result: s.result
            ? {
                percentage: Number(s.result.percentage),
                gradeLevel: s.result.gradeLevel,
                totalScore: s.result.totalScore,
              }
            : null,
        })),
      },
      message: 'Child statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching child statistics:', error);
    next(new ApiError('Failed to fetch child statistics', 500));
  }
};
