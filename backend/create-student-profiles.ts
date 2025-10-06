import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createProfiles() {
  try {
    const studentUsers = await prisma.user.findMany({
      where: { role: 'student' }
    });

    console.log(`Found ${studentUsers.length} student users`);

    for (const user of studentUsers) {
      // Check if Student profile exists
      const existing = await prisma.student.findUnique({
        where: { userId: user.id }
      });

      if (!existing) {
        // Create Student profile with grade 3 (초등 3학년)
        const student = await prisma.student.create({
          data: {
            userId: user.id,
            grade: 3,
            schoolName: '테스트초등학교',
            className: '3-1'
          }
        });
        console.log(`Created Student profile for ${user.name} (Grade ${student.grade})`);
      } else {
        console.log(`Student profile already exists for ${user.name} (Grade ${existing.grade})`);
      }
    }

    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProfiles();
