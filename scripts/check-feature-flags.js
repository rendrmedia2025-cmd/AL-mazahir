#!/usr/bin/env node

/**
 * Pre-deployment Feature Flag Safety Check
 * Ensures critical feature flags are in safe states before deployment
 * Requirements: 9.1, 9.2
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeatureFlags() {
  try {
    console.log('🔍 Checking feature flag safety before deployment...');

    // Get all active feature flags
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('environment', 'production')
      .in('status', ['enabled', 'rollout']);

    if (error) {
      throw new Error(`Failed to fetch feature flags: ${error.message}`);
    }

    console.log(`📊 Found ${flags.length} active feature flags`);

    // Define critical flags that should be checked
    const criticalFlags = [
      'availability_indicators',
      'smart_enquiry_form',
      'dynamic_cta_logic',
      'admin_dashboard'
    ];

    // Check for any flags that might cause issues
    const riskyFlags = [];
    const newFlags = [];

    for (const flag of flags) {
      // Check for flags created in the last hour (potentially untested)
      const createdAt = new Date(flag.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (createdAt > oneHourAgo) {
        newFlags.push(flag);
      }

      // Check for rollout flags with high percentages that might be risky
      if (flag.status === 'rollout' && flag.rollout_percentage > 50) {
        riskyFlags.push(flag);
      }

      // Check for expired flags
      if (flag.expires_at && new Date(flag.expires_at) < new Date()) {
        console.log(`⚠️  Flag '${flag.name}' has expired but is still active`);
      }
    }

    // Verify critical flags are in expected states
    for (const criticalFlagName of criticalFlags) {
      const flag = flags.find(f => f.name === criticalFlagName);
      if (!flag) {
        console.log(`⚠️  Critical flag '${criticalFlagName}' not found or disabled`);
      } else if (flag.status === 'rollout' && flag.rollout_percentage < 10) {
        console.log(`⚠️  Critical flag '${criticalFlagName}' has very low rollout percentage`);
      }
    }

    // Report findings
    if (newFlags.length > 0) {
      console.log(`⚠️  ${newFlags.length} flags created in the last hour:`);
      newFlags.forEach(flag => {
        console.log(`   - ${flag.name} (${flag.status})`);
      });
    }

    if (riskyFlags.length > 0) {
      console.log(`⚠️  ${riskyFlags.length} flags with high rollout percentages:`);
      riskyFlags.forEach(flag => {
        console.log(`   - ${flag.name} (${flag.rollout_percentage}%)`);
      });
    }

    // Check for any deployment blockers
    const blockers = flags.filter(flag => 
      flag.name.includes('block_deployment') && flag.status === 'enabled'
    );

    if (blockers.length > 0) {
      console.error('❌ Deployment blocked by feature flags:');
      blockers.forEach(flag => {
        console.error(`   - ${flag.name}: ${flag.description}`);
      });
      process.exit(1);
    }

    console.log('✅ Feature flag safety check passed');
    
    // Log deployment readiness metrics
    const enabledCount = flags.filter(f => f.status === 'enabled').length;
    const rolloutCount = flags.filter(f => f.status === 'rollout').length;
    
    console.log(`📈 Deployment metrics:`);
    console.log(`   - Enabled flags: ${enabledCount}`);
    console.log(`   - Rollout flags: ${rolloutCount}`);
    console.log(`   - Total active: ${flags.length}`);

  } catch (error) {
    console.error('❌ Feature flag check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkFeatureFlags();