import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkStudents() {
  try {
    console.log('🔍 Checking student accounts...\n');

    // Get all users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { role: 'student' }
        ]
      },
      include: { student: true }
    });

    console.log(`Found ${users.length} accounts:\n`);

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password Hash: ${user.passwordHash.substring(0, 40)}...`);

      if (user.student) {
        console.log(`Grade: ${user.student.grade}`);
        console.log(`School: ${user.student.schoolName || 'N/A'}`);
        console.log(`Class: ${user.student.className || 'N/A'}`);
      }

      // Test common passwords
      const testPasswords = ['test1234', 'password', '12345678', 'Test1234', 'test123'];
      console.log('\n🔐 Testing common passwords:');

      for (const pwd of testPasswords) {
        const isMatch = await bcrypt.compare(pwd, user.passwordHash);
        if (isMatch) {
          console.log(`   ✅ Password is: "${pwd}"`);
          break;
        }
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check templates for grade 3
    console.log('=== Templates for Grade 3 ===');
    const templates = await prisma.testTemplate.findMany({
      where: { grade: 3 },
      select: {
        templateCode: true,
        title: true,
        grade: true,
        isActive: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    if (templates.length === 0) {
      console.log('❌ No templates found for grade 3!');
    } else {
      templates.forEach(t => {
        console.log(`${t.templateCode} - ${t.title}`);
        console.log(`  Active: ${t.isActive}, Questions: ${t._count.questions}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();
