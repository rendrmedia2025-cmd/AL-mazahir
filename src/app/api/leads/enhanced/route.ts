/**
 * Enhanced Lead Capture API
 * Handles comprehensive lead intelligence with behavioral analytics
 * Requirements: 3.1, 3.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnhancedLead } from '@/lib/types/enterprise';
import { captureServerSideIntelligence } from '@/lib/lead-intelligence';

interface EnhancedLeadSubmission {
  // Basic lead data
  name: string;
  email: string;
  phone?: string;
  company?: string;
  product_category?: string;
  urgency: 'immediate' | '1-2_weeks' | 'planning';
  quantity_estimate?: string;
  message: string;
  source_section: string;
  
  // Enhanced intelligence
  company_size?: string;
  industry_sector?: string;
  decision_authority?: 'decision_maker' | 'influencer' | 'end_user' | 'gatekeeper';
  budget_range?: 'under_10k' | '10k_50k' | '50k_100k' | '100k_500k' | '500k_1m' | 'over_1m';
  project_timeline?: 'immediate' | 'within_month' | 'within_quarter' | 'within_year' | 'planning_phase';
  
  // Behavioral data
  device_type?: 'mobile' | 'tablet' | 'desktop';
  user_agent?: string;
  referrer?: string;
  total_engagement_time?: number;
  page_views_count?: number;
  
  // Session analytics (optional)
  session_analytics?: {
    sessionId: string;
    engagementScore: number;
    bounceRate: number;
    pageViews: any[];
    interactions: any[];
    conversionEvents: any[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancedLeadSubmission = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.urgency || !body.message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, urgency, and message are required',
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      }, { status: 400 });
    }

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Capture server-side intelligence
    const serverIntelligence = captureServerSideIntelligence(
      request,
      body.source_section,
      ip
    );

    // Create Supabase client
    const supabase = createClient();

    // Auto-detect company information if not provided
    let detectedCompanySize = body.company_size;
    let detectedIndustrySector = body.industry_sector;

    if (body.company && !detectedCompanySize) {
      detectedCompanySize = detectCompanySize(body.company);
    }

    if ((body.company || body.message) && !detectedIndustrySector) {
      detectedIndustrySector = detectIndustrySector(body.company || '', body.message);
    }

    // Prepare enhanced lead data
    const enhancedLeadData = {
      // Basic information
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim(),
      company: body.company?.trim(),
      product_category: body.product_category,
      urgency: body.urgency,
      quantity_estimate: body.quantity_estimate?.trim(),
      message: body.message.trim(),
      source_section: body.source_section,
      
      // Enhanced intelligence
      company_size: detectedCompanySize,
      industry_sector: detectedIndustrySector,
      decision_authority: body.decision_authority,
      budget_range: body.budget_range,
      project_timeline: body.project_timeline,
      
      // Behavioral data (prefer client-side data, fallback to server-side)
      device_type: body.device_type || serverIntelligence.deviceType,
      user_agent: body.user_agent || serverIntelligence.userAgent,
      referrer: body.referrer || serverIntelligence.referrer,
      ip_address: ip,
      
      // Analytics
      total_engagement_time: body.total_engagement_time || 0,
      page_views_count: body.page_views_count || 1,
      documents_downloaded: 0,
      
      // Status
      status: 'new' as const,
      priority: 'medium' as const,
      lead_score: 0, // Will be calculated by database function
    };

    // Insert enhanced lead
    const { data: leadData, error: leadError } = await supabase
      .from('enhanced_leads')
      .insert(enhancedLeadData)
      .select()
      .single();

    if (leadError) {
      console.error('Error inserting enhanced lead:', leadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save lead information',
      }, { status: 500 });
    }

    const leadId = leadData.id;

    // Record initial form submission event
    const { error: eventError } = await supabase
      .from('lead_events')
      .insert({
        lead_id: leadId,
        event_type: 'form_submission',
        event_data: {
          form_type: 'enhanced_lead_capture',
          source_section: body.source_section,
          engagement_time: body.total_engagement_time || 0,
        },
        page_url: request.headers.get('referer'),
        session_id: body.session_analytics?.sessionId,
        duration_seconds: Math.floor((body.total_engagement_time || 0) / 1000),
        ip_address: ip,
        user_agent: serverIntelligence.userAgent,
      });

    if (eventError) {
      console.error('Error recording lead event:', eventError);
      // Don't fail the request for event recording errors
    }

    // Store session analytics if provided
    if (body.session_analytics) {
      const { error: analyticsError } = await supabase
        .from('lead_behavior_analytics')
        .insert({
          lead_id: leadId,
          session_id: body.session_analytics.sessionId,
          total_session_time: body.total_engagement_time || 0,
          pages_visited: body.session_analytics.pageViews.length,
          bounce_rate: body.session_analytics.bounceRate,
          engagement_score: body.session_analytics.engagementScore,
          device_info: {
            type: body.device_type,
            user_agent: body.user_agent,
          },
          location_data: {
            ip_address: ip,
          },
          referrer_data: {
            referrer: body.referrer,
          },
          conversion_events: body.session_analytics.conversionEvents,
          session_start: new Date(Date.now() - (body.total_engagement_time || 0)).toISOString(),
          session_end: new Date().toISOString(),
        });

      if (analyticsError) {
        console.error('Error storing behavior analytics:', analyticsError);
        // Don't fail the request for analytics errors
      }
    }

    // Calculate lead score using database function
    const { error: scoreError } = await supabase
      .rpc('calculate_lead_score', { p_lead_id: leadId });

    if (scoreError) {
      console.error('Error calculating lead score:', scoreError);
      // Don't fail the request for scoring errors
    }

    // Route lead using database function
    const { error: routingError } = await supabase
      .rpc('route_lead', { p_lead_id: leadId });

    if (routingError) {
      console.error('Error routing lead:', routingError);
      // Don't fail the request for routing errors
    }

    // Create initial follow-up task
    const { error: taskError } = await supabase
      .rpc('create_followup_task', {
        p_lead_id: leadId,
        p_task_type: 'initial_contact',
        p_title: `Initial contact for ${body.name}`,
        p_description: `Follow up on enhanced lead inquiry from ${body.company || 'individual customer'}`,
        p_due_hours: body.urgency === 'immediate' ? 2 : 24,
        p_priority: body.urgency === 'immediate' ? 'high' : 'medium',
        p_automated: true,
      });

    if (taskError) {
      console.error('Error creating follow-up task:', taskError);
      // Don't fail the request for task creation errors
    }

    // Generate WhatsApp URL for immediate contact option
    const whatsappMessage = generateWhatsAppMessage(body);
    const whatsappUrl = `https://wa.me/966501234567?text=${encodeURIComponent(whatsappMessage)}`;

    // Log successful submission
    console.log('Enhanced lead captured successfully:', {
      leadId,
      name: body.name,
      company: body.company,
      email: body.email,
      urgency: body.urgency,
      source: body.source_section,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Thank you for your detailed inquiry. Our team will analyze your requirements and get back to you with a comprehensive quote.',
      whatsappUrl,
      estimatedResponseTime: body.urgency === 'immediate' ? '2 hours' : '24 hours',
    }, { status: 200 });

  } catch (error) {
    console.error('Enhanced lead capture error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error. Please try again or contact us directly.',
      fallbackContact: {
        phone: '+966 50 123 4567',
        email: 'info@almazahir.com',
        whatsapp: 'https://wa.me/966501234567',
      },
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Lead Capture API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

// Helper functions

function detectCompanySize(companyName: string): string {
  const name = companyName.toLowerCase();
  
  if (name.includes('corporation') || name.includes('corp') || 
      name.includes('international') || name.includes('group') || 
      name.includes('holdings') || name.includes('enterprise')) {
    return 'large';
  }
  
  if (name.includes('limited') || name.includes('ltd') || 
      name.includes('llc') || name.includes('company') || 
      name.includes('co.') || name.includes('inc')) {
    return 'medium';
  }
  
  return 'small';
}

function detectIndustrySector(companyName: string, message: string): string {
  const text = `${companyName} ${message}`.toLowerCase();
  
  if (text.includes('construction') || text.includes('building') || 
      text.includes('contractor') || text.includes('cement') || 
      text.includes('concrete')) {
    return 'construction';
  }
  
  if (text.includes('oil') || text.includes('gas') || 
      text.includes('petroleum') || text.includes('energy') || 
      text.includes('refinery')) {
    return 'oil_gas';
  }
  
  if (text.includes('manufacturing') || text.includes('factory') || 
      text.includes('production') || text.includes('industrial')) {
    return 'manufacturing';
  }
  
  if (text.includes('mining') || text.includes('extraction') || 
      text.includes('quarry')) {
    return 'mining';
  }
  
  if (text.includes('transport') || text.includes('logistics') || 
      text.includes('shipping') || text.includes('freight')) {
    return 'transportation';
  }
  
  if (text.includes('utility') || text.includes('utilities') || 
      text.includes('power') || text.includes('water') || 
      text.includes('infrastructure')) {
    return 'utilities';
  }
  
  if (text.includes('government') || text.includes('municipal') || 
      text.includes('public') || text.includes('ministry')) {
    return 'government';
  }
  
  return 'other';
}

function generateWhatsAppMessage(lead: EnhancedLeadSubmission): string {
  const parts = [
    `Hello, I'm ${lead.name}`,
    lead.company ? `from ${lead.company}` : '',
    `I submitted an inquiry through your website regarding ${lead.product_category || 'industrial equipment'}.`,
    '',
    `Urgency: ${lead.urgency}`,
    lead.budget_range ? `Budget Range: ${lead.budget_range}` : '',
    lead.quantity_estimate ? `Quantity: ${lead.quantity_estimate}` : '',
    '',
    `Requirements: ${lead.message}`,
    '',
    'Please contact me to discuss this further.',
  ];
  
  return parts.filter(Boolean).join('\n');
}