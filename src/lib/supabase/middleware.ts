/**
 * Enhanced Supabase Middleware for Enterprise Authentication
 * Handles session management, security, and audit logging
 * Requirements: 11.1, 11.2, 11.5
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '../logger'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Enhanced session management and security
  await handleSessionSecurity(request, supabaseResponse, user)

  // Protected routes handling
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Log unauthorized access attempt
      logger.logSecurityEvent('unauthorized_admin_access_attempt', 'medium', {
        url: request.nextUrl.pathname,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined
      })

      // Redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Verify admin role
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !adminProfile.is_active) {
      logger.logSecurityEvent('invalid_admin_access_attempt', 'high', {
        userId: user.id,
        email: user.email,
        url: request.nextUrl.pathname,
        ip: getClientIP(request),
        reason: !adminProfile ? 'no_admin_profile' : 'inactive_profile'
      })

      // Redirect to unauthorized page
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    // Log successful admin access
    logger.logAuthEvent('admin_access', user.id, true, {
      url: request.nextUrl.pathname,
      role: adminProfile.role,
      ip: getClientIP(request)
    })
  }

  // API routes protection
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!user) {
      logger.logSecurityEvent('unauthorized_api_access_attempt', 'medium', {
        url: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined
      })

      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }

    // Verify admin role for API access
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !adminProfile.is_active) {
      logger.logSecurityEvent('invalid_admin_api_access_attempt', 'high', {
        userId: user.id,
        email: user.email,
        url: request.nextUrl.pathname,
        method: request.method,
        ip: getClientIP(request),
        reason: !adminProfile ? 'no_admin_profile' : 'inactive_profile'
      })

      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

async function handleSessionSecurity(
  request: NextRequest,
  response: NextResponse,
  user: any
): Promise<void> {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const url = request.nextUrl.pathname

  // Session security checks
  if (user) {
    // Log user activity for security monitoring
    logger.logAuthEvent('session_activity', user.id, true, {
      ip: clientIP,
      userAgent,
      url,
      timestamp: new Date().toISOString()
    })

    // Check for suspicious session activity
    await checkSuspiciousActivity(user, clientIP, userAgent, url)

    // Update last activity timestamp
    await updateLastActivity(user.id, clientIP, userAgent)
  }

  // Add security headers to response
  response.headers.set('X-Session-Security', 'enabled')
  
  // Add session fingerprinting for additional security
  if (user) {
    const sessionFingerprint = generateSessionFingerprint(clientIP, userAgent)
    response.headers.set('X-Session-Fingerprint', sessionFingerprint)
  }
}

async function checkSuspiciousActivity(
  user: any,
  clientIP: string,
  userAgent: string,
  url: string
): Promise<void> {
  try {
    // Check for rapid requests (potential bot activity)
    const recentActivity = await getRecentUserActivity(user.id)
    
    if (recentActivity.length > 50) { // More than 50 requests in last minute
      logger.logSecurityEvent('suspicious_rapid_requests', 'medium', {
        userId: user.id,
        email: user.email,
        ip: clientIP,
        userAgent,
        url,
        requestCount: recentActivity.length
      })
    }

    // Check for unusual access patterns
    const unusualHour = new Date().getHours()
    if (unusualHour < 5 || unusualHour > 23) { // Outside normal hours
      logger.logSecurityEvent('unusual_access_time', 'low', {
        userId: user.id,
        email: user.email,
        ip: clientIP,
        hour: unusualHour,
        url
      })
    }

    // Check for new IP address
    const knownIPs = await getUserKnownIPs(user.id)
    if (!knownIPs.includes(clientIP)) {
      logger.logSecurityEvent('new_ip_access', 'medium', {
        userId: user.id,
        email: user.email,
        newIP: clientIP,
        knownIPs: knownIPs.slice(0, 5), // Log only last 5 IPs for privacy
        url
      })
    }

  } catch (error) {
    logger.error('Error checking suspicious activity', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function updateLastActivity(
  userId: string,
  clientIP: string,
  userAgent: string
): Promise<void> {
  try {
    // In a real implementation, you would update this in your database
    // For now, we'll just log it
    logger.logAuthEvent('activity_update', userId, true, {
      ip: clientIP,
      userAgent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error updating last activity', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function getRecentUserActivity(userId: string): Promise<any[]> {
  // In a real implementation, query your activity log
  // For now, return empty array
  return []
}

async function getUserKnownIPs(userId: string): Promise<string[]> {
  // In a real implementation, query your user IP history
  // For now, return empty array
  return []
}

function generateSessionFingerprint(clientIP: string, userAgent: string): string {
  // Create a simple fingerprint for session validation
  const crypto = require('crypto')
  const data = `${clientIP}:${userAgent}:${process.env.SESSION_SECRET || 'default'}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

function getClientIP(request: NextRequest): string {
  // Try various headers to get the real client IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback
  return request.ip || 'unknown'
}