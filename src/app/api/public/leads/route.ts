import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, just log the inquiry and return success
    // In a real implementation, this would save to database
    console.log('Lead submission received:', {
      name: body.name,
      company: body.company,
      phone: body.phone,
      email: body.email,
      productCategory: body.productCategory || body.productRequirement,
      message: body.message,
      timestamp: new Date().toISOString()
    });
    
    // Simulate successful submission
    return NextResponse.json({
      success: true,
      message: 'Thank you for your inquiry. We will contact you soon.',
      id: `lead_${Date.now()}`
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing lead submission:', error);
    
    return NextResponse.json({
      success: false,
      message: 'There was an error processing your request. Please try again or contact us directly.',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Leads API is working',
    timestamp: new Date().toISOString()
  });
}