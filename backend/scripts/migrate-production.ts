import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function migrateProduction() {
  try {
    console.log('🔄 Starting production migration...');

    // Add parent_phone column
    await prisma.$executeRaw`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20);
    `;
    console.log('✅ Added parent_phone column');

    // Add comment
    await prisma.$executeRaw`
      COMMENT ON COLUMN students.parent_phone IS 'Parent contact phone number';
    `;
    console.log('✅ Added column comment');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateProduction();
