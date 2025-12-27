#!/usr/bin/env node
/**
 * Local deployment script for Al Mazahir Trading Est.
 * Builds and starts the production server locally
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Starting local deployment for Al Mazahir Trading Est...\n');

// Step 1: Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm ci', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 2: Build the application
console.log('🔨 Building production application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Install production server dependencies
console.log('🚀 Installing server dependencies...');
try {
  const serverDeps = ['express', 'compression', 'helmet'];
  execSync(`npm install ${serverDeps.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Server dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install server dependencies:', error.message);
  process.exit(1);
}

// Step 4: Create environment file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating environment file...');
  const envContent = `# Al Mazahir Trading Est. Environment Variables
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# EmailJS Configuration (Required for contact form)
# Replace with your actual EmailJS credentials
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID=your_auto_reply_template_id_here
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created\n');
}

console.log('🎉 Local deployment completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Configure EmailJS credentials in .env.local');
console.log('2. Run: npm run start:local');
console.log('3. Visit: http://localhost:3000');