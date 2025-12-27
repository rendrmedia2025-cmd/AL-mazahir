/**
 * Error Events API
 * Provides error data for monitoring dashboard
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
    const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    const severity = searchParams.get('severity');

    // Get error summary from database function
    const { data: errorSummary, error: summaryError } = await supabase
      .rpc('get_error_summary', {
        time_range: getTimeRangeInterval(timeRange)
      });

    if (summaryError) {
      console.error('Error fetching error summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to fetch error summary' },
        { status: 500 }
      );
    }

    // Get recent error events for details
    const hours = getHoursFromTimeRange(timeRange);
    let errorQuery = supabase
      .from('error_events')
      .select('*')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    if (severity) {
      errorQuery = errorQuery.eq('severity', severity);
    }

    const { data: recentErrors, error: errorsError } = await errorQuery;

    if (errorsError) {
      console.error('Error fetching recent errors:', errorsError);
    }

    // Get error trends (hourly breakdown)
    const { data: errorTrends, error: trendsError } = await supabase
      .from('error_events')
      .select('severity, timestamp')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    const trends = processErrorTrends(errorTrends || [], timeRange);

    return NextResponse.json({
      success: true,
      errors: errorSummary || [],
      recentErrors: recentErrors || [],
      trends,
      timeRange
    });
  } catch (error) {
    console.error('Error in error events API:', error);
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

function getHoursFromTimeRange(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 1;
    case '24h': return 24;
    case '7d': return 24 * 7;
    case '30d': return 24 * 30;
    default: return 24;
  }
}

function processErrorTrends(errors: any[], timeRange: string) {
  const bucketSize = timeRange === '1h' ? 5 : timeRange === '24h' ? 60 : timeRange === '7d' ? 60 * 24 : 60 * 24; // minutes
  const buckets: Record<string, Record<string, number>> = {};

  errors.forEach(error => {
    const timestamp = new Date(error.timestamp);
    const bucketKey = getBucketKey(timestamp, bucketSize);
    
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = { critical: 0, high: 0, medium: 0, low: 0 };
    }
    
    buckets[bucketKey][error.severity] = (buckets[bucketKey][error.severity] || 0) + 1;
  });

  return Object.entries(buckets)
    .map(([time, counts]) => ({ time, ...counts }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

function getBucketKey(timestamp: Date, bucketSizeMinutes: number): string {
  const bucketStart = new Date(
    Math.floor(timestamp.getTime() / (bucketSizeMinutes * 60 * 1000)) * (bucketSizeMinutes * 60 * 1000)
  );
  return bucketStart.toISOString();
}