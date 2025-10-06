// Test sessions controller
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';
import { nanoid } from 'nanoid';

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
 * Get current user's test sessions
 */
export const getMySessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Find student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      // If no student record, return empty array
      return res.json({
        success: true,
        data: [],
        message: 'No sessions found',
      });
    }

    const sessions = await prisma.testSession.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        template: {
          select: {
            title: true,
            grade: true,
            templateCode: true,
          },
        },
        result: {
          select: {
            percentage: true,
            gradeLevel: true,
            totalScore: true,
            totalPossible: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: sessions,
      message: 'Sessions retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error fetching sessions:', error);
    next(new ApiError('Failed to fetch sessions', 500));
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        template: {
          include: {
            questions: {
              orderBy: {
                questionNumber: 'asc',
              },
            },
          },
        },
        answers: true,
        result: true,
      },
    });

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    // Check authorization
    if (session.student.userId !== userId && req.user?.role !== 'admin') {
      return next(new ApiError('Not authorized to access this session', 403));
    }

    res.json({
      success: true,
      data: session,
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error fetching session:', error);
    next(new ApiError('Failed to fetch session', 500));
  }
};

/**
 * Create new test session
 */
export const createSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateCode } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Find or create student record
    let student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      // Create student record if it doesn't exist
      student = await prisma.student.create({
        data: {
          userId,
          grade: 1, // Default grade, should be updated by user
        },
      });
    }

    // Find template
    const template = await prisma.testTemplate.findUnique({
      where: { templateCode },
    });

    if (!template) {
      return next(new ApiError('Template not found', 404));
    }

    if (!template.isActive) {
      return next(new ApiError('Template is not active', 400));
    }

    // Create session
    const session = await prisma.testSession.create({
      data: {
        sessionCode: `SESSION-${nanoid(10)}`,
        studentId: student.id,
        templateId: template.id,
        status: 'pending',
      },
      include: {
        template: {
          select: {
            title: true,
            grade: true,
            templateCode: true,
            totalQuestions: true,
            timeLimit: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error creating session:', error);
    next(new ApiError('Failed to create session', 500));
  }
};

/**
 * Update session status
 */
export const updateSessionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Find session
    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    // Check authorization
    if (session.student.userId !== userId && req.user?.role !== 'admin') {
      return next(new ApiError('Not authorized to update this session', 403));
    }

    // Update session
    const updatedSession = await prisma.testSession.update({
      where: { id },
      data: {
        status,
        startedAt: status === 'in_progress' ? new Date() : session.startedAt,
        completedAt: status === 'completed' ? new Date() : session.completedAt,
      },
    });

    res.json({
      success: true,
      data: updatedSession,
      message: 'Session status updated successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error updating session:', error);
    next(new ApiError('Failed to update session', 500));
  }
};
