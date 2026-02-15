import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Purple Score 차원 가중치
 * writing-spectrum 프로젝트의 Purple Score 0-1600P 척도 참고
 * 국어 문해력 4대 핵심 영역의 가중치
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  vocabulary: 0.30,   // 어휘력 30%
  reading: 0.30,      // 독해력 30%
  grammar: 0.20,      // 문법/통사 20%
  reasoning: 0.20,    // 추론/논리 20%
};

/**
 * 학년별 난이도 기대 수준 (1~6학년)
 * 해당 학년에서 기대되는 기본 정답률 (%)
 * 이 수치 이상이면 해당 학년 수준 달성으로 판정
 */
const GRADE_EXPECTATIONS: Record<number, number> = {
  1: 70, 2: 65, 3: 60, 4: 55, 5: 50, 6: 45,
};

/**
 * Purple Score 0-1600P 척도 기반 학년 범위 매핑
 * 각 학년에 대한 Purple Score 범위 (low~high)
 */
const PURPLE_GRADE_RANGES: Record<number, { low: number; mid: number; high: number; label: string }> = {
  0: { low: 0, mid: 100, high: 200, label: '입문 (primer)' },
  1: { low: 50, mid: 175, high: 300, label: '시작 (beginner)' },
  2: { low: 150, mid: 275, high: 400, label: '기초 (basic)' },
  3: { low: 250, mid: 375, high: 500, label: '성장 (growing)' },
  4: { low: 350, mid: 475, high: 600, label: '발전 (developing)' },
  5: { low: 450, mid: 575, high: 700, label: '숙련 (skilled)' },
  6: { low: 550, mid: 675, high: 800, label: '능숙 (proficient)' },
  7: { low: 650, mid: 775, high: 900, label: '심화 (intermediate)' },
  8: { low: 750, mid: 875, high: 1000, label: '확장 (expanding)' },
  9: { low: 850, mid: 975, high: 1100, label: '우수 (advanced)' },
  10: { low: 950, mid: 1075, high: 1200, label: '고급 (upper)' },
  11: { low: 1050, mid: 1200, high: 1350, label: '전문 (expert)' },
  12: { low: 1150, mid: 1300, high: 1450, label: '탁월 (exceptional)' },
  13: { low: 1300, mid: 1450, high: 1600, label: '학술 (academic)' },
};

interface ProficiencyDimension {
  category: string;
  score: number;
  possible: number;
  percentage: number;
  weight: number;
  weightedScore: number;
  level: string;
}

interface ProficiencyProfile {
  dimensions: ProficiencyDimension[];
  compositeScore: number;
  purpleScore: number;
  purpleGrade: string;
  purpleLevel: string;
  balanceIndex: number;
}

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
  proficiencyProfile: ProficiencyProfile;
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

    // 난이도별 정답 추적
    const difficultyPerformance: Record<string, { correct: number; total: number }> = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
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

      // 난이도별 추적
      if (question.difficulty && difficultyPerformance[question.difficulty]) {
        difficultyPerformance[question.difficulty].total++;
        if (isCorrect) difficultyPerformance[question.difficulty].correct++;
      }

      totalScore += pointsEarned;
      totalPossible += question.points;
    }

    // 3. 설문 점수 계산
    const surveyScores = this.calculateSurveyScores(session.answers);

    // 4. 백분율 계산
    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // 5. 다차원 역량 프로파일 생성 (Purple Score 연동)
    const proficiencyProfile = this.buildProficiencyProfile(
      categoryScores,
      session.template.grade,
      difficultyPerformance
    );

    // 6. 등급 계산 (Purple Score 기반 향상된 등급)
    const gradeLevel = this.calculateGradeLevel(proficiencyProfile.compositeScore);

    // 7. 백분위 계산 (통계 데이터 기반)
    const percentile = await this.calculatePercentile(
      session.template.grade,
      session.templateId,
      percentage
    );

    // 8. 강점/약점 분석 (프로파일 기반 향상)
    const analysis = this.analyzePerformance(categoryScores, surveyScores, proficiencyProfile);

    // 9. 학습 제안 생성 (프로파일 기반 개인화)
    const recommendations = this.generateRecommendations(
      analysis.weaknesses,
      surveyScores,
      session.template.grade,
      proficiencyProfile
    );

    // 10. 결과 저장
    await prisma.testResult.create({
      data: {
        sessionId,
        totalScore,
        totalPossible,
        percentage: new Decimal(percentage.toFixed(2)),
        gradeLevel,
        percentile: percentile ? new Decimal(percentile.toFixed(2)) : null,
        vocabularyScore: categoryScores.vocabulary.score,
        readingScore: categoryScores.reading.score,
        grammarScore: categoryScores.grammar.score,
        reasoningScore: categoryScores.reasoning.score,
        readingMotivationScore: surveyScores.readingMotivation,
        writingMotivationScore: surveyScores.writingMotivation,
        readingEnvironmentScore: surveyScores.readingEnvironment,
        readingHabitScore: surveyScores.readingHabit,
        readingPreferenceData: surveyScores.readingPreferenceData,
        strengths: [
          ...analysis.strengths,
          { _proficiencyProfile: proficiencyProfile },
        ],
        weaknesses: analysis.weaknesses,
        recommendations,
      },
    });

    // 11. 세션 상태 업데이트
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
      proficiencyProfile,
    };
  }

  /**
   * 다차원 역량 프로파일 생성
   * Purple Score 0-1600P 척도에 기반한 복합 점수 산출
   */
  private buildProficiencyProfile(
    categoryScores: Record<string, { score: number; possible: number }>,
    studentGrade: number,
    difficultyPerformance: Record<string, { correct: number; total: number }>
  ): ProficiencyProfile {
    const dimensions: ProficiencyDimension[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    const coreCategories = ['vocabulary', 'reading', 'grammar', 'reasoning'];

    for (const category of coreCategories) {
      const { score, possible } = categoryScores[category];
      const weight = CATEGORY_WEIGHTS[category] || 0.25;

      if (possible === 0) continue;

      const percentage = (score / possible) * 100;
      const weightedScore = percentage * weight;
      weightedSum += weightedScore;
      totalWeight += weight;

      dimensions.push({
        category,
        score,
        possible,
        percentage: Math.round(percentage * 10) / 10,
        weight,
        weightedScore: Math.round(weightedScore * 10) / 10,
        level: this.getDimensionLevel(percentage),
      });
    }

    // 가중 복합 점수 (0-100)
    const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // 난이도 보정: 어려운 문제를 맞추면 보너스
    const difficultyBonus = this.calculateDifficultyBonus(difficultyPerformance);
    const adjustedComposite = Math.min(100, compositeScore + difficultyBonus);

    // Purple Score (0-1600P) 변환
    const purpleScore = this.compositeToPurpleScore(adjustedComposite, studentGrade);

    // Purple Score → 학년/수준 매핑
    const { grade: purpleGrade, level: purpleLevel } = this.purpleScoreToGradeLevel(purpleScore);

    // 균형 지수: 차원 간 편차가 작을수록 높음 (0-1)
    const balanceIndex = this.calculateBalanceIndex(dimensions);

    return {
      dimensions,
      compositeScore: Math.round(adjustedComposite * 10) / 10,
      purpleScore: Math.round(purpleScore),
      purpleGrade,
      purpleLevel,
      balanceIndex: Math.round(balanceIndex * 100) / 100,
    };
  }

  /**
   * 차원별 수준 판정
   */
  private getDimensionLevel(percentage: number): string {
    if (percentage >= 90) return '탁월';
    if (percentage >= 75) return '우수';
    if (percentage >= 60) return '보통';
    if (percentage >= 40) return '미흡';
    return '부족';
  }

  /**
   * 난이도 보정 점수 계산
   * 어려운 문제 정답 비율이 높으면 보너스 부여
   */
  private calculateDifficultyBonus(
    difficultyPerformance: Record<string, { correct: number; total: number }>
  ): number {
    const hard = difficultyPerformance.hard;
    const medium = difficultyPerformance.medium;

    let bonus = 0;

    // 어려운 문제 70% 이상 정답 → +5점
    if (hard.total > 0) {
      const hardRate = hard.correct / hard.total;
      if (hardRate >= 0.7) bonus += 5;
      else if (hardRate >= 0.5) bonus += 2;
    }

    // 중간 문제 80% 이상 정답 → +2점
    if (medium.total > 0) {
      const mediumRate = medium.correct / medium.total;
      if (mediumRate >= 0.8) bonus += 2;
    }

    return bonus;
  }

  /**
   * 복합 점수 (0-100) → Purple Score (0-1600P) 변환
   * 학년을 고려한 비선형 매핑
   */
  private compositeToPurpleScore(composite: number, studentGrade: number): number {
    // 학년별 기본 범위
    const range = PURPLE_GRADE_RANGES[studentGrade] || PURPLE_GRADE_RANGES[1];

    // 복합 점수에 따라 학년 범위 내에서 매핑
    // 60% = 중앙값, 90%+ = 상한 초과 가능
    const normalizedScore = composite / 100;

    if (normalizedScore >= 0.9) {
      // 90%+ → 해당 학년 상한 ~ 다음 학년 중앙값
      const nextRange = PURPLE_GRADE_RANGES[studentGrade + 1] || range;
      return range.high + (normalizedScore - 0.9) / 0.1 * (nextRange.mid - range.high);
    } else if (normalizedScore >= 0.6) {
      // 60-90% → 중앙값 ~ 상한
      return range.mid + (normalizedScore - 0.6) / 0.3 * (range.high - range.mid);
    } else if (normalizedScore >= 0.3) {
      // 30-60% → 하한 ~ 중앙값
      return range.low + (normalizedScore - 0.3) / 0.3 * (range.mid - range.low);
    } else {
      // 0-30% → 이전 학년 중앙값 ~ 하한
      const prevRange = PURPLE_GRADE_RANGES[Math.max(0, studentGrade - 1)] || range;
      return prevRange.mid + normalizedScore / 0.3 * (range.low - prevRange.mid);
    }
  }

  /**
   * Purple Score → 학년 등급 및 수준 매핑
   */
  private purpleScoreToGradeLevel(purpleScore: number): { grade: string; level: string } {
    for (const [gradeNum, range] of Object.entries(PURPLE_GRADE_RANGES).reverse()) {
      if (purpleScore >= range.low) {
        const gradeLabels: Record<string, string> = {
          '0': '유아', '1': '1학년', '2': '2학년', '3': '3학년',
          '4': '4학년', '5': '5학년', '6': '6학년',
          '7': '중1', '8': '중2', '9': '중3',
          '10': '고1', '11': '고2', '12': '고3', '13': '대학+',
        };
        return {
          grade: gradeLabels[gradeNum] || `${gradeNum}학년`,
          level: range.label,
        };
      }
    }
    return { grade: '유아', level: '입문 (primer)' };
  }

  /**
   * 균형 지수 계산 (0-1)
   * 모든 차원의 점수가 균등할수록 1에 가까움
   */
  private calculateBalanceIndex(dimensions: ProficiencyDimension[]): number {
    if (dimensions.length < 2) return 1;

    const percentages = dimensions.map(d => d.percentage);
    const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
    const stdDev = Math.sqrt(variance);

    // 표준편차 0 = 완전 균형 → 1, 표준편차 50 → 0
    return Math.max(0, 1 - stdDev / 50);
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
   * Purple Score 가중 복합 점수 기반
   */
  private calculateGradeLevel(compositeScore: number): number {
    if (compositeScore >= 96) return 1;
    if (compositeScore >= 89) return 2;
    if (compositeScore >= 77) return 3;
    if (compositeScore >= 60) return 4;
    if (compositeScore >= 40) return 5;
    if (compositeScore >= 23) return 6;
    if (compositeScore >= 11) return 7;
    if (compositeScore >= 4) return 8;
    return 9;
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
    const percentile = 50 + 50 * this.erf(zScore / Math.sqrt(2));
    return Math.max(0, Math.min(100, percentile));
  }

  /**
   * 강점/약점 분석 (프로파일 기반 향상)
   */
  private analyzePerformance(
    categoryScores: Record<string, { score: number; possible: number }>,
    surveyScores: any,
    profile: ProficiencyProfile
  ): {
    strengths: any[];
    weaknesses: any[];
  } {
    const strengths: any[] = [];
    const weaknesses: any[] = [];

    // 프로파일 차원 기반 분석
    for (const dim of profile.dimensions) {
      if (dim.percentage >= 80) {
        strengths.push({
          category: dim.category,
          percentage: dim.percentage.toFixed(1),
          level: dim.level,
          purpleContribution: dim.weightedScore.toFixed(1),
          description: this.getCategoryDescription(dim.category, 'strength'),
        });
      } else if (dim.percentage < 50) {
        weaknesses.push({
          category: dim.category,
          percentage: dim.percentage.toFixed(1),
          level: dim.level,
          purpleContribution: dim.weightedScore.toFixed(1),
          description: this.getCategoryDescription(dim.category, 'weakness'),
        });
      }
    }

    // 균형 분석
    if (profile.balanceIndex < 0.5) {
      weaknesses.push({
        category: 'balance',
        balanceIndex: profile.balanceIndex,
        description: '영역 간 실력 편차가 큽니다. 약한 영역에 집중 학습이 필요합니다.',
      });
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
        strength: '어휘력이 우수합니다. 다양한 단어를 정확하게 이해하고 활용합니다.',
        weakness: '어휘력 향상이 필요합니다. 문맥 속에서 단어 의미를 파악하는 연습이 필요합니다.',
      },
      reading: {
        strength: '독해력이 뛰어납니다. 글의 핵심 내용과 세부 사항을 정확히 파악합니다.',
        weakness: '독해력 강화가 필요합니다. 다양한 유형의 글을 꾸준히 읽는 것이 중요합니다.',
      },
      grammar: {
        strength: '문법 이해도가 높습니다. 문장 구조를 정확하게 파악합니다.',
        weakness: '문법 학습이 필요합니다. 기초 문법 규칙부터 체계적으로 학습하세요.',
      },
      reasoning: {
        strength: '논리적 사고력이 강합니다. 글의 논리 구조를 잘 파악합니다.',
        weakness: '추론 능력 향상이 필요합니다. 원인-결과, 비교-대조 관계를 분석하는 연습을 하세요.',
      },
    };

    return descriptions[category]?.[type] || '';
  }

  /**
   * 학습 제안 생성 (프로파일 기반 개인화)
   */
  private generateRecommendations(
    weaknesses: any[],
    surveyScores: any,
    grade: number,
    profile: ProficiencyProfile
  ): any[] {
    const recommendations: any[] = [];

    // Purple Score 기반 총평
    recommendations.push({
      category: 'overall',
      priority: 'info',
      suggestion: `현재 Purple Score ${profile.purpleScore}P (${profile.purpleLevel}) 수준입니다. ${
        profile.purpleGrade
      } 수준에 해당하며, ${
        profile.balanceIndex >= 0.7
          ? '영역 간 균형이 잘 잡혀 있습니다.'
          : '일부 영역에 집중적인 학습이 필요합니다.'
      }`,
      purpleScore: profile.purpleScore,
    });

    // 약점 영역별 맞춤 제안
    for (const weakness of weaknesses) {
      const gradeLabel = grade <= 2 ? '저학년' : grade <= 4 ? '중학년' : '고학년';

      if (weakness.category === 'vocabulary') {
        recommendations.push({
          category: 'vocabulary',
          priority: 'high',
          suggestion: grade <= 3
            ? '그림책이나 동화에서 새로운 단어를 찾아 그림으로 그려보세요.'
            : '매일 10개의 새로운 단어를 학습하고 문장으로 만들어보세요.',
          resources: grade <= 3
            ? ['그림 어휘 카드', '동화 단어장']
            : ['어휘력 향상 교재', '단어장 앱'],
          targetPurpleGain: 50,
        });
      } else if (weakness.category === 'reading') {
        recommendations.push({
          category: 'reading',
          priority: 'high',
          suggestion: grade <= 3
            ? '하루 15분씩 소리 내어 읽기를 하고 줄거리를 말해보세요.'
            : '하루 20분씩 수준에 맞는 책을 읽고 핵심 내용을 요약해보세요.',
          resources: ['학년별 권장 도서', '독해력 문제집'],
          targetPurpleGain: 60,
        });
      } else if (weakness.category === 'grammar') {
        recommendations.push({
          category: 'grammar',
          priority: 'medium',
          suggestion: grade <= 3
            ? '짧은 문장 만들기 연습을 통해 문장 구조를 익혀보세요.'
            : '기초 문법 규칙을 체계적으로 학습하고 교정 연습을 하세요.',
          resources: ['문법 학습 교재', '문장 교정 연습'],
          targetPurpleGain: 40,
        });
      } else if (weakness.category === 'reasoning') {
        recommendations.push({
          category: 'reasoning',
          priority: 'medium',
          suggestion: grade <= 3
            ? '이야기를 읽고 "왜 그럴까?" 질문에 답해보세요.'
            : '논리 퍼즐과 추론 문제를 풀어보세요.',
          resources: ['사고력 교재', '논리 게임'],
          targetPurpleGain: 40,
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
      } else if (weakness.category === 'balance') {
        // 가장 약한 차원 찾기
        const weakestDim = profile.dimensions.reduce((min, d) =>
          d.percentage < min.percentage ? d : min
        );
        recommendations.push({
          category: 'balance',
          priority: 'high',
          suggestion: `${this.getCategoryLabel(weakestDim.category)} 영역(${weakestDim.percentage}%)이 가장 약합니다. 이 영역을 집중적으로 보완하면 전체 Purple Score가 크게 향상됩니다.`,
          resources: [],
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

  /**
   * 카테고리 한글 라벨
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      vocabulary: '어휘력',
      reading: '독해력',
      grammar: '문법',
      reasoning: '추론',
    };
    return labels[category] || category;
  }
}

export const scoringService = new ScoringService();
