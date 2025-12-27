import { NextRequest } from 'next/server'
import { authServer } from './auth-server'
import { getClientIP } from './security'
import { createClient } from './supabase/server'

export interface AuditLogEntry {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface SecurityEvent {
  eventType: 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ipAddress?: string
  userAgent?: string
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Enhanced audit logging service
 */
export class AuditLogger {
  private static instance: AuditLogger
  private supabase: any

  private constructor() {
    // Singleton pattern for consistent logging
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Log admin action with full context
   */
  async logAdminAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    req?: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const session = await authServer.getAuthSession()
      const supabase = await this.getSupabaseClient()
      
      const auditEntry: AuditLogEntry = {
        userId: session?.user.id || null,
        action,
        resourceType,
        resourceId: resourceId || null,
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: req ? getClientIP(req) : null,
        userAgent: req?.headers.get('user-agent') || null,
        sessionId: session?.sessionId || null,
        metadata: metadata || null
      }

      const { error } = await supabase.from('audit_log').insert({
        user_id: auditEntry.userId,
        action: auditEntry.action,
        resource_type: auditEntry.resourceType,
        resource_id: auditEntry.resourceId,
        old_values: auditEntry.oldValues,
        new_values: auditEntry.newValues,
        ip_address: auditEntry.ipAddress,
        user_agent: auditEntry.userAgent,
        metadata: auditEntry.metadata
      })

      if (error) {
        console.error('Audit logging failed:', error)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    event: SecurityEvent,
    req?: NextRequest
  ): Promise<void> {
    try {
      const session = await authServer.getAuthSession().catch(() => null)
      const supabase = await this.getSupabaseClient()

      // Log to audit_log table with security event type
      const { error } = await supabase.from('audit_log').insert({
        user_id: event.userId || session?.user.id || null,
        action: `SECURITY_EVENT_${event.eventType.toUpperCase()}`,
        resource_type: 'security_event',
        resource_id: null,
        old_values: null,
        new_values: {
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata
        },
        ip_address: event.ipAddress || (req ? getClientIP(req) : null),
        user_agent: event.userAgent || req?.headers.get('user-agent') || null
      })

      if (error) {
        console.error('Security event logging failed:', error)
      }

      // For high/critical severity events, also log to console for immediate attention
      if (event.severity === 'high' || event.severity === 'critical') {
        console.warn(`SECURITY ALERT [${event.severity.toUpperCase()}]: ${event.description}`, {
          eventType: event.eventType,
          ipAddress: event.ipAddress,
          userId: event.userId,
          metadata: event.metadata
        })
      }
    } catch (error) {
      console.error('Security event logging error:', error)
    }
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(
    email: string,
    reason: string,
    req?: NextRequest
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'failed_login',
      severity: 'medium',
      description: `Failed login attempt for email: ${email}. Reason: ${reason}`,
      ipAddress: req ? getClientIP(req) : undefined,
      userAgent: req?.headers.get('user-agent') || undefined,
      metadata: {
        email,
        reason,
        timestamp: new Date().toISOString()
      }
    }, req)
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    description: string,
    severity: SecurityEvent['severity'] = 'medium',
    req?: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'suspicious_activity',
      severity,
      description,
      ipAddress: req ? getClientIP(req) : undefined,
      userAgent: req?.headers.get('user-agent') || undefined,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }, req)
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    endpoint: string,
    req?: NextRequest
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'low',
      description: `Rate limit exceeded for endpoint: ${endpoint}`,
      ipAddress: req ? getClientIP(req) : undefined,
      userAgent: req?.headers.get('user-agent') || undefined,
      metadata: {
        endpoint,
        timestamp: new Date().toISOString()
      }
    }, req)
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    resource: string,
    requiredRole?: string,
    req?: NextRequest
  ): Promise<void> {
    const session = await authServer.getAuthSession().catch(() => null)
    
    await this.logSecurityEvent({
      eventType: 'unauthorized_access',
      severity: 'high',
      description: `Unauthorized access attempt to ${resource}${requiredRole ? ` (required role: ${requiredRole})` : ''}`,
      userId: session?.user.id,
      ipAddress: req ? getClientIP(req) : undefined,
      userAgent: req?.headers.get('user-agent') || undefined,
      metadata: {
        resource,
        requiredRole,
        userRole: session?.adminProfile?.role,
        timestamp: new Date().toISOString()
      }
    }, req)
  }

  /**
   * Get audit trail for a specific resource
   */
  async getAuditTrail(
    resourceType: string,
    resourceId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const supabase = await this.getSupabaseClient()
      
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          admin_profiles!inner(full_name, role)
        `)
        .eq('resource_type', resourceType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (resourceId) {
        query = query.eq('resource_id', resourceId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching audit trail:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Audit trail fetch error:', error)
      return []
    }
  }

  /**
   * Get security events within a time range
   */
  async getSecurityEvents(
    fromDate: Date,
    toDate: Date,
    severity?: SecurityEvent['severity']
  ): Promise<any[]> {
    try {
      const supabase = await this.getSupabaseClient()
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('resource_type', 'security_event')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false })

      if (severity) {
        query = query.eq('new_values->severity', severity)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching security events:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Security events fetch error:', error)
      return []
    }
  }

  /**
   * Get admin activity summary
   */
  async getAdminActivitySummary(
    userId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    totalActions: number
    actionsByType: Record<string, number>
    recentActions: any[]
  }> {
    try {
      const supabase = await this.getSupabaseClient()
      
      let query = supabase
        .from('audit_log')
        .select(`
          action,
          resource_type,
          created_at,
          admin_profiles!inner(full_name, role)
        `)
        .neq('resource_type', 'security_event')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString())
      }

      if (toDate) {
        query = query.lte('created_at', toDate.toISOString())
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching admin activity:', error)
        return { totalActions: 0, actionsByType: {}, recentActions: [] }
      }

      const actions = data || []
      const actionsByType: Record<string, number> = {}

      actions.forEach(action => {
        const key = `${action.action}_${action.resource_type}`
        actionsByType[key] = (actionsByType[key] || 0) + 1
      })

      return {
        totalActions: actions.length,
        actionsByType,
        recentActions: actions.slice(0, 10)
      }
    } catch (error) {
      console.error('Admin activity summary error:', error)
      return { totalActions: 0, actionsByType: {}, recentActions: [] }
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

// Convenience functions for common operations
export const logAdminAction = auditLogger.logAdminAction.bind(auditLogger)
export const logSecurityEvent = auditLogger.logSecurityEvent.bind(auditLogger)
export const logFailedLogin = auditLogger.logFailedLogin.bind(auditLogger)
export const logSuspiciousActivity = auditLogger.logSuspiciousActivity.bind(auditLogger)
export const logRateLimitExceeded = auditLogger.logRateLimitExceeded.bind(auditLogger)
export const logUnauthorizedAccess = auditLogger.logUnauthorizedAccess.bind(auditLogger)