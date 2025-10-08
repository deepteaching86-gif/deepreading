import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSurveyToAllGrades() {
  try {
    console.log('📝 Adding survey questions to all grades...\n');

    // Get Grade 5 template
    const grade5Template = await prisma.testTemplate.findFirst({
      where: { grade: 5 },
    });

    if (!grade5Template) {
      throw new Error('Grade 5 template not found');
    }

    // Get all survey questions from Grade 5
    const surveyQuestions = await prisma.question.findMany({
      where: {
        templateId: grade5Template.id,
        category: {
          in: ['reading_motivation', 'writing_motivation', 'reading_environment', 'reading_habit', 'reading_preference'],
        },
      },
      orderBy: {
        questionNumber: 'asc',
      },
    });

    console.log(`Found ${surveyQuestions.length} survey questions in Grade 5\n`);

    // Add to grades 1-4 and 6
    for (const targetGrade of [1, 2, 3, 4, 6]) {
      console.log(`Processing Grade ${targetGrade}...`);

      // Get target grade template
      const targetTemplate = await prisma.testTemplate.findFirst({
        where: { grade: targetGrade },
      });

      if (!targetTemplate) {
        console.log(`  ❌ Template not found for Grade ${targetGrade}, skipping`);
        continue;
      }

      // Check if survey questions already exist
      const existingCount = await prisma.question.count({
        where: {
          templateId: targetTemplate.id,
          category: {
            in: ['reading_motivation', 'writing_motivation', 'reading_environment', 'reading_habit', 'reading_preference'],
          },
        },
      });

      if (existingCount > 0) {
        console.log(`  ⚠️  Grade ${targetGrade} already has ${existingCount} survey questions, skipping`);
        continue;
      }

      // Get the highest question number in target template
      const lastQuestion = await prisma.question.findFirst({
        where: { templateId: targetTemplate.id },
        orderBy: { questionNumber: 'desc' },
      });

      const startQuestionNumber = lastQuestion ? lastQuestion.questionNumber + 1 : 1;

      // Copy survey questions
      let addedCount = 0;
      for (let i = 0; i < surveyQuestions.length; i++) {
        const sourceQuestion = surveyQuestions[i];

        await prisma.question.create({
          data: {
            templateId: targetTemplate.id,
            questionNumber: startQuestionNumber + i,
            category: sourceQuestion.category,
            questionType: sourceQuestion.questionType,
            questionText: sourceQuestion.questionText,
            passage: sourceQuestion.passage,
            imageUrl: sourceQuestion.imageUrl,
            options: sourceQuestion.options as any,
            correctAnswer: sourceQuestion.correctAnswer,
            points: sourceQuestion.points,
            difficulty: sourceQuestion.difficulty,
          },
        });

        addedCount++;
      }

      console.log(`  ✅ Added ${addedCount} survey questions to Grade ${targetGrade}`);
    }

    console.log('\n✅ Survey questions added to all grades successfully!');

    // Verify final distribution
    console.log('\n📊 Final distribution:');
    for (let grade = 1; grade <= 6; grade++) {
      const count = await prisma.question.count({
        where: {
          template: { grade },
          category: {
            in: ['reading_motivation', 'writing_motivation', 'reading_environment', 'reading_habit', 'reading_preference'],
          },
        },
      });
      console.log(`  Grade ${grade}: ${count} survey questions`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSurveyToAllGrades();
