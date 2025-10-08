import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuestion() {
  const answers = await prisma.answer.findMany({
    where: {
      sessionId: 'd6131960-38ef-4e72-a616-7b7184f5f43c',
      feedback: { not: null }
    },
    include: { question: true },
    take: 2
  });

  console.log('Found answers:', answers.length);
  answers.forEach((answer, idx) => {
    console.log(`\n=== Answer ${idx + 1} ===`);
    console.log('Question ID:', answer.question.id);
    console.log('Question Number:', answer.question.questionNumber);
    console.log('Question Text:', answer.question.questionText);
    console.log('Question Type:', answer.question.questionType);
    console.log('Passage:', answer.question.passage?.substring(0, 100));
  });

  await prisma.$disconnect();
}

checkQuestion().catch(console.error);
