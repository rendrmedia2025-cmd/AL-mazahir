import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, getClientIP } from '@/lib/security'
import { securityMonitor } from '@/lib/security-monitoring'
import { logAdminAction } from '@/lib/audit-logging'

async function getHandler(req: NextRequest) {
  try {
    const blockedIPs = securityMonitor.getBlockedIPs()
    
    return NextResponse.json({
      success: true,
      data: blockedIPs
    })
  } catch (error) {
    console.error('Get blocked IPs error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function deleteHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ip = searchParams.get('ip')

    if (!ip) {
      return NextResponse.json(
        { success: false, error: 'IP address is required' },
        { status: 400 }
      )
    }

    // Reset failed attempts for the IP
    securityMonitor.resetFailedAttempts(ip)

    // Log admin action
    await logAdminAction(
      'UNBLOCK_IP',
      'security_blocked_ip',
      ip,
      { blocked: true },
      { blocked: false },
      req,
      { unblockedIP: ip }
    )

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been unblocked`
    })
  } catch (error) {
    console.error('Unblock IP error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withSecurity(getHandler, {
  requireAuth: true,
  requireRole: 'admin',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }
})

export const DELETE = withSecurity(deleteHandler, {
  requireAuth: true,
  requireRole: 'admin',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  }
})