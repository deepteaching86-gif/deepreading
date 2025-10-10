import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImages() {
  const questions = await prisma.question.findMany({
    where: {
      questionNumber: { in: [10, 28] },
      template: { grade: 3 }
    },
    select: {
      id: true,
      questionNumber: true,
      questionText: true,
      imageUrl: true,
      template: {
        select: {
          grade: true,
          templateCode: true
        }
      }
    }
  });

  console.log(JSON.stringify(questions, null, 2));
}

checkImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
