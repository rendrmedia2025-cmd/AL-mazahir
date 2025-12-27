import { NextRequest, NextResponse } from 'next/server'
import { productCategories } from '@/lib/data/products'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    
    // Create mock availability data based on product categories
    const mockAvailabilityData = productCategories.map(category => ({
      category_id: category.id,
      status: 'in_stock', // Default to in_stock
      last_updated: new Date().toISOString(),
      product_categories: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        is_active: true
      }
    }));
    
    // Filter by specific category if provided
    let data = mockAvailabilityData;
    if (categoryId) {
      data = mockAvailabilityData.filter(item => item.category_id === categoryId);
    }

    return NextResponse.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString(),
      cached: false
    });
    
  } catch (error) {
    console.error('API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch availability data',
        data: [],
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}