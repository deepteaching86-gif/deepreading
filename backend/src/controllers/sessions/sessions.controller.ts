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
          select: {
            id: true,
            templateCode: true,
            grade: true,
            title: true,
            timeLimit: true,
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
    console.error('Error details:', JSON.stringify(error, null, 2));
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

/**
 * Save answers for a session
 */
export const saveAnswers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
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

    // Save or update answers
    for (const answer of answers) {
      // Find question to get questionNumber
      const question = await prisma.question.findUnique({
        where: { id: answer.questionId },
        select: { questionNumber: true },
      });

      if (!question) continue;

      // Check if answer already exists
      const existingAnswer = await prisma.answer.findFirst({
        where: {
          sessionId: id,
          questionId: answer.questionId,
        },
      });

      if (existingAnswer) {
        // Update existing answer
        await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: { studentAnswer: answer.answer },
        });
      } else {
        // Create new answer
        await prisma.answer.create({
          data: {
            sessionId: id,
            questionId: answer.questionId,
            questionNumber: question.questionNumber,
            studentAnswer: answer.answer,
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Answers saved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error saving answers:', error);
    next(new ApiError('Failed to save answers', 500));
  }
};

/**
 * Submit test session
 */
export const submitSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Find session with template and questions
    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        student: true,
        template: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    // Check authorization
    if (session.student.userId !== userId && req.user?.role !== 'admin') {
      return next(new ApiError('Not authorized to submit this session', 403));
    }

    // Save final answers
    const allQuestions = session.template.questions;
    const answersMap = new Map(answers.map((a: any) => [a.questionId, a.answer]));

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let totalScore = 0;
    let totalPossible = 0;

    for (const question of allQuestions) {
      const studentAnswer: string = String(answersMap.get(question.id) || '');
      const correctAnswer: string = String(question.correctAnswer || '');
      const isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      if (isCorrect) {
        correctAnswers++;
        totalScore += question.points;
      } else {
        incorrectAnswers++;
      }

      totalPossible += question.points;

      // Check if answer already exists
      const existingAnswer = await prisma.answer.findFirst({
        where: {
          sessionId: id,
          questionId: question.id,
        },
      });

      const answerValue: string | null = studentAnswer ? studentAnswer : null;

      if (existingAnswer) {
        // Update existing answer
        await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: {
            studentAnswer: answerValue,
            isCorrect,
          },
        });
      } else {
        // Create new answer
        await prisma.answer.create({
          data: {
            sessionId: id,
            questionId: question.id,
            questionNumber: question.questionNumber,
            studentAnswer: answerValue,
            isCorrect,
          },
        });
      }
    }

    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // Determine grade level (1-9 scale, not letter grades)
    let gradeLevel = 1;
    if (percentage >= 90) gradeLevel = 9;
    else if (percentage >= 80) gradeLevel = 8;
    else if (percentage >= 70) gradeLevel = 7;
    else if (percentage >= 60) gradeLevel = 6;
    else if (percentage >= 50) gradeLevel = 5;
    else if (percentage >= 40) gradeLevel = 4;
    else if (percentage >= 30) gradeLevel = 3;
    else if (percentage >= 20) gradeLevel = 2;

    // Update session status
    await prisma.testSession.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Create or update test result
    await prisma.testResult.upsert({
      where: { sessionId: id },
      update: {
        totalScore,
        totalPossible,
        percentage,
        gradeLevel,
        correctAnswers,
        incorrectAnswers,
      },
      create: {
        sessionId: id,
        totalScore,
        totalPossible,
        percentage,
        gradeLevel,
        correctAnswers,
        incorrectAnswers,
      },
    });

    res.json({
      success: true,
      data: {
        totalScore,
        totalPossible,
        percentage,
        gradeLevel,
        correctAnswers,
        incorrectAnswers,
      },
      message: 'Test submitted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error submitting session:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    next(new ApiError('Failed to submit session', 500));
  }
};

/**
 * Start a new test session (using templateId)
 */
export const startSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (!templateId) {
      return next(new ApiError('Template ID is required', 400));
    }

    // Find student record
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return next(new ApiError('Student profile not found', 404));
    }

    // Find template
    const template = await prisma.testTemplate.findUnique({
      where: { id: templateId },
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
        sessionCode: 'SESSION-' + nanoid(10),
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
      data: {
        sessionId: session.id,
        session,
      },
      message: 'Session started successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error starting session:', error);
    next(new ApiError('Failed to start session', 500));
  }
};
