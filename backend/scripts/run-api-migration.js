const https = require('https');

// Netlify Functions API URL
const API_BASE = 'https://playful-cocada-a89755.netlify.app/.netlify/functions/api';

// Admin credentials (from seed data)
const ADMIN_EMAIL = 'admin@deepreading.com';
const ADMIN_PASSWORD = 'Admin123!@#';

/**
 * Login and get admin token
 */
async function loginAdmin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const options = {
      hostname: 'playful-cocada-a89755.netlify.app',
      port: 443,
      path: '/.netlify/functions/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    console.log('🔐 Logging in as admin...');

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          if (res.statusCode === 200 && response.success) {
            console.log('✅ Login successful!');
            console.log(`   Token: ${response.data.accessToken.substring(0, 20)}...`);
            resolve(response.data.accessToken);
          } else {
            console.error('❌ Login failed:', response.message);
            reject(new Error(response.message));
          }
        } catch (error) {
          console.error('❌ Parse error:', error.message);
          console.error('   Response:', body);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Check peer statistics status
 */
async function checkStatus(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'playful-cocada-a89755.netlify.app',
      port: 443,
      path: '/.netlify/functions/api/v1/admin/migrate/peer-stats/status',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    console.log('\n🔍 Checking peer statistics status...');

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          if (res.statusCode === 200) {
            console.log('✅ Status check successful!');
            console.log(`   Initialized: ${response.initialized}`);
            console.log(`   Count: ${response.count}`);

            if (response.sample) {
              console.log('   Sample data:');
              response.sample.forEach(s => {
                console.log(`   - ${s.category}: ${s.avgScore}% (n=${s.sampleSize})`);
              });
            }

            resolve(response);
          } else {
            console.error('❌ Status check failed:', response.message);
            reject(new Error(response.message));
          }
        } catch (error) {
          console.error('❌ Parse error:', error.message);
          console.error('   Response:', body);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

/**
 * Run migration
 */
async function runMigration(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'playful-cocada-a89755.netlify.app',
      port: 443,
      path: '/.netlify/functions/api/v1/admin/migrate/peer-stats',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    console.log('\n🚀 Running peer statistics migration...');

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          if (res.statusCode === 200 && response.success) {
            console.log('✅ Migration completed!');
            console.log(`   Message: ${response.message}`);
            console.log(`   Inserted: ${response.inserted || response.count} records`);
            resolve(response);
          } else {
            console.error('❌ Migration failed:', response.message);
            reject(new Error(response.message));
          }
        } catch (error) {
          console.error('❌ Parse error:', error.message);
          console.error('   Response:', body);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('Peer Statistics Migration Tool');
    console.log('='.repeat(60));

    // Step 1: Login
    const token = await loginAdmin();

    // Step 2: Check current status
    const status = await checkStatus(token);

    // Step 3: Run migration if needed
    if (status.initialized && status.count > 0) {
      console.log('\n✅ Peer statistics already initialized!');
      console.log(`   Total records: ${status.count}`);
      console.log('\n   Skipping migration.');
    } else {
      await runMigration(token);

      // Verify after migration
      console.log('\n🔍 Verifying migration...');
      await checkStatus(token);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All done!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { loginAdmin, checkStatus, runMigration };
