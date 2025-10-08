import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

interface ScoringResult {
  totalScore: number;
  totalPossible: number;
  percentage: number;
  vocabularyScore: number;
  readingScore: number;
  grammarScore: number;
  reasoningScore: number;
  readingMotivationScore: number | null;
  writingMotivationScore: number | null;
  readingEnvironmentScore: number | null;
  readingHabitScore: number | null;
  readingPreferenceData: any | null;
  gradeLevel: number;
  percentile: number | null;
  strengths: any[];
  weaknesses: any[];
  recommendations: any[];
}

export class ScoringService {
  /**
   * 세션 채점 및 결과 생성
   */
  async scoreSession(sessionId: string): Promise<ScoringResult> {
    // 1. 세션과 답안 조회
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        template: true,
        student: true,
      },
    });

    if (!session) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    // 2. 각 답안 채점
    let totalScore = 0;
    let totalPossible = 0;
    const categoryScores: Record<string, { score: number; possible: number }> = {
      vocabulary: { score: 0, possible: 0 },
      reading: { score: 0, possible: 0 },
      grammar: { score: 0, possible: 0 },
      reasoning: { score: 0, possible: 0 },
      reading_motivation: { score: 0, possible: 0 },
      writing_motivation: { score: 0, possible: 0 },
      reading_environment: { score: 0, possible: 0 },
      reading_habit: { score: 0, possible: 0 },
      reading_preference: { score: 0, possible: 0 },
    };

    for (const answer of session.answers) {
      const question = answer.question;
      const isCorrect = this.checkAnswer(
        question.correctAnswer,
        answer.studentAnswer || ''
      );

      const pointsEarned = isCorrect ? question.points : 0;

      // 답안 업데이트
      await prisma.answer.update({
        where: { id: answer.id },
        data: {
          isCorrect,
          pointsEarned,
        },
      });

      // 카테고리별 점수 집계
      const category = question.category;
      if (categoryScores[category]) {
        categoryScores[category].score += pointsEarned;
        categoryScores[category].possible += question.points;
      }

      totalScore += pointsEarned;
      totalPossible += question.points;
    }

    // 3. 설문 점수 계산
    const surveyScores = this.calculateSurveyScores(session.answers);

    // 4. 백분율 계산
    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // 5. 등급 계산
    const gradeLevel = this.calculateGradeLevel(percentage);

    // 6. 백분위 계산 (통계 데이터 기반)
    const percentile = await this.calculatePercentile(
      session.template.grade,
      session.templateId,
      percentage
    );

    // 7. 강점/약점 분석
    const analysis = this.analyzePerformance(categoryScores, surveyScores);

    // 8. 학습 제안 생성
    const recommendations = this.generateRecommendations(
      analysis.weaknesses,
      surveyScores,
      session.template.grade
    );

    // 9. 결과 저장
    await prisma.testResult.create({
      data: {
        sessionId,
        totalScore,
        totalPossible,
        percentage: new Prisma.Decimal(percentage.toFixed(2)),
        gradeLevel,
        percentile: percentile ? new Prisma.Decimal(percentile.toFixed(2)) : null,
        vocabularyScore: categoryScores.vocabulary.score,
        readingScore: categoryScores.reading.score,
        grammarScore: categoryScores.grammar.score,
        reasoningScore: categoryScores.reasoning.score,
        readingMotivationScore: surveyScores.readingMotivation,
        writingMotivationScore: surveyScores.writingMotivation,
        readingEnvironmentScore: surveyScores.readingEnvironment,
        readingHabitScore: surveyScores.readingHabit,
        readingPreferenceData: surveyScores.readingPreferenceData,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations,
      },
    });

    // 10. 세션 상태 업데이트
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: 'scored',
        scoredAt: new Date(),
      },
    });

    return {
      totalScore,
      totalPossible,
      percentage,
      vocabularyScore: categoryScores.vocabulary.score,
      readingScore: categoryScores.reading.score,
      grammarScore: categoryScores.grammar.score,
      reasoningScore: categoryScores.reasoning.score,
      readingMotivationScore: surveyScores.readingMotivation,
      writingMotivationScore: surveyScores.writingMotivation,
      readingEnvironmentScore: surveyScores.readingEnvironment,
      readingHabitScore: surveyScores.readingHabit,
      readingPreferenceData: surveyScores.readingPreferenceData,
      gradeLevel,
      percentile,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations,
    };
  }

  /**
   * 답안 정답 여부 확인
   */
  private checkAnswer(correctAnswer: string, studentAnswer: string): boolean {
    const correct = correctAnswer.trim().toLowerCase();
    const student = studentAnswer.trim().toLowerCase();

    // 숫자 답안인 경우
    if (!isNaN(Number(correct)) && !isNaN(Number(student))) {
      return Number(correct) === Number(student);
    }

    return correct === student;
  }

  /**
   * 설문 점수 계산
   */
  private calculateSurveyScores(answers: any[]): {
    readingMotivation: number | null;
    writingMotivation: number | null;
    readingEnvironment: number | null;
    readingHabit: number | null;
    readingPreferenceData: any | null;
  } {
    const surveyAnswers = answers.filter((a) =>
      [
        'reading_motivation',
        'writing_motivation',
        'reading_environment',
        'reading_habit',
        'reading_preference',
      ].includes(a.question.category)
    );

    if (surveyAnswers.length === 0) {
      return {
        readingMotivation: null,
        writingMotivation: null,
        readingEnvironment: null,
        readingHabit: null,
        readingPreferenceData: null,
      };
    }

    const categories = {
      reading_motivation: [] as number[],
      writing_motivation: [] as number[],
      reading_environment: [] as number[],
      reading_habit: [] as number[],
      reading_preference: [] as any[],
    };

    for (const answer of surveyAnswers) {
      const category = answer.question.category;
      const studentAnswer = answer.studentAnswer;

      if (category === 'reading_preference') {
        categories.reading_preference.push({
          questionNumber: answer.question.questionNumber,
          answer: studentAnswer,
        });
      } else {
        const score = parseInt(studentAnswer || '0');
        if (!isNaN(score)) {
          categories[category as keyof typeof categories].push(score);
        }
      }
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    return {
      readingMotivation: avg(categories.reading_motivation),
      writingMotivation: avg(categories.writing_motivation),
      readingEnvironment: avg(categories.reading_environment),
      readingHabit: avg(categories.reading_habit),
      readingPreferenceData:
        categories.reading_preference.length > 0
          ? { answers: categories.reading_preference }
          : null,
    };
  }

  /**
   * 등급 계산 (1-9등급)
   * 1등급(최고) ~ 9등급(최하)
   */
  private calculateGradeLevel(percentage: number): number {
    if (percentage >= 96) return 1;  // 96% 이상 → 1등급
    if (percentage >= 89) return 2;  // 89-95% → 2등급
    if (percentage >= 77) return 3;  // 77-88% → 3등급
    if (percentage >= 60) return 4;  // 60-76% → 4등급
    if (percentage >= 40) return 5;  // 40-59% → 5등급
    if (percentage >= 23) return 6;  // 23-39% → 6등급
    if (percentage >= 11) return 7;  // 11-22% → 7등급
    if (percentage >= 4) return 8;   // 4-10% → 8등급
    return 9;                        // 0-3% → 9등급
  }

  /**
   * 백분위 계산
   */
  private async calculatePercentile(
    grade: number,
    templateId: string,
    percentage: number
  ): Promise<number | null> {
    const stat = await prisma.statistic.findFirst({
      where: {
        grade,
        templateId,
      },
    });

    if (!stat || !stat.avgScore || !stat.stdDeviation) {
      return null;
    }

    // Z-score 계산
    const zScore =
      (percentage - parseFloat(stat.avgScore.toString())) /
      parseFloat(stat.stdDeviation.toString());

    // Z-score를 백분위로 변환 (정규분포 가정)
    const percentile = this.zScoreToPercentile(zScore);

    return percentile;
  }

  /**
   * Error function (erf) approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Z-score를 백분위로 변환
   */
  private zScoreToPercentile(zScore: number): number {
    // 간단한 근사 공식 사용
    const percentile = 50 + 50 * this.erf(zScore / Math.sqrt(2));
    return Math.max(0, Math.min(100, percentile));
  }

  /**
   * 강점/약점 분석
   */
  private analyzePerformance(
    categoryScores: Record<string, { score: number; possible: number }>,
    surveyScores: any
  ): {
    strengths: any[];
    weaknesses: any[];
  } {
    const strengths: any[] = [];
    const weaknesses: any[] = [];

    // 영역별 분석
    const categories = ['vocabulary', 'reading', 'grammar', 'reasoning'];

    for (const category of categories) {
      const { score, possible } = categoryScores[category];
      if (possible === 0) continue;

      const percentage = (score / possible) * 100;

      if (percentage >= 80) {
        strengths.push({
          category,
          percentage: percentage.toFixed(1),
          description: this.getCategoryDescription(category, 'strength'),
        });
      } else if (percentage < 50) {
        weaknesses.push({
          category,
          percentage: percentage.toFixed(1),
          description: this.getCategoryDescription(category, 'weakness'),
        });
      }
    }

    // 설문 분석
    if (surveyScores.readingMotivation !== null) {
      if (surveyScores.readingMotivation >= 4.0) {
        strengths.push({
          category: 'reading_motivation',
          score: surveyScores.readingMotivation.toFixed(2),
          description: '독서에 대한 높은 흥미와 동기를 보입니다.',
        });
      } else if (surveyScores.readingMotivation < 2.5) {
        weaknesses.push({
          category: 'reading_motivation',
          score: surveyScores.readingMotivation.toFixed(2),
          description: '독서 동기가 부족합니다.',
        });
      }
    }

    if (surveyScores.readingEnvironment !== null) {
      if (surveyScores.readingEnvironment < 2.5) {
        weaknesses.push({
          category: 'reading_environment',
          score: surveyScores.readingEnvironment.toFixed(2),
          description: '가정 내 독서 환경 개선이 필요합니다.',
        });
      }
    }

    return { strengths, weaknesses };
  }

  /**
   * 카테고리 설명 생성
   */
  private getCategoryDescription(
    category: string,
    type: 'strength' | 'weakness'
  ): string {
    const descriptions: Record<string, Record<string, string>> = {
      vocabulary: {
        strength: '어휘력이 우수합니다.',
        weakness: '어휘력 향상이 필요합니다.',
      },
      reading: {
        strength: '독해력이 뛰어납니다.',
        weakness: '독해력 강화가 필요합니다.',
      },
      grammar: {
        strength: '문법 이해도가 높습니다.',
        weakness: '문법 학습이 필요합니다.',
      },
      reasoning: {
        strength: '논리적 사고력이 강합니다.',
        weakness: '추론 능력 향상이 필요합니다.',
      },
    };

    return descriptions[category]?.[type] || '';
  }

  /**
   * 학습 제안 생성
   */
  private generateRecommendations(
    weaknesses: any[],
    surveyScores: any,
    _grade: number
  ): any[] {
    const recommendations: any[] = [];

    for (const weakness of weaknesses) {
      if (weakness.category === 'vocabulary') {
        recommendations.push({
          category: 'vocabulary',
          priority: 'high',
          suggestion: '매일 10개의 새로운 단어를 학습하고 문장으로 만들어보세요.',
          resources: ['어휘력 향상 교재', '단어장 앱'],
        });
      } else if (weakness.category === 'reading') {
        recommendations.push({
          category: 'reading',
          priority: 'high',
          suggestion: '하루 20분씩 수준에 맞는 책을 소리 내어 읽어보세요.',
          resources: ['학년별 권장 도서', '독해력 문제집'],
        });
      } else if (weakness.category === 'grammar') {
        recommendations.push({
          category: 'grammar',
          priority: 'medium',
          suggestion: '기초 문법 규칙을 체계적으로 학습하세요.',
          resources: ['문법 학습 교재', '온라인 문법 강의'],
        });
      } else if (weakness.category === 'reasoning') {
        recommendations.push({
          category: 'reasoning',
          priority: 'medium',
          suggestion: '논리 퍼즐과 추론 문제를 풀어보세요.',
          resources: ['사고력 교재', '논리 게임'],
        });
      } else if (weakness.category === 'reading_motivation') {
        recommendations.push({
          category: 'reading_motivation',
          priority: 'high',
          suggestion: '흥미로운 주제의 책부터 시작하여 독서 습관을 만들어보세요.',
          resources: ['흥미 도서', '독서 동아리'],
        });
      } else if (weakness.category === 'reading_environment') {
        recommendations.push({
          category: 'reading_environment',
          priority: 'medium',
          suggestion: '부모님과 함께 책을 읽거나 도서관을 정기적으로 방문하세요.',
          resources: ['가정 내 독서 공간 마련', '도서관 이용'],
        });
      }
    }

    // 설문 기반 추가 제안
    if (surveyScores.readingHabit !== null && surveyScores.readingHabit < 2.5) {
      recommendations.push({
        category: 'reading_habit',
        priority: 'medium',
        suggestion: '매일 정해진 시간에 10분씩이라도 독서하는 습관을 기르세요.',
        resources: ['독서 습관 형성 프로그램'],
      });
    }

    return recommendations;
  }
}

export const scoringService = new ScoringService();
