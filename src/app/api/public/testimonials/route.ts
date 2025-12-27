import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Fetch active testimonials ordered by display_order
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch testimonials',
          data: []
        },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedTestimonials = testimonials?.map(testimonial => ({
      id: testimonial.id,
      name: testimonial.name,
      company: testimonial.company,
      position: testimonial.position,
      content: testimonial.content,
      rating: testimonial.rating,
      image: testimonial.image_url,
      isActive: testimonial.is_active
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedTestimonials,
      cached: false,
      cacheExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    });

  } catch (error) {
    console.error('Testimonials API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        data: []
      },
      { status: 500 }
    );
  }
}