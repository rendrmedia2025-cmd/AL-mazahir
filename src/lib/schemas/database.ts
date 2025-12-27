/**
 * Zod validation schemas for database entities
 * Provides runtime validation for all database models
 */

import { z } from 'zod';

// Enum schemas
export const AvailabilityStatusSchema = z.enum(['in_stock', 'limited', 'out_of_stock', 'on_order']);
export const UrgencyLevelSchema = z.enum(['immediate', '1-2_weeks', 'planning']);
export const DeviceTypeSchema = z.enum(['mobile', 'tablet', 'desktop']);
export const LeadStatusSchema = z.enum(['new', 'contacted', 'qualified', 'converted', 'closed']);
export const AdminRoleSchema = z.enum(['admin', 'manager']);
export const InsightCategorySchema = z.enum(['company_update', 'product_announcement', 'safety_guideline', 'industry_insight', 'project_showcase']);
export const AnalyticsEventSchema = z.enum(['form_view', 'form_start', 'form_submit', 'whatsapp_click', 'email_click', 'category_view', 'availability_check']);

// UUID validation
const UUIDSchema = z.string().uuid();

// Email validation
const EmailSchema = z.string().email();

// URL validation
const URLSchema = z.string().url();
const OptionalURLSchema = z.string().url().optional();

// IP address validation (using regex since zod doesn't have built-in IP validation)
const IPAddressSchema = z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/).optional();

// Timestamp validation
const TimestampSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid datetime string",
});

// Product Category Schema
export const ProductCategorySchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  image_url: OptionalURLSchema,
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const ProductCategoryInsertSchema = ProductCategorySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const ProductCategoryUpdateSchema = ProductCategoryInsertSchema.partial();

// Availability Status Schema
export const AvailabilityStatusRecordSchema = z.object({
  id: UUIDSchema,
  category_id: UUIDSchema,
  status: AvailabilityStatusSchema,
  last_updated: TimestampSchema,
  updated_by: UUIDSchema.optional(),
  admin_override: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  created_at: TimestampSchema,
});

export const AvailabilityStatusInsertSchema = AvailabilityStatusRecordSchema.omit({
  id: true,
  created_at: true,
});

export const AvailabilityStatusUpdateSchema = AvailabilityStatusInsertSchema.partial().extend({
  category_id: UUIDSchema, // category_id is required for updates
});

// Enhanced Lead Schema
export const EnhancedLeadSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  company: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  email: EmailSchema,
  product_category: UUIDSchema.optional(),
  urgency: UrgencyLevelSchema,
  quantity_estimate: z.string().max(255).optional(),
  message: z.string().max(1000).optional(),
  source_section: z.string().max(100).optional(),
  device_type: DeviceTypeSchema.optional(),
  user_agent: z.string().max(500).optional(),
  referrer: OptionalURLSchema,
  ip_address: IPAddressSchema,
  status: LeadStatusSchema.default('new'),
  assigned_to: UUIDSchema.optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const EnhancedLeadInsertSchema = EnhancedLeadSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const EnhancedLeadUpdateSchema = EnhancedLeadInsertSchema.partial();

// Admin Profile Schema
export const AdminProfileSchema = z.object({
  id: UUIDSchema,
  role: AdminRoleSchema.default('manager'),
  full_name: z.string().max(255).optional(),
  last_login: TimestampSchema.optional(),
  is_active: z.boolean().default(true),
  created_at: TimestampSchema,
});

export const AdminProfileInsertSchema = AdminProfileSchema.omit({
  created_at: true,
});

export const AdminProfileUpdateSchema = AdminProfileInsertSchema.partial().extend({
  id: UUIDSchema, // id is required for updates
});

// Audit Log Schema
export const AuditLogEntrySchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema.optional(),
  action: z.string().min(1).max(100),
  resource_type: z.string().min(1).max(100),
  resource_id: UUIDSchema.optional(),
  old_values: z.record(z.string(), z.any()).optional(),
  new_values: z.record(z.string(), z.any()).optional(),
  ip_address: IPAddressSchema,
  user_agent: z.string().max(500).optional(),
  created_at: TimestampSchema,
});

export const AuditLogInsertSchema = AuditLogEntrySchema.omit({
  id: true,
  created_at: true,
});

// Industry Schema (from enterprise enhancement tables)
export const IndustrySchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  icon_name: z.string().max(100).optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  project_count: z.number().int().min(0).default(0),
  years_experience: z.number().int().min(0).default(0),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const IndustryInsertSchema = IndustrySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const IndustryUpdateSchema = IndustryInsertSchema.partial();

// Business Insights Schema
export const BusinessInsightSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  category: InsightCategorySchema,
  featured_image_url: OptionalURLSchema,
  author_id: UUIDSchema.optional(),
  published_at: TimestampSchema.optional(),
  is_published: z.boolean().default(false),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  view_count: z.number().int().min(0).default(0),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const BusinessInsightInsertSchema = BusinessInsightSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const BusinessInsightUpdateSchema = BusinessInsightInsertSchema.partial();

// API Request/Response Schemas
export const LeadSubmissionRequestSchema = z.object({
  inquiry: EnhancedLeadInsertSchema,
  recaptchaToken: z.string().optional(),
});

export const LeadSubmissionResponseSchema = z.object({
  success: z.boolean(),
  leadId: UUIDSchema.optional(),
  message: z.string(),
  whatsappUrl: OptionalURLSchema,
});

export const UpdateAvailabilityRequestSchema = z.object({
  status: AvailabilityStatusSchema,
  notes: z.string().max(500).optional(),
  adminOverride: z.boolean().optional(),
});

export const UpdateAvailabilityResponseSchema = z.object({
  success: z.boolean(),
  updated: AvailabilityStatusRecordSchema,
  affectedPages: z.array(z.string()),
});

export const AvailabilityResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.object({
    status: AvailabilityStatusSchema,
    lastUpdated: z.string(),
  })),
  cached: z.boolean(),
  cacheExpiry: z.string(),
});

export const LeadsListRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: LeadStatusSchema.optional(),
  category: UUIDSchema.optional(),
  dateFrom: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid datetime string",
  }).optional(),
  dateTo: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid datetime string",
  }).optional(),
});

export const LeadsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EnhancedLeadSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

// Enhanced Inquiry Schema (for smart enquiry system)
export const EnhancedInquirySchema = z.object({
  name: z.string().min(1).max(255),
  company: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  email: EmailSchema,
  product_category: UUIDSchema.optional(),
  urgency: UrgencyLevelSchema,
  quantity_estimate: z.string().max(255).optional(),
  message: z.string().max(1000).optional(),
  source_section: z.string().max(100).optional(),
  device_type: DeviceTypeSchema.optional(),
  user_agent: z.string().max(500).optional(),
  referrer: OptionalURLSchema,
  ip_address: IPAddressSchema,
});

// Admin User Schema (simplified for API responses)
export const AdminUserSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  role: AdminRoleSchema,
  full_name: z.string().max(255).optional(),
  last_login: TimestampSchema.optional(),
  is_active: z.boolean(),
});

// Type exports for use in components
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type ProductCategoryInsert = z.infer<typeof ProductCategoryInsertSchema>;
export type ProductCategoryUpdate = z.infer<typeof ProductCategoryUpdateSchema>;

export type AvailabilityStatusRecord = z.infer<typeof AvailabilityStatusRecordSchema>;
export type AvailabilityStatusInsert = z.infer<typeof AvailabilityStatusInsertSchema>;
export type AvailabilityStatusUpdate = z.infer<typeof AvailabilityStatusUpdateSchema>;

export type EnhancedLead = z.infer<typeof EnhancedLeadSchema>;
export type EnhancedLeadInsert = z.infer<typeof EnhancedLeadInsertSchema>;
export type EnhancedLeadUpdate = z.infer<typeof EnhancedLeadUpdateSchema>;

export type AdminProfile = z.infer<typeof AdminProfileSchema>;
export type AdminProfileInsert = z.infer<typeof AdminProfileInsertSchema>;
export type AdminProfileUpdate = z.infer<typeof AdminProfileUpdateSchema>;

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
export type AuditLogInsert = z.infer<typeof AuditLogInsertSchema>;

export type Industry = z.infer<typeof IndustrySchema>;
export type IndustryInsert = z.infer<typeof IndustryInsertSchema>;
export type IndustryUpdate = z.infer<typeof IndustryUpdateSchema>;

export type BusinessInsight = z.infer<typeof BusinessInsightSchema>;
export type BusinessInsightInsert = z.infer<typeof BusinessInsightInsertSchema>;
export type BusinessInsightUpdate = z.infer<typeof BusinessInsightUpdateSchema>;

export type EnhancedInquiry = z.infer<typeof EnhancedInquirySchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;

export type LeadSubmissionRequest = z.infer<typeof LeadSubmissionRequestSchema>;
export type LeadSubmissionResponse = z.infer<typeof LeadSubmissionResponseSchema>;
export type UpdateAvailabilityRequest = z.infer<typeof UpdateAvailabilityRequestSchema>;
export type UpdateAvailabilityResponse = z.infer<typeof UpdateAvailabilityResponseSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type LeadsListRequest = z.infer<typeof LeadsListRequestSchema>;
export type LeadsListResponse = z.infer<typeof LeadsListResponseSchema>;

// Validation helper functions
export const validateProductCategory = (data: unknown) => ProductCategorySchema.parse(data);
export const validateEnhancedLead = (data: unknown) => EnhancedLeadSchema.parse(data);
export const validateAdminProfile = (data: unknown) => AdminProfileSchema.parse(data);
export const validateAuditLogEntry = (data: unknown) => AuditLogEntrySchema.parse(data);
export const validateEnhancedInquiry = (data: unknown) => EnhancedInquirySchema.parse(data);
export const validateLeadSubmissionRequest = (data: unknown) => LeadSubmissionRequestSchema.parse(data);
export const validateUpdateAvailabilityRequest = (data: unknown) => UpdateAvailabilityRequestSchema.parse(data);
export const validateLeadsListRequest = (data: unknown) => LeadsListRequestSchema.parse(data);

// Safe validation functions that return results instead of throwing
export const safeValidateProductCategory = (data: unknown) => ProductCategorySchema.safeParse(data);
export const safeValidateEnhancedLead = (data: unknown) => EnhancedLeadSchema.safeParse(data);
export const safeValidateAdminProfile = (data: unknown) => AdminProfileSchema.safeParse(data);
export const safeValidateEnhancedInquiry = (data: unknown) => EnhancedInquirySchema.safeParse(data);
export const safeValidateLeadSubmissionRequest = (data: unknown) => LeadSubmissionRequestSchema.safeParse(data);
export const safeValidateUpdateAvailabilityRequest = (data: unknown) => UpdateAvailabilityRequestSchema.safeParse(data);
export const safeValidateLeadsListRequest = (data: unknown) => LeadsListRequestSchema.safeParse(data);