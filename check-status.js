// Simple status check script
const http = require('http');

console.log('🔍 Checking Al Mazahir website status...\n');

// Check main page
const checkEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode === 200 ? '✅' : '❌';
        console.log(`${status} ${description}: ${res.statusCode}`);
        if (path === '/') {
          const hasProducts = data.includes('Our Product Categories') || data.includes('products');
          const hasIndustries = data.includes('Industries We Serve') || data.includes('industries');
          console.log(`   📦 Products section: ${hasProducts ? '✅ Found' : '❌ Missing'}`);
          console.log(`   🏭 Industries section: ${hasIndustries ? '✅ Found' : '❌ Missing'}`);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: Error - ${err.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${description}: Timeout`);
      req.destroy();
      resolve();
    });
  });
};

async function runChecks() {
  await checkEndpoint('/', 'Main Page');
  await checkEndpoint('/api/public/availability', 'Availability API');
  await checkEndpoint('/test', 'Test Page');
  
  console.log('\n🌐 Website should be accessible at: http://localhost:3000');
  console.log('📋 Diagnostic page: file://' + __dirname + '/diagnostic-check.html');
}

runChecks();