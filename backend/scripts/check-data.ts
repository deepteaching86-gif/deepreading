import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking database data...\n');

  try {
    // Check all students
    console.log('1️⃣ Students:');
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    students.forEach(s => {
      console.log(`   - ${s.user.name} (${s.user.email}): Grade ${s.grade}`);
    });
    console.log();

    // Check all templates
    console.log('2️⃣ Templates:');
    const templates = await prisma.testTemplate.findMany({
      orderBy: { grade: 'asc' }
    });

    templates.forEach(t => {
      console.log(`   - Grade ${t.grade}: ${t.title} (${t.templateCode}) - Active: ${t.isActive}`);
    });
    console.log();

    // Check questions count per template
    console.log('3️⃣ Questions count:');
    for (const template of templates) {
      const count = await prisma.question.count({
        where: { templateId: template.id }
      });
      console.log(`   - ${template.templateCode}: ${count} questions`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
