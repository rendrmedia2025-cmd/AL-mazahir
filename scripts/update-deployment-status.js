#!/usr/bin/env node

/**
 * Update Deployment Status
 * Records deployment information in the database for tracking
 * Requirements: 9.1, 9.2, 9.6
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const deploymentUrl = process.env.DEPLOYMENT_URL;
const commitSha = process.env.COMMIT_SHA;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDeploymentStatus() {
  try {
    console.log('📝 Recording deployment status...');

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .insert({
        commit_sha: commitSha,
        deployment_url: deploymentUrl,
        environment: 'production',
        status: 'success',
        deployed_at: new Date().toISOString(),
        metadata: {
          github_run_id: process.env.GITHUB_RUN_ID,
          github_actor: process.env.GITHUB_ACTOR,
          workflow: 'ci-cd'
        }
      })
      .select()
      .single();

    if (deploymentError) {
      // If deployments table doesn't exist, create it
      if (deploymentError.code === '42P01') {
        console.log('📋 Creating deployments table...');
        
        const { error: createError } = await supabase.rpc('create_deployments_table');
        if (createError) {
          console.log('⚠️  Could not create deployments table, logging to audit instead');
          await logToAudit();
          return;
        }
        
        // Retry insertion
        const { error: retryError } = await supabase
          .from('deployments')
          .insert({
            commit_sha: commitSha,
            deployment_url: deploymentUrl,
            environment: 'production',
            status: 'success',
            deployed_at: new Date().toISOString(),
            metadata: {
              github_run_id: process.env.GITHUB_RUN_ID,
              github_actor: process.env.GITHUB_ACTOR,
              workflow: 'ci-cd'
            }
          });
          
        if (retryError) {
          throw retryError;
        }
      } else {
        throw deploymentError;
      }
    }

    // Update business metrics
    await updateBusinessMetrics();

    // Log successful deployment
    await supabase.rpc('log_audit_event', {
      p_action: 'deployment_success',
      p_resource_type: 'deployment',
      p_resource_id: deployment?.id,
      p_new_values: {
        commit_sha: commitSha,
        deployment_url: deploymentUrl,
        environment: 'production'
      }
    });

    console.log('✅ Deployment status recorded successfully');

  } catch (error) {
    console.error('❌ Failed to record deployment status:', error.message);
    
    // Try to log to audit as fallback
    try {
      await logToAudit();
      console.log('✅ Logged to audit as fallback');
    } catch (auditError) {
      console.error('❌ Failed to log to audit:', auditError.message);
    }
    
    // Don't fail the deployment for logging issues
    process.exit(0);
  }
}

async function logToAudit() {
  await supabase.rpc('log_audit_event', {
    p_action: 'deployment_success',
    p_resource_type: 'deployment',
    p_new_values: {
      commit_sha: commitSha,
      deployment_url: deploymentUrl,
      environment: 'production',
      github_run_id: process.env.GITHUB_RUN_ID,
      github_actor: process.env.GITHUB_ACTOR
    }
  });
}

async function updateBusinessMetrics() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Record deployment metric
    await supabase
      .from('business_metrics')
      .upsert({
        metric_name: 'deployments',
        metric_value: 1,
        metric_date: today,
        category: 'operations',
        metadata: {
          commit_sha: commitSha,
          deployment_url: deploymentUrl
        }
      }, {
        onConflict: 'metric_name,metric_date,category',
        ignoreDuplicates: false
      });

    // Update uptime metric
    await supabase
      .from('business_metrics')
      .upsert({
        metric_name: 'uptime_percentage',
        metric_value: 100, // Assume 100% if deployment succeeded
        metric_date: today,
        category: 'performance'
      }, {
        onConflict: 'metric_name,metric_date,category',
        ignoreDuplicates: false
      });

  } catch (error) {
    console.warn('⚠️  Could not update business metrics:', error.message);
  }
}

// Run the update
updateDeploymentStatus();