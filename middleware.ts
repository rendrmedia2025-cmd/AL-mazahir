import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security configuration
const SECURITY_CONFIG = {
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100,
  enableSecurityHeaders: true,
  enableCSP: true,
  enableHSTS: process.env.NODE_ENV === 'production',
}

export async function middleware(request: NextRequest) {
  const response = await handleRequest(request)
  return response
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  // Handle Supabase auth session
  let response = await updateSession(request)
  
  // If no response from updateSession, create a new one
  if (!response) {
    response = NextResponse.next()
  }
  
  // Apply rate limiting
  if (SECURITY_CONFIG.rateLimitWindowMs > 0) {
    const rateLimitResult = await applyRateLimit(request)
    if (!rateLimitResult.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
          'X-RateLimit-Limit': SECURITY_CONFIG.rateLimitMaxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      })
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', SECURITY_CONFIG.rateLimitMaxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
  }
  
  // Apply enterprise security headers
  if (SECURITY_CONFIG.enableSecurityHeaders) {
    applySecurityHeaders(response, request)
  }
  
  // Apply Content Security Policy
  if (SECURITY_CONFIG.enableCSP) {
    applyContentSecurityPolicy(response)
  }
  
  // Apply HTTPS enforcement in production
  if (SECURITY_CONFIG.enableHSTS && process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Add performance headers
  applyPerformanceHeaders(response)
  
  // Log security events for monitoring
  await logSecurityEvent(request, response)
  
  return response
}

async function applyRateLimit(request: NextRequest): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const clientIP = getClientIP(request)
  const now = Date.now()
  const windowStart = now - SECURITY_CONFIG.rateLimitWindowMs
  
  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
  
  const key = `rate_limit:${clientIP}`
  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime < now) {
    // First request in window or window expired
    const resetTime = now + SECURITY_CONFIG.rateLimitWindowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: SECURITY_CONFIG.rateLimitMaxRequests - 1,
      resetTime
    }
  }
  
  if (current.count >= SECURITY_CONFIG.rateLimitMaxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return {
    allowed: true,
    remaining: SECURITY_CONFIG.rateLimitMaxRequests - current.count,
    resetTime: current.resetTime
  }
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): void {
  // Basic security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Advanced security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  // Permissions Policy (Feature Policy)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
  ].join(', ')
  response.headers.set('Permissions-Policy', permissionsPolicy)
  
  // Remove server information
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
}

function applyContentSecurityPolicy(response: NextResponse): void {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.emailjs.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.emailjs.com https://www.google-analytics.com https://analytics.google.com wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]
  
  // Add report-uri in production
  if (process.env.NODE_ENV === 'production' && process.env.CSP_REPORT_URI) {
    cspDirectives.push(`report-uri ${process.env.CSP_REPORT_URI}`)
  }
  
  const csp = cspDirectives.join('; ')
  response.headers.set('Content-Security-Policy', csp)
}

function applyPerformanceHeaders(response: NextResponse): void {
  // DNS prefetch control
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // Early hints for critical resources
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Link', [
      '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '</images/logo.webp>; rel=preload; as=image',
    ].join(', '))
  }
}

async function logSecurityEvent(request: NextRequest, response: NextResponse): Promise<void> {
  try {
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const method = request.method
    const url = request.url
    const statusCode = response.status
    
    // Log suspicious activities
    const suspiciousPatterns = [
      /\.(php|asp|jsp|cgi)$/i,
      /wp-admin|wp-login|phpmyadmin/i,
      /(union|select|insert|delete|drop|create|alter)\s/i,
      /<script|javascript:|vbscript:|onload|onerror/i,
    ]
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(url) || pattern.test(userAgent)
    )
    
    if (isSuspicious || statusCode === 429 || statusCode >= 400) {
      // In production, send to monitoring service
      console.warn('Security Event:', {
        timestamp: new Date().toISOString(),
        clientIP,
        userAgent,
        method,
        url,
        statusCode,
        isSuspicious,
        type: statusCode === 429 ? 'rate_limit' : statusCode >= 400 ? 'error' : 'suspicious'
      })
      
      // TODO: Send to external monitoring service (Sentry, DataDog, etc.)
    }
  } catch (error) {
    console.error('Error logging security event:', error)
  }
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
  
  // Fallback to connection remote address
  return request.ip || 'unknown'
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     * - images, assets (public static files)
     * - sw.js (service worker)
     * - manifest files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sw.js|manifest|images|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}