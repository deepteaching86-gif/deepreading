// Script to create an admin user
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Admin account details
    const adminEmail = 'admin@literacytest.com';
    const adminPassword = 'Admin123!@#'; // Change this in production
    const adminName = '관리자';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists:', adminEmail);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin',
        name: adminName,
        phone: null,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', adminName);
    console.log('🆔 User ID:', admin.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
