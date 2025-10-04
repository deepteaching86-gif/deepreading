#!/usr/bin/env node

/**
 * Supabase Migration Runner
 *
 * This script reads migration.sql and executes it using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('Please check your .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🗄️  Reading migration.sql...');

  const migrationPath = path.join(__dirname, 'migration.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ migration.sql not found');
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migration file: ${sql.length} characters`);
  console.log('');
  console.log('🚀 Executing migration...');
  console.log('This may take a few moments...');
  console.log('');

  try {
    // Execute SQL using Supabase REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, we need to use SQL Editor
      console.log('⚠️  Direct SQL execution not available via API');
      console.log('');
      console.log('📋 Please use Supabase SQL Editor instead:');
      console.log('');
      console.log('1. Go to: https://supabase.com/dashboard/project/sxnjeqqvqbhueqbwsnpj/editor');
      console.log('2. Click "New query"');
      console.log('3. Copy the contents of migration.sql');
      console.log('4. Paste into SQL Editor');
      console.log('5. Click "Run" button');
      console.log('');
      console.log('Alternative: Use Connection Pooler URL');
      console.log('');

      // Try to check if tables already exist
      console.log('🔍 Checking current database tables...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!tablesError && tables) {
        console.log(`✅ Found ${tables.length} existing tables`);
        if (tables.length > 0) {
          console.log('Tables:', tables.map(t => t.table_name).join(', '));
        }
      }

      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!tablesError && tables) {
      console.log(`✅ Created ${tables.length} tables`);
      console.log('');
      console.log('Tables:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    console.log('');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Test: curl http://localhost:3000/health');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('');
    console.error('Please use Supabase SQL Editor to run the migration manually.');
    process.exit(1);
  }
}

runMigration();
