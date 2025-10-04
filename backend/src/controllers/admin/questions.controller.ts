import { Request, Response } from 'express';
import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

// 모든 문항 조회
export const getAllQuestions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category, difficulty, templateCode } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.QuestionWhereInput = {};

    if (category) {
      where.category = category as string;
    }

    if (difficulty) {
      where.difficulty = difficulty as string;
    }

    if (templateCode) {
      where.template = {
        templateCode: templateCode as string,
      };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        include: {
          template: {
            select: {
              templateCode: true,
              title: true,
              grade: true,
            },
          },
        },
        orderBy: [
          { template: { grade: 'asc' } },
          { questionNumber: 'asc' },
        ],
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('문항 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '문항 조회에 실패했습니다.',
    });
  }
};

// 특정 템플릿의 문항 조회
export const getQuestionsByTemplate = async (req: Request, res: Response) => {
  try {
    const { templateCode } = req.params;

    const questions = await prisma.question.findMany({
      where: {
        template: {
          templateCode,
        },
      },
      include: {
        template: {
          select: {
            templateCode: true,
            title: true,
            grade: true,
            totalQuestions: true,
            timeLimit: true,
          },
        },
      },
      orderBy: {
        questionNumber: 'asc',
      },
    });

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 템플릿의 문항을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: {
        template: questions[0].template,
        questions,
      },
    });
  } catch (error) {
    console.error('템플릿 문항 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '문항 조회에 실패했습니다.',
    });
  }
};

// 특정 문항 조회
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            templateCode: true,
            title: true,
            grade: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '문항을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('문항 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '문항 조회에 실패했습니다.',
    });
  }
};

// 문항 생성
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const {
      templateCode,
      questionNumber,
      category,
      questionType,
      questionText,
      passage,
      options,
      correctAnswer,
      points,
      difficulty,
      explanation,
    } = req.body;

    // 템플릿 존재 확인
    const template = await prisma.testTemplate.findUnique({
      where: { templateCode },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 테스트 템플릿입니다.',
      });
    }

    // 문항 번호 중복 확인
    const existingQuestion = await prisma.question.findFirst({
      where: {
        templateId: template.id,
        questionNumber,
      },
    });

    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 문항 번호입니다.',
      });
    }

    const question = await prisma.question.create({
      data: {
        templateId: template.id,
        questionNumber,
        category,
        questionType,
        questionText,
        passage,
        options,
        correctAnswer,
        points,
        difficulty,
        explanation,
      },
      include: {
        template: {
          select: {
            templateCode: true,
            title: true,
            grade: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '문항이 생성되었습니다.',
      data: question,
    });
  } catch (error) {
    console.error('문항 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '문항 생성에 실패했습니다.',
    });
  }
};

// 문항 수정
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      questionNumber,
      category,
      questionType,
      questionText,
      passage,
      options,
      correctAnswer,
      points,
      difficulty,
      explanation,
    } = req.body;

    // 문항 존재 확인
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: '문항을 찾을 수 없습니다.',
      });
    }

    // 문항 번호 변경 시 중복 확인
    if (questionNumber && questionNumber !== existingQuestion.questionNumber) {
      const duplicateQuestion = await prisma.question.findFirst({
        where: {
          templateId: existingQuestion.templateId,
          questionNumber,
          id: { not: id },
        },
      });

      if (duplicateQuestion) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 문항 번호입니다.',
        });
      }
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(questionNumber !== undefined && { questionNumber }),
        ...(category && { category }),
        ...(questionType && { questionType }),
        ...(questionText && { questionText }),
        ...(passage !== undefined && { passage }),
        ...(options !== undefined && { options }),
        ...(correctAnswer && { correctAnswer }),
        ...(points !== undefined && { points }),
        ...(difficulty && { difficulty }),
        ...(explanation !== undefined && { explanation }),
      },
      include: {
        template: {
          select: {
            templateCode: true,
            title: true,
            grade: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: '문항이 수정되었습니다.',
      data: question,
    });
  } catch (error) {
    console.error('문항 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '문항 수정에 실패했습니다.',
    });
  }
};

// 문항 삭제
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 문항 존재 확인
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '문항을 찾을 수 없습니다.',
      });
    }

    // 문항이 사용된 답안이 있는지 확인
    const answerCount = await prisma.answer.count({
      where: { questionId: id },
    });

    if (answerCount > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 사용된 문항은 삭제할 수 없습니다.',
      });
    }

    await prisma.question.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '문항이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('문항 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '문항 삭제에 실패했습니다.',
    });
  }
};
