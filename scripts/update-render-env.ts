/**
 * Playwright script to automate Render dashboard environment variable updates
 *
 * Prerequisites:
 * - npm install -D @playwright/test
 * - Set RENDER_EMAIL and RENDER_PASSWORD environment variables
 *
 * Usage:
 * npx tsx scripts/update-render-env.ts
 */

import { chromium } from '@playwright/test';

const RENDER_EMAIL = process.env.RENDER_EMAIL;
const RENDER_PASSWORD = process.env.RENDER_PASSWORD;

// Service name to update
const SERVICE_NAME = 'literacy-backend';

// Environment variables to add/update
const ENV_VARS = {
  DATABASE_URL: 'postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
  JWT_SECRET: 'literacy-test-secret-key-2025-very-secure-and-long-enough-for-production',
  NODE_ENV: 'production',
};

async function updateRenderEnvironmentVariables() {
  if (!RENDER_EMAIL || !RENDER_PASSWORD) {
    console.error('❌ Error: RENDER_EMAIL and RENDER_PASSWORD environment variables are required');
    console.log('Usage: RENDER_EMAIL=your@email.com RENDER_PASSWORD=yourpass npx tsx scripts/update-render-env.ts');
    process.exit(1);
  }

  console.log('🚀 Starting Render dashboard automation...');

  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 500 // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to Render login
    console.log('📍 Step 1: Navigating to Render login page...');
    await page.goto('https://dashboard.render.com/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Login
    console.log('🔐 Step 2: Logging in to Render...');
    await page.fill('input[type="email"]', RENDER_EMAIL);
    await page.fill('input[type="password"]', RENDER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard.render.com/**', { timeout: 15000 });
    console.log('✅ Successfully logged in');

    // Step 3: Navigate to services
    console.log('📍 Step 3: Navigating to services...');
    await page.waitForSelector('text=Web Services', { timeout: 10000 });
    await page.click('text=Web Services');
    await page.waitForLoadState('networkidle');

    // Step 4: Find and click the literacy-backend service
    console.log(`🔍 Step 4: Finding service "${SERVICE_NAME}"...`);
    await page.waitForSelector(`text=${SERVICE_NAME}`, { timeout: 10000 });
    await page.click(`text=${SERVICE_NAME}`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Opened service page');

    // Step 5: Navigate to Environment tab
    console.log('📍 Step 5: Opening Environment tab...');
    await page.waitForSelector('text=Environment', { timeout: 10000 });
    await page.click('text=Environment');
    await page.waitForLoadState('networkidle');
    console.log('✅ Environment tab opened');

    // Step 6: Update environment variables
    console.log('🔧 Step 6: Updating environment variables...');

    for (const [key, value] of Object.entries(ENV_VARS)) {
      console.log(`  📝 Processing ${key}...`);

      try {
        // Check if variable exists by looking for the key
        const existingVar = await page.locator(`text="${key}"`).first();
        const exists = await existingVar.isVisible().catch(() => false);

        if (exists) {
          console.log(`    ℹ️  ${key} exists, updating...`);

          // Click edit button next to the variable
          await page.locator(`text="${key}"`).first().locator('..').locator('button:has-text("Edit")').click();
          await page.waitForTimeout(500);

          // Find value input and update
          const valueInput = await page.locator('input[name="value"]').last();
          await valueInput.clear();
          await valueInput.fill(value);

          // Click save
          await page.click('button:has-text("Save")');
          await page.waitForTimeout(1000);

          console.log(`    ✅ ${key} updated`);
        } else {
          console.log(`    ℹ️  ${key} doesn't exist, adding...`);

          // Click "Add Environment Variable" button
          await page.click('button:has-text("Add Environment Variable")');
          await page.waitForTimeout(500);

          // Fill in key and value
          await page.fill('input[name="key"]', key);
          await page.fill('input[name="value"]', value);

          // Click save
          await page.click('button:has-text("Save")');
          await page.waitForTimeout(1000);

          console.log(`    ✅ ${key} added`);
        }
      } catch (error) {
        console.error(`    ❌ Error processing ${key}:`, error.message);
      }
    }

    // Step 7: Save all changes (if there's a final save button)
    console.log('💾 Step 7: Saving changes...');
    try {
      const saveChangesButton = page.locator('button:has-text("Save Changes")');
      if (await saveChangesButton.isVisible()) {
        await saveChangesButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Changes saved');
      }
    } catch {
      console.log('ℹ️  No "Save Changes" button found (changes may auto-save)');
    }

    // Step 8: Verify deployment
    console.log('🔄 Step 8: Checking deployment status...');
    await page.click('text=Events');
    await page.waitForLoadState('networkidle');

    const deploymentStatus = await page.locator('text=/Deploy (live|succeeded|in progress)/i').first().textContent();
    console.log(`📊 Deployment status: ${deploymentStatus}`);

    console.log('\n✅ ========================================');
    console.log('✅ Environment variables updated successfully!');
    console.log('✅ ========================================\n');
    console.log('📋 Next steps:');
    console.log('1. Wait for Render to automatically redeploy (2-3 minutes)');
    console.log('2. Check Events tab for "Deploy succeeded" message');
    console.log('3. Test login at frontend: https://playful-cocada-a89755.netlify.app');
    console.log('   - Email: test@test.com');
    console.log('   - Password: test123');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ Error during automation:');
    console.error('❌ ========================================');
    console.error(error);

    // Take screenshot on error
    await page.screenshot({ path: 'render-error-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved to: render-error-screenshot.png');
  } finally {
    // Keep browser open for 5 seconds to see final state
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

    await browser.close();
    console.log('👋 Browser closed');
  }
}

// Run the automation
updateRenderEnvironmentVariables().catch(console.error);
