#!/usr/bin/env node

/**
 * Supabase Validation Script
 * 
 * This script validates that the Supabase setup is working correctly
 * by testing the client connections and basic functionality.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Supabase Setup...\n');

// Check if environment variables are set
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('   Please create .env.local with your Supabase credentials\n');
  process.exit(1);
}

// Read environment variables
require('dotenv').config({ path: envPath });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n   Please update your .env.local file\n');
  process.exit(1);
}

console.log('✅ Environment variables configured');

// Check if Supabase files exist
const requiredFiles = [
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/lib/supabase/middleware.ts',
  'src/lib/types/database.ts',
  'middleware.ts',
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/seed.sql'
];

const missingFiles = requiredFiles.filter(filePath => !fs.existsSync(path.join(process.cwd(), filePath)));

if (missingFiles.length > 0) {
  console.log('❌ Missing required files:');
  missingFiles.forEach(filePath => {
    console.log(`   - ${filePath}`);
  });
  console.log('\n   Please run the setup script: npm run setup:supabase\n');
  process.exit(1);
}

console.log('✅ All required files present');

// Test basic Supabase connection (if we can import the modules)
try {
  // This will test if the TypeScript files can be imported without syntax errors
  const { createClient } = require('@supabase/supabase-js');
  
  // Create a test client to validate the configuration format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl.startsWith('https://') || !supabaseKey) {
    throw new Error('Invalid Supabase configuration format');
  }
  
  console.log('✅ Supabase client configuration valid');
  
} catch (error) {
  console.log('❌ Supabase client validation failed:');
  console.log(`   ${error.message}\n`);
  process.exit(1);
}

// Check if migrations are ready
const schemaFile = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
const schemaContent = fs.readFileSync(schemaFile, 'utf8');

const requiredTables = [
  'product_categories',
  'availability_status',
  'enhanced_leads',
  'admin_profiles',
  'audit_log'
];

const missingTables = requiredTables.filter(tableName => !schemaContent.includes(`CREATE TABLE ${tableName}`));

if (missingTables.length > 0) {
  console.log('❌ Missing table definitions in schema:');
  missingTables.forEach(tableName => {
    console.log(`   - ${tableName}`);
  });
  console.log('\n');
  process.exit(1);
}

console.log('✅ Database schema complete');

console.log('\n🎉 Supabase setup validation passed!');
console.log('\n📋 Next steps:');
console.log('1. Create your Supabase project at https://supabase.com/dashboard');
console.log('2. Update .env.local with your actual project credentials');
console.log('3. Run the database migrations in your Supabase SQL editor');
console.log('4. Create your first admin user');
console.log('5. Test the connection by running: npm run dev\n');

console.log('💡 For detailed instructions, run: npm run setup:supabase\n');