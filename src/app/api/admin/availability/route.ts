import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, RATE_LIMITS, logAuditEvent } from '@/lib/security'
import { createClient } from '@/lib/supabase/server'
import { invalidateAvailabilityCache, warmAvailabilityCache } from '@/lib/cache'

async function getAvailabilityHandler(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('availability_status')
      .select(`
        *,
        product_categories (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch availability data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateAvailabilityHandler(req: NextRequest) {
  try {
    const body = await req.json()
    const { categoryId, status, notes, adminOverride } = body

    if (!categoryId || !status) {
      return NextResponse.json(
        { error: 'Category ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current status for audit logging
    const { data: currentData } = await supabase
      .from('availability_status')
      .select('*')
      .eq('category_id', categoryId)
      .single()

    // Update or insert availability status
    const { data, error } = await supabase
      .from('availability_status')
      .upsert({
        category_id: categoryId,
        status,
        notes: notes || null,
        admin_override: adminOverride || false,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update availability status' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent(
      'update_availability',
      'availability_status',
      data.id,
      currentData,
      data,
      req
    )

    // Invalidate availability cache to ensure fresh data
    await invalidateAvailabilityCache()
    
    // Warm cache with new data
    setTimeout(() => warmAvailabilityCache(), 100)

    return NextResponse.json({
      success: true,
      data,
      cacheInvalidated: true
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply security middleware
export const GET = withSecurity(getAvailabilityHandler, {
  requireAuth: true,
  requireRole: 'manager',
  rateLimit: RATE_LIMITS.ADMIN,
  httpsOnly: true
})

export const POST = withSecurity(updateAvailabilityHandler, {
  requireAuth: true,
  requireRole: 'manager',
  rateLimit: RATE_LIMITS.ADMIN,
  validateInput: true,
  httpsOnly: true
})