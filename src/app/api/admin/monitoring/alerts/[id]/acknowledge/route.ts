/**
 * Alert Acknowledgment API
 * Allows admins to acknowledge alerts
 * Requirements: 9.3, 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
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

    // Acknowledge the alert
    const { data: alert, error: updateError } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error acknowledging alert:', updateError);
      return NextResponse.json(
        { error: 'Failed to acknowledge alert' },
        { status: 500 }
      );
    }

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error in acknowledge alert API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}