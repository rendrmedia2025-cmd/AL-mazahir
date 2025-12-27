/**
 * Core TypeScript interfaces and types for Al Mazahir Trading Est. corporate website
 * Defines data models for products, contact inquiries, company information, and validation schemas
 */

// Re-export enterprise types
export * from './types/enterprise';

// Product-related interfaces
export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  products: Product[];
  slug: string;
}

// Contact and inquiry interfaces
export interface ContactInquiry {
  name: string;
  company: string;
  phone: string;
  email: string;
  productRequirement: string;
  message: string;
  timestamp: Date;
  source: 'form' | 'whatsapp';
}

// Enhanced inquiry interface for smart enquiry system
export interface EnhancedInquiry {
  name: string;
  company?: string;
  phone: string;
  email: string;
  productCategory?: string;
  urgency: 'immediate' | '1-2_weeks' | 'planning';
  quantityEstimate?: string;
  message: string;
  sourceSection: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
  timestamp: Date;
  source: 'form' | 'whatsapp';
}

// Company information interfaces
export interface TrustIndicator {
  icon: string;
  title: string;
  description: string;
}

export interface Industry {
  name: string;
  icon: string;
  description: string;
}

export interface CompanyInfo {
  name: string;
  description: string;
  yearsOfExperience: number;
  location: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  trustIndicators: TrustIndicator[];
  industries: Industry[];
}

// Service interfaces for email and WhatsApp integration
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailService {
  sendInquiry(inquiry: ContactInquiry): Promise<EmailResult>;
  validateEmail(email: string): boolean;
}

export interface WhatsAppService {
  generateWhatsAppUrl(message: string, phoneNumber: string): string;
  formatInquiryMessage(inquiry: ContactInquiry): string;
}

// Form validation types
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
};

export type ValidationRules = {
  [K in keyof ContactInquiry]?: ValidationRule;
};

export interface ValidationError {
  field: keyof ContactInquiry;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}