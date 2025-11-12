// Admin seed controller
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../errors/api-error';
import { grade1Data } from '../../data/seeds/grade1';
import { grade2Data } from '../../data/seeds/grade2';
import { grade3Data } from '../../data/seeds/grade3';
import { grade4Data } from '../../data/seeds/grade4';
import { grade5Data } from '../../data/seeds/grade5';
import { grade6Data } from '../../data/seeds/grade6';
import { grade7Data } from '../../data/seeds/grade7';
import { grade8Data } from '../../data/seeds/grade8';
import { grade9Data } from '../../data/seeds/grade9';

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
 * Run database seed (admin only)
 */
export const runSeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return next(new ApiError('Only administrators can run database seed', 403));
    }

    console.log('🌱 Starting database seeding via API...\n');

    const gradeData = [
      grade1Data,
      grade2Data,
      grade3Data,
      grade4Data,
      grade5Data,
      grade6Data,
      grade7Data,
      grade8Data,
      grade9Data,
    ];

    const templates: any[] = [];
    let totalQuestions = 0;

    // Seed templates
    for (const data of gradeData) {
      const template = await prisma.testTemplate.upsert({
        where: { templateCode: data.template.templateCode },
        update: {},
        create: {
          templateCode: data.template.templateCode,
          grade: data.template.grade,
          title: data.template.title,
          version: data.template.version,
          totalQuestions: data.template.totalQuestions,
          timeLimit: data.template.timeLimit,
          isActive: data.template.isActive,
        },
      });
      templates.push(template);
    }

    // Seed questions
    for (let i = 0; i < gradeData.length; i++) {
      const data = gradeData[i];
      const template = templates[i];

      for (const question of data.questions) {
        await prisma.question.upsert({
          where: {
            templateId_questionNumber: {
              templateId: template.id,
              questionNumber: question.questionNumber,
            },
          } as any,
          update: {},
          create: {
            templateId: template.id,
            questionNumber: question.questionNumber,
            category: question.category,
            questionType: question.questionType,
            questionText: question.questionText,
            passage: question.passage ?? undefined,
            options: question.options ? JSON.parse(JSON.stringify(question.options)) : undefined,
            correctAnswer: question.correctAnswer,
            points: question.points,
            difficulty: question.difficulty ?? undefined,
            explanation: question.explanation ?? undefined,
          },
        });
        totalQuestions++;
      }
    }

    res.json({
      success: true,
      data: {
        templatesCreated: templates.length,
        questionsCreated: totalQuestions,
        grades: templates.map((t) => t.grade),
      },
      message: 'Database seeding completed successfully',
    });
  } catch (error) {
    console.error('Error running seed:', error);
    next(new ApiError('Failed to run database seed', 500));
  }
};
