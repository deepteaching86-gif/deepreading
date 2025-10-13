// Vision TEST Template Management Controller

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { VisionConfig, VisionTestError, VisionErrorCode } from '../../types/vision.types';

const prisma = new PrismaClient();

/**
 * GET /api/v1/vision/templates
 * List Vision TEST templates
 */
export const listVisionTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade, status = 'active' } = req.query;

    const where: any = {
      templateType: 'vision',
      isActive: status === 'active'
    };

    if (grade) {
      where.grade = parseInt(grade as string);
    }

    const templates = await prisma.testTemplate.findMany({
      where,
      orderBy: [{ grade: 'asc' }, { createdAt: 'desc' }]
    });

    res.status(200).json({
      templates: templates.map(t => ({
        id: t.id,
        templateCode: t.templateCode,
        grade: t.grade,
        title: t.title,
        description: t.description,
        totalQuestions: t.totalQuestions,
        isActive: t.isActive,
        visionConfig: t.visionConfig
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vision/templates/:templateId
 * Get Vision TEST template details
 */
export const getVisionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { templateId } = req.params;

    const template = await prisma.testTemplate.findUnique({
      where: { id: templateId },
      include: { questions: true }
    });

    if (!template || template.templateType !== 'vision') {
      throw new VisionTestError(
        VisionErrorCode.SESSION_NOT_FOUND,
        'Vision template not found',
        404
      );
    }

    res.status(200).json(template);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vision/templates
 * Create new Vision TEST template
 */
export const createVisionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grade, title, description, visionConfig } = req.body;

    const templateCode = `VISION_G${grade}_${Date.now()}`;

    const template = await prisma.testTemplate.create({
      data: {
        templateCode,
        grade,
        title,
        description,
        templateType: 'vision',
        visionConfig,
        totalQuestions: visionConfig.passages.length,
        totalPoints: visionConfig.passages.length * 10,
        passingScore: 60,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/vision/templates/:templateId
 * Update Vision TEST template
 */
export const updateVisionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { title, description, visionConfig, isActive } = req.body;

    const template = await prisma.testTemplate.update({
      where: { id: templateId },
      data: {
        title,
        description,
        visionConfig,
        isActive,
        totalQuestions: visionConfig?.passages?.length
      }
    });

    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/vision/templates/:templateId
 * Delete Vision TEST template
 */
export const deleteVisionTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { templateId } = req.params;

    await prisma.testTemplate.update({
      where: { id: templateId },
      data: { isActive: false }
    });

    res.status(200).json({
      success: true,
      message: 'Template deactivated'
    });
  } catch (error) {
    next(error);
  }
};
