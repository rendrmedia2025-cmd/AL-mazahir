/**
 * Feature Flag Analytics API
 * Provides analytics data for feature flag usage
 * Requirements: 9.1, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverFeatureFlags } from '@/lib/feature-flags';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const days = parseInt(searchParams.get('days') || '7');

    // Get raw analytics data
    const analyticsData = await serverFeatureFlags.getAnalytics(params.id, days);
    
    // Process analytics data
    const totalEvaluations = analyticsData.length;
    const enabledCount = analyticsData.filter(record => record.flag_enabled).length;
    const successRate = totalEvaluations > 0 ? (enabledCount / totalEvaluations) * 100 : 0;

    // Group by date for trend analysis
    const dailyStats = analyticsData.reduce((acc, record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { evaluations: 0, enabled: 0 };
      }
      acc[date].evaluations++;
      if (record.flag_enabled) {
        acc[date].enabled++;
      }
      return acc;
    }, {} as Record<string, { evaluations: number; enabled: number }>);

    // Get unique users/sessions
    const uniqueUsers = new Set(analyticsData.map(record => record.user_id || record.session_id)).size;

    return NextResponse.json({
      success: true,
      total_evaluations: totalEvaluations,
      enabled_count: enabledCount,
      success_rate: Math.round(successRate * 100) / 100,
      unique_users: uniqueUsers,
      daily_stats: dailyStats,
      raw_data: analyticsData.slice(0, 100) // Limit raw data for performance
    });
  } catch (error) {
    console.error('Error fetching feature flag analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}