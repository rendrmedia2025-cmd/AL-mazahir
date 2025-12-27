/**
 * Property-based tests for form validation consistency
 * Feature: corporate-website, Property 3: Form Validation Consistency
 * Validates: Requirements 3.5
 */

import * as fc from 'fast-check';
import { 
  validateContactInquiry, 
  validateField, 
  isValidEmail, 
  isValidPhone,
  contactInquiryValidationRules 
} from './validation';
import { ContactInquiry } from './types';

describe('Property-based tests for form validation', () => {
  /**
   * Property 3: Form Validation Consistency
   * For any combination of form inputs, the validation system should consistently 
   * reject invalid inputs and accept valid inputs according to the defined rules.
   * Validates: Requirements 3.5
   */
  test('Property 3: Form validation should be consistent for all input combinations', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary contact inquiry data
        fc.record({
          name: fc.string(),
          company: fc.string(),
          phone: fc.string(),
          email: fc.string(),
          productRequirement: fc.string(),
          message: fc.string(),
        }),
        (inquiry) => {
          const result = validateContactInquiry(inquiry);
          
          // Property: Validation result should always have consistent structure
          expect(result).toHaveProperty('isValid');
          expect(result).toHaveProperty('errors');
          expect(Array.isArray(result.errors)).toBe(true);
          
          // Property: If validation fails, there should be at least one error
          if (!result.isValid) {
            expect(result.errors.length).toBeGreaterThan(0);
          }
          
          // Property: If validation passes, there should be no errors
          if (result.isValid) {
            expect(result.errors.length).toBe(0);
          }
          
          // Property: Each error should have field and message properties
          result.errors.forEach(error => {
            expect(error).toHaveProperty('field');
            expect(error).toHaveProperty('message');
            expect(typeof error.field).toBe('string');
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Valid email format should always be accepted', () => {
    fc.assert(
      fc.property(
        // Generate valid email formats
        fc.tuple(
          fc.stringMatching(/^[a-zA-Z0-9]+$/),
          fc.stringMatching(/^[a-zA-Z0-9]+$/),
          fc.stringMatching(/^[a-zA-Z]{2,}$/)
        ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
        (validEmail) => {
          expect(isValidEmail(validEmail)).toBe(true);
          
          const fieldError = validateField('email', validEmail, contactInquiryValidationRules.email);
          expect(fieldError).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Invalid email format should always be rejected', () => {
    fc.assert(
      fc.property(
        // Generate invalid email formats
        fc.oneof(
          fc.string().filter(s => !s.includes('@')), // No @ symbol
          fc.string().filter(s => s.includes('@') && !s.includes('.')), // @ but no dot
          fc.constant(''), // Empty string
          fc.constant('@domain.com'), // Missing local part
          fc.constant('user@'), // Missing domain
          fc.constant('user@domain'), // Missing TLD
        ),
        (invalidEmail) => {
          expect(isValidEmail(invalidEmail)).toBe(false);
          
          if (invalidEmail.trim()) { // Only test non-empty strings for field validation
            const fieldError = validateField('email', invalidEmail, contactInquiryValidationRules.email);
            expect(fieldError).not.toBeNull();
            expect(fieldError?.message).toContain('valid email');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Valid phone numbers should always be accepted', () => {
    fc.assert(
      fc.property(
        // Generate valid phone number formats
        fc.oneof(
          fc.stringMatching(/^\+[1-9]\d{7,14}$/), // International format
          fc.stringMatching(/^[1-9]\d{7,14}$/), // National format
        ),
        (validPhone) => {
          expect(isValidPhone(validPhone)).toBe(true);
          
          const fieldError = validateField('phone', validPhone, contactInquiryValidationRules.phone);
          expect(fieldError).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Required field validation should be consistent', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('name', 'company', 'phone', 'email', 'productRequirement'),
        (value, fieldName) => {
          const rule = contactInquiryValidationRules[fieldName as keyof typeof contactInquiryValidationRules];
          const fieldError = validateField(fieldName as keyof ContactInquiry, value, rule);
          
          // Property: If field is required and value is empty/whitespace, should have error
          if (rule?.required && !value.trim()) {
            expect(fieldError).not.toBeNull();
            expect(fieldError?.message).toContain('required');
          }
          
          // Property: If field is not required or has value, error should be null or about format/length
          if (!rule?.required || value.trim()) {
            if (fieldError) {
              expect(fieldError.message).not.toContain('required');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Length validation should be consistent', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom('name', 'company', 'phone', 'email', 'productRequirement', 'message'),
        (value, fieldName) => {
          const rule = contactInquiryValidationRules[fieldName as keyof typeof contactInquiryValidationRules];
          const fieldError = validateField(fieldName as keyof ContactInquiry, value, rule);
          
          // Property: If value exceeds max length, should have error
          if (rule?.maxLength && value.length > rule.maxLength) {
            expect(fieldError).not.toBeNull();
            expect(fieldError?.message).toContain('exceed');
          }
          
          // Property: If value is below min length (and not empty for non-required), should have error
          if (rule?.minLength && value.trim() && value.trim().length < rule.minLength) {
            expect(fieldError).not.toBeNull();
            expect(fieldError?.message).toContain('at least');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Complete valid inquiry should always pass validation', () => {
    fc.assert(
      fc.property(
        // Generate valid contact inquiry
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          company: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^\+[1-9]\d{7,14}$/),
          email: fc.tuple(
            fc.stringMatching(/^[a-zA-Z0-9]+$/),
            fc.stringMatching(/^[a-zA-Z0-9]+$/),
            fc.stringMatching(/^[a-zA-Z]{2,}$/)
          ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
          productRequirement: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
          message: fc.string({ maxLength: 200 }),
        }),
        (validInquiry) => {
          const result = validateContactInquiry(validInquiry);
          
          // Property: Valid inquiry should always pass validation
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});