import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await authServer.requireAdminRole(['admin', 'manager'])
    const supabase = await createClient()

    // Get total leads count
    const { count: totalLeads } = await supabase
      .from('enhanced_leads')
      .select('*', { count: 'exact', head: true })

    // Get new leads count (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newLeads } = await supabase
      .from('enhanced_leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get active categories count
    const { count: activeCategories } = await supabase
      .from('product_categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get last availability update
    const { data: lastUpdate } = await supabase
      .from('availability_status')
      .select('last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    const lastUpdated = lastUpdate?.last_updated 
      ? new Date(lastUpdate.last_updated).toLocaleDateString()
      : 'Never'

    return NextResponse.json({
      totalLeads: totalLeads || 0,
      newLeads: newLeads || 0,
      activeCategories: activeCategories || 0,
      lastUpdated
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to load dashboard statistics' },
      { status: 500 }
    )
  }
}