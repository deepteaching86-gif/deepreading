import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Survey questions for Grade 5
const surveyQuestions = [
  // 독서 동기 (5문항)
  {
    questionNumber: 36,
    category: 'reading_motivation',
    questionType: 'likert_scale',
    questionText: '나는 책 읽는 것이 즐겁다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 37,
    category: 'reading_motivation',
    questionType: 'likert_scale',
    questionText: '책을 읽으면 새로운 것을 배울 수 있어서 좋다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 38,
    category: 'reading_motivation',
    questionType: 'likert_scale',
    questionText: '부모님이나 선생님이 책을 읽으라고 해서 읽는다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 39,
    category: 'reading_motivation',
    questionType: 'likert_scale',
    questionText: '책을 읽고 나면 상상력이 풍부해지는 것 같다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 40,
    category: 'reading_motivation',
    questionType: 'likert_scale',
    questionText: '재미있는 이야기가 있으면 끝까지 읽고 싶다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },

  // 독서 환경 (5문항)
  {
    questionNumber: 41,
    category: 'reading_environment',
    questionType: 'likert_scale',
    questionText: '우리 집에는 읽을 만한 책이 충분히 있다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 42,
    category: 'reading_environment',
    questionType: 'likert_scale',
    questionText: '부모님은 나에게 책을 자주 사주신다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 43,
    category: 'reading_environment',
    questionType: 'likert_scale',
    questionText: '학교나 동네 도서관에 자주 간다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 44,
    category: 'reading_environment',
    questionType: 'likert_scale',
    questionText: '집에 책을 읽기 좋은 조용한 공간이 있다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 45,
    category: 'reading_environment',
    questionType: 'likert_scale',
    questionText: '부모님이나 형제자매가 책 읽는 모습을 자주 본다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },

  // 독서 습관 (5문항)
  {
    questionNumber: 46,
    category: 'reading_habit',
    questionType: 'likert_scale',
    questionText: '나는 매일 일정한 시간에 책을 읽는다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 47,
    category: 'reading_habit',
    questionType: 'likert_scale',
    questionText: '일주일에 책을 2권 이상 읽는다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 48,
    category: 'reading_habit',
    questionType: 'likert_scale',
    questionText: '책을 읽을 때 집중해서 끝까지 읽는다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 49,
    category: 'reading_habit',
    questionType: 'likert_scale',
    questionText: '책을 읽고 나서 내용을 다른 사람에게 이야기해 준다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 50,
    category: 'reading_habit',
    questionType: 'likert_scale',
    questionText: '책을 읽으면서 중요한 내용에 밑줄을 긋거나 메모를 한다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },

  // 글쓰기 동기 (5문항)
  {
    questionNumber: 51,
    category: 'writing_motivation',
    questionType: 'likert_scale',
    questionText: '나는 일기나 독후감 쓰는 것을 좋아한다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 52,
    category: 'writing_motivation',
    questionType: 'likert_scale',
    questionText: '글을 쓰면 내 생각을 잘 표현할 수 있다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 53,
    category: 'writing_motivation',
    questionType: 'likert_scale',
    questionText: '책을 읽고 나서 느낀 점을 글로 쓰고 싶다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 54,
    category: 'writing_motivation',
    questionType: 'likert_scale',
    questionText: '친구들과 내가 쓴 글을 나누고 싶다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 55,
    category: 'writing_motivation',
    questionType: 'likert_scale',
    questionText: '글쓰기 숙제를 할 때 재미있게 쓴다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },

  // 독서 선호도 (5문항)
  {
    questionNumber: 56,
    category: 'reading_preference',
    questionType: 'likert_scale',
    questionText: '나는 동화나 소설 같은 이야기책을 좋아한다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 57,
    category: 'reading_preference',
    questionType: 'likert_scale',
    questionText: '과학이나 역사 같은 지식책을 읽는 것이 좋다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 58,
    category: 'reading_preference',
    questionType: 'likert_scale',
    questionText: '만화책이나 그림책을 읽는 것을 좋아한다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 59,
    category: 'reading_preference',
    questionType: 'likert_scale',
    questionText: '시나 수필 같은 문학 작품을 읽는 것을 즐긴다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
  {
    questionNumber: 60,
    category: 'reading_preference',
    questionType: 'likert_scale',
    questionText: '새로운 장르의 책을 읽어보고 싶다',
    options: [
      { id: 1, text: '전혀 그렇지 않다' },
      { id: 2, text: '그렇지 않다' },
      { id: 3, text: '보통이다' },
      { id: 4, text: '그렇다' },
      { id: 5, text: '매우 그렇다' },
    ],
    correctAnswer: '',
    points: 0,
    difficulty: 'easy',
    explanation: '',
  },
];

async function addSurveyQuestions() {
  try {
    console.log('Adding survey questions for Grade 5...');

    // Find Grade 5 template
    const template = await prisma.testTemplate.findFirst({
      where: { grade: 5, templateCode: 'ELEM5-V1' },
    });

    if (!template) {
      console.error('❌ Grade 5 template not found');
      return;
    }

    console.log(`Found template: ${template.title} (${template.id})`);

    // Update totalQuestions to 60
    await prisma.testTemplate.update({
      where: { id: template.id },
      data: { totalQuestions: 60 },
    });
    console.log('✅ Updated totalQuestions to 60');

    // Add survey questions
    let added = 0;
    for (const q of surveyQuestions) {
      await prisma.question.create({
        data: {
          templateId: template.id,
          questionNumber: q.questionNumber,
          category: q.category as any,
          questionType: q.questionType as any,
          questionText: q.questionText,
          options: q.options as any,
          correctAnswer: q.correctAnswer,
          points: q.points,
          difficulty: q.difficulty as any,
          explanation: q.explanation,
        },
      });
      added++;
      if (added % 5 === 0) {
        console.log(`   ${added}/${surveyQuestions.length} questions added...`);
      }
    }

    console.log(`\n✅ Successfully added ${added} survey questions!`);
  } catch (error) {
    console.error('Error adding survey questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSurveyQuestions()
  .then(() => {
    console.log('\n✨ Survey questions added successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add survey questions:', error);
    process.exit(1);
  });
