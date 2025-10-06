const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check students with their users
    const students = await prisma.studentProfile.findMany({
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

    console.log('\n=== Students ===');
    students.forEach(s => {
      console.log(`ID: ${s.id}`);
      console.log(`Grade: ${s.grade}`);
      console.log(`User: ${s.user.name} (${s.user.email})`);
      console.log(`School: ${s.schoolName}`);
      console.log('---');
    });

    // Check templates
    const templates = await prisma.testTemplate.findMany({
      select: {
        id: true,
        templateCode: true,
        title: true,
        grade: true,
        isActive: true
      }
    });

    console.log('\n=== Templates ===');
    templates.forEach(t => {
      console.log(`${t.templateCode} - ${t.title} (Grade: ${t.grade}, Active: ${t.isActive})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
