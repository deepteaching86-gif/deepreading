import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate templates...\n');

  try {
    // Delete old templates with only 1 question
    const oldTemplateCodes = ['MID1-V1', 'MID2-V1', 'MID3-V1'];

    for (const code of oldTemplateCodes) {
      console.log(`Deleting ${code}...`);

      // Find template
      const template = await prisma.testTemplate.findUnique({
        where: { templateCode: code },
        include: { questions: true }
      });

      if (template) {
        console.log(`  Found: ${template.title} with ${template.questions.length} questions`);

        // Delete template (cascade will delete questions)
        await prisma.testTemplate.delete({
          where: { id: template.id }
        });

        console.log(`  ✅ Deleted ${code}\n`);
      } else {
        console.log(`  ⚠️ ${code} not found\n`);
      }
    }

    console.log('✅ Cleanup completed!\n');

    // Verify remaining templates
    console.log('Remaining templates:');
    const templates = await prisma.testTemplate.findMany({
      orderBy: { grade: 'asc' }
    });

    for (const t of templates) {
      const qCount = await prisma.question.count({
        where: { templateId: t.id }
      });
      console.log(`  - Grade ${t.grade}: ${t.templateCode} (${qCount} questions)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
