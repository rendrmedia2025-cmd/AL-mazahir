/**
 * Unit Tests for Audit Logging
 * Tests audit logging completeness and security event detection
 * Requirements: 2.8, 7.7
 */

import { AuditLogger } from './audit-logging'
import { NextRequest } from 'next/server'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => Promise.resolve({ error: null })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }))
}

// Mock auth server
jest.mock('./auth', () => ({
  authServer: {
    getAuthSession: jest.fn(() => Promise.resolve({
      user: { id: 'test-user-id' },
      adminProfile: { role: 'admin' }
    }))
  }
}))

// Mock Supabase server
jest.mock('./supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

// Mock security utilities
jest.mock('./security', () => ({
  getClientIP: jest.fn(() => '127.0.0.1')
}))

describe('AuditLogger', () => {
  let auditLogger: AuditLogger
  let mockRequest: NextRequest

  beforeEach(() => {
    auditLogger = AuditLogger.getInstance()
    mockRequest = {
      headers: new Headers({
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1'
      })
    } as NextRequest

    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('logAdminAction', () => {
    test('should log admin action with all required fields', async () => {
      const action = 'UPDATE'
      const resourceType = 'availability_status'
      const resourceId = 'test-resource-id'
      const oldValues = { status: 'in_stock' }
      const newValues = { status: 'out_of_stock' }
      const metadata = { reason: 'inventory update' }

      await auditLogger.logAdminAction(
        action,
        resourceType,
        resourceId,
        oldValues,
        newValues,
        mockRequest,
        metadata
      )

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_log')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
        metadata
      })
    })

    test('should handle missing request object gracefully', async () => {
      await auditLogger.logAdminAction('CREATE', 'test_resource')

      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        action: 'CREATE',
        resource_type: 'test_resource',
        resource_id: null,
        old_values: null,
        new_values: null,
        ip_address: null,
        user_agent: null,
        metadata: null
      })
    })

    test('should not throw error when database insert fails', async () => {
      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: new Error('Database error') }))
      })

      // Should not throw
      await expect(
        auditLogger.logAdminAction('TEST', 'test_resource')
      ).resolves.not.toThrow()
    })
  })

  describe('logSecurityEvent', () => {
    test('should log security event with correct severity', async () => {
      const securityEvent = {
        eventType: 'failed_login' as const,
        severity: 'high' as const,
        description: 'Multiple failed login attempts',
        ipAddress: '192.168.1.1',
        userAgent: 'malicious-bot',
        metadata: { attempts: 5 }
      }

      await auditLogger.logSecurityEvent(securityEvent, mockRequest)

      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        action: 'SECURITY_EVENT_FAILED_LOGIN',
        resource_type: 'security_event',
        resource_id: null,
        old_values: null,
        new_values: {
          eventType: 'failed_login',
          severity: 'high',
          description: 'Multiple failed login attempts',
          metadata: { attempts: 5 }
        },
        ip_address: '192.168.1.1',
        user_agent: 'malicious-bot'
      })
    })

    test('should log critical events to console', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const criticalEvent = {
        eventType: 'suspicious_activity' as const,
        severity: 'critical' as const,
        description: 'Potential security breach',
        metadata: { threat_level: 'high' }
      }

      await auditLogger.logSecurityEvent(criticalEvent)

      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY ALERT [CRITICAL]: Potential security breach',
        expect.objectContaining({
          eventType: 'suspicious_activity',
          metadata: { threat_level: 'high' }
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = AuditLogger.getInstance()
      const instance2 = AuditLogger.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })
})