/**
 * Alerts API
 * Manages alerts and alert rules for monitoring system
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    // Build query for alerts
    let alertQuery = supabase
      .from('alerts')
      .select('*')
      .order('triggered_at', { ascending: false });

    if (status) {
      alertQuery = alertQuery.eq('status', status);
    }

    if (severity) {
      alertQuery = alertQuery.eq('severity', severity);
    }

    const { data: alerts, error: alertsError } = await alertQuery.limit(100);

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    });
  } catch (error) {
    console.error('Error in alerts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, severity, message, data } = body;

    if (!name || !severity || !message) {
      return NextResponse.json(
        { error: 'Name, severity, and message are required' },
        { status: 400 }
      );
    }

    // Create new alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .insert({
        name,
        severity,
        message,
        data,
        triggered_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating alert:', alertError);
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error in create alert API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}