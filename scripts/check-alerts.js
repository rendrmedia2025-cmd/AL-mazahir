#!/usr/bin/env node

/**
 * Alert Checking Script
 * Periodically checks alert rules and triggers notifications
 * Requirements: 9.3, 10.2
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAlerts() {
  try {
    console.log('🔍 Checking alert rules...');

    // Get all active alert rules
    const { data: rules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      throw new Error(`Failed to fetch alert rules: ${rulesError.message}`);
    }

    console.log(`📋 Found ${rules.length} active alert rules`);

    let alertsTriggered = 0;

    for (const rule of rules) {
      try {
        const shouldAlert = await evaluateAlertRule(rule);
        if (shouldAlert) {
          await triggerAlert(rule, shouldAlert);
          alertsTriggered++;
        }
      } catch (error) {
        console.error(`❌ Error evaluating rule ${rule.name}:`, error.message);
      }
    }

    console.log(`🚨 Triggered ${alertsTriggered} alerts`);

    // Update system health for monitoring component
    await supabase.rpc('update_system_health', {
      p_component: 'alerting',
      p_status: 'healthy',
      p_metadata: {
        rules_checked: rules.length,
        alerts_triggered: alertsTriggered,
        last_check: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Alert checking failed:', error.message);
    
    // Update system health to indicate alerting issues
    try {
      await supabase.rpc('update_system_health', {
        p_component: 'alerting',
        p_status: 'degraded',
        p_metadata: {
          error: error.message,
          last_check: new Date().toISOString()
        }
      });
    } catch (healthError) {
      console.error('❌ Failed to update health status:', healthError.message);
    }
    
    process.exit(1);
  }
}

async function evaluateAlertRule(rule) {
  const timeWindowMs = rule.time_window * 60 * 1000;
  const since = new Date(Date.now() - timeWindowMs).toISOString();

  // Get metrics for this rule
  const { data: metrics, error } = await supabase
    .from('performance_metrics')
    .select('value, timestamp')
    .eq('name', rule.metric)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false });

  if (error) {
    console.warn(`⚠️  Failed to fetch metrics for ${rule.metric}:`, error.message);
    return false;
  }

  if (!metrics || metrics.length === 0) {
    console.log(`📊 No metrics found for ${rule.metric} in the last ${rule.time_window} minutes`);
    return false;
  }

  // Calculate aggregate value (average for now)
  const avgValue = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  const maxValue = Math.max(...metrics.map(m => m.value));
  const minValue = Math.min(...metrics.map(m => m.value));

  console.log(`📈 ${rule.metric}: avg=${avgValue.toFixed(2)}, min=${minValue}, max=${maxValue} (${metrics.length} samples)`);

  // Check if alert condition is met
  let shouldAlert = false;
  let actualValue = avgValue;

  switch (rule.condition) {
    case 'greater_than':
      shouldAlert = avgValue > rule.threshold;
      break;
    case 'less_than':
      shouldAlert = avgValue < rule.threshold;
      break;
    case 'equals':
      shouldAlert = Math.abs(avgValue - rule.threshold) < 0.01; // Allow small floating point differences
      break;
    case 'not_equals':
      shouldAlert = Math.abs(avgValue - rule.threshold) >= 0.01;
      break;
  }

  if (shouldAlert) {
    console.log(`🚨 Alert condition met for ${rule.name}: ${actualValue} ${rule.condition} ${rule.threshold}`);
    return {
      metric: rule.metric,
      value: actualValue,
      threshold: rule.threshold,
      condition: rule.condition,
      samples: metrics.length,
      timeWindow: rule.time_window
    };
  }

  return false;
}

async function triggerAlert(rule, alertData) {
  try {
    // Check if we already have an active alert for this rule (to prevent spam)
    const { data: existingAlerts, error: checkError } = await supabase
      .from('alerts')
      .select('id')
      .eq('alert_rule_id', rule.id)
      .eq('status', 'active')
      .gte('triggered_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    if (checkError) {
      console.warn(`⚠️  Failed to check existing alerts:`, checkError.message);
    }

    if (existingAlerts && existingAlerts.length > 0) {
      console.log(`⏭️  Skipping duplicate alert for ${rule.name} (already active)`);
      return;
    }

    // Create new alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        name: rule.name,
        severity: rule.severity,
        message: `${rule.description || rule.name}: ${alertData.value.toFixed(2)} ${rule.condition} ${rule.threshold}`,
        data: alertData,
        triggered_at: new Date().toISOString(),
        status: 'active',
        alert_rule_id: rule.id
      })
      .select()
      .single();

    if (alertError) {
      throw new Error(`Failed to create alert: ${alertError.message}`);
    }

    console.log(`✅ Created alert: ${rule.name} (${rule.severity})`);

    // Send notifications based on configured channels
    await sendNotifications(rule, alert, alertData);

  } catch (error) {
    console.error(`❌ Failed to trigger alert for ${rule.name}:`, error.message);
  }
}

async function sendNotifications(rule, alert, alertData) {
  for (const channel of rule.channels || []) {
    try {
      switch (channel) {
        case 'email':
          await sendEmailNotification(rule, alert, alertData);
          break;
        case 'slack':
          await sendSlackNotification(rule, alert, alertData);
          break;
        case 'webhook':
          await sendWebhookNotification(rule, alert, alertData);
          break;
        default:
          console.warn(`⚠️  Unknown notification channel: ${channel}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send ${channel} notification:`, error.message);
    }
  }
}

async function sendEmailNotification(rule, alert, alertData) {
  // TODO: Implement email notifications
  console.log(`📧 Would send email notification for: ${rule.name}`);
}

async function sendSlackNotification(rule, alert, alertData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️  Slack webhook URL not configured');
    return;
  }

  const color = {
    critical: '#ff0000',
    high: '#ff8800',
    medium: '#ffaa00',
    low: '#0088ff'
  }[rule.severity] || '#888888';

  const payload = {
    text: `🚨 Alert: ${rule.name}`,
    attachments: [{
      color,
      fields: [
        {
          title: 'Severity',
          value: rule.severity.toUpperCase(),
          short: true
        },
        {
          title: 'Metric',
          value: rule.metric,
          short: true
        },
        {
          title: 'Current Value',
          value: alertData.value.toFixed(2),
          short: true
        },
        {
          title: 'Threshold',
          value: `${rule.condition} ${rule.threshold}`,
          short: true
        },
        {
          title: 'Time Window',
          value: `${rule.time_window} minutes`,
          short: true
        },
        {
          title: 'Samples',
          value: alertData.samples.toString(),
          short: true
        }
      ],
      footer: 'Al Mazahir Monitoring',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Sent Slack notification for: ${rule.name}`);
    } else {
      throw new Error(`Slack API returned ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send Slack notification:`, error.message);
  }
}

async function sendWebhookNotification(rule, alert, alertData) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️  Alert webhook URL not configured');
    return;
  }

  const payload = {
    alert: {
      id: alert.id,
      name: rule.name,
      severity: rule.severity,
      message: alert.message,
      triggered_at: alert.triggered_at
    },
    rule: {
      id: rule.id,
      metric: rule.metric,
      condition: rule.condition,
      threshold: rule.threshold,
      time_window: rule.time_window
    },
    data: alertData
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Sent webhook notification for: ${rule.name}`);
    } else {
      throw new Error(`Webhook returned ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send webhook notification:`, error.message);
  }
}

// Run the alert check
checkAlerts();