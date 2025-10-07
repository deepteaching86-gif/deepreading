import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEnumValues() {
  console.log('Adding missing enum values...');

  // Add survey categories to QuestionCategory
  console.log('\n1. Adding survey categories to QuestionCategory enum...');
  const categories = [
    'reading_motivation',
    'writing_motivation',
    'reading_environment',
    'reading_habit',
    'reading_preference'
  ];

  try {
    for (const category of categories) {
      console.log(`  Adding ${category}...`);
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "QuestionCategory" ADD VALUE IF NOT EXISTS '${category}'`
      );
      console.log(`  ✅ Added ${category}`);
    }

    // Add likert_scale to QuestionType
    console.log('\n2. Adding likert_scale to QuestionType enum...');
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'likert_scale'`
    );
    console.log('  ✅ Added likert_scale');

    console.log('\n✅ Successfully added all enum values!');
  } catch (error) {
    console.error('❌ Error adding enum values:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addEnumValues()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
