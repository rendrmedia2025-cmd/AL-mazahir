/**
 * Unit tests for database schema validation
 * Tests schema validation with various input combinations
 * Tests type safety and interface compliance
 * Requirements: 3.1, 3.4
 */

import {
  ProductCategorySchema,
  ProductCategoryInsertSchema,
  EnhancedLeadSchema,
  EnhancedLeadInsertSchema,
  AdminProfileSchema,
  AuditLogEntrySchema,
  EnhancedInquirySchema,
  LeadSubmissionRequestSchema,
  UpdateAvailabilityRequestSchema,
  AvailabilityStatusSchema,
  UrgencyLevelSchema,
  DeviceTypeSchema,
  LeadStatusSchema,
  AdminRoleSchema,
  validateProductCategory,
  validateEnhancedLead,
  validateEnhancedInquiry,
  safeValidateProductCategory,
  safeValidateEnhancedLead,
  safeValidateEnhancedInquiry,
} from './database';

describe('Database Schema Validation', () => {
  describe('Enum Schemas', () => {
    test('AvailabilityStatusSchema should validate correct values', () => {
      expect(AvailabilityStatusSchema.parse('in_stock')).toBe('in_stock');
      expect(AvailabilityStatusSchema.parse('limited')).toBe('limited');
      expect(AvailabilityStatusSchema.parse('out_of_stock')).toBe('out_of_stock');
      expect(AvailabilityStatusSchema.parse('on_order')).toBe('on_order');
    });

    test('AvailabilityStatusSchema should reject invalid values', () => {
      expect(() => AvailabilityStatusSchema.parse('invalid')).toThrow();
      expect(() => AvailabilityStatusSchema.parse('')).toThrow();
      expect(() => AvailabilityStatusSchema.parse(null)).toThrow();
    });

    test('UrgencyLevelSchema should validate correct values', () => {
      expect(UrgencyLevelSchema.parse('immediate')).toBe('immediate');
      expect(UrgencyLevelSchema.parse('1-2_weeks')).toBe('1-2_weeks');
      expect(UrgencyLevelSchema.parse('planning')).toBe('planning');
    });

    test('DeviceTypeSchema should validate correct values', () => {
      expect(DeviceTypeSchema.parse('mobile')).toBe('mobile');
      expect(DeviceTypeSchema.parse('tablet')).toBe('tablet');
      expect(DeviceTypeSchema.parse('desktop')).toBe('desktop');
    });

    test('LeadStatusSchema should validate correct values', () => {
      expect(LeadStatusSchema.parse('new')).toBe('new');
      expect(LeadStatusSchema.parse('contacted')).toBe('contacted');
      expect(LeadStatusSchema.parse('qualified')).toBe('qualified');
      expect(LeadStatusSchema.parse('converted')).toBe('converted');
      expect(LeadStatusSchema.parse('closed')).toBe('closed');
    });

    test('AdminRoleSchema should validate correct values', () => {
      expect(AdminRoleSchema.parse('admin')).toBe('admin');
      expect(AdminRoleSchema.parse('manager')).toBe('manager');
    });
  });

  describe('ProductCategory Schema', () => {
    const validProductCategory = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Construction Materials',
      slug: 'construction-materials',
      description: 'High-quality construction materials for all projects',
      image_url: 'https://example.com/image.jpg',
      display_order: 1,
      is_active: true,
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    test('should validate a complete valid product category', () => {
      expect(() => validateProductCategory(validProductCategory)).not.toThrow();
      const result = ProductCategorySchema.parse(validProductCategory);
      expect(result).toEqual(validProductCategory);
    });

    test('should validate product category with minimal required fields', () => {
      const minimal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Category',
        slug: 'test-category',
        display_order: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      expect(() => ProductCategorySchema.parse(minimal)).not.toThrow();
    });

    test('should reject product category with invalid UUID', () => {
      const invalid = { ...validProductCategory, id: 'invalid-uuid' };
      expect(() => ProductCategorySchema.parse(invalid)).toThrow();
    });

    test('should reject product category with empty name', () => {
      const invalid = { ...validProductCategory, name: '' };
      expect(() => ProductCategorySchema.parse(invalid)).toThrow();
    });

    test('should reject product category with name too long', () => {
      const invalid = { ...validProductCategory, name: 'a'.repeat(256) };
      expect(() => ProductCategorySchema.parse(invalid)).toThrow();
    });

    test('should reject product category with invalid URL', () => {
      const invalid = { ...validProductCategory, image_url: 'not-a-url' };
      expect(() => ProductCategorySchema.parse(invalid)).toThrow();
    });

    test('should reject product category with negative display_order', () => {
      const invalid = { ...validProductCategory, display_order: -1 };
      expect(() => ProductCategorySchema.parse(invalid)).toThrow();
    });

    test('ProductCategoryInsertSchema should omit auto-generated fields', () => {
      const insertData = {
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category',
        display_order: 5,
        is_active: true,
      };
      expect(() => ProductCategoryInsertSchema.parse(insertData)).not.toThrow();
      
      // Should allow id to be provided (it will be ignored)
      const withId = { ...insertData, id: '123e4567-e89b-12d3-a456-426614174000' };
      const result = ProductCategoryInsertSchema.parse(withId);
      // The result should not include the id field
      expect(result).not.toHaveProperty('id');
    });
  });

  describe('EnhancedLead Schema', () => {
    const validEnhancedLead = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      company: 'Acme Corp',
      phone: '+1234567890',
      email: 'john@example.com',
      product_category: '123e4567-e89b-12d3-a456-426614174001',
      urgency: 'immediate' as const,
      quantity_estimate: '100 units',
      message: 'Need urgent quote for construction project',
      source_section: 'hero',
      device_type: 'desktop' as const,
      user_agent: 'Mozilla/5.0...',
      referrer: 'https://google.com',
      ip_address: '192.168.1.1',
      status: 'new' as const,
      assigned_to: '123e4567-e89b-12d3-a456-426614174002',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    test('should validate a complete valid enhanced lead', () => {
      expect(() => validateEnhancedLead(validEnhancedLead)).not.toThrow();
      const result = EnhancedLeadSchema.parse(validEnhancedLead);
      expect(result).toEqual(validEnhancedLead);
    });

    test('should validate enhanced lead with minimal required fields', () => {
      const minimal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@example.com',
        urgency: 'planning' as const,
        status: 'new' as const,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      expect(() => EnhancedLeadSchema.parse(minimal)).not.toThrow();
    });

    test('should reject enhanced lead with invalid email', () => {
      const invalid = { ...validEnhancedLead, email: 'not-an-email' };
      expect(() => EnhancedLeadSchema.parse(invalid)).toThrow();
    });

    test('should reject enhanced lead with invalid urgency', () => {
      const invalid = { ...validEnhancedLead, urgency: 'invalid' };
      expect(() => EnhancedLeadSchema.parse(invalid)).toThrow();
    });

    test('should reject enhanced lead with invalid device type', () => {
      const invalid = { ...validEnhancedLead, device_type: 'invalid' };
      expect(() => EnhancedLeadSchema.parse(invalid)).toThrow();
    });

    test('should reject enhanced lead with invalid IP address', () => {
      const invalid = { ...validEnhancedLead, ip_address: '999.999.999.999' };
      expect(() => EnhancedLeadSchema.parse(invalid)).toThrow();
    });

    test('should reject enhanced lead with invalid referrer URL', () => {
      const invalid = { ...validEnhancedLead, referrer: 'not-a-url' };
      expect(() => EnhancedLeadSchema.parse(invalid)).toThrow();
    });

    test('EnhancedLeadInsertSchema should omit auto-generated fields', () => {
      const insertData = {
        name: 'New Lead',
        email: 'lead@example.com',
        urgency: 'immediate' as const,
        message: 'Test message',
      };
      expect(() => EnhancedLeadInsertSchema.parse(insertData)).not.toThrow();
      
      // Should allow id to be provided (it will be ignored)
      const withId = { ...insertData, id: '123e4567-e89b-12d3-a456-426614174000' };
      const result = EnhancedLeadInsertSchema.parse(withId);
      // The result should not include the id field
      expect(result).not.toHaveProperty('id');
    });
  });

  describe('AdminProfile Schema', () => {
    const validAdminProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'admin' as const,
      full_name: 'Admin User',
      last_login: '2023-01-01T00:00:00.000Z',
      is_active: true,
      created_at: '2023-01-01T00:00:00.000Z',
    };

    test('should validate a complete valid admin profile', () => {
      expect(() => AdminProfileSchema.parse(validAdminProfile)).not.toThrow();
    });

    test('should validate admin profile with minimal fields', () => {
      const minimal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'manager' as const,
        is_active: true,
        created_at: '2023-01-01T00:00:00.000Z',
      };
      expect(() => AdminProfileSchema.parse(minimal)).not.toThrow();
    });

    test('should reject admin profile with invalid role', () => {
      const invalid = { ...validAdminProfile, role: 'invalid' };
      expect(() => AdminProfileSchema.parse(invalid)).toThrow();
    });

    test('should reject admin profile with invalid UUID', () => {
      const invalid = { ...validAdminProfile, id: 'invalid-uuid' };
      expect(() => AdminProfileSchema.parse(invalid)).toThrow();
    });
  });

  describe('AuditLog Schema', () => {
    const validAuditLog = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      action: 'CREATE',
      resource_type: 'product_category',
      resource_id: '123e4567-e89b-12d3-a456-426614174002',
      old_values: { name: 'Old Name' },
      new_values: { name: 'New Name' },
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      created_at: '2023-01-01T00:00:00.000Z',
    };

    test('should validate a complete valid audit log entry', () => {
      expect(() => AuditLogEntrySchema.parse(validAuditLog)).not.toThrow();
    });

    test('should validate audit log with minimal fields', () => {
      const minimal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'DELETE',
        resource_type: 'enhanced_lead',
        created_at: '2023-01-01T00:00:00.000Z',
      };
      expect(() => AuditLogEntrySchema.parse(minimal)).not.toThrow();
    });

    test('should reject audit log with empty action', () => {
      const invalid = { ...validAuditLog, action: '' };
      expect(() => AuditLogEntrySchema.parse(invalid)).toThrow();
    });

    test('should reject audit log with action too long', () => {
      const invalid = { ...validAuditLog, action: 'a'.repeat(101) };
      expect(() => AuditLogEntrySchema.parse(invalid)).toThrow();
    });

    test('should reject audit log with invalid IP address', () => {
      const invalid = { ...validAuditLog, ip_address: '999.999.999.999' };
      expect(() => AuditLogEntrySchema.parse(invalid)).toThrow();
    });
  });

  describe('EnhancedInquiry Schema', () => {
    const validEnhancedInquiry = {
      name: 'John Smith',
      company: 'Smith Construction',
      phone: '+1234567890',
      email: 'john@smithconstruction.com',
      product_category: '123e4567-e89b-12d3-a456-426614174000',
      urgency: 'immediate' as const,
      quantity_estimate: '50 units',
      message: 'Need quote for upcoming project',
      source_section: 'product-catalog',
      device_type: 'mobile' as const,
      user_agent: 'Mozilla/5.0 (iPhone...)',
      referrer: 'https://google.com/search',
      ip_address: '10.0.0.1',
    };

    test('should validate a complete valid enhanced inquiry', () => {
      expect(() => validateEnhancedInquiry(validEnhancedInquiry)).not.toThrow();
    });

    test('should validate enhanced inquiry with minimal fields', () => {
      const minimal = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        urgency: 'planning' as const,
      };
      expect(() => EnhancedInquirySchema.parse(minimal)).not.toThrow();
    });

    test('should reject enhanced inquiry with invalid email', () => {
      const invalid = { ...validEnhancedInquiry, email: 'invalid-email' };
      expect(() => EnhancedInquirySchema.parse(invalid)).toThrow();
    });

    test('should reject enhanced inquiry with empty name', () => {
      const invalid = { ...validEnhancedInquiry, name: '' };
      expect(() => EnhancedInquirySchema.parse(invalid)).toThrow();
    });
  });

  describe('API Request/Response Schemas', () => {
    test('LeadSubmissionRequestSchema should validate correctly', () => {
      const validRequest = {
        inquiry: {
          name: 'Test User',
          email: 'test@example.com',
          urgency: 'immediate' as const,
        },
        recaptchaToken: 'valid-token',
      };
      expect(() => LeadSubmissionRequestSchema.parse(validRequest)).not.toThrow();
    });

    test('UpdateAvailabilityRequestSchema should validate correctly', () => {
      const validRequest = {
        status: 'in_stock' as const,
        notes: 'Updated inventory',
        adminOverride: true,
      };
      expect(() => UpdateAvailabilityRequestSchema.parse(validRequest)).not.toThrow();
    });

    test('UpdateAvailabilityRequestSchema should reject invalid status', () => {
      const invalidRequest = {
        status: 'invalid_status',
        notes: 'Test',
      };
      expect(() => UpdateAvailabilityRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('Safe Validation Functions', () => {
    test('safeValidateProductCategory should return success for valid data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Category',
        slug: 'test-category',
        display_order: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      const result = safeValidateProductCategory(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test('safeValidateProductCategory should return error for invalid data', () => {
      const invalidData = { name: '', slug: 'test' };
      const result = safeValidateProductCategory(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    test('safeValidateEnhancedLead should return success for valid data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Lead',
        email: 'test@example.com',
        urgency: 'immediate' as const,
        status: 'new' as const,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      const result = safeValidateEnhancedLead(validData);
      expect(result.success).toBe(true);
    });

    test('safeValidateEnhancedInquiry should return error for invalid email', () => {
      const invalidData = {
        name: 'Test',
        email: 'invalid-email',
        urgency: 'immediate',
      };
      const result = safeValidateEnhancedInquiry(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    test('schemas should enforce type safety at compile time', () => {
      // This test ensures TypeScript compilation catches type errors
      const validCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        slug: 'test',
        display_order: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      
      // TypeScript should enforce that this matches the schema
      const parsed = ProductCategorySchema.parse(validCategory);
      expect(parsed.name).toBe('Test');
      expect(parsed.is_active).toBe(true);
      expect(typeof parsed.display_order).toBe('number');
    });

    test('insert schemas should omit readonly fields', () => {
      const insertData = {
        name: 'New Category',
        slug: 'new-category',
        display_order: 1,
        is_active: true,
      };
      
      // Should not require id, created_at, updated_at
      expect(() => ProductCategoryInsertSchema.parse(insertData)).not.toThrow();
    });

    test('enum schemas should provide type safety', () => {
      // These should be type-safe at compile time
      const status = AvailabilityStatusSchema.parse('in_stock');
      const urgency = UrgencyLevelSchema.parse('immediate');
      const device = DeviceTypeSchema.parse('mobile');
      
      expect(status).toBe('in_stock');
      expect(urgency).toBe('immediate');
      expect(device).toBe('mobile');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null and undefined values appropriately', () => {
      expect(() => ProductCategorySchema.parse(null)).toThrow();
      expect(() => ProductCategorySchema.parse(undefined)).toThrow();
      expect(() => EnhancedLeadSchema.parse({})).toThrow();
    });

    test('should handle empty objects', () => {
      expect(() => ProductCategorySchema.parse({})).toThrow();
      expect(() => EnhancedLeadSchema.parse({})).toThrow();
    });

    test('should handle arrays when objects expected', () => {
      expect(() => ProductCategorySchema.parse([])).toThrow();
      expect(() => EnhancedLeadSchema.parse(['invalid'])).toThrow();
    });

    test('should handle string values for number fields', () => {
      const invalidCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test',
        slug: 'test',
        display_order: '0', // String instead of number
        is_active: true,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      expect(() => ProductCategorySchema.parse(invalidCategory)).toThrow();
    });

    test('should handle boolean values for string fields', () => {
      const invalidCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: true, // Boolean instead of string
        slug: 'test',
        display_order: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };
      expect(() => ProductCategorySchema.parse(invalidCategory)).toThrow();
    });
  });
});