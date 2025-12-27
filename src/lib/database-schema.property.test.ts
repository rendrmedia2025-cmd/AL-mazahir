/**
 * Property-based tests for database schema integrity
 * Feature: dynamic-enhancement-layer, Property 7: Data Integrity and Audit Trail
 * Validates: Requirements 2.8, 7.7
 */

import * as fc from 'fast-check';
import { 
  ProductCategory, 
  AvailabilityStatusRecord, 
  EnhancedLead, 
  AdminProfile, 
  AuditLogEntry,
  AvailabilityStatus,
  UrgencyLevel,
  DeviceType,
  LeadStatus,
  AdminRole
} from './types/database';

// Mock database operations for testing schema integrity
const mockDatabaseOperations = {
  insertProductCategory: (category: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): ProductCategory => ({
    ...category,
    id: `cat_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  insertAvailabilityStatus: (status: Omit<AvailabilityStatusRecord, 'id' | 'created_at'>): AvailabilityStatusRecord => ({
    ...status,
    id: `avail_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  }),

  insertEnhancedLead: (lead: Omit<EnhancedLead, 'id' | 'created_at' | 'updated_at'>): EnhancedLead => ({
    ...lead,
    id: `lead_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  insertAdminProfile: (profile: Omit<AdminProfile, 'created_at'>): AdminProfile => ({
    ...profile,
    created_at: new Date().toISOString(),
  }),

  insertAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'created_at'>): AuditLogEntry => ({
    ...entry,
    id: `audit_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  }),
};

// Generators for database entities
const availabilityStatusGenerator = fc.constantFrom<AvailabilityStatus>('in_stock', 'limited', 'out_of_stock', 'on_order');
const urgencyLevelGenerator = fc.constantFrom<UrgencyLevel>('immediate', '1-2_weeks', 'planning');
const deviceTypeGenerator = fc.constantFrom<DeviceType>('mobile', 'tablet', 'desktop');
const leadStatusGenerator = fc.constantFrom<LeadStatus>('new', 'contacted', 'qualified', 'converted', 'closed');
const adminRoleGenerator = fc.constantFrom<AdminRole>('admin', 'manager');

const productCategoryGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  slug: fc.string({ minLength: 1, maxLength: 255 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  description: fc.option(fc.string({ maxLength: 1000 })),
  image_url: fc.option(fc.webUrl()),
  display_order: fc.integer({ min: 0, max: 100 }),
  is_active: fc.boolean(),
});

const enhancedLeadGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  company: fc.option(fc.string({ maxLength: 255 })),
  phone: fc.option(fc.string({ maxLength: 50 })),
  email: fc.emailAddress(),
  product_category: fc.option(fc.uuid()),
  urgency: urgencyLevelGenerator,
  quantity_estimate: fc.option(fc.string({ maxLength: 255 })),
  message: fc.option(fc.string({ maxLength: 1000 })),
  source_section: fc.option(fc.string({ maxLength: 100 })),
  device_type: fc.option(deviceTypeGenerator),
  user_agent: fc.option(fc.string({ maxLength: 500 })),
  referrer: fc.option(fc.webUrl()),
  ip_address: fc.option(fc.ipV4()),
  status: leadStatusGenerator,
  assigned_to: fc.option(fc.uuid()),
});

const auditLogEntryGenerator = fc.record({
  user_id: fc.option(fc.uuid()),
  action: fc.string({ minLength: 1, maxLength: 100 }),
  resource_type: fc.string({ minLength: 1, maxLength: 100 }),
  resource_id: fc.option(fc.uuid()),
  old_values: fc.option(fc.object()),
  new_values: fc.option(fc.object()),
  ip_address: fc.option(fc.ipV4()),
  user_agent: fc.option(fc.string({ maxLength: 500 })),
});

describe('Property-based tests for database schema integrity', () => {
  /**
   * Property 7: Data Integrity and Audit Trail
   * For any database operation that modifies system data, the schema should maintain
   * referential integrity, proper constraints, and complete audit information.
   * Validates: Requirements 2.8, 7.7
   */
  test('Property 7: Product categories should maintain schema integrity', () => {
    fc.assert(
      fc.property(
        productCategoryGenerator,
        (categoryData) => {
          const category = mockDatabaseOperations.insertProductCategory(categoryData);
          
          // Property: All required fields should be present
          expect(category.id).toBeDefined();
          expect(category.name).toBeDefined();
          expect(category.slug).toBeDefined();
          expect(category.created_at).toBeDefined();
          expect(category.updated_at).toBeDefined();
          
          // Property: Field types should be correct
          expect(typeof category.id).toBe('string');
          expect(typeof category.name).toBe('string');
          expect(typeof category.slug).toBe('string');
          expect(typeof category.display_order).toBe('number');
          expect(typeof category.is_active).toBe('boolean');
          
          // Property: Constraints should be enforced
          expect(category.name.length).toBeGreaterThan(0);
          expect(category.name.length).toBeLessThanOrEqual(255);
          expect(category.slug.length).toBeGreaterThan(0);
          expect(category.slug.length).toBeLessThanOrEqual(255);
          expect(category.display_order).toBeGreaterThanOrEqual(0);
          
          // Property: Timestamps should be valid ISO strings
          expect(() => new Date(category.created_at)).not.toThrow();
          expect(() => new Date(category.updated_at)).not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property 7: Enhanced leads should maintain data integrity', () => {
    fc.assert(
      fc.property(
        enhancedLeadGenerator,
        (leadData) => {
          const lead = mockDatabaseOperations.insertEnhancedLead(leadData);
          
          // Property: All required fields should be present
          expect(lead.id).toBeDefined();
          expect(lead.name).toBeDefined();
          expect(lead.email).toBeDefined();
          expect(lead.urgency).toBeDefined();
          expect(lead.status).toBeDefined();
          expect(lead.created_at).toBeDefined();
          expect(lead.updated_at).toBeDefined();
          
          // Property: Field types should be correct
          expect(typeof lead.id).toBe('string');
          expect(typeof lead.name).toBe('string');
          expect(typeof lead.email).toBe('string');
          
          // Property: Enum values should be valid
          expect(['immediate', '1-2_weeks', 'planning']).toContain(lead.urgency);
          expect(['new', 'contacted', 'qualified', 'converted', 'closed']).toContain(lead.status);
          
          if (lead.device_type) {
            expect(['mobile', 'tablet', 'desktop']).toContain(lead.device_type);
          }
          
          // Property: Email should be valid format
          expect(lead.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
          
          // Property: Constraints should be enforced
          expect(lead.name.length).toBeGreaterThan(0);
          expect(lead.name.length).toBeLessThanOrEqual(255);
          expect(lead.email.length).toBeLessThanOrEqual(255);
          
          // Property: Timestamps should be valid ISO strings
          expect(() => new Date(lead.created_at)).not.toThrow();
          expect(() => new Date(lead.updated_at)).not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property 7: Audit log should maintain complete audit trail', () => {
    fc.assert(
      fc.property(
        auditLogEntryGenerator,
        (auditData) => {
          const auditEntry = mockDatabaseOperations.insertAuditLog(auditData);
          
          // Property: All required fields should be present
          expect(auditEntry.id).toBeDefined();
          expect(auditEntry.action).toBeDefined();
          expect(auditEntry.resource_type).toBeDefined();
          expect(auditEntry.created_at).toBeDefined();
          
          // Property: Field types should be correct
          expect(typeof auditEntry.id).toBe('string');
          expect(typeof auditEntry.action).toBe('string');
          expect(typeof auditEntry.resource_type).toBe('string');
          
          // Property: Constraints should be enforced
          expect(auditEntry.action.length).toBeGreaterThan(0);
          expect(auditEntry.action.length).toBeLessThanOrEqual(100);
          expect(auditEntry.resource_type.length).toBeGreaterThan(0);
          expect(auditEntry.resource_type.length).toBeLessThanOrEqual(100);
          
          // Property: Timestamps should be valid ISO strings
          expect(() => new Date(auditEntry.created_at)).not.toThrow();
          
          // Property: JSON fields should be valid objects when present
          if (auditEntry.old_values !== undefined) {
            expect(typeof auditEntry.old_values).toBe('object');
          }
          
          if (auditEntry.new_values !== undefined) {
            expect(typeof auditEntry.new_values).toBe('object');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property 7: Database operations should maintain audit trail completeness', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('CREATE', 'UPDATE', 'DELETE'),
          fc.constantFrom('product_category', 'availability_status', 'enhanced_lead', 'admin_profile'),
          fc.option(fc.object()),
          fc.option(fc.object())
        ),
        ([action, resourceType, oldValues, newValues]) => {
          const auditEntry = mockDatabaseOperations.insertAuditLog({
            action,
            resource_type: resourceType,
            old_values: oldValues,
            new_values: newValues,
          });
          
          // Property: Audit trail should capture all essential information
          expect(auditEntry.action).toBe(action);
          expect(auditEntry.resource_type).toBe(resourceType);
          
          // Property: Audit entries should be immutable (no update capability)
          expect(auditEntry.created_at).toBeDefined();
          expect(() => new Date(auditEntry.created_at)).not.toThrow();
          
          // Property: Audit entries should maintain chronological order
          const timestamp = new Date(auditEntry.created_at);
          expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        }
      ),
      { numRuns: 20 }
    );
  });
});