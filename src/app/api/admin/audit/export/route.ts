import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security'
import { createClient } from '@/lib/supabase/server'

async function handler(req: NextRequest) {
  try {
    const body = await req.json()
    const { filters, type } = body

    const supabase = await createClient()
    
    let query = supabase.from('audit_log').select('*')

    if (type === 'audit') {
      query = query.neq('resource_type', 'security_event')
      
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
    } else if (type === 'security') {
      query = query.eq('resource_type', 'security_event')
      
      if (filters.severity) {
        query = query.eq('new_values->severity', filters.severity)
      }
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', new Date(filters.dateFrom).toISOString())
    }

    if (filters.dateTo) {
      query = query.lte('created_at', new Date(filters.dateTo + 'T23:59:59').toISOString())
    }

    query = query.order('created_at', { ascending: false }).limit(1000)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching data for export:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch data for export' },
        { status: 500 }
      )
    }

    // Convert to CSV
    const csvHeaders = type === 'audit' 
      ? ['Date', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'User Agent']
      : ['Date', 'Event Type', 'Severity', 'Description', 'IP Address', 'User Agent']

    const csvRows = data?.map(row => {
      if (type === 'audit') {
        return [
          new Date(row.created_at).toISOString(),
          row.user_id || '',
          row.action || '',
          row.resource_type || '',
          row.resource_id || '',
          row.ip_address || '',
          row.user_agent || ''
        ]
      } else {
        return [
          new Date(row.created_at).toISOString(),
          row.new_values?.eventType || '',
          row.new_values?.severity || '',
          row.new_values?.description || '',
          row.ip_address || '',
          row.user_agent || ''
        ]
      }
    }) || []

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-${type}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(handler, {
  requireAuth: true,
  requireRole: 'admin',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5
  }
})