// Reports controller - Simple working version
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
 * Get session report
 */
export const getSessionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        template: true,
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            questionNumber: 'asc',
          },
        },
        result: true,
      },
    });

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    if (req.user?.role !== 'admin' && req.user?.userId !== session.student.userId) {
      return next(new ApiError('Permission denied', 403));
    }

    if (!session.result) {
      return next(new ApiError('Not scored yet', 400));
    }

    // Filter out survey categories (only include actual test questions)
    const surveyCategories = [
      'reading_motivation',
      'writing_motivation',
      'reading_environment',
      'reading_habit',
      'reading_preference',
      'digital_literacy',
      'critical_thinking',
      'reading_attitude'
    ];

    const testAnswers = session.answers.filter(
      (answer) => !surveyCategories.includes(answer.question.category)
    );

    // Calculate category scores
    const categoryScores: Record<string, { earned: number; total: number }> = {};

    testAnswers.forEach((answer) => {
      const category = answer.question.category;
      if (!categoryScores[category]) {
        categoryScores[category] = { earned: 0, total: 0 };
      }
      categoryScores[category].earned += answer.pointsEarned;
      categoryScores[category].total += answer.question.points;
    });

    // Get survey responses
    const surveyResponses = await prisma.surveyResponse.findMany({
      where: { sessionId: session.id },
      include: {
        question: {
          select: {
            category: true,
            questionText: true,
            questionNumber: true,
          },
        },
      },
      orderBy: {
        questionNumber: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        resultId: session.result.id,
        sessionId: session.id,
        student: {
          name: session.student.user.name,
          email: session.student.user.email,
          grade: session.student.grade,
          schoolName: session.student.schoolName,
          className: session.student.className,
        },
        test: {
          templateCode: session.template.templateCode,
          title: session.template.title,
          completedAt: session.completedAt,
        },
        overall: {
          totalScore: session.result.totalScore,
          totalPossible: session.result.totalPossible,
          percentage: Number(session.result.percentage),
          gradeLevel: session.result.gradeLevel,
          correctAnswers: session.result.correctAnswers,
          incorrectAnswers: session.result.incorrectAnswers,
        },
        categoryScores,
        answers: testAnswers.map((a) => ({
          questionNumber: a.questionNumber,
          questionText: a.question.questionText,
          questionType: a.question.questionType,
          category: a.question.category,
          studentAnswer: a.studentAnswer,
          correctAnswer: a.question.correctAnswer,
          isCorrect: a.isCorrect,
          pointsEarned: a.pointsEarned,
          totalPoints: a.question.points,
          feedback: a.feedback,
        })),
        surveyResponses: surveyResponses.map((r) => ({
          questionNumber: r.questionNumber,
          questionText: r.question.questionText,
          category: r.question.category,
          response: r.response,
        })),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    next(new ApiError('Failed to fetch report', 500));
  }
};

/**
 * Get all sessions
 */
export const getAllSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return next(new ApiError('Admin only', 403));
    }

    const sessions = await prisma.testSession.findMany({
      where: {
        status: {
          in: ['completed', 'scored'],
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        template: true,
        result: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 100,
    });

    const data = sessions.map((s) => ({
      id: s.id,
      studentName: s.student.user.name,
      studentEmail: s.student.user.email,
      grade: s.student.grade,
      templateCode: s.template.templateCode,
      completedAt: s.completedAt,
      score: s.result ? `${s.result.totalScore}/${s.result.totalPossible}` : null,
      percentage: s.result ? Number(s.result.percentage) : null,
      gradeLevel: s.result?.gradeLevel,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error:', error);
    next(new ApiError('Failed to fetch sessions', 500));
  }
};
