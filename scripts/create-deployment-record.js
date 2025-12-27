#!/usr/bin/env node

/**
 * Create Deployment Record Script
 * Records deployment information for tracking and rollback capabilities
 * Requirements: 14.1, 14.2, 14.5
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createDeploymentRecord() {
  try {
    console.log('🚀 Creating deployment record...')
    
    const deploymentData = {
      commit_sha: process.env.COMMIT_SHA || process.env.GITHUB_SHA,
      environment: process.env.DEPLOYMENT_ENVIRONMENT || 'production',
      branch: process.env.GITHUB_REF_NAME || 'main',
      status: 'in_progress',
      started_at: new Date().toISOString(),
      metadata: {
        github_run_id: process.env.GITHUB_RUN_ID,
        github_run_number: process.env.GITHUB_RUN_NUMBER,
        github_actor: process.env.GITHUB_ACTOR,
        node_version: process.version,
        deployment_trigger: process.env.GITHUB_EVENT_NAME || 'manual'
      }
    }
    
    const { data, error } = await supabase
      .from('deployments')
      .insert(deploymentData)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    console.log('✅ Deployment record created:', {
      id: data.id,
      commit: data.commit_sha?.substring(0, 8),
      environment: data.environment,
      status: data.status
    })
    
    // Set environment variable for other scripts
    console.log(`::set-output name=deployment_id::${data.id}`)
    
    return data
  } catch (error) {
    console.error('❌ Failed to create deployment record:', error.message)
    process.exit(1)
  }
}

async function main() {
  await createDeploymentRecord()
}

if (require.main === module) {
  main()
}

module.exports = { createDeploymentRecord }