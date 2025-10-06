import { Request, Response, NextFunction } from 'express';
import { PrismaClient, QuestionCategory } from '@prisma/client';
import { ApiError } from '../errors/api-error';
import { getPeerStatistics, calculateStudentPercentile } from '../services/peer-statistics.service';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * 학생 평가 결과 상세 레포트 생성
 */
export const generateDetailedReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resultId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // 결과 조회
    const result = await prisma.testResult.findUnique({
      where: { id: resultId },
      include: {
        session: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
            template: true,
            answers: {
              include: { question: true },
              orderBy: { questionNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!result) {
      return next(new ApiError('Test result not found', 404));
    }

    const { session } = result;
    const studentGrade = session.student.grade;

    // 영역별 점수 계산
    const categoryScores = calculateCategoryScores(session.answers);

    // 또래 평균 데이터 조회
    const peerStats = await getPeerStatistics(studentGrade);

    // 또래 비교 데이터 생성
    const peerComparison = await generatePeerComparison(
      studentGrade,
      categoryScores,
      peerStats
    );

    // 강점/약점 분석
    const analysis = analyzeStrengthsWeaknesses(categoryScores, peerComparison);

    // 학습 제안 생성 (간단한 룰 기반)
    const recommendations = generateRecommendations(analysis, studentGrade);

    // 레포트 데이터
    const reportData = {
      // 기본 정보
      student: {
        name: session.student.user.name,
        grade: studentGrade,
        className: session.student.className,
      },
      test: {
        title: session.template.title,
        date: session.completedAt,
        duration: session.startedAt && session.completedAt
          ? Math.round(
              (new Date(session.completedAt).getTime() -
                new Date(session.startedAt).getTime()) /
                60000
            )
          : null,
      },

      // 종합 성적
      overall: {
        totalScore: result.totalScore,
        totalPossible: result.totalPossible,
        percentage: parseFloat(result.percentage.toString()),
        gradeLevel: result.gradeLevel,
        correctAnswers: result.correctAnswers,
        incorrectAnswers: result.incorrectAnswers,
      },

      // 영역별 성적
      categoryScores: Object.entries(categoryScores).map(([category, data]) => ({
        category,
        categoryName: getCategoryName(category as QuestionCategory),
        score: data.score,
        maxScore: data.maxScore,
        percentage: data.percentage,
        peerAverage: peerComparison[category]?.peerAvg || 0,
        percentile: peerComparison[category]?.percentile || 50,
      })),

      // 또래 비교
      peerComparison,

      // 강점/약점
      analysis,

      // 학습 제안
      recommendations,

      // 상세 답변 (오답 중심)
      incorrectAnswers: session.answers
        .filter((a) => !a.isCorrect)
        .map((a) => ({
          questionNumber: a.questionNumber,
          category: a.question.category,
          categoryName: getCategoryName(a.question.category),
          questionText: a.question.questionText,
          studentAnswer: a.studentAnswer,
          correctAnswer: a.question.correctAnswer,
          explanation: a.question.explanation,
          feedback: a.feedback,
        })),
    };

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 영역별 점수 계산
 */
function calculateCategoryScores(answers: any[]) {
  const categoryScores: Record<
    string,
    { score: number; maxScore: number; percentage: number }
  > = {};

  for (const answer of answers) {
    const category = answer.question.category;
    if (!categoryScores[category]) {
      categoryScores[category] = { score: 0, maxScore: 0, percentage: 0 };
    }
    categoryScores[category].score += answer.pointsEarned;
    categoryScores[category].maxScore += answer.question.points;
  }

  // 퍼센트 계산
  for (const category in categoryScores) {
    const data = categoryScores[category];
    data.percentage = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0;
  }

  return categoryScores;
}

/**
 * 또래 비교 데이터 생성
 */
async function generatePeerComparison(
  grade: number,
  categoryScores: Record<string, any>,
  peerStats: any[]
) {
  const comparison: Record<string, any> = {};

  for (const [category, scores] of Object.entries(categoryScores)) {
    const peerStat = peerStats.find((p) => p.category === category);

    if (peerStat) {
      const percentile = await calculateStudentPercentile(
        grade,
        category as QuestionCategory,
        scores.percentage
      );

      comparison[category] = {
        studentScore: scores.percentage,
        peerAvg: parseFloat(peerStat.avgPercentage.toString()),
        difference: scores.percentage - parseFloat(peerStat.avgPercentage.toString()),
        percentile,
        percentileDistribution: peerStat.percentileDistribution,
      };
    }
  }

  return comparison;
}

/**
 * 강점/약점 분석
 */
function analyzeStrengthsWeaknesses(
  categoryScores: Record<string, any>,
  peerComparison: Record<string, any>
) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [category] of Object.entries(categoryScores)) {
    const comparison = peerComparison[category];
    if (!comparison) continue;

    const categoryName = getCategoryName(category as QuestionCategory);

    // 또래 평균보다 10% 이상 높으면 강점
    if (comparison.difference > 10) {
      strengths.push(
        `${categoryName} 영역에서 또래 평균(${comparison.peerAvg.toFixed(1)}%)보다 ${comparison.difference.toFixed(1)}% 높은 우수한 성과`
      );
    }

    // 또래 평균보다 10% 이상 낮으면 약점
    if (comparison.difference < -10) {
      weaknesses.push(
        `${categoryName} 영역 보완 필요 (또래 평균 대비 ${Math.abs(comparison.difference).toFixed(1)}% 낮음)`
      );
    }

    // 백분위 기반 분석
    if (comparison.percentile >= 80) {
      strengths.push(`${categoryName} 영역 상위 ${100 - comparison.percentile}% 이내`);
    } else if (comparison.percentile <= 30) {
      weaknesses.push(`${categoryName} 영역 집중 학습 권장`);
    }
  }

  return { strengths, weaknesses };
}

/**
 * 학습 제안 생성
 */
function generateRecommendations(
  analysis: { strengths: string[]; weaknesses: string[] },
  grade: number
) {
  const recommendations: string[] = [];

  // 약점 기반 제안
  if (analysis.weaknesses.length > 0) {
    recommendations.push('📚 우선 학습 영역:');
    analysis.weaknesses.forEach((w) => recommendations.push(`  • ${w}`));
  }

  // 학년별 일반 제안
  if (grade <= 6) {
    recommendations.push('📖 초등 학습 팁:');
    recommendations.push('  • 매일 15-20분 독서 습관 들이기');
    recommendations.push('  • 읽은 내용을 자신의 말로 설명하기');
  } else {
    recommendations.push('📖 중등 학습 팁:');
    recommendations.push('  • 다양한 장르의 글 읽기');
    recommendations.push('  • 주장과 근거 파악 연습');
  }

  return recommendations;
}

/**
 * 카테고리 한글명
 */
function getCategoryName(category: QuestionCategory): string {
  const names: Record<QuestionCategory, string> = {
    vocabulary: '어휘력',
    reading: '독해력',
    grammar: '문법',
    reasoning: '추론',
    reading_motivation: '읽기 동기',
    writing_motivation: '쓰기 동기',
    reading_environment: '독서 환경',
    reading_habit: '독서 습관',
    reading_preference: '선호 장르',
  };
  return names[category] || category;
}
