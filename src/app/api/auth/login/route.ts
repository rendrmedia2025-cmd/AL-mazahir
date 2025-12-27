import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackFailedLogin, trackSuspiciousActivity, isIPBlocked } from '@/lib/security-monitoring'
import { getClientIP } from '@/lib/security'
import { logAdminAction } from '@/lib/audit-logging'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if IP is blocked
    const clientIP = getClientIP(req)
    const blockStatus = isIPBlocked(clientIP)
    
    if (blockStatus.blocked) {
      await trackSuspiciousActivity(
        'blocked_ip_login_attempt',
        `Login attempt from blocked IP: ${clientIP}`,
        'high',
        req
      )
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access temporarily restricted. Please try again later.',
          blockedUntil: blockStatus.lockoutTime?.toISOString()
        },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    
    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Track failed login attempt
      await trackFailedLogin(email, error.message, req)
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      await trackFailedLogin(email, 'No user returned', req)
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Check if user has admin profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !adminProfile) {
      await trackSuspiciousActivity(
        'non_admin_login_attempt',
        `Non-admin user attempted to access admin panel: ${email}`,
        'high',
        req,
        data.user.id
      )
      
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update last login timestamp
    await supabase
      .from('admin_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    // Check for suspicious login patterns
    await checkSuspiciousLogin(data.user, adminProfile, req, supabase)

    // Log successful login
    await logAdminAction(
      'LOGIN',
      'admin_session',
      data.user.id,
      null,
      { 
        email: data.user.email,
        role: adminProfile.role,
        loginTime: new Date().toISOString()
      },
      req
    )

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: adminProfile.role,
        full_name: adminProfile.full_name,
        last_login: adminProfile.last_login,
        is_active: adminProfile.is_active
      }
    })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function checkSuspiciousLogin(
  user: any,
  adminProfile: any,
  req: NextRequest,
  supabase: any
) {
  try {
    // Get user's login history to detect unusual patterns
    const { data: recentLogins } = await supabase
      .from('audit_log')
      .select('ip_address, user_agent, created_at')
      .eq('user_id', user.id)
      .eq('action', 'LOGIN')
      .order('created_at', { ascending: false })
      .limit(10)

    const currentIP = getClientIP(req)
    const currentUserAgent = req.headers.get('user-agent') || 'unknown'

    if (recentLogins && recentLogins.length > 0) {
      // Check for new IP address
      const knownIPs = new Set(recentLogins.map(login => login.ip_address).filter(Boolean))
      if (!knownIPs.has(currentIP) && currentIP !== 'unknown') {
        await trackSuspiciousActivity(
          'new_ip_login',
          `Admin user ${user.email} logged in from new IP address: ${currentIP}`,
          'medium',
          req,
          user.id
        )
      }

      // Check for rapid successive logins (potential account takeover)
      const lastLogin = recentLogins[0]
      if (lastLogin) {
        const timeDiff = Date.now() - new Date(lastLogin.created_at).getTime()
        if (timeDiff < 60000) { // Less than 1 minute
          await trackSuspiciousActivity(
            'rapid_successive_login',
            `Admin user ${user.email} had rapid successive logins (${timeDiff}ms apart)`,
            'high',
            req,
            user.id
          )
        }
      }
    }

    // Check for unusual time (e.g., login outside normal business hours)
    const now = new Date()
    const hour = now.getHours()
    if (hour < 6 || hour > 22) { // Outside 6 AM - 10 PM
      await trackSuspiciousActivity(
        'unusual_time_login',
        `Admin user ${user.email} logged in at unusual time: ${now.toISOString()}`,
        'low',
        req,
        user.id
      )
    }

    // Check for different user agent (potential device change)
    if (recentLogins && recentLogins.length > 0) {
      const lastUserAgent = recentLogins[0].user_agent
      if (lastUserAgent && lastUserAgent !== currentUserAgent) {
        await trackSuspiciousActivity(
          'different_user_agent',
          `Admin user ${user.email} logged in with different user agent`,
          'low',
          req,
          user.id
        )
      }
    }
  } catch (error) {
    console.error('Error checking suspicious login:', error)
    // Don't throw - suspicious login check failure shouldn't prevent login
  }
}