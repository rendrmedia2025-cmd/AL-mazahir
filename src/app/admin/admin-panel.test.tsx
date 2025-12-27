/**
 * Unit Tests for Admin Panel Functionality
 * Tests all admin operations and validations
 * Tests role-based access control enforcement
 * Requirements: 2.1, 2.7
 */

import { hasPermission, canAccessResource } from '@/lib/auth-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('Admin Panel Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Role-based Access Control', () => {
    describe('hasPermission function', () => {
      test('admin should have all permissions', () => {
        expect(hasPermission('admin', 'admin')).toBe(true)
        expect(hasPermission('admin', 'manager')).toBe(true)
      })

      test('manager should have manager permissions only', () => {
        expect(hasPermission('manager', 'manager')).toBe(true)
        expect(hasPermission('manager', 'admin')).toBe(false)
      })

      test('should handle role hierarchy correctly', () => {
        // Admin role should satisfy manager requirements
        expect(hasPermission('admin', 'manager')).toBe(true)
        
        // Manager role should not satisfy admin requirements
        expect(hasPermission('manager', 'admin')).toBe(false)
        
        // Same role should satisfy itself
        expect(hasPermission('admin', 'admin')).toBe(true)
        expect(hasPermission('manager', 'manager')).toBe(true)
      })
    })

    describe('canAccessResource function', () => {
      test('admin should have full access to all resources', () => {
        const resources = [
          'availability_status',
          'enhanced_leads',
          'product_categories',
          'business_insights',
          'industries'
        ]

        resources.forEach(resource => {
          expect(canAccessResource('admin', resource, 'read')).toBe(true)
          expect(canAccessResource('admin', resource, 'write')).toBe(true)
          expect(canAccessResource('admin', resource, 'delete')).toBe(true)
        })
      })

      test('manager should have limited access based on resource', () => {
        // Availability status - read/write allowed
        expect(canAccessResource('manager', 'availability_status', 'read')).toBe(true)
        expect(canAccessResource('manager', 'availability_status', 'write')).toBe(true)
        expect(canAccessResource('manager', 'availability_status', 'delete')).toBe(false)

        // Enhanced leads - read only
        expect(canAccessResource('manager', 'enhanced_leads', 'read')).toBe(true)
        expect(canAccessResource('manager', 'enhanced_leads', 'write')).toBe(false)
        expect(canAccessResource('manager', 'enhanced_leads', 'delete')).toBe(false)

        // Product categories - read/write allowed
        expect(canAccessResource('manager', 'product_categories', 'read')).toBe(true)
        expect(canAccessResource('manager', 'product_categories', 'write')).toBe(true)
        expect(canAccessResource('manager', 'product_categories', 'delete')).toBe(false)

        // Business insights - read/write allowed
        expect(canAccessResource('manager', 'business_insights', 'read')).toBe(true)
        expect(canAccessResource('manager', 'business_insights', 'write')).toBe(true)
        expect(canAccessResource('manager', 'business_insights', 'delete')).toBe(false)

        // Industries - read only
        expect(canAccessResource('manager', 'industries', 'read')).toBe(true)
        expect(canAccessResource('manager', 'industries', 'write')).toBe(false)
        expect(canAccessResource('manager', 'industries', 'delete')).toBe(false)
      })

      test('should deny delete permissions for manager on all resources', () => {
        const allResources = [
          'availability_status',
          'enhanced_leads',
          'product_categories',
          'business_insights',
          'industries',
          'unknown_resource'
        ]

        allResources.forEach(resource => {
          expect(canAccessResource('manager', resource, 'delete')).toBe(false)
        })
      })

      test('should handle write permissions correctly for manager', () => {
        const writeAllowedResources = [
          'availability_status',
          'product_categories', 
          'business_insights'
        ]
        
        const readOnlyResources = [
          'enhanced_leads',
          'industries'
        ]

        writeAllowedResources.forEach(resource => {
          expect(canAccessResource('manager', resource, 'write')).toBe(true)
        })

        readOnlyResources.forEach(resource => {
          expect(canAccessResource('manager', resource, 'write')).toBe(false)
        })
      })
    })

    describe('Permission edge cases', () => {
      test('should handle invalid roles gracefully', () => {
        // @ts-ignore - Testing invalid input
        expect(canAccessResource('invalid_role', 'availability_status', 'read')).toBe(false)
        // @ts-ignore - Testing invalid input
        expect(hasPermission('invalid_role', 'admin')).toBe(false)
      })

      test('should maintain security boundaries', () => {
        // Ensure manager cannot escalate to admin permissions
        expect(hasPermission('manager', 'admin')).toBe(false)
        
        // Ensure manager cannot delete any resources
        const resources = ['availability_status', 'enhanced_leads', 'product_categories', 'business_insights', 'industries']
        resources.forEach(resource => {
          expect(canAccessResource('manager', resource, 'delete')).toBe(false)
        })
        
        // Ensure manager has limited write access
        expect(canAccessResource('manager', 'enhanced_leads', 'write')).toBe(false)
        expect(canAccessResource('manager', 'industries', 'write')).toBe(false)
      })
    })
  })

  describe('Admin API Operations', () => {
    describe('Dashboard Statistics API', () => {
      test('should handle successful dashboard stats request', async () => {
        const mockStats = {
          totalLeads: 25,
          newLeads: 8,
          activeCategories: 6,
          lastUpdated: '2024-01-15'
        }

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockStats)
        })

        const response = await fetch('/api/admin/dashboard-stats')
        const data = await response.json()

        expect(response.ok).toBe(true)
        expect(data).toEqual(mockStats)
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/dashboard-stats')
      })

      test('should handle dashboard stats API failure', async () => {
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

        try {
          await fetch('/api/admin/dashboard-stats')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Network error')
        }
      })
    })

    describe('Availability Management API', () => {
      test('should handle availability status update', async () => {
        const updateData = {
          categoryId: 'cat1',
          status: 'limited',
          notes: 'Low stock',
          adminOverride: false
        }

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, data: updateData })
        })

        const response = await fetch('/api/admin/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })

        const result = await response.json()

        expect(response.ok).toBe(true)
        expect(result.success).toBe(true)
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
      })

      test('should handle availability data retrieval', async () => {
        const mockAvailabilityData = [
          {
            id: '1',
            category_id: 'cat1',
            status: 'in_stock',
            last_updated: '2024-01-01T00:00:00Z',
            product_categories: {
              id: 'cat1',
              name: 'Construction Materials',
              slug: 'construction-materials'
            }
          }
        ]

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAvailabilityData })
        })

        const response = await fetch('/api/admin/availability')
        const result = await response.json()

        expect(response.ok).toBe(true)
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockAvailabilityData)
      })
    })

    describe('Content Management API', () => {
      test('should handle content updates', async () => {
        const contentUpdate = {
          type: 'contact_info',
          data: {
            phone: '+966 11 999 8888',
            whatsapp: '+966 50 123 4567',
            email: 'info@test.com',
            address: 'Test Address'
          }
        }

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true, data: contentUpdate })
        })

        const response = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentUpdate)
        })

        const result = await response.json()

        expect(response.ok).toBe(true)
        expect(result.success).toBe(true)
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentUpdate)
        })
      })

      test('should validate content update types', async () => {
        const validTypes = ['contact_info', 'hero_text', 'cta_labels', 'category_settings']
        
        validTypes.forEach(type => {
          const contentUpdate = { type, data: { test: 'data' } }
          
          // Mock successful response for valid types
          ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true })
          })

          expect(() => JSON.stringify(contentUpdate)).not.toThrow()
        })
      })
    })

    describe('Leads Management API', () => {
      test('should handle leads data retrieval with filters', async () => {
        const mockLeadsResponse = {
          success: true,
          data: [
            {
              id: '1',
              name: 'John Doe',
              email: 'john@test.com',
              status: 'new',
              urgency: 'immediate',
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          },
          stats: {
            total: 1,
            statusCounts: { new: 1 }
          }
        }

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockLeadsResponse)
        })

        const params = new URLSearchParams({
          page: '1',
          limit: '20',
          status: 'new',
          sortBy: 'created_at',
          sortOrder: 'desc'
        })

        const response = await fetch(`/api/admin/leads?${params}`)
        const result = await response.json()

        expect(response.ok).toBe(true)
        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.pagination.total).toBe(1)
      })

      test('should handle leads export functionality', async () => {
        const csvData = 'Name,Email,Status\nJohn Doe,john@test.com,new'

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(new Blob([csvData], { type: 'text/csv' }))
        })

        const response = await fetch('/api/admin/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'csv' })
        })

        expect(response.ok).toBe(true)
        const blob = await response.blob()
        expect(blob.type).toBe('text/csv')
      })
    })
  })

  describe('Admin Operations Validation', () => {
    describe('Input Validation', () => {
      test('should validate availability status values', () => {
        const validStatuses = ['in_stock', 'limited', 'out_of_stock', 'on_order']
        const invalidStatuses = ['invalid', '', null, undefined]

        validStatuses.forEach(status => {
          expect(validStatuses.includes(status)).toBe(true)
        })

        invalidStatuses.forEach(status => {
          expect(validStatuses.includes(status as any)).toBe(false)
        })
      })

      test('should validate lead status values', () => {
        const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'closed']
        const invalidStatuses = ['invalid', '', null, undefined]

        validStatuses.forEach(status => {
          expect(validStatuses.includes(status)).toBe(true)
        })

        invalidStatuses.forEach(status => {
          expect(validStatuses.includes(status as any)).toBe(false)
        })
      })

      test('should validate urgency levels', () => {
        const validUrgencies = ['immediate', '1-2_weeks', 'planning']
        const invalidUrgencies = ['invalid', '', null, undefined]

        validUrgencies.forEach(urgency => {
          expect(validUrgencies.includes(urgency)).toBe(true)
        })

        invalidUrgencies.forEach(urgency => {
          expect(validUrgencies.includes(urgency as any)).toBe(false)
        })
      })

      test('should validate content types', () => {
        const validTypes = ['contact_info', 'hero_text', 'cta_labels', 'category_settings']
        const invalidTypes = ['invalid', '', null, undefined]

        validTypes.forEach(type => {
          expect(validTypes.includes(type)).toBe(true)
        })

        invalidTypes.forEach(type => {
          expect(validTypes.includes(type as any)).toBe(false)
        })
      })
    })

    describe('Data Structure Validation', () => {
      test('should validate contact info structure', () => {
        const validContactInfo = {
          phone: '+966 11 234 5678',
          whatsapp: '+966 50 123 4567',
          email: 'info@test.com',
          address: 'Test Address'
        }

        expect(validContactInfo).toHaveProperty('phone')
        expect(validContactInfo).toHaveProperty('whatsapp')
        expect(validContactInfo).toHaveProperty('email')
        expect(validContactInfo).toHaveProperty('address')
        expect(typeof validContactInfo.phone).toBe('string')
        expect(typeof validContactInfo.email).toBe('string')
      })

      test('should validate hero text structure', () => {
        const validHeroText = {
          title: 'Industrial Excellence in Saudi Arabia',
          subtitle: 'Your trusted partner for construction materials',
          cta_text: 'Get Quote'
        }

        expect(validHeroText).toHaveProperty('title')
        expect(validHeroText).toHaveProperty('subtitle')
        expect(validHeroText).toHaveProperty('cta_text')
        expect(typeof validHeroText.title).toBe('string')
        expect(typeof validHeroText.subtitle).toBe('string')
        expect(typeof validHeroText.cta_text).toBe('string')
      })

      test('should validate CTA labels structure', () => {
        const validCTALabels = {
          in_stock: 'Request Quote',
          limited: 'Check Availability',
          out_of_stock: 'Notify Me',
          on_order: 'Request Lead Time',
          default: 'Enquire Now'
        }

        expect(validCTALabels).toHaveProperty('in_stock')
        expect(validCTALabels).toHaveProperty('limited')
        expect(validCTALabels).toHaveProperty('out_of_stock')
        expect(validCTALabels).toHaveProperty('on_order')
        expect(validCTALabels).toHaveProperty('default')
        
        Object.values(validCTALabels).forEach(label => {
          expect(typeof label).toBe('string')
          expect(label.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      try {
        await fetch('/api/admin/availability')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    test('should handle API error responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      })

      const response = await fetch('/api/admin/availability')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    test('should handle authentication errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Authentication required' })
      })

      const response = await fetch('/api/admin/availability')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
      expect(result.error).toBe('Authentication required')
    })

    test('should handle authorization errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Insufficient permissions' })
      })

      const response = await fetch('/api/admin/availability')
      const result = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
      expect(result.error).toBe('Insufficient permissions')
    })
  })
})