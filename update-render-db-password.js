// Script to update Render.com DATABASE_URL with new password
// Run with: node update-render-db-password.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Opening Render.com dashboard...');
    await page.goto('https://dashboard.render.com/');

    console.log('⏳ Please log in to Render.com manually...');
    console.log('   Then navigate to the backend service environment variables page.');
    console.log('   Press ENTER when ready to update DATABASE_URL...');

    // Wait for user to press ENTER
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    console.log('\n📝 Instructions:');
    console.log('1. Find the DATABASE_URL environment variable');
    console.log('2. Click Edit');
    console.log('3. Update the password from "DeepReading2025!@#$SecureDB" to "DEEPREADING86!"');
    console.log('   Full URL: postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DEEPREADING86!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres');
    console.log('4. Click Save Changes');
    console.log('\n⚠️  NOTE: Service will auto-redeploy after saving!');
    console.log('\nPress ENTER when done...');

    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    console.log('✅ Done! The browser will stay open for verification.');
    console.log('   Close the browser when ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
