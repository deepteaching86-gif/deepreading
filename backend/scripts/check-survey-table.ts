// Check if survey_responses table exists
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSurveyTable() {
  try {
    console.log('Checking survey_responses table...');

    // Try to query the table
    const count = await prisma.surveyResponse.count();
    console.log(`✅ survey_responses table exists with ${count} records`);

    // Check if we can create a test record
    console.log('\nChecking table structure...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'survey_responses'
      ORDER BY ordinal_position;
    `;
    console.log('Table columns:');
    console.table(tableInfo);

  } catch (error) {
    console.error('❌ Error checking survey_responses table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkSurveyTable();
