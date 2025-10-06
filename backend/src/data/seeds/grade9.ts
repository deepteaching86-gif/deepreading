import { GradeSeedData } from '../../../src/types/seed.types';

export const grade9Data: GradeSeedData = {
  template: {
    templateCode: 'MID3-V1',
    grade: 9,
    title: '중등 3학년 문해력 진단 평가',
    version: '1.0',
    totalQuestions: 45,
    timeLimit: 50,
    isActive: true,
  },
  questions: [
    {
      templateCode: 'MID3-V1',
      questionNumber: 1,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: '다음 중 \'함축\'의 의미로 가장 적절한 것은?',
      options: [
        { id: 1, text: '직접적으로 표현함' },
        { id: 2, text: '속에 간직하여 품음' },
        { id: 3, text: '크게 소리침' },
        { id: 4, text: '자세히 설명함' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
    },
  ],
};
