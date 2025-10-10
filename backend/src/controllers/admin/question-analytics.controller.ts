import { Request, Response } from 'express';
import { prisma } from '../../config/database';

interface QuestionStats {
  id: string;
  questionNumber: number;
  questionText: string;
  category: string;
  difficulty: string | null;
  templateCode: string;
  templateTitle: string;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  avgScore: number;
  discrimination: number;
  qualityFlag: 'excellent' | 'good' | 'review' | 'revise';
  topStudentsCorrectRate: number;
  bottomStudentsCorrectRate: number;
  commonWrongAnswers: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
  lastUsed: string | null;
}

/**
 * Get question analytics
 * 문항별 통계 데이터 및 품질 분석
 */
export const getQuestionAnalytics = async (req: Request, res: Response) => {
  try {
    const { templateCode } = req.query;

    // Build where clause
    const where: any = {};
    if (templateCode && templateCode !== 'all') {
      where.template = { templateCode: templateCode as string };
    }

    // Get all questions with their answers
    const questions = await prisma.question.findMany({
      where,
      include: {
        template: {
          select: {
            templateCode: true,
            title: true,
          },
        },
        answers: {
          include: {
            session: {
              include: {
                result: true,
              },
            },
          },
        },
      },
      orderBy: {
        questionNumber: 'asc',
      },
    });

    // Calculate statistics for each question
    const questionStats: QuestionStats[] = questions.map((question) => {
      const answers = question.answers;
      const totalAttempts = answers.length;
      const correctAttempts = answers.filter((a) => a.isCorrect).length;
      const correctRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const avgScore =
        totalAttempts > 0
          ? answers.reduce((sum, a) => sum + a.pointsEarned, 0) / totalAttempts
          : 0;

      // Calculate discrimination index (변별도)
      // Compare top 27% and bottom 27% of students
      const answersWithScores = answers
        .filter((a) => a.session?.result)
        .map((a) => ({
          answer: a,
          totalScore: a.session?.result?.totalScore || 0,
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      const topCount = Math.ceil(answersWithScores.length * 0.27);
      const bottomCount = Math.ceil(answersWithScores.length * 0.27);

      const topStudents = answersWithScores.slice(0, topCount);
      const bottomStudents = answersWithScores.slice(-bottomCount);

      const topCorrect = topStudents.filter((s) => s.answer.isCorrect).length;
      const bottomCorrect = bottomStudents.filter((s) => s.answer.isCorrect).length;

      const topStudentsCorrectRate = topCount > 0 ? (topCorrect / topCount) * 100 : 0;
      const bottomStudentsCorrectRate = bottomCount > 0 ? (bottomCorrect / bottomCount) * 100 : 0;

      const discrimination =
        topCount > 0 && bottomCount > 0
          ? (topStudentsCorrectRate - bottomStudentsCorrectRate) / 100
          : 0;

      // Determine quality flag
      let qualityFlag: 'excellent' | 'good' | 'review' | 'revise' = 'good';

      if (correctRate >= 95 || correctRate <= 10) {
        qualityFlag = 'revise'; // 너무 쉽거나 어려움
      } else if (discrimination < 0.2) {
        qualityFlag = 'revise'; // 변별도 낮음
      } else if (correctRate >= 90 || correctRate <= 30) {
        qualityFlag = 'review'; // 검토 필요
      } else if (discrimination >= 0.4 && correctRate >= 40 && correctRate <= 80) {
        qualityFlag = 'excellent'; // 우수
      }

      // Find common wrong answers
      const wrongAnswers = answers.filter((a) => !a.isCorrect);
      const answerCounts = new Map<string, number>();

      wrongAnswers.forEach((a) => {
        const answer = a.studentAnswer?.trim() || '';
        if (answer) {
          answerCounts.set(answer, (answerCounts.get(answer) || 0) + 1);
        }
      });

      const commonWrongAnswers = Array.from(answerCounts.entries())
        .map(([answer, count]) => ({
          answer,
          count,
          percentage: totalAttempts > 0 ? (count / totalAttempts) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 wrong answers

      // Last used date
      const lastUsed =
        answers.length > 0
          ? answers
              .map((a) => a.session?.completedAt)
              .filter((d) => d)
              .sort((a, b) => (b && a ? b.getTime() - a.getTime() : 0))[0] || null
          : null;

      return {
        id: question.id,
        questionNumber: question.questionNumber,
        questionText: question.questionText.substring(0, 100), // Truncate for list view
        category: question.category,
        difficulty: question.difficulty,
        templateCode: question.template.templateCode,
        templateTitle: question.template.title,
        totalAttempts,
        correctAttempts,
        correctRate: Math.round(correctRate * 10) / 10,
        avgScore: Math.round(avgScore * 10) / 10,
        discrimination: Math.round(discrimination * 100) / 100,
        qualityFlag,
        topStudentsCorrectRate: Math.round(topStudentsCorrectRate * 10) / 10,
        bottomStudentsCorrectRate: Math.round(bottomStudentsCorrectRate * 10) / 10,
        commonWrongAnswers,
        lastUsed: lastUsed ? lastUsed.toISOString() : null,
      };
    });

    res.json({
      success: true,
      data: questionStats,
    });
  } catch (error) {
    console.error('Error fetching question analytics:', error);
    res.status(500).json({
      success: false,
      message: '문항 분석 데이터를 불러오는데 실패했습니다.',
    });
  }
};

/**
 * Get template analytics
 * 템플릿별 통계 요약
 */
export const getTemplateAnalytics = async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.testTemplate.findMany({
      include: {
        questions: {
          include: {
            answers: {
              include: {
                session: {
                  include: {
                    result: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const templateStats = templates.map((template) => {
      const questions = template.questions;
      const totalQuestions = questions.length;

      // Calculate quality distribution
      const qualityDistribution = {
        excellent: 0,
        good: 0,
        review: 0,
        revise: 0,
      };

      let totalCorrectRate = 0;
      let totalDiscrimination = 0;
      let questionsWithStats = 0;

      questions.forEach((question) => {
        const answers = question.answers;
        const totalAttempts = answers.length;

        if (totalAttempts === 0) return;

        const correctAttempts = answers.filter((a) => a.isCorrect).length;
        const correctRate = (correctAttempts / totalAttempts) * 100;

        // Calculate discrimination
        const answersWithScores = answers
          .filter((a) => a.session?.result)
          .map((a) => ({
            answer: a,
            totalScore: a.session?.result?.totalScore || 0,
          }))
          .sort((a, b) => b.totalScore - a.totalScore);

        const topCount = Math.ceil(answersWithScores.length * 0.27);
        const bottomCount = Math.ceil(answersWithScores.length * 0.27);

        const topStudents = answersWithScores.slice(0, topCount);
        const bottomStudents = answersWithScores.slice(-bottomCount);

        const topCorrect = topStudents.filter((s) => s.answer.isCorrect).length;
        const bottomCorrect = bottomStudents.filter((s) => s.answer.isCorrect).length;

        const topRate = topCount > 0 ? (topCorrect / topCount) * 100 : 0;
        const bottomRate = bottomCount > 0 ? (bottomCorrect / bottomCount) * 100 : 0;

        const discrimination = topCount > 0 && bottomCount > 0 ? (topRate - bottomRate) / 100 : 0;

        totalCorrectRate += correctRate;
        totalDiscrimination += discrimination;
        questionsWithStats++;

        // Determine quality flag
        if (correctRate >= 95 || correctRate <= 10 || discrimination < 0.2) {
          qualityDistribution.revise++;
        } else if (correctRate >= 90 || correctRate <= 30) {
          qualityDistribution.review++;
        } else if (discrimination >= 0.4 && correctRate >= 40 && correctRate <= 80) {
          qualityDistribution.excellent++;
        } else {
          qualityDistribution.good++;
        }
      });

      const avgCorrectRate =
        questionsWithStats > 0 ? totalCorrectRate / questionsWithStats : 0;
      const avgDiscrimination =
        questionsWithStats > 0 ? totalDiscrimination / questionsWithStats : 0;

      return {
        templateCode: template.templateCode,
        title: template.title,
        totalQuestions,
        avgCorrectRate: Math.round(avgCorrectRate * 10) / 10,
        avgDiscrimination: Math.round(avgDiscrimination * 100) / 100,
        qualityDistribution,
      };
    });

    res.json({
      success: true,
      data: templateStats,
    });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    res.status(500).json({
      success: false,
      message: '템플릿 분석 데이터를 불러오는데 실패했습니다.',
    });
  }
};

/**
 * Get detailed question analytics
 * 특정 문항의 상세 분석
 */
export const getQuestionDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        template: true,
        answers: {
          include: {
            session: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
                result: true,
              },
            },
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

    // Calculate detailed statistics
    const answers = question.answers;
    const totalAttempts = answers.length;
    const correctAttempts = answers.filter((a) => a.isCorrect).length;
    const correctRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    // Time-series data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnswers = answers.filter(
      (a) => a.session?.completedAt && a.session.completedAt >= thirtyDaysAgo
    );

    // Group by date
    const dateGroups = new Map<string, { total: number; correct: number }>();

    recentAnswers.forEach((a) => {
      if (!a.session?.completedAt) return;
      const dateKey = a.session.completedAt.toISOString().split('T')[0];
      const group = dateGroups.get(dateKey) || { total: 0, correct: 0 };
      group.total++;
      if (a.isCorrect) group.correct++;
      dateGroups.set(dateKey, group);
    });

    const timeSeriesData = Array.from(dateGroups.entries())
      .map(([date, data]) => ({
        date,
        correctRate: (data.correct / data.total) * 100,
        attempts: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      data: {
        question: {
          id: question.id,
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          category: question.category,
          difficulty: question.difficulty,
          passage: question.passage,
          imageUrl: question.imageUrl,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        },
        template: {
          code: question.template.templateCode,
          title: question.template.title,
        },
        statistics: {
          totalAttempts,
          correctAttempts,
          correctRate: Math.round(correctRate * 10) / 10,
        },
        timeSeriesData,
      },
    });
  } catch (error) {
    console.error('Error fetching question detail:', error);
    return res.status(500).json({
      success: false,
      message: '문항 상세 정보를 불러오는데 실패했습니다.',
    });
  }
};
