import { createClient } from './supabase/server'
import { trackFailedLogin, trackSuspiciousActivity } from './security-monitoring'
import type { User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'manager'
  full_name?: string
  last_login?: string
  is_active: boolean
}

export interface AuthSession {
  user: User
  adminProfile: AdminUser
}

/**
 * Server-side authentication utilities
 */
export class AuthServer {
  private async getSupabase() {
    return await createClient()
  }

  async signIn(email: string, password: string, req?: NextRequest) {
    const supabase = await this.getSupabase()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Track failed login attempt
        await trackFailedLogin(email, error.message, req)
        throw new Error(error.message)
      }

      if (data.user) {
        // Update last login timestamp
        await this.updateLastLogin(data.user.id)
        
        // Check if this is a suspicious login (e.g., from new location, unusual time)
        await this.checkSuspiciousLogin(data.user, req)
      }

      return data
    } catch (error) {
      // If it's not already tracked, track the failed attempt
      if (error instanceof Error && !error.message.includes('tracked')) {
        await trackFailedLogin(email, error.message, req)
      }
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const supabase = await this.getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  async getAdminProfile(userId: string): Promise<AdminUser | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      email: data.email || '',
      role: data.role,
      full_name: data.full_name,
      last_login: data.last_login,
      is_active: data.is_active,
    }
  }

  async getAuthSession(): Promise<AuthSession | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const adminProfile = await this.getAdminProfile(user.id)
    if (!adminProfile) return null

    return {
      user,
      adminProfile,
    }
  }

  async requireAuth(): Promise<AuthSession> {
    const session = await this.getAuthSession()
    if (!session) {
      throw new Error('Authentication required')
    }
    return session
  }

  async requireAdminRole(allowedRoles: ('admin' | 'manager')[] = ['admin', 'manager']): Promise<AuthSession> {
    const session = await this.requireAuth()
    if (!allowedRoles.includes(session.adminProfile.role)) {
      throw new Error('Insufficient permissions')
    }
    return session
  }

  private async updateLastLogin(userId: string) {
    const supabase = await this.getSupabase()
    await supabase
      .from('admin_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
  }

  private async checkSuspiciousLogin(user: User, req?: NextRequest) {
    try {
      const supabase = await this.getSupabase()
      
      // Get user's login history to detect unusual patterns
      const { data: recentLogins } = await supabase
        .from('audit_log')
        .select('ip_address, user_agent, created_at')
        .eq('user_id', user.id)
        .eq('action', 'LOGIN')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!recentLogins || recentLogins.length === 0) {
        // First login - not suspicious
        return
      }

      const currentIP = req?.headers.get('x-forwarded-for')?.split(',')[0] || 
                       req?.headers.get('x-real-ip') || 
                       'unknown'
      const currentUserAgent = req?.headers.get('user-agent') || 'unknown'

      // Check for new IP address
      const knownIPs = new Set(recentLogins.map(login => login.ip_address).filter(Boolean))
      if (!knownIPs.has(currentIP) && currentIP !== 'unknown') {
        await trackSuspiciousActivity(
          'new_ip_login',
          `User ${user.email} logged in from new IP address: ${currentIP}`,
          'medium',
          req,
          user.id
        )
      }

      // Check for unusual time (e.g., login outside normal business hours)
      const now = new Date()
      const hour = now.getHours()
      if (hour < 6 || hour > 22) { // Outside 6 AM - 10 PM
        await trackSuspiciousActivity(
          'unusual_time_login',
          `User ${user.email} logged in at unusual time: ${now.toISOString()}`,
          'low',
          req,
          user.id
        )
      }

      // Check for rapid successive logins (potential account takeover)
      const lastLogin = recentLogins[0]
      if (lastLogin) {
        const timeDiff = now.getTime() - new Date(lastLogin.created_at).getTime()
        if (timeDiff < 60000) { // Less than 1 minute
          await trackSuspiciousActivity(
            'rapid_successive_login',
            `User ${user.email} had rapid successive logins (${timeDiff}ms apart)`,
            'high',
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
}

// Export singleton instance
export const authServer = new AuthServer()

// Verification helper for API routes
export async function verifyAdminAuth(): Promise<AuthSession> {
  return await authServer.requireAuth()
}