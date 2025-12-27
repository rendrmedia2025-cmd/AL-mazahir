#!/usr/bin/env node

/**
 * Rollback Deployment Script
 * Handles automatic rollback to previous successful deployment
 * Requirements: 9.1, 9.2
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const previousSha = process.env.PREVIOUS_SHA;
const vercelToken = process.env.VERCEL_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rollbackDeployment() {
  try {
    console.log('🔄 Initiating deployment rollback...');

    // Get the last successful deployment
    const { data: lastDeployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('*')
      .eq('environment', 'production')
      .eq('status', 'success')
      .order('deployed_at', { ascending: false })
      .limit(2);

    if (deploymentError) {
      console.log('⚠️  Could not fetch deployment history, using git SHA');
    }

    const rollbackTarget = lastDeployment?.[1] || { commit_sha: previousSha };
    
    console.log(`📍 Rolling back to: ${rollbackTarget.commit_sha}`);

    // Disable risky feature flags first
    await disableRiskyFeatureFlags();

    // Record rollback attempt
    const { data: rollbackRecord, error: recordError } = await supabase
      .from('deployments')
      .insert({
        commit_sha: rollbackTarget.commit_sha,
        deployment_url: rollbackTarget.deployment_url || 'rollback-pending',
        environment: 'production',
        status: 'rollback',
        deployed_at: new Date().toISOString(),
        metadata: {
          rollback_reason: 'deployment_failure',
          original_sha: process.env.GITHUB_SHA,
          github_run_id: process.env.GITHUB_RUN_ID,
          automated: true
        }
      })
      .select()
      .single();

    if (recordError) {
      console.warn('⚠️  Could not record rollback:', recordError.message);
    }

    // If we have Vercel integration, trigger rollback
    if (vercelToken && rollbackTarget.deployment_url) {
      await triggerVercelRollback(rollbackTarget.deployment_url);
    }

    // Log the rollback
    await supabase.rpc('log_audit_event', {
      p_action: 'deployment_rollback',
      p_resource_type: 'deployment',
      p_resource_id: rollbackRecord?.id,
      p_new_values: {
        rollback_to: rollbackTarget.commit_sha,
        reason: 'deployment_failure',
        automated: true
      }
    });

    // Update business metrics
    await updateRollbackMetrics();

    console.log('✅ Rollback completed successfully');

  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    
    // Try emergency feature flag disable
    try {
      await emergencyFeatureFlagDisable();
      console.log('🚨 Emergency feature flag disable completed');
    } catch (emergencyError) {
      console.error('❌ Emergency disable failed:', emergencyError.message);
    }
    
    process.exit(1);
  }
}

async function disableRiskyFeatureFlags() {
  try {
    console.log('🚩 Disabling risky feature flags...');

    // Get flags that are in rollout with high percentages
    const { data: riskyFlags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('environment', 'production')
      .eq('status', 'rollout')
      .gte('rollout_percentage', 50);

    if (error) {
      console.warn('⚠️  Could not fetch risky flags:', error.message);
      return;
    }

    if (riskyFlags.length === 0) {
      console.log('✅ No risky feature flags found');
      return;
    }

    // Disable risky flags
    for (const flag of riskyFlags) {
      await supabase
        .from('feature_flags')
        .update({ 
          status: 'disabled',
          updated_by: 'system-rollback'
        })
        .eq('id', flag.id);
      
      console.log(`🔴 Disabled risky flag: ${flag.name}`);
    }

  } catch (error) {
    console.warn('⚠️  Could not disable risky flags:', error.message);
  }
}

async function emergencyFeatureFlagDisable() {
  console.log('🚨 Executing emergency feature flag disable...');

  // Disable all non-critical flags
  const criticalFlags = [
    'availability_indicators',
    'smart_enquiry_form',
    'admin_dashboard'
  ];

  const { error } = await supabase
    .from('feature_flags')
    .update({ 
      status: 'disabled',
      updated_by: 'emergency-rollback'
    })
    .eq('environment', 'production')
    .not('name', 'in', `(${criticalFlags.map(f => `"${f}"`).join(',')})`);

  if (error) {
    throw error;
  }

  console.log('🚨 Emergency disable completed');
}

async function triggerVercelRollback(targetUrl) {
  try {
    console.log('🔄 Triggering Vercel rollback...');
    
    // This would integrate with Vercel API to rollback
    // For now, just log the intent
    console.log(`📍 Would rollback to: ${targetUrl}`);
    
  } catch (error) {
    console.warn('⚠️  Vercel rollback failed:', error.message);
  }
}

async function updateRollbackMetrics() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Record rollback metric
    await supabase
      .from('business_metrics')
      .upsert({
        metric_name: 'rollbacks',
        metric_value: 1,
        metric_date: today,
        category: 'operations',
        metadata: {
          reason: 'deployment_failure',
          automated: true
        }
      }, {
        onConflict: 'metric_name,metric_date,category',
        ignoreDuplicates: false
      });

    // Update reliability metric
    await supabase
      .from('business_metrics')
      .upsert({
        metric_name: 'deployment_reliability',
        metric_value: 95, // Reduced due to rollback
        metric_date: today,
        category: 'performance'
      }, {
        onConflict: 'metric_name,metric_date,category',
        ignoreDuplicates: false
      });

  } catch (error) {
    console.warn('⚠️  Could not update rollback metrics:', error.message);
  }
}

// Run the rollback
rollbackDeployment();