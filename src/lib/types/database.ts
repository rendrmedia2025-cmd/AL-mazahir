export type AvailabilityStatus = 'in_stock' | 'limited' | 'out_of_stock' | 'on_order'
export type UrgencyLevel = 'immediate' | '1-2_weeks' | 'planning'
export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
export type AdminRole = 'admin' | 'manager'
export type InsightCategory = 'company_update' | 'product_announcement' | 'safety_guideline' | 'industry_insight' | 'project_showcase'
export type AnalyticsEvent = 'form_view' | 'form_start' | 'form_submit' | 'whatsapp_click' | 'email_click' | 'category_view' | 'availability_check'

// Re-export Zod schemas and types for validation
export * from './schemas/database';

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AvailabilityStatusRecord {
  id: string
  category_id: string
  status: AvailabilityStatus
  last_updated: string
  updated_by?: string
  admin_override: boolean
  notes?: string
  created_at: string
}

export interface EnhancedLead {
  id: string
  name: string
  company?: string
  phone?: string
  email: string
  product_category?: string
  urgency: UrgencyLevel
  quantity_estimate?: string
  message?: string
  source_section?: string
  device_type?: DeviceType
  user_agent?: string
  referrer?: string
  ip_address?: string
  status: LeadStatus
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface AdminProfile {
  id: string
  role: AdminRole
  full_name?: string
  last_login?: string
  is_active: boolean
  created_at: string
}

export interface AuditLogEntry {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// API Response Types
export interface AvailabilityResponse {
  success: boolean
  data: {
    [categoryId: string]: {
      status: AvailabilityStatus
      lastUpdated: string
    }
  }
  cached: boolean
  cacheExpiry: string
}

export interface LeadSubmissionRequest {
  inquiry: Omit<EnhancedLead, 'id' | 'status' | 'created_at' | 'updated_at'>
  recaptchaToken?: string
}

export interface LeadSubmissionResponse {
  success: boolean
  leadId?: string
  message: string
  whatsappUrl?: string
}

export interface UpdateAvailabilityRequest {
  status: AvailabilityStatus
  notes?: string
  adminOverride?: boolean
}

export interface UpdateAvailabilityResponse {
  success: boolean
  updated: AvailabilityStatusRecord
  affectedPages: string[]
}

export interface LeadsListRequest {
  page?: number
  limit?: number
  status?: LeadStatus
  category?: string
  dateFrom?: string
  dateTo?: string
}

export interface LeadsListResponse {
  success: boolean
  data: EnhancedLead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Database schema type for Supabase
export interface Database {
  public: {
    Tables: {
      product_categories: {
        Row: ProductCategory
        Insert: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>>
      }
      availability_status: {
        Row: AvailabilityStatusRecord
        Insert: Omit<AvailabilityStatusRecord, 'id' | 'created_at'>
        Update: Partial<Omit<AvailabilityStatusRecord, 'id' | 'created_at'>>
      }
      enhanced_leads: {
        Row: EnhancedLead
        Insert: Omit<EnhancedLead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EnhancedLead, 'id' | 'created_at' | 'updated_at'>>
      }
      admin_profiles: {
        Row: AdminProfile
        Insert: Omit<AdminProfile, 'created_at'>
        Update: Partial<Omit<AdminProfile, 'id' | 'created_at'>>
      }
      audit_log: {
        Row: AuditLogEntry
        Insert: Omit<AuditLogEntry, 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {}
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_old_values?: Record<string, any>
          p_new_values?: Record<string, any>
        }
        Returns: string
      }
    }
    Enums: {
      availability_enum: AvailabilityStatus
      urgency_enum: UrgencyLevel
      device_enum: DeviceType
      lead_status_enum: LeadStatus
      admin_role_enum: AdminRole
    }
  }
}