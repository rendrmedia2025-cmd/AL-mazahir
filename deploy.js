#!/usr/bin/env node

/**
 * Deployment script for Al Mazahir Trading Est. website
 * This script helps prepare and deploy the website to various hosting platforms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Al Mazahir Trading Est. - Deployment Script');
console.log('================================================');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'src/app/page.tsx',
  'src/components/sections/ProductCatalog.tsx',
  'src/components/sections/ContactSection.tsx'
];

console.log('\n📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check your project structure.');
  process.exit(1);
}

// Check environment variables
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_EMAILJS_SERVICE_ID',
  'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID', 
  'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY',
  'NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID'
];

let envVarsSet = true;
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`⚠️  ${envVar} - Not set (required for contact form)`);
    envVarsSet = false;
  }
});

if (!envVarsSet) {
  console.log('\n⚠️  Some environment variables are not set.');
  console.log('The website will build successfully but the contact form may not work.');
  console.log('Please set these variables in your hosting platform or .env.local file.');
}

// Run build
console.log('\n🔨 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.log('❌ Build failed. Please fix the errors and try again.');
  process.exit(1);
}

// Check build output
console.log('\n📦 Checking build output...');
const buildDir = '.next';
if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory exists');
  
  // Check for static files
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    console.log('✅ Static assets generated');
  }
  
  // Check for pages
  const serverDir = path.join(buildDir, 'server');
  if (fs.existsSync(serverDir)) {
    console.log('✅ Server files generated');
  }
} else {
  console.log('❌ Build directory not found');
  process.exit(1);
}

// Generate deployment info
console.log('\n📄 Generating deployment information...');
const deploymentInfo = {
  buildTime: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  buildSuccess: true,
  environmentVariables: {
    emailJSConfigured: envVarsSet,
    requiredVars: requiredEnvVars
  },
  deploymentPlatforms: {
    vercel: {
      recommended: true,
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm install',
      framework: 'nextjs'
    },
    netlify: {
      buildCommand: 'npm run build',
      publishDirectory: '.next',
      installCommand: 'npm install'
    },
    awsAmplify: {
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      nodeVersion: '18'
    }
  }
};

fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
console.log('✅ Deployment info saved to deployment-info.json');

// Success message
console.log('\n🎉 Deployment preparation completed successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Choose a hosting platform (Vercel recommended)');
console.log('2. Set up environment variables for EmailJS');
console.log('3. Connect your repository to the hosting platform');
console.log('4. Deploy using the platform\'s deployment process');

console.log('\n🔗 Recommended Hosting Platforms:');
console.log('• Vercel: https://vercel.com (Best for Next.js)');
console.log('• Netlify: https://netlify.com');
console.log('• AWS Amplify: https://aws.amazon.com/amplify/');

console.log('\n📚 Documentation:');
console.log('• See DEPLOYMENT_CHECKLIST.md for detailed instructions');
console.log('• See DEPLOYMENT_READINESS_REPORT.md for full status');

if (!envVarsSet) {
  console.log('\n⚠️  Remember to configure EmailJS environment variables!');
}