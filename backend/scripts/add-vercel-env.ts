/**
 * Add Environment Variables to Vercel Project
 *
 * Usage:
 * 1. Get your Vercel token from: https://vercel.com/account/tokens
 * 2. Run: VERCEL_TOKEN=your_token npx ts-node scripts/add-vercel-env.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = 'literacy-assessment-backend'; // Your project name

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  console.error('Get your token from: https://vercel.com/account/tokens');
  process.exit(1);
}

interface EnvVar {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
}

async function addEnvVariable(projectId: string, envVar: EnvVar): Promise<void> {
  const url = `https://api.vercel.com/v10/projects/${projectId}/env`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: envVar.key,
      value: envVar.value,
      type: 'encrypted',
      target: envVar.target,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add ${envVar.key}: ${error}`);
  }

  console.log(`✅ Added: ${envVar.key}`);
}

async function main() {
  console.log('🚀 Adding environment variables to Vercel...\n');

  // Read .env.vercel file
  const envFilePath = path.join(__dirname, '..', '.env.vercel');
  const envContent = fs.readFileSync(envFilePath, 'utf-8');

  const envVars: EnvVar[] = [];

  // Parse environment variables
  envContent.split('\n').forEach((line) => {
    line = line.trim();

    // Skip comments and empty lines
    if (line.startsWith('#') || !line) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=');

    // Remove quotes
    value = value.replace(/^["']|["']$/g, '');

    envVars.push({
      key: key.trim(),
      value: value.trim(),
      target: ['production', 'preview', 'development'],
    });
  });

  // Add each environment variable
  for (const envVar of envVars) {
    try {
      await addEnvVariable(VERCEL_PROJECT_ID, envVar);
    } catch (error) {
      console.error(`❌ Error adding ${envVar.key}:`, error);
    }
  }

  console.log('\n✅ Environment variables setup complete!');
  console.log('\nNext steps:');
  console.log('1. Verify in Vercel Dashboard');
  console.log('2. Trigger redeploy');
}

main().catch(console.error);
