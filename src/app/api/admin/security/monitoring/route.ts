import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security'
import { securityMonitor } from '@/lib/security-monitoring'
import { createClient } from '@/lib/supabase/server'

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const timeWindow = parseInt(searchParams.get('timeWindow') || '86400000') // 24 hours default

    // Get security statistics
    const stats = await securityMonitor.getSecurityStats(timeWindow)
    
    // Get blocked IPs
    const blockedIPs = securityMonitor.getBlockedIPs()

    // Get recent security alerts from database
    const supabase = await createClient()
    const windowStart = new Date(Date.now() - timeWindow)
    
    const { data: recentAlerts, error: alertsError } = await supabase
      .from('audit_log')
      .select('*')
      .eq('resource_type', 'security_alert')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (alertsError) {
      console.error('Error fetching security alerts:', alertsError)
    }

    // Get failed login trends (hourly breakdown)
    const { data: loginTrends, error: trendsError } = await supabase
      .from('audit_log')
      .select('created_at, new_values')
      .like('action', 'SECURITY_EVENT_FAILED_LOGIN%')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: true })

    if (trendsError) {
      console.error('Error fetching login trends:', trendsError)
    }

    // Process trends data into hourly buckets
    const hourlyTrends: Record<string, number> = {}
    if (loginTrends) {
      loginTrends.forEach(event => {
        const hour = new Date(event.created_at).toISOString().slice(0, 13) + ':00:00.000Z'
        hourlyTrends[hour] = (hourlyTrends[hour] || 0) + 1
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        blockedIPs,
        recentAlerts: recentAlerts || [],
        hourlyTrends
      }
    })
  } catch (error) {
    console.error('Security monitoring API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withSecurity(handler, {
  requireAuth: true,
  requireRole: 'admin',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }
})