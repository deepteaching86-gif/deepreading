// Admin grading controller
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-deployment',
});

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Get pending sessions for grading
 */
export const getPendingSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    const sessions = await prisma.testSession.findMany({
      where: {
        status: 'completed',
        result: null,
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
        template: {
          select: {
            templateCode: true,
            title: true,
            grade: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            questionNumber: 'asc',
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 50,
    });

    res.json({
      success: true,
      data: sessions,
      message: 'Pending sessions retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching pending sessions:', error);
    next(new ApiError('Failed to fetch pending sessions', 500));
  }
};

/**
 * Auto-grade a session with AI for essay questions
 */
export const autoGradeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    // Get session with answers
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            questionNumber: 'asc',
          },
        },
        template: true,
      },
    });

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    if (session.status !== 'completed') {
      return next(new ApiError('Session is not completed yet', 400));
    }

    let totalScore = 0;
    let correctAnswers = 0;
    const totalQuestions = session.answers.length;

    // Grade each answer
    for (const answer of session.answers) {
      const question = answer.question;
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.questionType === 'choice') {
        // Objective grading for multiple choice
        const studentAns = answer.studentAnswer?.trim() || '';
        isCorrect = studentAns === question.correctAnswer.trim();
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.questionType === 'essay' || question.questionType === 'short_answer') {
        // AI-based grading for subjective questions
        try {
          const rubric = await generateGradingRubric(question);
          const grading = await gradeEssayWithAI(
            question.questionText,
            question.correctAnswer,
            answer.studentAnswer || '',
            rubric,
            question.points
          );

          pointsEarned = grading.score;
          isCorrect = grading.score >= question.points * 0.6; // 60% threshold

          // Store AI feedback
          await prisma.answer.update({
            where: { id: answer.id },
            data: {
              feedback: grading.feedback,
            },
          });
        } catch (error) {
          console.error('AI grading error:', error);
          // Fallback to partial credit
          pointsEarned = question.points * 0.5;
        }
      }

      totalScore += pointsEarned;
      if (isCorrect) correctAnswers++;

      // Update answer with grading
      await prisma.answer.update({
        where: { id: answer.id },
        data: {
          isCorrect,
          pointsEarned,
        },
      });
    }

    // Calculate percentage and grade level
    const percentage = (totalScore / session.template.totalPoints) * 100;
    const gradeLevel = calculateGradeLevel(percentage);

    // Create result
    const result = await prisma.testResult.create({
      data: {
        sessionId: session.id,
        totalScore,
        totalPossible: session.template.totalPoints,
        percentage,
        gradeLevel,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        strengths: [],
        weaknesses: [],
        recommendations: [],
      },
    });

    // Update session status
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'scored',
      },
    });

    res.json({
      success: true,
      data: {
        sessionId,
        result,
        totalScore,
        percentage,
        gradeLevel,
      },
      message: 'Session graded successfully',
    });
  } catch (error) {
    console.error('Error auto-grading session:', error);
    next(new ApiError('Failed to auto-grade session', 500));
  }
};

/**
 * Manual grade adjustment
 */
export const manualGradeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;
    const { answers } = req.body; // Array of { answerId, pointsEarned, feedback }

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only admins can access this endpoint', 403));
    }

    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        template: true,
        answers: true,
      },
    });

    if (!session) {
      return next(new ApiError('Session not found', 404));
    }

    let totalScore = 0;
    let correctAnswers = 0;

    // Update each answer
    for (const answerUpdate of answers) {
      const answer = await prisma.answer.update({
        where: { id: answerUpdate.answerId },
        data: {
          pointsEarned: answerUpdate.pointsEarned,
          isCorrect: answerUpdate.pointsEarned > 0,
          feedback: answerUpdate.feedback,
        },
        include: {
          question: true,
        },
      });

      totalScore += answer.pointsEarned;
      if (answer.isCorrect) correctAnswers++;
    }

    // Calculate percentage and grade level
    const percentage = (totalScore / session.template.totalPoints) * 100;
    const gradeLevel = calculateGradeLevel(percentage);

    // Update or create result
    const result = await prisma.testResult.upsert({
      where: { sessionId },
      update: {
        totalScore,
        totalPossible: session.template.totalPoints,
        percentage,
        gradeLevel,
        correctAnswers,
        incorrectAnswers: session.answers.length - correctAnswers,
      },
      create: {
        sessionId,
        totalScore,
        totalPossible: session.template.totalPoints,
        percentage,
        gradeLevel,
        correctAnswers,
        incorrectAnswers: session.answers.length - correctAnswers,
        strengths: [],
        weaknesses: [],
        recommendations: [],
      },
    });

    // Update session status
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'scored',
      },
    });

    res.json({
      success: true,
      data: result,
      message: 'Manual grading completed successfully',
    });
  } catch (error) {
    console.error('Error manual grading:', error);
    next(new ApiError('Failed to grade session', 500));
  }
};

/**
 * Generate grading rubric using AI
 */
async function generateGradingRubric(question: any): Promise<string> {
  const prompt = `다음 문제에 대한 채점 루브릭을 생성해주세요:

문제: ${question.questionText}
모범 답안: ${question.correctAnswer}
배점: ${question.points}점

채점 기준을 명확하게 작성해주세요. 각 점수 범위별로 어떤 요소가 포함되어야 하는지 설명해주세요.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          '당신은 국어 교육 전문가입니다. 학생 답안을 평가하기 위한 명확하고 공정한 채점 기준을 만드는 전문가입니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message.content || '';
}

/**
 * Grade essay answer using AI
 */
async function gradeEssayWithAI(
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  rubric: string,
  maxPoints: number
): Promise<{ score: number; feedback: string }> {
  const prompt = `다음 학생 답안을 채점해주세요:

문제: ${questionText}
모범 답안: ${correctAnswer}
학생 답안: ${studentAnswer}
배점: ${maxPoints}점

채점 기준:
${rubric}

학생 답안을 평가하고 다음 형식으로 응답해주세요:
점수: [0-${maxPoints}]
피드백: [구체적인 피드백]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          '당신은 공정하고 엄격한 국어 교사입니다. 학생 답안을 객관적으로 평가하고 건설적인 피드백을 제공합니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  const response = completion.choices[0].message.content || '';

  // Parse response
  const scoreMatch = response.match(/점수[:\s]+(\d+(?:\.\d+)?)/);
  const feedbackMatch = response.match(/피드백[:\s]+(.+)/s);

  const score = scoreMatch ? parseFloat(scoreMatch[1]) : maxPoints * 0.5;
  const feedback = feedbackMatch ? feedbackMatch[1].trim() : response;

  return {
    score: Math.min(score, maxPoints),
    feedback,
  };
}

/**
 * Calculate grade level from percentage
 */
function calculateGradeLevel(percentage: number): number {
  if (percentage >= 90) return 1;
  if (percentage >= 80) return 2;
  if (percentage >= 70) return 3;
  if (percentage >= 60) return 4;
  if (percentage >= 50) return 5;
  if (percentage >= 40) return 6;
  if (percentage >= 30) return 7;
  if (percentage >= 20) return 8;
  return 9;
}
