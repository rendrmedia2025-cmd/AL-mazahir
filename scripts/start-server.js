#!/usr/bin/env node
/**
 * Server startup script for Al Mazahir Trading Est.
 * Starts the production server with proper configuration
 */

const { spawn } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🚀 Starting Al Mazahir Trading Est. production server...\n');

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.kill('SIGTERM');
});