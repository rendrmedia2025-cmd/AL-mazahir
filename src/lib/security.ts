import { NextRequest, NextResponse } from 'next/server'
import { authServer } from './auth-server'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

export interface SecurityConfig {
  requireAuth?: boolean
  requireRole?: 'admin' | 'manager'
  rateLimit?: RateLimitConfig
  validateInput?: boolean
  httpsOnly?: boolean
}

/**
 * Rate limiting implementation
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req)
    const now = Date.now()
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    const entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      // First request or window expired
      const resetTime = now + config.windowMs
      rateLimitStore.set(key, { count: 1, resetTime })
      return { allowed: true, remaining: config.maxRequests - 1, resetTime }
    }
    
    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: entry.resetTime }
    }
    
    // Increment count
    entry.count++
    rateLimitStore.set(key, entry)
    
    return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime }
  }
}

/**
 * Input sanitization utilities
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: any,
  validator: (data: any) => T
): { valid: true; data: T } | { valid: false; errors: string[] } {
  try {
    const data = validator(body)
    return { valid: true, data }
  } catch (error) {
    const errors = error instanceof Error ? [error.message] : ['Validation failed']
    return { valid: false, errors }
  }
}

/**
 * Get client IP address
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const clientIP = req.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || clientIP || 'unknown'
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // HTTPS enforcement
      if (config.httpsOnly && req.nextUrl.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
        const httpsUrl = new URL(req.url)
        httpsUrl.protocol = 'https:'
        return NextResponse.redirect(httpsUrl)
      }

      // Rate limiting
      if (config.rateLimit) {
        const rateLimiter = rateLimit(config.rateLimit)
        const result = rateLimiter(req)
        
        if (!result.allowed) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            }),
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': config.rateLimit.maxRequests.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.resetTime.toString(),
                'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
              }
            }
          )
        }
      }

      // Authentication check
      if (config.requireAuth) {
        try {
          const session = await authServer.getAuthSession()
          if (!session) {
            return new NextResponse(
              JSON.stringify({ error: 'Authentication required' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Role-based access control
          if (config.requireRole) {
            const allowedRoles: ('admin' | 'manager')[] = 
              config.requireRole === 'admin' ? ['admin'] : ['admin', 'manager']
            
            if (!allowedRoles.includes(session.adminProfile.role)) {
              return new NextResponse(
                JSON.stringify({ error: 'Insufficient permissions' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              )
            }
          }
        } catch (error) {
          return new NextResponse(
            JSON.stringify({ error: 'Authentication failed' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      return null // Continue to next middleware/handler
    } catch (error) {
      console.error('Security middleware error:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

/**
 * API route wrapper with security
 */
export function withSecurity<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const securityMiddleware = createSecurityMiddleware(config)
    const securityResult = await securityMiddleware(req)
    
    if (securityResult) {
      return securityResult // Security check failed
    }

    // Input sanitization
    if (config.validateInput && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      try {
        const body = await req.json()
        const sanitizedBody = sanitizeInput(body)
        
        // Create new request with sanitized body
        const sanitizedReq = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(sanitizedBody)
        })
        
        return handler(sanitizedReq, ...args)
      } catch (error) {
        // If JSON parsing fails, continue with original request
        return handler(req, ...args)
      }
    }

    return handler(req, ...args)
  }
}

/**
 * Audit logging utility
 */
export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any,
  req?: NextRequest
) {
  try {
    const session = await authServer.getAuthSession()
    const supabase = await import('./supabase/server').then(m => m.createClient())
    
    await (await supabase).from('audit_log').insert({
      user_id: session?.user.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: req ? getClientIP(req) : null,
      user_agent: req?.headers.get('user-agent') || null
    })
  } catch (error) {
    console.error('Audit logging failed:', error)
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  
  // Form submissions
  FORM_SUBMISSION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3
  },
  
  // Admin operations
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }
} as const