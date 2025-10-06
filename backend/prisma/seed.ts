import { PrismaClient } from '@prisma/client';
import { grade1Data } from './seeds/data/grade1';
import { grade2Data } from './seeds/data/grade2';
import { grade3Data } from './seeds/data/grade3';
import { grade4Data } from './seeds/data/grade4';
import { grade5Data } from './seeds/data/grade5';
import { grade6Data } from './seeds/data/grade6';
import { grade7Data } from './seeds/data/grade7';
import { grade8Data } from './seeds/data/grade8';
import { grade9Data } from './seeds/data/grade9';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // ===== 1. Seed Test Templates =====
    console.log('📝 Seeding Test Templates...');

    const gradeData = [grade1Data, grade2Data, grade3Data, grade4Data, grade5Data, grade6Data, grade7Data, grade8Data, grade9Data];
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
          } as any,
          update: {},
          create: {
            templateId: template.id,
            questionNumber: question.questionNumber,
            category: question.category,
            questionType: question.questionType,
            questionText: question.questionText,
            passage: question.passage ?? undefined,
            options: question.options ? JSON.parse(JSON.stringify(question.options)) : undefined,
            correctAnswer: question.correctAnswer,
            points: question.points,
            difficulty: question.difficulty ?? undefined,
            explanation: question.explanation ?? undefined,
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
    console.log(`   ✅ Grade Coverage: 초등 1-6학년, 중등 1-3학년\n`);

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
