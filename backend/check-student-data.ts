import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log('Students:', JSON.stringify(students, null, 2));

    const templates = await prisma.testTemplate.findMany({
      select: {
        id: true,
        templateCode: true,
        title: true,
        grade: true,
        isActive: true
      }
    });

    console.log('Templates:', JSON.stringify(templates, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
