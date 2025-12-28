import { NextRequest, NextResponse } from 'next/server'

interface LeadData {
  name: string
  email: string
  phone: string
  company: string
  industry: string
  projectType: string
  budget: string
  timeline: string
  message: string
  source: string
  behavioralData: {
    timeOnPage: number
    scrollDepth: number
    pagesVisited: number
    categoryInterest: string[]
  }
  leadScore: number
  submittedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const leadData: LeadData = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'industry', 'projectType', 'budget', 'timeline']
    const missingFields = requiredFields.filter(field => !leadData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        missingFields
      }, { status: 400 })
    }

    // Enhanced lead scoring
    let enhancedScore = leadData.leadScore || 0
    
    // Industry-specific scoring
    const highValueIndustries = ['Oil & Gas', 'Mining', 'Manufacturing', 'Construction']
    if (highValueIndustries.includes(leadData.industry)) {
      enhancedScore += 10
    }
    
    // Engagement scoring
    if (leadData.behavioralData.timeOnPage > 300) enhancedScore += 15 // 5+ minutes
    if (leadData.behavioralData.scrollDepth > 90) enhancedScore += 10 // 90%+ scroll
    if (leadData.message && leadData.message.length > 100) enhancedScore += 5 // Detailed message
    
    // Cap the score at 100
    enhancedScore = Math.min(enhancedScore, 100)
    
    // Determine priority level
    let priority: 'high' | 'medium' | 'low'
    if (enhancedScore >= 70) priority = 'high'
    else if (enhancedScore >= 40) priority = 'medium'
    else priority = 'low'
    
    // Create enriched lead object
    const enrichedLead = {
      ...leadData,
      leadScore: enhancedScore,
      priority,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      processedAt: new Date().toISOString(),
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // In a real application, you would:
    // 1. Save to database (Supabase, MongoDB, etc.)
    // 2. Send to CRM system
    // 3. Trigger email notifications
    // 4. Add to marketing automation
    
    console.log('New Enhanced Lead Received:', {
      id: enrichedLead.id,
      name: enrichedLead.name,
      company: enrichedLead.company,
      industry: enrichedLead.industry,
      leadScore: enrichedLead.leadScore,
      priority: enrichedLead.priority,
      submittedAt: enrichedLead.submittedAt
    })
    
    // Simulate database save delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return success response
    return NextResponse.json({
      success: true,
      leadId: enrichedLead.id,
      leadScore: enrichedLead.leadScore,
      priority: enrichedLead.priority,
      message: 'Lead successfully processed and scored',
      estimatedResponseTime: priority === 'high' ? '30 minutes' : priority === 'medium' ? '2 hours' : '24 hours'
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('Error processing lead:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process lead submission',
      message: 'Please try again or contact us directly'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Lead Capture API',
    version: '2.0',
    endpoints: {
      POST: 'Submit new lead with behavioral analytics',
      GET: 'API information'
    },
    requiredFields: ['name', 'email', 'phone', 'industry', 'projectType', 'budget', 'timeline'],
    optionalFields: ['company', 'message', 'behavioralData'],
    leadScoring: {
      factors: ['budget', 'timeline', 'industry', 'engagement', 'company_size'],
      maxScore: 100,
      priorities: {
        high: '70-100',
        medium: '40-69',
        low: '0-39'
      }
    }
  })
}