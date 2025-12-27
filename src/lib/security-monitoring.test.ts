/**
 * Unit Tests for Security Monitoring
 * Tests security event detection and failed login tracking
 * Requirements: 2.8, 7.7
 */

import { SecurityMonitor } from './security-monitoring'
import { NextRequest } from 'next/server'

// Mock dependencies
const mockAuditLogger = {
  logFailedLogin: jest.fn(),
  logSecurityEvent: jest.fn(),
  logSuspiciousActivity: jest.fn()
}

jest.mock('./audit-logging', () => ({
  auditLogger: mockAuditLogger
}))

jest.mock('./security', () => ({
  getClientIP: jest.fn((req) => {
    if (req?.headers?.get) {
      return req.headers.get('x-forwarded-for') || '127.0.0.1'
    }
    return '127.0.0.1'
  })
}))

jest.mock('./supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ count: 0, error: null }))
            }))
          }))
        }))
      }))
    }))
  }))
}))

describe('SecurityMonitor', () => {
  let securityMonitor: SecurityMonitor
  let mockRequest: NextRequest

  beforeEach(() => {
    // Get fresh instance
    securityMonitor = SecurityMonitor.getInstance()
    
    mockRequest = {
      headers: new Headers({
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1'
      })
    } as NextRequest

    // Clear all mocks
    jest.clearAllMocks()
    
    // Reset any existing state by clearing failed attempts
    securityMonitor.resetFailedAttempts('127.0.0.1')
    securityMonitor.resetFailedAttempts('192.168.1.1')
    securityMonitor.resetFailedAttempts('192.168.1.2')
  })

  describe('trackFailedLogin', () => {
    test('should track failed login attempts and return correct remaining attempts', async () => {
      const email = 'test@example.com'
      const reason = 'Invalid password'

      // First attempt
      const result1 = await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      expect(result1.blocked).toBe(false)
      expect(result1.remainingAttempts).toBe(4) // MAX_FAILED_ATTEMPTS - 1

      // Second attempt
      const result2 = await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      expect(result2.blocked).toBe(false)
      expect(result2.remainingAttempts).toBe(3)

      // Verify audit logging was called
      expect(mockAuditLogger.logFailedLogin).toHaveBeenCalledTimes(2)
    })

    test('should block IP after maximum failed attempts', async () => {
      const email = 'test@example.com'
      const reason = 'Invalid password'

      // Trigger 5 failed attempts to reach threshold
      for (let i = 0; i < 5; i++) {
        await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      }

      // Fifth attempt should trigger block
      const result = await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      expect(result.blocked).toBe(true)
      expect(result.remainingAttempts).toBe(0)
      expect(result.lockoutTime).toBeDefined()
    })

    test('should track different IPs separately', async () => {
      const email = 'test@example.com'
      const reason = 'Invalid password'

      // Mock different IPs
      const mockRequest1 = {
        headers: new Headers({ 'x-forwarded-for': '192.168.1.1' })
      } as NextRequest

      const mockRequest2 = {
        headers: new Headers({ 'x-forwarded-for': '192.168.1.2' })
      } as NextRequest

      // Track attempts from first IP
      for (let i = 0; i < 5; i++) {
        await securityMonitor.trackFailedLogin(email, reason, mockRequest1)
      }

      // First IP should be blocked
      const blocked1 = securityMonitor.isIPBlocked('192.168.1.1')
      expect(blocked1.blocked).toBe(true)

      // Second IP should not be blocked
      const blocked2 = securityMonitor.isIPBlocked('192.168.1.2')
      expect(blocked2.blocked).toBe(false)

      // First attempt from second IP should be allowed
      const result = await securityMonitor.trackFailedLogin(email, reason, mockRequest2)
      expect(result.blocked).toBe(false)
      expect(result.remainingAttempts).toBe(4)
    })
  })

  describe('isIPBlocked', () => {
    test('should return correct block status', async () => {
      const email = 'test@example.com'
      const reason = 'Invalid password'
      const ip = '127.0.0.1'

      // Initially not blocked
      let blockStatus = securityMonitor.isIPBlocked(ip)
      expect(blockStatus.blocked).toBe(false)

      // Trigger block
      for (let i = 0; i < 5; i++) {
        await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      }

      // Should be blocked now
      blockStatus = securityMonitor.isIPBlocked(ip)
      expect(blockStatus.blocked).toBe(true)
      expect(blockStatus.lockoutTime).toBeDefined()
    })
  })

  describe('trackSuspiciousActivity', () => {
    test('should track suspicious activity with correct severity', async () => {
      const activityType = 'unusual_access'
      const details = 'Multiple rapid requests'
      const severity = 'high'
      const userId = 'user-123'

      await securityMonitor.trackSuspiciousActivity(
        activityType,
        details,
        severity,
        mockRequest,
        userId
      )

      expect(mockAuditLogger.logSuspiciousActivity).toHaveBeenCalledWith(
        details,
        severity,
        mockRequest,
        {
          activityType,
          userId
        }
      )
    })
  })

  describe('getSecurityStats', () => {
    test('should return correct security statistics structure', async () => {
      const stats = await securityMonitor.getSecurityStats()

      expect(stats).toEqual({
        failedLogins: expect.any(Number),
        blockedIPs: expect.any(Number),
        suspiciousActivities: expect.any(Number),
        criticalAlerts: expect.any(Number)
      })

      expect(stats.failedLogins).toBeGreaterThanOrEqual(0)
      expect(stats.blockedIPs).toBeGreaterThanOrEqual(0)
      expect(stats.suspiciousActivities).toBeGreaterThanOrEqual(0)
      expect(stats.criticalAlerts).toBeGreaterThanOrEqual(0)
    })
  })

  describe('resetFailedAttempts', () => {
    test('should reset failed attempts for an IP', async () => {
      const email = 'test@example.com'
      const reason = 'Invalid password'
      const ip = '127.0.0.1'

      // Trigger some failed attempts
      for (let i = 0; i < 3; i++) {
        await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      }

      // Reset attempts
      securityMonitor.resetFailedAttempts(ip)

      // Next attempt should start fresh
      const result = await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      expect(result.remainingAttempts).toBe(4) // Should be back to max - 1
    })
  })

  describe('getBlockedIPs', () => {
    test('should return list of blocked IPs', async () => {
      const email = 'test@example.com'
      const reason = 'Invalid password'

      // Initially no blocked IPs
      let blockedIPs = securityMonitor.getBlockedIPs()
      expect(blockedIPs).toHaveLength(0)

      // Trigger block
      for (let i = 0; i < 5; i++) {
        await securityMonitor.trackFailedLogin(email, reason, mockRequest)
      }

      // Should have one blocked IP
      blockedIPs = securityMonitor.getBlockedIPs()
      expect(blockedIPs).toHaveLength(1)
      expect(blockedIPs[0]).toEqual({
        ip: '127.0.0.1',
        lockoutTime: expect.any(Date),
        attempts: expect.any(Number)
      })
      expect(blockedIPs[0].attempts).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = SecurityMonitor.getInstance()
      const instance2 = SecurityMonitor.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })
})