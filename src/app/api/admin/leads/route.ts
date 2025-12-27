import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, RATE_LIMITS } from '@/lib/security'
import { createClient } from '@/lib/supabase/server'

interface LeadsQuery {
  page?: number
  limit?: number
  status?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

async function getLeadsHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: LeadsQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const supabase = await createClient()
    
    // Build the query
    let dbQuery = supabase
      .from('enhanced_leads')
      .select(`
        *,
        product_categories (
          id,
          name,
          slug
        )
      `)

    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }

    if (query.category) {
      dbQuery = dbQuery.eq('product_category', query.category)
    }

    if (query.dateFrom) {
      dbQuery = dbQuery.gte('created_at', query.dateFrom)
    }

    if (query.dateTo) {
      dbQuery = dbQuery.lte('created_at', query.dateTo)
    }

    if (query.search) {
      dbQuery = dbQuery.or(`name.ilike.%${query.search}%,company.ilike.%${query.search}%,email.ilike.%${query.search}%`)
    }

    // Get total count for pagination
    const { count } = await dbQuery.select('*', { count: 'exact', head: true })

    // Apply pagination and sorting
    const offset = ((query.page || 1) - 1) * (query.limit || 20)
    dbQuery = dbQuery
      .order(query.sortBy || 'created_at', { ascending: query.sortOrder === 'asc' })
      .range(offset, offset + (query.limit || 20) - 1)

    const { data, error } = await dbQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads data' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('enhanced_leads')
      .select('status')

    const statusCounts = stats?.reduce((acc: any, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (query.limit || 20))
      },
      stats: {
        total: count || 0,
        statusCounts
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function exportLeadsHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid export format. Use csv or json.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('enhanced_leads')
      .select(`
        *,
        product_categories (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to export leads data' },
        { status: 500 }
      )
    }

    if (format === 'csv') {
      const csvData = convertToCSV(data || [])
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = [
    'Name',
    'Company',
    'Email',
    'Phone',
    'Product Category',
    'Urgency',
    'Quantity Estimate',
    'Message',
    'Status',
    'Source Section',
    'Device Type',
    'Created At'
  ]

  const csvRows = [
    headers.join(','),
    ...data.map(lead => [
      `"${lead.name || ''}"`,
      `"${lead.company || ''}"`,
      `"${lead.email || ''}"`,
      `"${lead.phone || ''}"`,
      `"${lead.product_categories?.name || ''}"`,
      `"${lead.urgency || ''}"`,
      `"${lead.quantity_estimate || ''}"`,
      `"${(lead.message || '').replace(/"/g, '""')}"`,
      `"${lead.status || ''}"`,
      `"${lead.source_section || ''}"`,
      `"${lead.device_type || ''}"`,
      `"${new Date(lead.created_at).toLocaleString()}"`
    ].join(','))
  ]

  return csvRows.join('\n')
}

// Apply security middleware
export const GET = withSecurity(getLeadsHandler, {
  requireAuth: true,
  requireRole: 'manager',
  rateLimit: RATE_LIMITS.ADMIN,
  httpsOnly: true
})

// Export endpoint
export const POST = withSecurity(exportLeadsHandler, {
  requireAuth: true,
  requireRole: 'manager',
  rateLimit: RATE_LIMITS.ADMIN,
  httpsOnly: true
})