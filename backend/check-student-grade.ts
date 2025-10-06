import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStudent() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test2@literacy.com' },
      include: {
        student: true
      }
    });

    console.log('User:', JSON.stringify(user, null, 2));

    const templates = await prisma.testTemplate.findMany({
      where: { isActive: true },
      select: {
        templateCode: true,
        title: true,
        grade: true
      }
    });

    console.log('\nActive Templates:', JSON.stringify(templates, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();
