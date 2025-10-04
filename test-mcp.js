#!/usr/bin/env node

/**
 * Supabase MCP Server Test Script
 *
 * Usage:
 *   node test-mcp.js YOUR_ACCESS_TOKEN
 *
 * This script verifies that the Supabase MCP server is properly installed
 * and can be executed with your personal access token.
 */

const { spawn } = require('child_process');

const accessToken = process.argv[2];

if (!accessToken) {
  console.error('❌ Error: Personal Access Token required');
  console.error('');
  console.error('Usage:');
  console.error('  node test-mcp.js YOUR_ACCESS_TOKEN');
  console.error('');
  console.error('Get your token from:');
  console.error('  https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

console.log('🧪 Testing Supabase MCP Server...');
console.log('');

const mcp = spawn('npx', [
  '-y',
  '@supabase/mcp-server-supabase@latest',
  '--access-token',
  accessToken
], {
  stdio: 'inherit'
});

mcp.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error.message);
  process.exit(1);
});

mcp.on('close', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✅ MCP Server test completed successfully!');
  } else {
    console.log('');
    console.error(`❌ MCP Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️  Test interrupted by user');
  mcp.kill('SIGINT');
  process.exit(0);
});
