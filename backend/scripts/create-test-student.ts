// Script to create a test student user
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestStudent() {
  try {
    // Student account details
    const studentEmail = 'student1@test.com';
    const studentPassword = 'password123';
    const studentName = '김학생';
    const grade = 5;

    // Check if student already exists
    const existingStudent = await prisma.user.findUnique({
      where: { email: studentEmail },
    });

    if (existingStudent) {
      console.log('✅ Student user already exists:', studentEmail);
      console.log('🆔 User ID:', existingStudent.id);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(studentPassword, 10);

    // Create student user
    const student = await prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash,
        role: 'student',
        name: studentName,
        phone: null,
      },
    });

    // Create student profile
    const studentProfile = await prisma.student.create({
      data: {
        userId: student.id,
        grade,
        schoolName: '테스트초등학교',
        studentCode: 'TEST001',
      },
    });

    console.log('✅ Test student created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', studentEmail);
    console.log('🔑 Password:', studentPassword);
    console.log('👤 Name:', studentName);
    console.log('🎓 Grade:', grade);
    console.log('🆔 User ID:', student.id);
    console.log('🆔 Student ID:', studentProfile.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error creating test student:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudent();
