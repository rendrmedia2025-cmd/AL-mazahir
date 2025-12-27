/**
 * Form validation schemas and functions for Al Mazahir Trading Est. corporate website
 * Provides validation rules and functions for contact inquiry forms
 */

import { ContactInquiry, EnhancedInquiry, ValidationRules, ValidationError, ValidationResult } from './types';

// Validation rules for contact inquiry form
export const contactInquiryValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  company: {
    required: true,
    minLength: 2,
    maxLength: 200,
  },
  phone: {
    required: true,
    phone: true,
    minLength: 8,
    maxLength: 20,
  },
  email: {
    required: true,
    email: true,
    maxLength: 254,
  },
  productRequirement: {
    required: true,
    minLength: 5,
    maxLength: 500,
  },
  message: {
    required: false,
    maxLength: 1000,
  },
};

// Validation rules for enhanced inquiry form
export const enhancedInquiryValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  company: {
    required: false,
    minLength: 2,
    maxLength: 200,
  },
  phone: {
    required: true,
    phone: true,
    minLength: 8,
    maxLength: 20,
  },
  email: {
    required: true,
    email: true,
    maxLength: 254,
  },
  productCategory: {
    required: false,
    maxLength: 255,
  },
  urgency: {
    required: true,
  },
  quantityEstimate: {
    required: false,
    maxLength: 255,
  },
  message: {
    required: true,
    minLength: 5,
    maxLength: 1000,
  },
  sourceSection: {
    required: true,
    maxLength: 100,
  },
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports international formats)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

/**
 * Validates a single field value against its validation rule
 */
export function validateField(
  fieldName: keyof ContactInquiry,
  value: string,
  rule: ValidationRules[keyof ContactInquiry]
): ValidationError | null {
  if (!rule) return null;

  const trimmedValue = value.trim();

  // Required field validation
  if (rule.required && !trimmedValue) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }

  // Skip other validations if field is empty and not required
  if (!trimmedValue && !rule.required) {
    return null;
  }

  // Minimum length validation
  if (rule.minLength && trimmedValue.length < rule.minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${rule.minLength} characters`,
    };
  }

  // Maximum length validation
  if (rule.maxLength && trimmedValue.length > rule.maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must not exceed ${rule.maxLength} characters`,
    };
  }

  // Email validation
  if (rule.email && !EMAIL_REGEX.test(trimmedValue)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
    };
  }

  // Phone validation
  if (rule.phone && !PHONE_REGEX.test(trimmedValue.replace(/[\s\-\(\)]/g, ''))) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid phone number`,
    };
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(trimmedValue)) {
    return {
      field: fieldName,
      message: `${fieldName} format is invalid`,
    };
  }

  return null;
}

/**
 * Validates an entire contact inquiry form
 */
export function validateContactInquiry(inquiry: Partial<ContactInquiry>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each field according to its rules
  Object.entries(contactInquiryValidationRules).forEach(([fieldName, rule]) => {
    const field = fieldName as keyof ContactInquiry;
    const value = inquiry[field] || '';
    
    // Skip timestamp and source fields as they're not user input
    if (field === 'timestamp' || field === 'source') return;
    
    const error = validateField(field, String(value), rule);
    if (error) {
      errors.push(error);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an enhanced inquiry form
 */
export function validateEnhancedInquiry(inquiry: Partial<EnhancedInquiry>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each field according to its rules
  Object.entries(enhancedInquiryValidationRules).forEach(([fieldName, rule]) => {
    const field = fieldName as keyof typeof enhancedInquiryValidationRules;
    const value = inquiry[field as keyof EnhancedInquiry] || '';
    
    // Skip metadata fields as they're not user input
    if (['timestamp', 'source', 'deviceType', 'userAgent', 'referrer', 'ipAddress'].includes(field)) return;
    
    // Special validation for urgency field
    if (field === 'urgency') {
      if (rule.required && !value) {
        errors.push({
          field: field as keyof ContactInquiry,
          message: 'Urgency level is required',
        });
      } else if (value && !['immediate', '1-2_weeks', 'planning'].includes(String(value))) {
        errors.push({
          field: field as keyof ContactInquiry,
          message: 'Invalid urgency level',
        });
      }
      return;
    }
    
    const error = validateField(field as keyof ContactInquiry, String(value), rule);
    if (error) {
      errors.push(error);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates phone number format
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_REGEX.test(cleanPhone);
}

/**
 * Sanitizes input by trimming whitespace and removing potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}