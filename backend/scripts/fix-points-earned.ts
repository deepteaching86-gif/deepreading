import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPointsEarned() {
  try {
    console.log('Starting to fix pointsEarned for existing answers...');

    // Get all answers with their questions
    const answers = await prisma.answer.findMany({
      include: {
        question: {
          select: {
            points: true,
          },
        },
      },
    });

    console.log(`Found ${answers.length} answers to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const answer of answers) {
      // Calculate correct pointsEarned based on isCorrect and question points
      const correctPointsEarned = answer.isCorrect ? answer.question.points : 0;

      // Only update if current value is wrong
      if (answer.pointsEarned !== correctPointsEarned) {
        await prisma.answer.update({
          where: { id: answer.id },
          data: { pointsEarned: correctPointsEarned },
        });
        updatedCount++;

        if (updatedCount % 100 === 0) {
          console.log(`Progress: ${updatedCount} answers updated`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log('\nMigration completed!');
    console.log(`✅ Updated: ${updatedCount} answers`);
    console.log(`⏭️  Skipped: ${skippedCount} answers (already correct)`);
    console.log(`📊 Total processed: ${answers.length} answers`);

  } catch (error) {
    console.error('Error fixing pointsEarned:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixPointsEarned()
  .then(() => {
    console.log('\n✨ Migration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
