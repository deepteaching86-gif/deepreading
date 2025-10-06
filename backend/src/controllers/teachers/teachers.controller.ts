// Teacher controller
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
 * Get teacher's students
 */
export const getMyStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'teacher') {
      return next(new ApiError('Only teachers can access this endpoint', 403));
    }

    // Find all students where this user is the teacher
    const students = await prisma.student.findMany({
      where: {
        teacherId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sessions: {
          include: {
            result: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: [
        {
          grade: 'asc',
        },
        {
          className: 'asc',
        },
      ],
    });

    // Calculate stats for each student
    const studentsWithStats = students.map((student) => {
      const allSessions = student.sessions;
      const completedSessions = allSessions.filter(
        (s) => s.status === 'completed' || s.status === 'scored'
      );
      const scoredSessions = allSessions.filter((s) => s.status === 'scored' && s.result);

      const scores = scoredSessions.map((s) => Number(s.result!.percentage));
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        id: student.id,
        grade: student.grade,
        schoolName: student.schoolName,
        className: student.className,
        user: student.user,
        stats: {
          totalSessions: allSessions.length,
          completedSessions: completedSessions.length,
          averageScore: Math.round(averageScore * 10) / 10,
        },
        recentSessions: allSessions.slice(0, 3),
      };
    });

    res.json({
      success: true,
      data: studentsWithStats,
      message: 'Students retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    next(new ApiError('Failed to fetch students', 500));
  }
};

/**
 * Get class statistics
 */
export const getClassStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'teacher') {
      return next(new ApiError('Only teachers can access this endpoint', 403));
    }

    // Get all students for this teacher
    const students = await prisma.student.findMany({
      where: {
        teacherId: userId,
      },
      include: {
        sessions: {
          include: {
            result: true,
          },
        },
      },
    });

    const totalStudents = students.length;

    // Calculate overall statistics
    let totalSessions = 0;
    let completedSessions = 0;
    let scoredSessions = 0;
    const allScores: number[] = [];

    students.forEach((student) => {
      totalSessions += student.sessions.length;
      completedSessions += student.sessions.filter(
        (s) => s.status === 'completed' || s.status === 'scored'
      ).length;
      scoredSessions += student.sessions.filter((s) => s.status === 'scored' && s.result).length;

      student.sessions.forEach((session) => {
        if (session.result) {
          allScores.push(Number(session.result.percentage));
        }
      });
    });

    const averageScore =
      allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    // Group by grade
    const gradeStats: Record<
      number,
      {
        grade: number;
        studentCount: number;
        averageScore: number;
        totalSessions: number;
      }
    > = {};

    students.forEach((student) => {
      if (!gradeStats[student.grade]) {
        gradeStats[student.grade] = {
          grade: student.grade,
          studentCount: 0,
          averageScore: 0,
          totalSessions: 0,
        };
      }

      gradeStats[student.grade].studentCount++;
      gradeStats[student.grade].totalSessions += student.sessions.length;

      const scores = student.sessions
        .filter((s) => s.result)
        .map((s) => Number(s.result!.percentage));
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        gradeStats[student.grade].averageScore =
          (gradeStats[student.grade].averageScore *
            (gradeStats[student.grade].studentCount - 1) +
            avgScore) /
          gradeStats[student.grade].studentCount;
      }
    });

    const gradeStatsArray = Object.values(gradeStats)
      .sort((a, b) => a.grade - b.grade)
      .map((stat) => ({
        ...stat,
        averageScore: Math.round(stat.averageScore * 10) / 10,
      }));

    res.json({
      success: true,
      data: {
        overall: {
          totalStudents,
          totalSessions,
          completedSessions,
          scoredSessions,
          averageScore: Math.round(averageScore * 10) / 10,
        },
        byGrade: gradeStatsArray,
      },
      message: 'Class statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching class statistics:', error);
    next(new ApiError('Failed to fetch class statistics', 500));
  }
};

/**
 * Get specific student's details
 */
export const getStudentDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { studentId } = req.params;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'teacher') {
      return next(new ApiError('Only teachers can access this endpoint', 403));
    }

    // Verify that this student belongs to this teacher
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: userId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        sessions: {
          include: {
            result: true,
            template: {
              select: {
                title: true,
                grade: true,
                templateCode: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return next(
        new ApiError('Student not found or not authorized to view this student', 404)
      );
    }

    // Calculate statistics
    const totalSessions = student.sessions.length;
    const completedSessions = student.sessions.filter(
      (s) => s.status === 'completed' || s.status === 'scored'
    ).length;
    const scoredSessions = student.sessions.filter((s) => s.status === 'scored' && s.result).length;

    const scores = student.sessions.filter((s) => s.result).map((s) => Number(s.result!.percentage));
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Get score trend (last 5 tests)
    const recentScores = student.sessions
      .filter((s) => s.result)
      .slice(0, 5)
      .map((s) => ({
        date: s.completedAt || s.createdAt,
        score: Number(s.result!.percentage),
        templateTitle: s.template.title,
      }))
      .reverse();

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.user.name,
          email: student.user.email,
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
        recentSessions: student.sessions.slice(0, 10).map((s) => ({
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
      message: 'Student details retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    next(new ApiError('Failed to fetch student details', 500));
  }
};
