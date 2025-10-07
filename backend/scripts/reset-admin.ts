import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    console.log('Resetting admin account...');

    // Delete existing admin
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@literacy.com' },
    });

    if (existing) {
      console.log('Deleting existing admin...');
      await prisma.user.delete({ where: { id: existing.id } });
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@literacy.com',
        passwordHash: hashedPassword,
        name: 'Administrator',
        role: 'admin',
      },
    });

    console.log('✅ Admin account created:');
    console.log('Email:', admin.email);
    console.log('Password: admin1234');
    console.log('Role:', admin.role);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
