/**
 * System Health API
 * Provides system health status for monitoring dashboard
 * Requirements: 9.3, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication and admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get latest system health status for each component
    const { data: healthData, error: healthError } = await supabase
      .from('system_health')
      .select('*')
      .order('created_at', { ascending: false });

    if (healthError) {
      console.error('Error fetching system health:', healthError);
      return NextResponse.json(
        { error: 'Failed to fetch system health' },
        { status: 500 }
      );
    }

    // Group by component and get the latest status for each
    const latestHealth = healthData?.reduce((acc: any, health: any) => {
      if (!acc[health.component] || new Date(health.created_at) > new Date(acc[health.component].created_at)) {
        acc[health.component] = health;
      }
      return acc;
    }, {});

    const healthArray = Object.values(latestHealth || {});

    // Perform real-time health checks
    const realtimeHealth = await performHealthChecks(supabase);

    // Merge database health with real-time checks
    const combinedHealth = mergeHealthData(healthArray, realtimeHealth);

    return NextResponse.json({
      success: true,
      health: combinedHealth,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in system health API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function performHealthChecks(supabase: any) {
  const checks = [];

  // Database connectivity check
  try {
    const start = Date.now();
    const { error } = await supabase
      .from('feature_flags')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - start;
    
    checks.push({
      component: 'database',
      status: error ? 'down' : responseTime > 1000 ? 'degraded' : 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      metadata: { error: error?.message }
    });
  } catch (error) {
    checks.push({
      component: 'database',
      status: 'down',
      last_check: new Date().toISOString(),
      metadata: { error: 'Connection failed' }
    });
  }

  // Feature flags system check
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('count')
      .eq('status', 'enabled');
    
    const responseTime = Date.now() - start;
    
    checks.push({
      component: 'feature_flags',
      status: error ? 'down' : 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      metadata: { 
        active_flags: data?.length || 0,
        error: error?.message 
      }
    });
  } catch (error) {
    checks.push({
      component: 'feature_flags',
      status: 'down',
      last_check: new Date().toISOString(),
      metadata: { error: 'Feature flags check failed' }
    });
  }

  // Monitoring system check
  try {
    const start = Date.now();
    const { error } = await supabase
      .from('performance_metrics')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - start;
    
    checks.push({
      component: 'monitoring',
      status: error ? 'degraded' : 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      metadata: { error: error?.message }
    });
  } catch (error) {
    checks.push({
      component: 'monitoring',
      status: 'degraded',
      last_check: new Date().toISOString(),
      metadata: { error: 'Monitoring check failed' }
    });
  }

  // Web server check (implicit - if we're responding, it's healthy)
  checks.push({
    component: 'web_server',
    status: 'healthy',
    response_time_ms: 0,
    last_check: new Date().toISOString(),
    metadata: { version: '2.0' }
  });

  return checks;
}

function mergeHealthData(dbHealth: any[], realtimeHealth: any[]) {
  const merged = [...realtimeHealth];
  
  // Add any components from DB that aren't in real-time checks
  dbHealth.forEach(dbComponent => {
    const exists = realtimeHealth.find(rt => rt.component === dbComponent.component);
    if (!exists) {
      merged.push(dbComponent);
    }
  });

  return merged.sort((a, b) => {
    // Sort by status priority (down > degraded > healthy)
    const statusPriority = { down: 3, degraded: 2, healthy: 1 };
    return (statusPriority[b.status as keyof typeof statusPriority] || 0) - 
           (statusPriority[a.status as keyof typeof statusPriority] || 0);
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // This endpoint allows system components to report their health
    const body = await request.json();
    const { component, status, response_time_ms, error_rate, metadata } = body;

    if (!component || !status) {
      return NextResponse.json(
        { error: 'Component and status are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .rpc('update_system_health', {
        p_component: component,
        p_status: status,
        p_response_time_ms: response_time_ms,
        p_error_rate: error_rate,
        p_metadata: metadata
      });

    if (error) {
      console.error('Error updating system health:', error);
      return NextResponse.json(
        { error: 'Failed to update system health' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      health_id: data
    });
  } catch (error) {
    console.error('Error in system health update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}