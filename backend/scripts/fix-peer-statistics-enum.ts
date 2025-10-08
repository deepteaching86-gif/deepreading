import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEnum() {
  try {
    console.log('Step 1: Checking for constraints...');

    // Drop the unique constraint if it exists
    try {
      await prisma.$executeRaw`
        ALTER TABLE peer_statistics DROP CONSTRAINT IF EXISTS peer_statistics_grade_category_key
      `;
      console.log('  Dropped existing unique constraint');
    } catch (e) {
      console.log('  No constraint to drop or already dropped');
    }

    console.log('Step 2: Altering column type to use QuestionCategory enum...');

    // ALTER column type from TEXT to QuestionCategory enum
    await prisma.$executeRaw`
      ALTER TABLE peer_statistics
      ALTER COLUMN category TYPE "QuestionCategory" USING category::"QuestionCategory"
    `;

    console.log('Step 3: Re-creating unique constraint...');

    // Recreate the unique constraint
    await prisma.$executeRaw`
      ALTER TABLE peer_statistics
      ADD CONSTRAINT peer_statistics_grade_category_key UNIQUE (grade, category)
    `;

    console.log('✅ Column type fixed and constraint restored!');

    // Verify the change
    const result: any = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'peer_statistics'
      AND column_name = 'category'
    `;
    console.log('New column info:', result);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnum();
