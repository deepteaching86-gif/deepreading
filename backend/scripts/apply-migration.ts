import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔧 Applying database migration...\n');

  try {
    // Check if description column exists
    console.log('1️⃣ Checking current schema...');
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'test_templates'
    `;

    const hasDescription = columns.some(col => col.column_name === 'description');
    console.log(`   Description column exists: ${hasDescription}\n`);

    if (!hasDescription) {
      console.log('2️⃣ Adding description column...');
      await prisma.$executeRaw`
        ALTER TABLE test_templates
        ADD COLUMN description TEXT
      `;
      console.log('   ✅ Description column added\n');
    } else {
      console.log('2️⃣ Description column already exists, skipping...\n');
    }

    // Verify other required columns
    console.log('3️⃣ Checking other required columns...');
    const hasStatus = columns.some(col => col.column_name === 'status');
    const hasTotalPoints = columns.some(col => col.column_name === 'total_points');
    const hasPassingScore = columns.some(col => col.column_name === 'passing_score');

    console.log(`   status: ${hasStatus}`);
    console.log(`   total_points: ${hasTotalPoints}`);
    console.log(`   passing_score: ${hasPassingScore}\n`);

    // Add missing columns
    if (!hasStatus) {
      console.log('4️⃣ Adding status column...');
      await prisma.$executeRaw`
        ALTER TABLE test_templates
        ADD COLUMN status VARCHAR(20) DEFAULT 'active'
      `;
      console.log('   ✅ Status column added\n');
    }

    if (!hasTotalPoints) {
      console.log('5️⃣ Adding total_points column...');
      await prisma.$executeRaw`
        ALTER TABLE test_templates
        ADD COLUMN total_points INTEGER DEFAULT 100
      `;
      console.log('   ✅ Total_points column added\n');
    }

    if (!hasPassingScore) {
      console.log('6️⃣ Adding passing_score column...');
      await prisma.$executeRaw`
        ALTER TABLE test_templates
        ADD COLUMN passing_score INTEGER DEFAULT 60
      `;
      console.log('   ✅ Passing_score column added\n');
    }

    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  });
