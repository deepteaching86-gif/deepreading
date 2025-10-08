import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnum() {
  try {
    const result: any = await prisma.$queryRaw`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'QuestionCategory'
    `;
    console.log('QuestionCategory enum values:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnum();
