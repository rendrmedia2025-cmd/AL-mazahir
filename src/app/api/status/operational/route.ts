import { NextResponse } from 'next/server'

// Simulated operational data - in production this would come from your database
const operationalAreas = [
  {
    id: 'inventory',
    name: 'Inventory Availability',
    status: 'operational',
    percentage: 94,
    lastUpdated: new Date().toISOString(),
    details: 'Stock levels optimal across all categories. Safety equipment: 98%, Construction materials: 92%, Tools: 96%'
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Health',
    status: 'operational',
    percentage: 89,
    lastUpdated: new Date().toISOString(),
    details: 'All suppliers active. Minor delays in steel delivery due to high demand, estimated 2-3 days additional lead time'
  },
  {
    id: 'quality',
    name: 'Quality Assurance',
    status: 'operational',
    percentage: 98,
    lastUpdated: new Date().toISOString(),
    details: 'All certifications current. ISO 9001:2015 compliant. Recent audit score: 98/100. Next inspection: March 2024'
  },
  {
    id: 'logistics',
    name: 'Logistics Capacity',
    status: 'warning',
    percentage: 76,
    lastUpdated: new Date().toISOString(),
    details: 'High demand period affecting delivery times. Riyadh: Same day, Jeddah: 1-2 days, Other cities: 2-4 days'
  },
  {
    id: 'customer-service',
    name: 'Customer Service Level',
    status: 'operational',
    percentage: 96,
    lastUpdated: new Date().toISOString(),
    details: 'Average response time: 1.2 hours. Customer satisfaction: 4.8/5. 24/7 WhatsApp support active'
  },
  {
    id: 'operations',
    name: 'Business Operations',
    status: 'operational',
    percentage: 92,
    lastUpdated: new Date().toISOString(),
    details: 'All systems operational. Scheduled maintenance this weekend (Sat 2-6 AM). ERP system uptime: 99.8%'
  }
]

export async function GET() {
  try {
    // Add some realistic variation to the data
    const currentTime = new Date()
    const updatedAreas = operationalAreas.map(area => ({
      ...area,
      lastUpdated: currentTime.toISOString(),
      // Add slight random variation to percentages (±3%)
      percentage: Math.max(70, Math.min(100, area.percentage + (Math.random() - 0.5) * 6))
    }))

    return NextResponse.json({
      success: true,
      areas: updatedAreas,
      lastUpdated: currentTime.toISOString(),
      overallHealth: Math.round(updatedAreas.reduce((sum, area) => sum + area.percentage, 0) / updatedAreas.length)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error fetching operational status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch operational status',
      areas: operationalAreas // Fallback data
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60'
      }
    })
  }
}