import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuestionImage() {
  try {
    // 초등 3학년 템플릿 찾기
    const template = await prisma.testTemplate.findFirst({
      where: {
        title: { contains: '초등 3학년' }
      }
    });

    if (!template) {
      console.log('초등 3학년 템플릿을 찾을 수 없습니다.');
      return;
    }

    console.log('템플릿:', template.title);

    // 10번 문제 찾기
    const question = await prisma.question.findFirst({
      where: {
        templateId: template.id,
        questionNumber: 10
      },
      select: {
        id: true,
        questionNumber: true,
        questionText: true,
        imageUrl: true,
        category: true
      }
    });

    if (!question) {
      console.log('10번 문제를 찾을 수 없습니다.');
      return;
    }

    console.log('\n=== 10번 문제 정보 ===');
    console.log('문제 번호:', question.questionNumber);
    console.log('카테고리:', question.category);
    console.log('문제 텍스트:', question.questionText.substring(0, 100) + '...');
    console.log('이미지 URL:', question.imageUrl || '(없음)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestionImage();
