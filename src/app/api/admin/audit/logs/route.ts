import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security'
import { auditLogger } from '@/lib/audit-logging'
import { createClient } from '@/lib/supabase/server'

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const resourceType = searchParams.get('resourceType')
    const action = searchParams.get('action')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createClient()
    
    let query = supabase
      .from('audit_log')
      .select(`
        *,
        admin_profiles(full_name, role)
      `)
      .neq('resource_type', 'security_event')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString())
    }

    if (dateTo) {
      query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Audit logs API error:', error)
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