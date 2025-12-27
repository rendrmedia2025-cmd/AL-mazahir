import { createClient } from './supabase/client'
import type { User } from '@supabase/supabase-js'

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
 * Client-side authentication utilities
 */
export class AuthClient {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        // Update last login timestamp
        await this.updateLastLogin(data.user.id)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  async getAdminProfile(userId: string): Promise<AdminUser | null> {
    const { data, error } = await this.supabase
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

  private async updateLastLogin(userId: string) {
    await this.supabase
      .from('admin_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const adminProfile = await this.getAdminProfile(session.user.id)
        if (adminProfile) {
          callback({ user: session.user, adminProfile })
        } else {
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}

// Export singleton instance
export const authClient = new AuthClient()

// Role-based access control helpers
export function hasPermission(
  userRole: 'admin' | 'manager',
  requiredRole: 'admin' | 'manager'
): boolean {
  if (requiredRole === 'manager') {
    return userRole === 'admin' || userRole === 'manager'
  }
  return userRole === 'admin'
}

export function canAccessResource(
  userRole: 'admin' | 'manager',
  resource: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  // Admin can do everything
  if (userRole === 'admin') {
    return true
  }

  // Manager permissions
  if (userRole === 'manager') {
    switch (resource) {
      case 'availability_status':
        return action === 'read' || action === 'write'
      case 'enhanced_leads':
        return action === 'read'
      case 'product_categories':
        return action === 'read' || action === 'write'
      case 'business_insights':
        return action === 'read' || action === 'write'
      case 'industries':
        return action === 'read'
      default:
        return action === 'read'
    }
  }

  return false
}