import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: { email: true, name: true, role: true }
    });

    if (admin) {
      console.log('Admin found:');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
    } else {
      console.log('No admin user found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
