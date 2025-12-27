/**
 * Public Feature Flags API
 * Provides feature flag evaluation for client-side usage
 * Requirements: 9.1, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flagNames = searchParams.get('flags')?.split(',') || [];
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    // Get user agent and IP from headers
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || undefined;

    const context = {
      userId,
      sessionId,
      userAgent,
      ipAddress,
      isAdmin
    };

    if (flagNames.length > 0) {
      // Get specific flags
      const flagResults = await featureFlags.getFlags(flagNames);
      return NextResponse.json({
        success: true,
        flags: flagResults
      });
    } else {
      // Get all active flags
      const supabase = createClient();
      const { data: activeFlags, error } = await supabase
        .from('feature_flags')
        .select('name, status, rollout_strategy, rollout_percentage, rollout_user_list')
        .in('status', ['enabled', 'rollout'])
        .eq('environment', process.env.NODE_ENV || 'production')
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) {
        console.error('Error fetching active flags:', error);
        return NextResponse.json({ success: true, flags: {} });
      }

      const flagResults: Record<string, boolean> = {};
      
      for (const flag of activeFlags || []) {
        flagResults[flag.name] = await featureFlags.isEnabled(flag.name, context);
      }

      return NextResponse.json({
        success: true,
        flags: flagResults
      });
    }
  } catch (error) {
    console.error('Error evaluating feature flags:', error);
    return NextResponse.json(
      { success: false, flags: {}, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flag, context = {} } = body;

    if (!flag) {
      return NextResponse.json(
        { error: 'Flag name is required' },
        { status: 400 }
      );
    }

    // Add request context
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || undefined;

    const evaluationContext = {
      ...context,
      userAgent,
      ipAddress
    };

    const isEnabled = await featureFlags.isEnabled(flag, evaluationContext);

    return NextResponse.json({
      success: true,
      flag,
      enabled: isEnabled
    });
  } catch (error) {
    console.error('Error evaluating feature flag:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}