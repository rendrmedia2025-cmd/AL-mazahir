#!/usr/bin/env node

/**
 * Supabase Setup Script
 * 
 * This script helps set up the Supabase project for the Dynamic Enhancement Layer.
 * It provides instructions and validates the environment configuration.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Al Mazahir Trading - Supabase Setup Script');
console.log('================================================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.local.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.local file not found. Creating from example...\n');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env.local from .env.local.example\n');
  } else {
    console.log('❌ .env.local.example not found. Please create .env.local manually.\n');
    process.exit(1);
  }
}

console.log('📋 Setup Instructions:');
console.log('======================\n');

console.log('1. Create a new Supabase project:');
console.log('   - Go to https://supabase.com/dashboard');
console.log('   - Click "New Project"');
console.log('   - Choose your organization');
console.log('   - Name: "Al Mazahir Dynamic Enhancement"');
console.log('   - Database Password: (choose a strong password)');
console.log('   - Region: (choose closest to your users)\n');

console.log('2. Get your project credentials:');
console.log('   - Go to Settings > API');
console.log('   - Copy the Project URL');
console.log('   - Copy the anon/public key');
console.log('   - Copy the service_role key (keep this secret!)\n');

console.log('3. Update your .env.local file:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL=your_project_url');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
console.log('   - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');

console.log('4. Run the database migrations:');
console.log('   - Go to SQL Editor in your Supabase dashboard');
console.log('   - Copy and run the contents of supabase/migrations/001_initial_schema.sql');
console.log('   - Copy and run the contents of supabase/migrations/002_rls_policies.sql');
console.log('   - Copy and run the contents of supabase/seed.sql\n');

console.log('5. Set up authentication:');
console.log('   - Go to Authentication > Settings');
console.log('   - Disable "Enable email confirmations" for development');
console.log('   - Set Site URL to http://localhost:3000');
console.log('   - Add redirect URLs if needed\n');

console.log('6. Create your first admin user:');
console.log('   - Go to Authentication > Users');
console.log('   - Click "Add user"');
console.log('   - Enter email and password');
console.log('   - After creation, run this SQL to make them an admin:');
console.log('   INSERT INTO admin_profiles (id, role, full_name, is_active)');
console.log('   VALUES (\'user_id_here\', \'admin\', \'Your Name\', true);\n');

console.log('7. Test the setup:');
console.log('   - Run: npm run dev');
console.log('   - Visit http://localhost:3000');
console.log('   - Check that the site loads without errors\n');

console.log('📁 Files created:');
console.log('==================');
console.log('✅ src/lib/supabase/client.ts - Browser client');
console.log('✅ src/lib/supabase/server.ts - Server client');
console.log('✅ src/lib/supabase/middleware.ts - Auth middleware');
console.log('✅ src/lib/types/database.ts - TypeScript types');
console.log('✅ supabase/migrations/001_initial_schema.sql - Database schema');
console.log('✅ supabase/migrations/002_rls_policies.sql - Security policies');
console.log('✅ supabase/seed.sql - Initial data');
console.log('✅ supabase/config.toml - Local development config');
console.log('✅ middleware.ts - Next.js middleware');
console.log('✅ .env.local.example - Updated with Supabase vars\n');

console.log('🔧 Next Steps:');
console.log('===============');
console.log('1. Follow the setup instructions above');
console.log('2. Update your .env.local file with actual Supabase credentials');
console.log('3. Run the database migrations in your Supabase dashboard');
console.log('4. Create your first admin user');
console.log('5. Start implementing the next task in the implementation plan\n');

console.log('💡 Need help?');
console.log('=============');
console.log('- Supabase Documentation: https://supabase.com/docs');
console.log('- Next.js + Supabase Guide: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs');
console.log('- Project Requirements: .kiro/specs/dynamic-enhancement-layer/requirements.md\n');

console.log('✨ Setup script completed successfully!');