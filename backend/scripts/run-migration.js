const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Step 1: Create table
    console.log('📋 Step 1: Creating peer_statistics table...');
    const createTableSql = fs.readFileSync(
      path.join(__dirname, '../migrations/add-peer-statistics.sql'),
      'utf8'
    );

    // Split SQL into individual statements
    const statements = createTableSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('   ❌ Error:', error.message);
          // Try direct query method
          const { error: error2 } = await supabase.from('_').select('*').limit(0);
          if (error2) {
            console.error('   Using pg_query instead...');
            // Use PostgreSQL connection directly
            const pg = require('pg');
            const client = new pg.Client({
              connectionString: process.env.DIRECT_URL
            });
            await client.connect();
            await client.query(statement);
            await client.end();
            console.log('   ✅ Executed via direct connection');
          }
        } else {
          console.log('   ✅ Statement executed');
        }
      }
    }

    console.log('✅ Table creation completed!\n');

    // Step 2: Insert seed data
    console.log('📊 Step 2: Inserting peer statistics seed data...');
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../migrations/seed-peer-statistics.sql'),
      'utf8'
    );

    // Parse INSERT statements
    const insertStatements = seedSql
      .split(/INSERT INTO/)
      .slice(1)
      .map(s => 'INSERT INTO' + s.split(';')[0] + ';');

    console.log(`   Found ${insertStatements.length} records to insert...`);

    // Use direct PostgreSQL connection for inserts
    const pg = require('pg');
    const client = new pg.Client({
      connectionString: process.env.DIRECT_URL
    });

    await client.connect();
    console.log('   ✅ Connected to database');

    let successCount = 0;
    for (const statement of insertStatements) {
      try {
        await client.query(statement);
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`   Progress: ${successCount}/${insertStatements.length}`);
        }
      } catch (error) {
        console.error(`   ❌ Insert error: ${error.message}`);
      }
    }

    await client.end();

    console.log(`\n✅ Seed data completed! (${successCount}/${insertStatements.length} records)\n`);

    // Step 3: Verify
    console.log('🔍 Step 3: Verifying data...');
    const client2 = new pg.Client({
      connectionString: process.env.DIRECT_URL
    });
    await client2.connect();

    const result = await client2.query('SELECT COUNT(*) FROM peer_statistics');
    const count = parseInt(result.rows[0].count);

    console.log(`   Total records: ${count}`);

    if (count === 81) {
      console.log('   ✅ All records inserted successfully!');
    } else {
      console.log(`   ⚠️  Expected 81 records, found ${count}`);
    }

    // Sample data
    const sample = await client2.query(`
      SELECT grade, category, avg_score, sample_size
      FROM peer_statistics
      WHERE grade = 5
      ORDER BY category
      LIMIT 5
    `);

    console.log('\n   Sample data (Grade 5):');
    sample.rows.forEach(row => {
      console.log(`   - ${row.category}: ${row.avg_score}% (n=${row.sample_size})`);
    });

    await client2.end();

    console.log('\n🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Check if pg package is installed
try {
  require('pg');
} catch (error) {
  console.log('📦 Installing required package: pg');
  require('child_process').execSync('npm install pg', { stdio: 'inherit' });
}

runMigration();
