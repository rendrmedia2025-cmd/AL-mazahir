#!/usr/bin/env node

/**
 * Post-Deployment Health Check Script
 * Validates deployment health and functionality
 * Requirements: 9.1, 9.2, 9.6
 */

const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const baseUrl = process.argv[2] || process.env.BASE_URL || 'https://al-mazahir.vercel.app';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const healthChecks = [
  {
    name: 'homepage_load',
    description: 'Homepage loads successfully',
    url: '/',
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'api_availability',
    description: 'Availability API responds',
    url: '/api/public/availability',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'admin_login_page',
    description: 'Admin login page loads',
    url: '/admin/login',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'feature_flags_api',
    description: 'Feature flags API responds',
    url: '/api/feature-flags',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'sitemap_xml',
    description: 'Sitemap.xml is accessible',
    url: '/sitemap.xml',
    expectedStatus: 200,
    timeout: 3000
  },
  {
    name: 'robots_txt',
    description: 'Robots.txt is accessible',
    url: '/robots.txt',
    expectedStatus: 200,
    timeout: 3000
  }
];

async function runHealthChecks() {
  console.log(`🏥 Running health checks for: ${baseUrl}`);
  console.log(`📊 Total checks: ${healthChecks.length}`);
  
  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const check of healthChecks) {
    console.log(`\n🔍 Running: ${check.description}`);
    
    const startTime = Date.now();
    const result = await runSingleCheck(check);
    const duration = Date.now() - startTime;
    
    result.duration = duration;
    results.push(result);

    if (result.passed) {
      passedCount++;
      console.log(`✅ ${check.name}: PASSED (${duration}ms)`);
    } else {
      failedCount++;
      console.log(`❌ ${check.name}: FAILED (${duration}ms)`);
      console.log(`   Error: ${result.error}`);
    }

    // Record health check in database if available
    if (supabase && process.env.DEPLOYMENT_ID) {
      try {
        await supabase.rpc('record_health_check', {
          p_deployment_id: process.env.DEPLOYMENT_ID,
          p_check_name: check.name,
          p_status: result.passed ? 'passed' : 'failed',
          p_response_time_ms: duration,
          p_error_message: result.error || null,
          p_metadata: {
            url: check.url,
            expected_status: check.expectedStatus,
            actual_status: result.statusCode
          }
        });
      } catch (dbError) {
        console.warn(`⚠️  Could not record health check: ${dbError.message}`);
      }
    }
  }

  // Summary
  console.log(`\n📈 Health Check Summary:`);
  console.log(`   ✅ Passed: ${passedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📊 Success Rate: ${Math.round((passedCount / healthChecks.length) * 100)}%`);

  // Performance summary
  const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxResponseTime = Math.max(...results.map(r => r.duration));
  
  console.log(`   ⏱️  Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`   🐌 Slowest Response: ${maxResponseTime}ms`);

  // Check for performance issues
  const slowChecks = results.filter(r => r.duration > 3000);
  if (slowChecks.length > 0) {
    console.log(`\n⚠️  Slow responses detected:`);
    slowChecks.forEach(check => {
      console.log(`   - ${check.name}: ${check.duration}ms`);
    });
  }

  // Exit with appropriate code
  if (failedCount > 0) {
    console.log(`\n❌ Health checks failed. Deployment may have issues.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All health checks passed. Deployment is healthy.`);
    process.exit(0);
  }
}

async function runSingleCheck(check) {
  return new Promise((resolve) => {
    const url = new URL(check.url, baseUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const request = client.get(url.toString(), {
      timeout: check.timeout,
      headers: {
        'User-Agent': 'Health-Check-Bot/1.0',
        'Accept': 'text/html,application/json,*/*'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const passed = response.statusCode === check.expectedStatus;
        resolve({
          name: check.name,
          passed,
          statusCode: response.statusCode,
          error: passed ? null : `Expected ${check.expectedStatus}, got ${response.statusCode}`,
          responseSize: data.length,
          headers: response.headers
        });
      });
    });

    request.on('error', (error) => {
      resolve({
        name: check.name,
        passed: false,
        statusCode: null,
        error: error.message,
        responseSize: 0
      });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({
        name: check.name,
        passed: false,
        statusCode: null,
        error: `Timeout after ${check.timeout}ms`,
        responseSize: 0
      });
    });
  });
}

// Additional checks for specific functionality
async function runAdvancedHealthChecks() {
  console.log(`\n🔬 Running advanced health checks...`);

  // Check if feature flags are working
  try {
    const flagsResponse = await fetch(`${baseUrl}/api/feature-flags`);
    const flagsData = await flagsResponse.json();
    
    if (flagsData.success && typeof flagsData.flags === 'object') {
      console.log(`✅ Feature flags system: WORKING`);
      console.log(`   Active flags: ${Object.keys(flagsData.flags).length}`);
    } else {
      console.log(`❌ Feature flags system: FAILED`);
    }
  } catch (error) {
    console.log(`❌ Feature flags system: ERROR - ${error.message}`);
  }

  // Check database connectivity (if Supabase is configured)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('count')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Database connectivity: WORKING`);
      } else {
        console.log(`❌ Database connectivity: FAILED - ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Database connectivity: ERROR - ${error.message}`);
    }
  }
}

// Run all health checks
async function main() {
  try {
    await runHealthChecks();
    await runAdvancedHealthChecks();
  } catch (error) {
    console.error(`❌ Health check runner failed: ${error.message}`);
    process.exit(1);
  }
}

main();