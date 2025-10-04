import { PrismaClient } from '@prisma/client';
import { grade1Data } from './seeds/data/grade1';
import { grade2Data } from './seeds/data/grade2';
import { grade3Data } from './seeds/data/grade3';
import { grade4Data } from './seeds/data/grade4';
import { grade5Data } from './seeds/data/grade5';
import { grade6Data } from './seeds/data/grade6';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // ===== 1. Seed Test Templates =====
    console.log('📝 Seeding Test Templates...');

    const gradeData = [grade1Data, grade2Data, grade3Data, grade4Data, grade5Data, grade6Data];
    const templates = [];

    for (const data of gradeData) {
      const template = await prisma.testTemplate.upsert({
        where: { templateCode: data.template.templateCode },
        update: {},
        create: {
          templateCode: data.template.templateCode,
          grade: data.template.grade,
          title: data.template.title,
          version: data.template.version,
          totalQuestions: data.template.totalQuestions,
          timeLimit: data.template.timeLimit,
          isActive: data.template.isActive,
        },
      });
      templates.push(template);
      console.log(`   ✅ ${template.title} (${template.templateCode})`);
    }

    // ===== 2. Seed Questions =====
    console.log('\n📚 Seeding Questions...');

    let totalQuestions = 0;

    for (let i = 0; i < gradeData.length; i++) {
      const data = gradeData[i];
      const template = templates[i];
      let createdCount = 0;

      console.log(`\n   📖 Grade ${data.template.grade} (${data.questions.length} questions)...`);

      for (const question of data.questions) {
        await prisma.question.upsert({
          where: {
            templateId_questionNumber: {
              templateId: template.id,
              questionNumber: question.questionNumber,
            },
          },
          update: {},
          create: {
            templateId: template.id,
            questionNumber: question.questionNumber,
            category: question.category,
            questionType: question.questionType,
            questionText: question.questionText,
            passage: question.passage,
            options: question.options ? JSON.stringify(question.options) : null,
            correctAnswer: question.correctAnswer,
            points: question.points,
            difficulty: question.difficulty,
            explanation: question.explanation,
          },
        });
        createdCount++;
        totalQuestions++;

        // Progress indicator
        if (createdCount % 5 === 0) {
          console.log(`      ${createdCount}/${data.questions.length} questions...`);
        }
      }

      console.log(`   ✅ ${createdCount} questions created for Grade ${data.template.grade}`);
    }

    // ===== 3. Summary =====
    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Test Templates: ${templates.length}`);
    console.log(`   ✅ Total Questions: ${totalQuestions}`);
    console.log(`   ✅ Grade Coverage: 1학년, 2학년, 3학년, 4학년, 5학년, 6학년\n`);

    console.log('🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
