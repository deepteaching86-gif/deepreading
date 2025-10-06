// Templates controller
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';

const prisma = new PrismaClient();

/**
 * Get all active test templates
 */
export const getAllTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.testTemplate.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        templateCode: true,
        grade: true,
        title: true,
        totalQuestions: true,
        timeLimit: true,
        version: true,
        createdAt: true,
      },
      orderBy: {
        grade: 'asc',
      },
    });

    res.json({
      success: true,
      data: templates,
      message: 'Templates retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    next(new ApiError('Failed to fetch templates', 500));
  }
};

/**
 * Get template by code
 */
export const getTemplateByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;

    const template = await prisma.testTemplate.findUnique({
      where: {
        templateCode: code,
      },
      include: {
        questions: {
          select: {
            id: true,
            questionNumber: true,
            category: true,
            questionType: true,
            questionText: true,
            passage: true,
            options: true,
            points: true,
            difficulty: true,
          },
          orderBy: {
            questionNumber: 'asc',
          },
        },
      },
    });

    if (!template) {
      return next(new ApiError('Template not found', 404));
    }

    if (!template.isActive) {
      return next(new ApiError('Template is not active', 400));
    }

    res.json({
      success: true,
      data: template,
      message: 'Template retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    console.error('Error fetching template:', error);
    next(new ApiError('Failed to fetch template', 500));
  }
};
