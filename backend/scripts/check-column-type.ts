import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumnType() {
  try {
    const result: any = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'peer_statistics'
      AND column_name = 'category'
    `;
    console.log('Column info:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumnType();
