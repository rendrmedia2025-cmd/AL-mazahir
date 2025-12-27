import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, RATE_LIMITS, logAuditEvent } from '@/lib/security'
import { createClient } from '@/lib/supabase/server'

interface ContentUpdateRequest {
  type: 'contact_info' | 'hero_text' | 'cta_labels' | 'category_settings'
  data: any
}

async function getContentHandler(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all content settings
    const { data: contentSettings, error: contentError } = await supabase
      .from('content_settings')
      .select('*')
      .order('updated_at', { ascending: false })

    if (contentError) {
      console.error('Content settings error:', contentError)
    }

    // Get product categories with their settings
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (categoriesError) {
      console.error('Categories error:', categoriesError)
    }

    return NextResponse.json({
      success: true,
      data: {
        contentSettings: contentSettings || [],
        categories: categories || []
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

async function updateContentHandler(req: NextRequest) {
  try {
    const body: ContentUpdateRequest = await req.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let result

    switch (type) {
      case 'contact_info':
        result = await updateContactInfo(supabase, data)
        break
      case 'hero_text':
        result = await updateHeroText(supabase, data)
        break
      case 'cta_labels':
        result = await updateCTALabels(supabase, data)
        break
      case 'category_settings':
        result = await updateCategorySettings(supabase, data)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 400 }
        )
    }

    if (result.error) {
      console.error('Update error:', result.error)
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent(
      'update_content',
      type,
      result.data?.id || 'unknown',
      null,
      result.data,
      req
    )

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateContactInfo(supabase: any, data: any) {
  return await supabase
    .from('content_settings')
    .upsert({
      key: 'contact_info',
      value: data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
}

async function updateHeroText(supabase: any, data: any) {
  return await supabase
    .from('content_settings')
    .upsert({
      key: 'hero_text',
      value: data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
}

async function updateCTALabels(supabase: any, data: any) {
  return await supabase
    .from('content_settings')
    .upsert({
      key: 'cta_labels',
      value: data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
}

async function updateCategorySettings(supabase: any, data: any) {
  const { categoryId, ...updateData } = data
  
  return await supabase
    .from('product_categories')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', categoryId)
    .select()
    .single()
}

// Apply security middleware
export const GET = withSecurity(getContentHandler, {
  requireAuth: true,
  requireRole: 'manager',
  rateLimit: RATE_LIMITS.ADMIN,
  httpsOnly: true
})

export const POST = withSecurity(updateContentHandler, {
  requireAuth: true,
  requireRole: 'manager',
  rateLimit: RATE_LIMITS.ADMIN,
  validateInput: true,
  httpsOnly: true
})