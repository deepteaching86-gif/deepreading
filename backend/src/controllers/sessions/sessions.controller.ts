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
              select: {
                id: true,
                questionNumber: true,
                category: true,
                questionType: true,
                questionText: true,
                passage: true,
                imageUrl: true,
                options: true,
                points: true,
                difficulty: true,
                correctAnswer: true,
              },
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
 * Get session result
 */
export const getSessionResult = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Get session with template info
    const session: any = await prisma.testSession.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            templateCode: true,
            grade: true,
            title: true,
            timeLimit: true,
          },
        },
        result: true,
        answers: {
          include: {
            question: {
              select: {
                questionNumber: true,
                category: true,
                points: true,
              },
            },
          },
          orderBy: {
            questionNumber: 'asc',
          },
        },
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Verify ownership
    if (session.student.userId !== userId) {
      throw new ApiError('Unauthorized access to session', 403);
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      throw new ApiError('Session is not completed yet', 400);
    }

    if (!session.result) {
      throw new ApiError('Test result not available', 404);
    }

    // Calculate category scores
    const categoryScores: Record<string, { correct: number; total: number; score: number }> = {};

    session.answers.forEach((answer: any) => {
      const category = answer.question.category;
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0, score: 0 };
      }
      categoryScores[category].total += answer.question.points;
      if (answer.isCorrect) {
        categoryScores[category].correct += answer.question.points;
        categoryScores[category].score += answer.question.points;
      }
    });

    // Calculate survey scores (Likert scale averages)
    const surveyCategories = ['reading_motivation', 'writing_motivation', 'reading_environment', 'reading_habit', 'reading_preference'];
    const surveyScores: Record<string, number | null> = {};

    surveyCategories.forEach((category) => {
      const categoryAnswers = session.answers.filter((a: any) => a.question.category === category);
      if (categoryAnswers.length > 0) {
        const sum = categoryAnswers.reduce((acc: any, a: any) => {
          const value = parseInt(a.studentAnswer || '0', 10);
          return acc + (isNaN(value) ? 0 : value);
        }, 0);
        surveyScores[category] = sum / categoryAnswers.length;
      } else {
        surveyScores[category] = null;
      }
    });

    // Identify strengths (categories with >80% correct)
    const strengths: any[] = [];
    const weaknesses: any[] = [];

    const getCategoryKoreanName = (cat: string): string => {
      const names: Record<string, string> = {
        vocabulary: '어휘력',
        reading: '독해력',
        grammar: '문법/어법',
        reasoning: '추론/사고력',
        reading_motivation: '읽기 동기',
        reading_environment: '독서 환경',
        reading_habit: '독서 습관',
        writing_motivation: '글쓰기 동기',
      };
      return names[cat] || cat;
    };

    Object.entries(categoryScores).forEach(([category, data]) => {
      const percentage = (data.correct / data.total) * 100;
      const koreanName = getCategoryKoreanName(category);

      if (percentage >= 80) {
        strengths.push({
          category,
          description: `${koreanName} 영역에서 ${percentage.toFixed(1)}%의 정답률을 달성했습니다.`,
          percentage: percentage.toFixed(1),
          score: data.score,
        });
      } else if (percentage < 60) {
        weaknesses.push({
          category,
          description: `${koreanName} 영역에서 ${percentage.toFixed(1)}%의 정답률을 보였습니다. 추가 학습이 필요합니다.`,
          percentage: percentage.toFixed(1),
          score: data.score,
        });
      }
    });

    // Generate recommendations based on weaknesses
    const recommendations: any[] = [];
    weaknesses.forEach((weakness) => {
      const koreanName = getCategoryKoreanName(weakness.category);
      recommendations.push({
        category: weakness.category,
        priority: weakness.percentage < 50 ? 'high' : 'medium',
        suggestion: `${koreanName} 영역 집중 학습을 권장합니다.`,
        resources: ['교과서 복습', '추가 문제 풀이', '개별 학습 지도'],
      });
    });

    const result = {
      totalScore: session.result.totalScore,
      totalPossible: session.result.totalPossible,
      percentage: Number(session.result.percentage),
      gradeLevel: session.result.gradeLevel || 1,
      percentile: session.result.percentile ? Number(session.result.percentile) : null,
      vocabularyScore: categoryScores['vocabulary']?.score || 0,
      readingScore: categoryScores['reading']?.score || 0,
      grammarScore: categoryScores['grammar']?.score || 0,
      reasoningScore: categoryScores['reasoning']?.score || 0,
      readingMotivationScore: surveyScores['reading_motivation'],
      writingMotivationScore: surveyScores['writing_motivation'],
      readingEnvironmentScore: surveyScores['reading_environment'],
      readingHabitScore: surveyScores['reading_habit'],
      readingPreferenceData: surveyScores['reading_preference'],
      strengths,
      weaknesses,
      recommendations,
    };

    res.json({
      success: true,
      data: {
        result,
        template: session.template,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error getting session result:', error);
    next(new ApiError('Failed to get session result', 500));
  }
};

/**
 * Delete a test session
 */
export const deleteSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Get session to verify ownership
    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // Verify ownership (students can only delete their own sessions, admins can delete any)
    if (session.student.userId !== userId && req.user?.role !== 'admin') {
      throw new ApiError('Unauthorized to delete this session', 403);
    }

    // Delete session (cascade will delete answers and result)
    await prisma.testSession.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error deleting session:', error);
    next(new ApiError('Failed to delete session', 500));
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
