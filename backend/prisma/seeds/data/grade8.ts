import { GradeSeedData } from '../../../src/types/seed.types';

export const grade8Data: GradeSeedData = {
  template: {
    templateCode: 'MID2-V1',
    grade: 8,
    title: '중등 2학년 문해력 진단 평가',
    version: '1.0',
    totalQuestions: 40,
    timeLimit: 45,
    isActive: true,
  },
  questions: [
    {
      templateCode: 'MID2-V1',
      questionNumber: 1,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: '다음 중 \'비판적 사고\'의 의미로 적절한 것은?',
      options: [
        { id: 1, text: '무조건 반대하는 태도' },
        { id: 2, text: '분석하고 평가하는 사고' },
        { id: 3, text: '남의 의견을 무시하는 것' },
        { id: 4, text: '자기 생각만 주장하는 것' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
    },
  ],
};
