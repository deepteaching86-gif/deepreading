// Script to drop Vision test tables from Supabase database
const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025%21%40%23%24SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
});

async function dropVisionTables() {
  try {
    await client.connect();
    console.log('✓ Connected to Supabase database');

    // Drop Vision tables in reverse dependency order
    const dropQueries = [
      'DROP TABLE IF EXISTS "vision_calibration_adjustments" CASCADE',
      'DROP TABLE IF EXISTS "vision_gaze_data" CASCADE',
      'DROP TABLE IF EXISTS "vision_metrics" CASCADE',
      'DROP TABLE IF EXISTS "vision_test_sessions" CASCADE',
      'DROP TABLE IF EXISTS "vision_calibrations" CASCADE'
    ];

    for (const query of dropQueries) {
      console.log(`Executing: ${query}`);
      await client.query(query);
      console.log('✓ Success');
    }

    console.log('\n✅ All Vision test tables removed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropVisionTables();
