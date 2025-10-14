// Run Vision TEST migration manually
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = path.join(
      __dirname,
      '../../prisma/migrations/20250614_add_vision_test_models/migration.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📦 Executing migration...');
    await prisma.$executeRawUnsafe(sql);

    console.log('✅ Vision TEST migration completed successfully!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Tables already exist, migration skipped');
    } else {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
