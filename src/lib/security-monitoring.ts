import { NextRequest } from 'next/server'
import { auditLogger } from './audit-logging'
import { getClientIP } from './security'
import { createClient } from './supabase/server'

interface FailedLoginAttempt {
  ip: string
  email: string
  timestamp: Date
  userAgent?: string
}

interface SuspiciousActivity {
  ip: string
  activityType: string
  details: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  userAgent?: string
  userId?: string
}

/**
 * Security monitoring service for tracking and alerting on security events
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor
  private failedLoginAttempts: Map<string, FailedLoginAttempt[]> = new Map()
  private suspiciousActivities: SuspiciousActivity[] = []
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupOldEntries(), this.CLEANUP_INTERVAL)
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  /**
   * Track failed login attempt
   */
  async trackFailedLogin(
    email: string,
    reason: string,
    req?: NextRequest
  ): Promise<{ blocked: boolean; remainingAttempts: number; lockoutTime?: Date }> {
    const ip = req ? getClientIP(req) : 'unknown'
    const userAgent = req?.headers.get('user-agent') || undefined
    const now = new Date()

    // Get existing attempts for this IP
    const attempts = this.failedLoginAttempts.get(ip) || []
    
    // Remove old attempts (older than lockout duration)
    const recentAttempts = attempts.filter(
      attempt => now.getTime() - attempt.timestamp.getTime() < this.LOCKOUT_DURATION
    )

    // Add new attempt
    const newAttempt: FailedLoginAttempt = {
      ip,
      email,
      timestamp: now,
      userAgent
    }
    recentAttempts.push(newAttempt)
    this.failedLoginAttempts.set(ip, recentAttempts)

    // Log the failed attempt
    await auditLogger.logFailedLogin(email, reason, req)

    // Check if IP should be blocked
    const blocked = recentAttempts.length >= this.MAX_FAILED_ATTEMPTS
    const remainingAttempts = Math.max(0, this.MAX_FAILED_ATTEMPTS - recentAttempts.length)

    if (blocked) {
      // Log security event for blocked IP
      await auditLogger.logSecurityEvent({
        eventType: 'suspicious_activity',
        severity: 'high',
        description: `IP ${ip} blocked due to ${recentAttempts.length} failed login attempts`,
        ipAddress: ip,
        userAgent,
        metadata: {
          failedAttempts: recentAttempts.length,
          emails: recentAttempts.map(a => a.email),
          lockoutDuration: this.LOCKOUT_DURATION
        }
      }, req)

      // Send alert for critical security event
      await this.sendSecurityAlert({
        type: 'failed_login_threshold',
        severity: 'high',
        message: `IP ${ip} has been blocked due to ${recentAttempts.length} failed login attempts`,
        details: {
          ip,
          attempts: recentAttempts.length,
          emails: recentAttempts.map(a => a.email),
          userAgent
        }
      })

      const lockoutTime = new Date(now.getTime() + this.LOCKOUT_DURATION)
      return { blocked: true, remainingAttempts: 0, lockoutTime }
    }

    // Send warning alert if approaching threshold
    if (recentAttempts.length >= this.MAX_FAILED_ATTEMPTS - 1) {
      await this.sendSecurityAlert({
        type: 'failed_login_warning',
        severity: 'medium',
        message: `IP ${ip} approaching failed login threshold (${recentAttempts.length}/${this.MAX_FAILED_ATTEMPTS})`,
        details: {
          ip,
          attempts: recentAttempts.length,
          emails: recentAttempts.map(a => a.email),
          userAgent
        }
      })
    }

    return { blocked: false, remainingAttempts }
  }

  /**
   * Check if IP is currently blocked
   */
  isIPBlocked(ip: string): { blocked: boolean; lockoutTime?: Date } {
    const attempts = this.failedLoginAttempts.get(ip) || []
    const now = new Date()
    
    const recentAttempts = attempts.filter(
      attempt => now.getTime() - attempt.timestamp.getTime() < this.LOCKOUT_DURATION
    )

    if (recentAttempts.length >= this.MAX_FAILED_ATTEMPTS) {
      const oldestAttempt = recentAttempts[0]
      const lockoutTime = new Date(oldestAttempt.timestamp.getTime() + this.LOCKOUT_DURATION)
      return { blocked: true, lockoutTime }
    }

    return { blocked: false }
  }

  /**
   * Track suspicious activity
   */
  async trackSuspiciousActivity(
    activityType: string,
    details: string,
    severity: SuspiciousActivity['severity'] = 'medium',
    req?: NextRequest,
    userId?: string
  ): Promise<void> {
    const ip = req ? getClientIP(req) : 'unknown'
    const userAgent = req?.headers.get('user-agent') || undefined

    const activity: SuspiciousActivity = {
      ip,
      activityType,
      details,
      timestamp: new Date(),
      severity,
      userAgent,
      userId
    }

    this.suspiciousActivities.push(activity)

    // Log security event
    await auditLogger.logSuspiciousActivity(details, severity, req, {
      activityType,
      userId
    })

    // Send alert for high/critical severity
    if (severity === 'high' || severity === 'critical') {
      await this.sendSecurityAlert({
        type: 'suspicious_activity',
        severity,
        message: `Suspicious activity detected: ${activityType}`,
        details: {
          ip,
          activityType,
          details,
          userId,
          userAgent
        }
      })
    }

    // Check for patterns that might indicate coordinated attacks
    await this.analyzeActivityPatterns(ip, activityType)
  }

  /**
   * Analyze activity patterns for potential attacks
   */
  private async analyzeActivityPatterns(ip: string, activityType: string): Promise<void> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Check for repeated suspicious activities from same IP
    const recentActivities = this.suspiciousActivities.filter(
      activity => 
        activity.ip === ip && 
        activity.timestamp > oneHourAgo
    )

    if (recentActivities.length >= 10) {
      await this.sendSecurityAlert({
        type: 'coordinated_attack',
        severity: 'critical',
        message: `Potential coordinated attack detected from IP ${ip}`,
        details: {
          ip,
          activitiesCount: recentActivities.length,
          activityTypes: [...new Set(recentActivities.map(a => a.activityType))],
          timeWindow: '1 hour'
        }
      })
    }

    // Check for distributed attacks (same activity type from multiple IPs)
    const sameActivityFromDifferentIPs = this.suspiciousActivities.filter(
      activity => 
        activity.activityType === activityType && 
        activity.timestamp > oneHourAgo
    )

    const uniqueIPs = new Set(sameActivityFromDifferentIPs.map(a => a.ip))
    if (uniqueIPs.size >= 5) {
      await this.sendSecurityAlert({
        type: 'distributed_attack',
        severity: 'critical',
        message: `Potential distributed attack detected: ${activityType}`,
        details: {
          activityType,
          uniqueIPs: uniqueIPs.size,
          totalActivities: sameActivityFromDifferentIPs.length,
          timeWindow: '1 hour'
        }
      })
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(alert: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    details: any
  }): Promise<void> {
    try {
      // Log to console for immediate visibility
      const logLevel = alert.severity === 'critical' ? 'error' : 
                      alert.severity === 'high' ? 'warn' : 'info'
      
      console[logLevel](`SECURITY ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, alert.details)

      // Store alert in database for admin dashboard
      const supabase = await createClient()
      await supabase.from('audit_log').insert({
        user_id: null,
        action: `SECURITY_ALERT_${alert.type.toUpperCase()}`,
        resource_type: 'security_alert',
        resource_id: null,
        old_values: null,
        new_values: {
          alertType: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
          timestamp: new Date().toISOString()
        },
        ip_address: alert.details.ip || null,
        user_agent: alert.details.userAgent || null
      })

      // In production, you would also send notifications via:
      // - Email to security team
      // - Slack/Teams webhook
      // - SMS for critical alerts
      // - Integration with security monitoring tools (e.g., Datadog, New Relic)
      
      if (process.env.NODE_ENV === 'production') {
        // Example: Send email alert (implement based on your email service)
        // await this.sendEmailAlert(alert)
        
        // Example: Send Slack notification (implement based on your Slack setup)
        // await this.sendSlackAlert(alert)
      }
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(timeWindow: number = 24 * 60 * 60 * 1000): Promise<{
    failedLogins: number
    blockedIPs: number
    suspiciousActivities: number
    criticalAlerts: number
  }> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - timeWindow)

    // Count failed logins in time window
    let failedLogins = 0
    for (const attempts of this.failedLoginAttempts.values()) {
      failedLogins += attempts.filter(a => a.timestamp > windowStart).length
    }

    // Count currently blocked IPs
    let blockedIPs = 0
    for (const [ip] of this.failedLoginAttempts.entries()) {
      if (this.isIPBlocked(ip).blocked) {
        blockedIPs++
      }
    }

    // Count suspicious activities in time window
    const suspiciousActivities = this.suspiciousActivities.filter(
      a => a.timestamp > windowStart
    ).length

    // Count critical alerts from database
    try {
      const supabase = await createClient()
      const { count } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('resource_type', 'security_alert')
        .eq('new_values->severity', 'critical')
        .gte('created_at', windowStart.toISOString())

      return {
        failedLogins,
        blockedIPs,
        suspiciousActivities,
        criticalAlerts: count || 0
      }
    } catch (error) {
      console.error('Error fetching security stats:', error)
      return {
        failedLogins,
        blockedIPs,
        suspiciousActivities,
        criticalAlerts: 0
      }
    }
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanupOldEntries(): void {
    const now = new Date()
    const cutoff = new Date(now.getTime() - this.LOCKOUT_DURATION * 2)

    // Clean up failed login attempts
    for (const [ip, attempts] of this.failedLoginAttempts.entries()) {
      const recentAttempts = attempts.filter(a => a.timestamp > cutoff)
      if (recentAttempts.length === 0) {
        this.failedLoginAttempts.delete(ip)
      } else {
        this.failedLoginAttempts.set(ip, recentAttempts)
      }
    }

    // Clean up suspicious activities (keep last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    this.suspiciousActivities = this.suspiciousActivities.filter(
      a => a.timestamp > oneDayAgo
    )
  }

  /**
   * Reset failed login attempts for an IP (for admin use)
   */
  resetFailedAttempts(ip: string): void {
    this.failedLoginAttempts.delete(ip)
  }

  /**
   * Get blocked IPs list
   */
  getBlockedIPs(): Array<{ ip: string; lockoutTime: Date; attempts: number }> {
    const blocked: Array<{ ip: string; lockoutTime: Date; attempts: number }> = []
    
    for (const [ip, attempts] of this.failedLoginAttempts.entries()) {
      const blockStatus = this.isIPBlocked(ip)
      if (blockStatus.blocked && blockStatus.lockoutTime) {
        blocked.push({
          ip,
          lockoutTime: blockStatus.lockoutTime,
          attempts: attempts.length
        })
      }
    }

    return blocked
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance()

// Convenience functions
export const trackFailedLogin = securityMonitor.trackFailedLogin.bind(securityMonitor)
export const trackSuspiciousActivity = securityMonitor.trackSuspiciousActivity.bind(securityMonitor)
export const isIPBlocked = securityMonitor.isIPBlocked.bind(securityMonitor)