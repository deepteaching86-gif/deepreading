import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTest2() {
  try {
    console.log('🔍 Checking test2 user and data...\n');

    // Check test2 user
    const user = await prisma.user.findUnique({
      where: { email: 'test2@test.com' },
      include: {
        student: true
      }
    });

    console.log('=== test2 User ===');
    if (user) {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      if (user.student) {
        console.log(`Grade: ${user.student.grade}`);
        console.log(`School: ${user.student.schoolName || 'N/A'}`);
        console.log(`Class: ${user.student.className || 'N/A'}`);
      }
    } else {
      console.log('❌ test2 user not found!');
    }

    // Check templates for test2's grade
    if (user?.student?.grade) {
      console.log(`\n=== Templates for Grade ${user.student.grade} ===`);
      const templates = await prisma.testTemplate.findMany({
        where: { grade: user.student.grade },
        include: {
          _count: {
            select: { questions: true }
          }
        }
      });

      if (templates.length === 0) {
        console.log(`❌ No templates found for grade ${user.student.grade}!`);
      } else {
        templates.forEach(t => {
          console.log(`\n📝 ${t.templateCode} - ${t.title}`);
          console.log(`   Questions: ${t._count.questions}`);
          console.log(`   Time Limit: ${t.timeLimit} minutes`);
          console.log(`   Active: ${t.isActive}`);
        });
      }
    }

    // Check all templates
    console.log('\n=== All Templates ===');
    const allTemplates = await prisma.testTemplate.findMany({
      select: {
        templateCode: true,
        grade: true,
        title: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { grade: 'asc' }
    });

    allTemplates.forEach(t => {
      const gradeText = t.grade <= 6 ? `초등 ${t.grade}학년` : `중등 ${t.grade - 6}학년`;
      console.log(`${t.templateCode} (${gradeText}): ${t._count.questions} questions`);
    });

    // Check all users
    console.log('\n=== All Users ===');
    const allUsers = await prisma.user.findMany({
      include: {
        student: true
      }
    });
    console.log(`Total Users: ${allUsers.length}`);
    allUsers.forEach(u => {
      const gradeInfo = u.student ? ` (Grade ${u.student.grade})` : '';
      console.log(`  ${u.email} - ${u.role}${gradeInfo}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTest2();
