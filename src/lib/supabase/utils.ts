import { createClient } from './server'
import type { Database } from '../types/database'

/**
 * Utility functions for common Supabase operations
 */

/**
 * Get all active product categories with their availability status
 */
export async function getProductCategoriesWithAvailability() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('product_categories')
    .select(`
      *,
      availability_status (
        status,
        last_updated,
        notes
      )
    `)
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    console.error('Error fetching product categories:', error)
    return []
  }

  return data || []
}

/**
 * Get availability status for all categories (public endpoint)
 */
export async function getAvailabilityStatus() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('availability_status')
    .select(`
      category_id,
      status,
      last_updated,
      product_categories!inner (
        slug,
        name,
        is_active
      )
    `)
    .eq('product_categories.is_active', true)

  if (error) {
    console.error('Error fetching availability status:', error)
    return {}
  }

  // Transform to object with category slug as key
  const statusMap: Record<string, any> = {}
  data?.forEach(item => {
    const category = item.product_categories as any
    statusMap[category.slug] = {
      status: item.status,
      lastUpdated: item.last_updated
    }
  })

  return statusMap
}

/**
 * Submit a new lead inquiry
 */
export async function submitLead(leadData: Database['public']['Tables']['enhanced_leads']['Insert']) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('enhanced_leads')
    .insert(leadData)
    .select()
    .single()

  if (error) {
    console.error('Error submitting lead:', error)
    throw error
  }

  return data
}

/**
 * Update availability status (admin only)
 */
export async function updateAvailabilityStatus(
  categoryId: string, 
  status: Database['public']['Enums']['availability_enum'],
  notes?: string
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('availability_status')
    .update({
      status,
      notes,
      last_updated: new Date().toISOString()
    })
    .eq('category_id', categoryId)
    .select()
    .single()

  if (error) {
    console.error('Error updating availability status:', error)
    throw error
  }

  return data
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('log_audit_event', {
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_old_values: oldValues,
    p_new_values: newValues
  })

  if (error) {
    console.error('Error logging audit event:', error)
  }

  return data
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('is_admin')

  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }

  return data || false
}

/**
 * Get leads with pagination and filtering (admin only)
 */
export async function getLeads(options: {
  page?: number
  limit?: number
  status?: Database['public']['Enums']['lead_status_enum']
  category?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  const supabase = await createClient()
  
  const {
    page = 1,
    limit = 20,
    status,
    category,
    dateFrom,
    dateTo
  } = options

  let query = supabase
    .from('enhanced_leads')
    .select(`
      *,
      product_categories (
        name,
        slug
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }
  
  if (category) {
    query = query.eq('product_category', category)
  }
  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching leads:', error)
    throw error
  }

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}