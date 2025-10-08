// Admin controller
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
 * Get dashboard statistics for admin
 */
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    // Get total counts
    const [totalUsers, totalStudents, totalParents, totalTeachers, totalTemplates, totalSessions] =
      await Promise.all([
        prisma.user.count(),
        prisma.student.count(),
        prisma.user.count({ where: { role: 'parent' } }),
        prisma.user.count({ where: { role: 'teacher' } }),
        prisma.testTemplate.count(),
        prisma.testSession.count(),
      ]);

    // Get session statistics
    const sessions = await prisma.testSession.findMany({
      include: {
        result: true,
      },
    });

    const completedSessions = sessions.filter(
      (s) => s.status === 'completed' || s.status === 'scored'
    ).length;
    const scoredSessions = sessions.filter((s) => s.status === 'scored' && s.result).length;

    const scores = sessions.filter((s) => s.result).map((s) => Number(s.result!.percentage));
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const recentSessions = await prisma.testSession.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          parents: totalParents,
          teachers: totalTeachers,
          recentRegistrations: recentUsers,
        },
        templates: {
          total: totalTemplates,
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          scored: scoredSessions,
          averageScore: Math.round(averageScore * 10) / 10,
          recentSessions,
        },
      },
      message: 'Dashboard statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    next(new ApiError('Failed to fetch dashboard statistics', 500));
  }
};

/**
 * Get recent user registrations
 */
export const getRecentUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const users = await prisma.user.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
      message: 'Recent users retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    next(new ApiError('Failed to fetch recent users', 500));
  }
};

/**
 * Get statistics by grade level
 */
export const getStatsByGrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    // Get all students grouped by grade
    const students = await prisma.student.findMany({
      include: {
        sessions: {
          include: {
            result: true,
          },
        },
      },
    });

    // Group by grade and calculate statistics
    const gradeStats: Record<
      number,
      {
        grade: number;
        studentCount: number;
        totalSessions: number;
        completedSessions: number;
        averageScore: number;
      }
    > = {};

    students.forEach((student) => {
      if (!gradeStats[student.grade]) {
        gradeStats[student.grade] = {
          grade: student.grade,
          studentCount: 0,
          totalSessions: 0,
          completedSessions: 0,
          averageScore: 0,
        };
      }

      gradeStats[student.grade].studentCount++;
      gradeStats[student.grade].totalSessions += student.sessions.length;
      gradeStats[student.grade].completedSessions += student.sessions.filter(
        (s) => s.status === 'completed' || s.status === 'scored'
      ).length;

      const scores = student.sessions
        .filter((s) => s.result)
        .map((s) => Number(s.result!.percentage));
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        gradeStats[student.grade].averageScore =
          (gradeStats[student.grade].averageScore * (gradeStats[student.grade].studentCount - 1) +
            avgScore) /
          gradeStats[student.grade].studentCount;
      }
    });

    const result = Object.values(gradeStats)
      .sort((a, b) => a.grade - b.grade)
      .map((stat) => ({
        ...stat,
        averageScore: Math.round(stat.averageScore * 10) / 10,
      }));

    res.json({
      success: true,
      data: result,
      message: 'Grade statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching grade statistics:', error);
    next(new ApiError('Failed to fetch grade statistics', 500));
  }
};

/**
 * Get all users for admin management
 */
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    const users = await prisma.user.findMany({
      include: {
        student: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(new ApiError('Failed to fetch users', 500));
  }
};

/**
 * Update user information
 */
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminUserId = req.user?.userId;
    const { userId } = req.params;
    const { name, email, phone, grade, schoolName, parentPhone } = req.body;

    if (!adminUserId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can update users', 403));
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!existingUser) {
      return next(new ApiError('User not found', 404));
    }

    // Update user in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          phone,
        },
      });

      // Update student info if user is a student
      if (existingUser.role === 'student' && existingUser.student) {
        await tx.student.update({
          where: { id: existingUser.student.id },
          data: {
            grade: grade ? parseInt(grade) : undefined,
            schoolName: schoolName || null,
            parentPhone: parentPhone || null,
          },
        });
      }

      return user;
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    next(new ApiError('Failed to update user', 500));
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminUserId = req.user?.userId;
    const { userId } = req.params;

    if (!adminUserId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can delete users', 403));
    }

    // Prevent admin from deleting themselves
    if (adminUserId === userId) {
      return next(new ApiError('Cannot delete your own account', 400));
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return next(new ApiError('User not found', 404));
    }

    // Delete user (cascade will handle student and sessions)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    next(new ApiError('Failed to delete user', 500));
  }
};
