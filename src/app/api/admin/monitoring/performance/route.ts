/**
 * Performance Metrics API
 * Provides performance data for monitoring dashboard
 * Requirements: 9.3, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverMonitoring } from '@/lib/monitoring';
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
    const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';

    // Get performance summary from database function
    const { data: metrics, error } = await supabase
      .rpc('get_performance_summary', {
        time_range: getTimeRangeInterval(timeRange)
      });

    if (error) {
      console.error('Error fetching performance metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      );
    }

    // Get additional real-time metrics
    const realtimeMetrics = await getRealTimeMetrics(supabase, timeRange);

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      realtime: realtimeMetrics,
      timeRange
    });
  } catch (error) {
    console.error('Error in performance metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTimeRangeInterval(timeRange: string): string {
  switch (timeRange) {
    case '1h': return '1 hour';
    case '24h': return '24 hours';
    case '7d': return '7 days';
    case '30d': return '30 days';
    default: return '24 hours';
  }
}

async function getRealTimeMetrics(supabase: any, timeRange: string) {
  const hours = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  }[timeRange];

  try {
    // Get Core Web Vitals
    const { data: webVitals } = await supabase
      .from('performance_metrics')
      .select('name, value, timestamp')
      .in('name', ['web_vitals_lcp', 'web_vitals_fid', 'web_vitals_cls'])
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);

    // Get API response times
    const { data: apiMetrics } = await supabase
      .from('performance_metrics')
      .select('name, value, timestamp, context')
      .eq('name', 'api_response_time')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);

    // Calculate averages for Core Web Vitals
    const vitalsAverages = webVitals?.reduce((acc: any, metric: any) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { sum: 0, count: 0 };
      }
      acc[metric.name].sum += metric.value;
      acc[metric.name].count += 1;
      return acc;
    }, {});

    const coreWebVitals = Object.entries(vitalsAverages || {}).map(([name, data]: [string, any]) => ({
      name,
      average: data.sum / data.count,
      status: getWebVitalStatus(name, data.sum / data.count)
    }));

    return {
      coreWebVitals,
      apiResponseTimes: apiMetrics || [],
      totalSamples: (webVitals?.length || 0) + (apiMetrics?.length || 0)
    };
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    return {
      coreWebVitals: [],
      apiResponseTimes: [],
      totalSamples: 0
    };
  }
}

function getWebVitalStatus(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (metric) {
    case 'web_vitals_lcp':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'web_vitals_fid':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'web_vitals_cls':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
}