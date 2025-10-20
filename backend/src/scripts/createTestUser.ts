import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        passwordHash: hashedPassword,
        name: '테스트 사용자',
        role: 'student'
      }
    });

    console.log('✅ Test user created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
    console.log('\n📧 Login credentials:');
    console.log('Email: test@test.com');
    console.log('Password: test123');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();