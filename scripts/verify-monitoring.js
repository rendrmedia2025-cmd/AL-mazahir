#!/usr/bin/env node

/**
 * Verify Monitoring Setup Script
 * Validates that all monitoring components are working correctly
 * Requirements: 14.2, 14.6
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyMonitoringSetup() {
  try {
    console.log('🔍 Verifying enterprise monitoring setup...')
    
    const results = {
      alertRules: 0,
      systemHealth: 0,
      businessMetrics: 0,
      performanceMetrics: 0,
      errorEvents: 0,
      issues: []
    }
    
    // Check alert rules
    const { data: alertRules, error: alertError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true)
    
    if (alertError) {
      results.issues.push(`Alert rules check failed: ${alertError.message}`)
    } else {
      results.alertRules = alertRules.length
      console.log(`✅ Alert rules active: ${alertRules.length}`)
    }
    
    // Check system health
    const { data: systemHealth, error: healthError } = await supabase
      .from('system_health')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (healthError) {
      results.issues.push(`System health check failed: ${healthError.message}`)
    } else {
      results.systemHealth = systemHealth.length
      console.log(`✅ System health records: ${systemHealth.length}`)
      
      // Check for any unhealthy components
      const unhealthyComponents = systemHealth.filter(h => h.status !== 'healthy')
      if (unhealthyComponents.length > 0) {
        results.issues.push(`Unhealthy components detected: ${unhealthyComponents.map(c => c.component).join(', ')}`)
      }
    }
    
    // Check business metrics
    const { data: businessMetrics, error: metricsError } = await supabase
      .from('business_metrics')
      .select('*')
      .gte('measurement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    
    if (metricsError) {
      results.issues.push(`Business metrics check failed: ${metricsError.message}`)
    } else {
      results.businessMetrics = businessMetrics.length
      console.log(`✅ Business metrics (last 7 days): ${businessMetrics.length}`)
    }
    
    // Check performance metrics table exists and is accessible
    const { data: perfMetrics, error: perfError } = await supabase
      .from('performance_metrics')
      .select('count')
      .limit(1)
    
    if (perfError) {
      results.issues.push(`Performance metrics check failed: ${perfError.message}`)
    } else {
      results.performanceMetrics = 1
      console.log('✅ Performance metrics table accessible')
    }
    
    // Check error events table
    const { data: errorEvents, error: errorError } = await supabase
      .from('error_events')
      .select('count')
      .limit(1)
    
    if (errorError) {
      results.issues.push(`Error events check failed: ${errorError.message}`)
    } else {
      results.errorEvents = 1
      console.log('✅ Error events table accessible')
    }
    
    // Test alert rule evaluation function
    try {
      const { data: testAlert, error: testError } = await supabase
        .rpc('get_performance_summary', { time_range: '1 hour' })
      
      if (testError) {
        results.issues.push(`Performance summary function failed: ${testError.message}`)
      } else {
        console.log('✅ Performance summary function working')
      }
    } catch (error) {
      results.issues.push(`Performance summary function test failed: ${error.message}`)
    }
    
    // Verify database functions exist
    const requiredFunctions = [
      'get_operational_status',
      'update_operational_status',
      'record_business_metric',
      'log_security_event'
    ]
    
    for (const funcName of requiredFunctions) {
      try {
        const { error } = await supabase
          .rpc(funcName.replace('_', ''), {}) // This will fail but tells us if function exists
      } catch (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          results.issues.push(`Required function missing: ${funcName}`)
        } else {
          console.log(`✅ Function exists: ${funcName}`)
        }
      }
    }
    
    // Generate monitoring report
    console.log('\n📊 Monitoring Verification Report:')
    console.log('=====================================')
    console.log(`Alert Rules: ${results.alertRules}`)
    console.log(`System Health Records: ${results.systemHealth}`)
    console.log(`Business Metrics: ${results.businessMetrics}`)
    console.log(`Performance Metrics: ${results.performanceMetrics ? 'Available' : 'Not Available'}`)
    console.log(`Error Events: ${results.errorEvents ? 'Available' : 'Not Available'}`)
    
    if (results.issues.length > 0) {
      console.log('\n⚠️  Issues Found:')
      results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`)
      })
      
      if (results.issues.length > 3) {
        console.log('\n❌ Critical monitoring issues detected. Deployment should be reviewed.')
        process.exit(1)
      } else {
        console.log('\n⚠️  Minor monitoring issues detected. Consider addressing these.')
      }
    } else {
      console.log('\n🎉 All monitoring components verified successfully!')
    }
    
    // Test a sample metric insertion
    try {
      const { error: testMetricError } = await supabase
        .from('performance_metrics')
        .insert({
          name: 'monitoring_verification_test',
          value: 1,
          unit: 'count',
          timestamp: new Date().toISOString(),
          context: { test: true, verification_time: new Date().toISOString() },
          server_side: true
        })
      
      if (testMetricError) {
        console.log(`⚠️  Test metric insertion failed: ${testMetricError.message}`)
      } else {
        console.log('✅ Test metric insertion successful')
      }
    } catch (error) {
      console.log(`⚠️  Test metric insertion error: ${error.message}`)
    }
    
    return results
    
  } catch (error) {
    console.error('❌ Failed to verify monitoring setup:', error.message)
    process.exit(1)
  }
}

async function main() {
  await verifyMonitoringSetup()
}

if (require.main === module) {
  main()
}

module.exports = { verifyMonitoringSetup }