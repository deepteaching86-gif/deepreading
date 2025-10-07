import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';

const prisma = new PrismaClient();

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * 설문 문항 조회
 * GET /api/v1/sessions/:id/survey
 */
export const getSurveyQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // 세션 확인
    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
        template: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    // 권한 확인 (본인만 접근)
    if (session.student.userId !== userId) {
      throw new ApiError('Unauthorized', 403);
    }

    // 설문 문항 조회 (총 25문항)
    const surveyQuestions = await prisma.question.findMany({
      where: {
        templateId: session.template.id,
        category: {
          in: [
            'reading_motivation',
            'reading_environment',
            'reading_habit',
            'writing_motivation',
            'reading_preference',
            'digital_literacy',
            'critical_thinking',
            'reading_attitude',
          ],
        },
      },
      select: {
        id: true,
        questionNumber: true,
        category: true,
        questionType: true,
        questionText: true,
        options: true,
      },
      orderBy: {
        questionNumber: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        questions: surveyQuestions,
        totalQuestions: surveyQuestions.length,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error fetching survey questions:', error);
    next(new ApiError('Failed to fetch survey questions', 500));
  }
};

/**
 * 설문 응답 저장
 * POST /api/v1/sessions/:id/survey
 */
export const submitSurveyResponses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { responses } = req.body; // [{ questionId, questionNumber, response }]
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    if (!responses || !Array.isArray(responses)) {
      throw new ApiError('Invalid responses format', 400);
    }

    // 세션 확인
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

    // 권한 확인
    if (session.student.userId !== userId) {
      throw new ApiError('Unauthorized', 403);
    }

    // 이미 설문 완료했는지 확인
    if (session.surveyCompletedAt) {
      throw new ApiError('Survey already completed', 400);
    }

    // 트랜잭션으로 응답 저장
    await prisma.$transaction(async (tx) => {
      // 기존 응답 삭제 (재제출 가능하도록)
      await tx.surveyResponse.deleteMany({
        where: {
          sessionId: id,
        },
      });

      // 새 응답 저장
      const surveyResponsesData = responses.map((r: any) => ({
        sessionId: id,
        questionId: r.questionId,
        questionNumber: r.questionNumber,
        response: String(r.response), // 숫자든 텍스트든 문자열로 저장
      }));

      await tx.surveyResponse.createMany({
        data: surveyResponsesData,
      });

      // 설문 완료 시간 업데이트
      await tx.testSession.update({
        where: { id },
        data: {
          surveyCompletedAt: new Date(),
        },
      });
    });

    res.json({
      success: true,
      message: 'Survey responses saved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error saving survey responses:', error);
    next(new ApiError('Failed to save survey responses', 500));
  }
};

/**
 * 설문 응답 조회
 * GET /api/v1/sessions/:id/survey/responses
 */
export const getSurveyResponses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // 세션 확인
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

    // 권한 확인 (본인 또는 관리자)
    if (session.student.userId !== userId && userRole !== 'admin') {
      throw new ApiError('Unauthorized', 403);
    }

    // 설문 응답 조회
    const responses = await prisma.surveyResponse.findMany({
      where: {
        sessionId: id,
      },
      include: {
        question: {
          select: {
            questionNumber: true,
            category: true,
            questionType: true,
            questionText: true,
            options: true,
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
        responses,
        surveyCompletedAt: session.surveyCompletedAt,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error fetching survey responses:', error);
    next(new ApiError('Failed to fetch survey responses', 500));
  }
};
