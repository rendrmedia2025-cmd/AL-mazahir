import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAuth } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Fetch all testimonials (including inactive ones) for admin
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testimonials || []
    });

  } catch (error) {
    console.error('Admin testimonials API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, company, position, content, rating, image_url, display_order, is_active } = body;

    // Validate required fields
    if (!name || !company || !position || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Insert new testimonial
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert({
        name,
        company,
        position,
        content,
        rating: rating || null,
        image_url: image_url || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        created_by: authResult.user.id,
        updated_by: authResult.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating testimonial:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testimonial,
      message: 'Testimonial created successfully'
    });

  } catch (error) {
    console.error('Admin testimonials POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, company, position, content, rating, image_url, display_order, is_active } = body;

    // Validate required fields
    if (!id || !name || !company || !position || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update testimonial
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update({
        name,
        company,
        position,
        content,
        rating: rating || null,
        image_url: image_url || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_by: authResult.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating testimonial:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testimonial,
      message: 'Testimonial updated successfully'
    });

  } catch (error) {
    console.error('Admin testimonials PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Delete testimonial
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting testimonial:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });

  } catch (error) {
    console.error('Admin testimonials DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}