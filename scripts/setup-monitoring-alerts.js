#!/usr/bin/env node

/**
 * Setup Monitoring Alerts Script
 * Configures enterprise monitoring and alerting after deployment
 * Requirements: 14.2, 14.6
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ENTERPRISE_ALERT_RULES = [
  {
    name: 'Critical Page Load Time',
    description: 'Alert when page load time exceeds critical threshold',
    metric: 'page_load_time',
    condition: 'greater_than',
    threshold: 5000,
    time_window: 10,
    severity: 'critical',
    channels: ['email', 'slack']
  },
  {
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds acceptable threshold',
    metric: 'error_rate',
    condition: 'greater_than',
    threshold: 5,
    time_window: 15,
    severity: 'high',
    channels: ['email', 'slack']
  },
  {
    name: 'Database Connection Issues',
    description: 'Alert on database connection problems',
    metric: 'database_connection_errors',
    condition: 'greater_than',
    threshold: 3,
    time_window: 5,
    severity: 'critical',
    channels: ['email', 'slack']
  },
  {
    name: 'Security Incidents',
    description: 'Alert on high severity security events',
    metric: 'security_events_high',
    condition: 'greater_than',
    threshold: 0,
    time_window: 5,
    severity: 'critical',
    channels: ['email', 'slack']
  },
  {
    name: 'Memory Usage High',
    description: 'Alert when memory usage is consistently high',
    metric: 'memory_usage_percentage',
    condition: 'greater_than',
    threshold: 85,
    time_window: 30,
    severity: 'medium',
    channels: ['email']
  },
  {
    name: 'API Response Time Degradation',
    description: 'Alert when API response times degrade',
    metric: 'api_response_time_p95',
    condition: 'greater_than',
    threshold: 2000,
    time_window: 20,
    severity: 'medium',
    channels: ['email', 'slack']
  },
  {
    name: 'Failed Login Attempts',
    description: 'Alert on suspicious login activity',
    metric: 'failed_login_attempts',
    condition: 'greater_than',
    threshold: 10,
    time_window: 15,
    severity: 'medium',
    channels: ['email', 'slack']
  },
  {
    name: 'Business Metrics Anomaly',
    description: 'Alert when business metrics show unusual patterns',
    metric: 'business_metrics_anomaly',
    condition: 'greater_than',
    threshold: 0,
    time_window: 60,
    severity: 'low',
    channels: ['email']
  }
]

async function setupMonitoringAlerts() {
  try {
    console.log('🔧 Setting up enterprise monitoring alerts...')
    
    // Insert or update alert rules
    for (const rule of ENTERPRISE_ALERT_RULES) {
      const { data, error } = await supabase
        .from('alert_rules')
        .upsert({
          ...rule,
          is_active: true,
          created_by: null // System created
        }, {
          onConflict: 'name'
        })
        .select()
        .single()
      
      if (error) {
        console.warn(`⚠️  Failed to create alert rule "${rule.name}":`, error.message)
        continue
      }
      
      console.log(`✅ Alert rule configured: ${rule.name}`)
    }
    
    // Update system health components
    const healthComponents = [
      {
        component: 'web_server',
        status: 'healthy',
        metadata: {
          deployment_url: process.env.DEPLOYMENT_URL,
          version: process.env.GITHUB_RUN_NUMBER || '1',
          last_deployment: new Date().toISOString()
        }
      },
      {
        component: 'database',
        status: 'healthy',
        metadata: {
          provider: 'supabase',
          last_migration: new Date().toISOString()
        }
      },
      {
        component: 'monitoring',
        status: 'healthy',
        metadata: {
          alert_rules_count: ENTERPRISE_ALERT_RULES.length,
          setup_time: new Date().toISOString()
        }
      }
    ]
    
    for (const component of healthComponents) {
      const { error } = await supabase
        .from('system_health')
        .insert(component)
      
      if (error) {
        console.warn(`⚠️  Failed to update system health for ${component.component}:`, error.message)
      } else {
        console.log(`✅ System health updated: ${component.component}`)
      }
    }
    
    // Initialize business metrics
    const initialMetrics = [
      {
        metric_name: 'deployment_success_rate',
        metric_category: 'deployment',
        value: 100,
        unit: 'percentage',
        measurement_date: new Date().toISOString().split('T')[0]
      },
      {
        metric_name: 'system_uptime',
        metric_category: 'performance',
        value: 100,
        unit: 'percentage',
        measurement_date: new Date().toISOString().split('T')[0]
      },
      {
        metric_name: 'security_incidents',
        metric_category: 'security',
        value: 0,
        unit: 'count',
        measurement_date: new Date().toISOString().split('T')[0]
      }
    ]
    
    for (const metric of initialMetrics) {
      const { error } = await supabase
        .from('business_metrics')
        .upsert(metric, {
          onConflict: 'metric_name,metric_category,measurement_date'
        })
      
      if (error) {
        console.warn(`⚠️  Failed to initialize metric ${metric.metric_name}:`, error.message)
      } else {
        console.log(`✅ Business metric initialized: ${metric.metric_name}`)
      }
    }
    
    console.log('🎉 Enterprise monitoring alerts setup completed!')
    
  } catch (error) {
    console.error('❌ Failed to setup monitoring alerts:', error.message)
    process.exit(1)
  }
}

async function main() {
  await setupMonitoringAlerts()
}

if (require.main === module) {
  main()
}

module.exports = { setupMonitoringAlerts }