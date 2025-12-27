/**
 * API Contract Interfaces for Enterprise Dynamic Platform
 * Type-safe interfaces that correspond to OpenAPI specification
 * Requirements: 1.1, 3.1, 4.1, 5.1
 */

import type {
  OperationalAreaStatus,
  SystemHealth,
  EnhancedLead,
  BehaviorData,
  RoutingDecision,
  AutomatedAction,
  RecommendedAction,
  TrustIndicator,
  BusinessMetric,
  TrendAnalysis,
  PredictiveInsight,
  IndustryBenchmark,
  LeadEvent,
  LeadPrediction,
  LeadFollowupTask,
  Alert,
  ContentSetting,
  TimeRange,
  AnalyticsFilter,
  AggregationConfig
} from '../types/enterprise';

// ============================================================================
// COMMON RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiResponse {
  success: false;
  error: string;
  validation_errors: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// ============================================================================
// OPERATIONAL STATUS API CONTRACTS
// ============================================================================

export interface StatusEngineResponse extends ApiResponse {
  success: true;
  data: {
    operationalAreas: OperationalAreaStatus[];
    lastUpdated: string;
    systemHealth: SystemHealth;
  };
  metadata: {
    cacheStatus: 'live' | 'cached';
    nextUpdate: string;
    dataFreshness: number;
  };
}

export interface UpdateOperationalStatusRequest {
  area_name: string;
  status: 'optimal' | 'good' | 'limited' | 'critical';
  metrics?: Record<string, any>;
  trend?: 'improving' | 'stable' | 'declining';
  details?: string;
}

export interface UpdateOperationalStatusResponse extends ApiResponse {
  success: true;
  status_id: string;
  updated_areas: OperationalAreaStatus[];
}

// ============================================================================
// LEAD MANAGEMENT API CONTRACTS
// ============================================================================

export interface LeadOrchestrationRequest {
  leadData: Omit<EnhancedLead, 
    'id' | 'created_at' | 'updated_at' | 'lead_score' | 'priority' | 
    'total_engagement_time' | 'page_views_count' | 'documents_downloaded'
  >;
  behaviorContext: BehaviorData;
  sourceMetadata: Record<string, any>;
}

export interface LeadOrchestrationResponse extends ApiResponse {
  success: true;
  leadId: string;
  leadScore: number;
  routingDecision: RoutingDecision;
  automatedActions: AutomatedAction[];
  nextSteps: RecommendedAction[];
}

export interface LeadsListRequest {
  page?: number;
  limit?: number;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dateFrom?: string;
  dateTo?: string;
  assigned_to?: string;
  industry_sector?: string;
  budget_range?: string;
  search?: string;
}

export interface LeadsListResponse extends PaginatedResponse<EnhancedLead> {
  success: true;
  data: EnhancedLead[];
  pagination: PaginationMeta;
  filters_applied: Partial<LeadsListRequest>;
  summary: {
    total_leads: number;
    new_leads: number;
    qualified_leads: number;
    converted_leads: number;
    average_score: number;
  };
}

export interface LeadDetailsResponse extends ApiResponse {
  success: true;
  lead: EnhancedLead;
  events: LeadEvent[];
  predictions: LeadPrediction[];
  tasks: LeadFollowupTask[];
  communications: LeadCommunication[];
  analytics: LeadAnalyticsSummary;
}

export interface LeadAnalyticsSummary {
  total_interactions: number;
  engagement_score: number;
  conversion_probability: number;
  last_activity: string;
  activity_timeline: ActivityTimelineItem[];
}

export interface ActivityTimelineItem {
  timestamp: string;
  type: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface LeadCommunication {
  id: string;
  communication_type: 'email' | 'phone' | 'whatsapp' | 'meeting';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  sent_by?: string;
  sent_at: string;
  response_received: boolean;
  response_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UpdateLeadRequest {
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  assigned_to?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  routing_notes?: string;
  conversion_probability?: number;
  tags?: string[];
}

export interface UpdateLeadResponse extends ApiResponse {
  success: true;
  lead: EnhancedLead;
  changes_made: string[];
  audit_log_id: string;
}

export interface BulkLeadActionRequest {
  lead_ids: string[];
  action: 'assign' | 'update_status' | 'add_tag' | 'remove_tag' | 'delete';
  parameters: Record<string, any>;
}

export interface BulkLeadActionResponse extends ApiResponse {
  success: true;
  processed: number;
  failed: number;
  results: Array<{
    lead_id: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// TRUST AUTHORITY API CONTRACTS
// ============================================================================

export interface TrustIndicatorsResponse extends ApiResponse {
  success: true;
  indicators: TrustIndicator[];
  last_updated: string;
  categories: {
    [key: string]: TrustIndicator[];
  };
}

export interface AdminTrustIndicatorsResponse extends ApiResponse {
  success: true;
  indicators: TrustIndicator[];
  statistics: {
    total: number;
    active: number;
    verified: number;
    pending_verification: number;
    by_type: Record<string, number>;
  };
}

export interface CreateTrustIndicatorRequest {
  type: 'performance_metric' | 'certification' | 'testimonial' | 'case_study' | 'award' | 'compliance';
  title: string;
  value_text?: string;
  value_numeric?: number;
  verification_url?: string;
  display_priority?: number;
  is_active?: boolean;
}

export interface UpdateTrustIndicatorRequest {
  title?: string;
  value_text?: string;
  value_numeric?: number;
  verification_status?: 'verified' | 'pending' | 'expired' | 'invalid';
  verification_url?: string;
  display_priority?: number;
  is_active?: boolean;
}

export interface TrustIndicatorResponse extends ApiResponse {
  success: true;
  indicator: TrustIndicator;
}

// ============================================================================
// BUSINESS INTELLIGENCE API CONTRACTS
// ============================================================================

export interface BusinessIntelligenceRequest {
  dashboard: string;
  timeRange: TimeRange;
  filters: AnalyticsFilter[];
  aggregation: AggregationConfig;
  include_predictions?: boolean;
  include_benchmarks?: boolean;
}

export interface BusinessIntelligenceResponse extends ApiResponse {
  success: true;
  data: {
    metrics: BusinessMetric[];
    trends: TrendAnalysis[];
    predictions: PredictiveInsight[];
    benchmarks: IndustryBenchmark[];
  };
  metadata: {
    dataQuality: number;
    lastUpdated: string;
    sampleSize: number;
    query_execution_time: number;
    cache_hit: boolean;
  };
}

export interface RecordMetricRequest {
  metric_name: string;
  metric_category: string;
  value: number;
  target_value?: number;
  unit?: string;
  measurement_date?: string;
  metadata?: Record<string, any>;
}

export interface RecordMetricResponse extends ApiResponse {
  success: true;
  metric: BusinessMetric;
  trend_analysis?: TrendAnalysis;
}

export interface AnalyticsDashboardConfig {
  dashboard_id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  refresh_interval: number;
  permissions: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'trend';
  title: string;
  data_source: string;
  configuration: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  widgets: Omit<DashboardWidget, 'id'>[];
  refresh_interval?: number;
  is_public?: boolean;
}

export interface DashboardResponse extends ApiResponse {
  success: true;
  dashboard: AnalyticsDashboardConfig;
  data: Record<string, any>;
}

// ============================================================================
// MONITORING API CONTRACTS
// ============================================================================

export interface SystemHealthResponse extends ApiResponse {
  success: true;
  components: SystemHealth[];
  overall_status: 'healthy' | 'degraded' | 'down';
  last_updated: string;
  uptime_percentage: number;
}

export interface AlertsResponse extends ApiResponse {
  success: true;
  alerts: Alert[];
  summary: {
    total: number;
    active: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  last_updated: string;
}

export interface AcknowledgeAlertRequest {
  alert_id: string;
  notes?: string;
}

export interface AcknowledgeAlertResponse extends ApiResponse {
  success: true;
  alert: Alert;
  acknowledged_by: string;
  acknowledged_at: string;
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  time_window: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  is_active?: boolean;
}

export interface PerformanceMetricsRequest {
  time_range: TimeRange;
  metrics?: string[];
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
  group_by?: string;
}

export interface PerformanceMetricsResponse extends ApiResponse {
  success: true;
  metrics: Array<{
    name: string;
    values: Array<{
      timestamp: string;
      value: number;
    }>;
    summary: {
      avg: number;
      min: number;
      max: number;
      count: number;
    };
  }>;
  time_range: TimeRange;
}

// ============================================================================
// CONTENT MANAGEMENT API CONTRACTS
// ============================================================================

export interface ContentSettingsResponse extends ApiResponse {
  success: true;
  settings: ContentSetting[];
  sections: string[];
  last_updated: string;
}

export interface UpdateContentSettingsRequest {
  settings: Array<{
    section: string;
    key: string;
    value: string;
    value_type?: 'text' | 'json' | 'html' | 'markdown';
  }>;
}

export interface UpdateContentSettingsResponse extends ApiResponse {
  success: true;
  updated_settings: ContentSetting[];
  cache_invalidated: string[];
  validation_errors?: ValidationError[];
}

export interface ContentSectionResponse extends ApiResponse {
  success: true;
  section: string;
  settings: Record<string, any>;
  last_updated: string;
  cache_ttl: number;
}

export interface BulkContentUpdateRequest {
  updates: Array<{
    section: string;
    settings: Record<string, string>;
  }>;
  publish_immediately?: boolean;
}

export interface ContentHistoryResponse extends ApiResponse {
  success: true;
  history: Array<{
    id: string;
    section: string;
    key: string;
    old_value: string;
    new_value: string;
    updated_by: string;
    updated_at: string;
    change_reason?: string;
  }>;
  pagination: PaginationMeta;
}

// ============================================================================
// ADMIN AND USER MANAGEMENT API CONTRACTS
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  full_name?: string;
  last_login?: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
}

export interface AdminUsersResponse extends ApiResponse {
  success: true;
  users: AdminUser[];
  roles: Array<{
    name: string;
    permissions: string[];
  }>;
}

export interface CreateAdminUserRequest {
  email: string;
  role: 'admin' | 'manager';
  full_name?: string;
  permissions?: string[];
  send_invitation?: boolean;
}

export interface UpdateAdminUserRequest {
  role?: 'admin' | 'manager';
  full_name?: string;
  is_active?: boolean;
  permissions?: string[];
}

export interface AdminUserResponse extends ApiResponse {
  success: true;
  user: AdminUser;
}

// ============================================================================
// AUDIT AND LOGGING API CONTRACTS
// ============================================================================

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogResponse extends PaginatedResponse<AuditLogEntry> {
  success: true;
  data: AuditLogEntry[];
  pagination: PaginationMeta;
  filters_applied: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  };
}

export interface AuditLogRequest {
  page?: number;
  limit?: number;
  user_id?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface SecurityEventResponse extends ApiResponse {
  success: true;
  events: Array<{
    id: string;
    event_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ip_address?: string;
    user_id?: string;
    resolved: boolean;
    created_at: string;
  }>;
  summary: {
    total: number;
    unresolved: number;
    by_severity: Record<string, number>;
  };
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  // Re-export enterprise types for convenience
  OperationalAreaStatus,
  SystemHealth,
  EnhancedLead,
  BehaviorData,
  RoutingDecision,
  AutomatedAction,
  RecommendedAction,
  TrustIndicator,
  BusinessMetric,
  TrendAnalysis,
  PredictiveInsight,
  IndustryBenchmark,
  LeadEvent,
  LeadPrediction,
  LeadFollowupTask,
  Alert,
  ContentSetting,
  TimeRange,
  AnalyticsFilter,
  AggregationConfig
};

// ============================================================================
// API CLIENT TYPE HELPERS
// ============================================================================

export type ApiEndpoint = 
  | '/status/operational'
  | '/admin/status/operational'
  | '/public/leads'
  | '/admin/leads'
  | '/admin/leads/{leadId}'
  | '/public/trust-indicators'
  | '/admin/trust-indicators'
  | '/admin/analytics/dashboard'
  | '/admin/analytics/metrics'
  | '/admin/monitoring/health'
  | '/admin/monitoring/alerts'
  | '/admin/content';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestConfig {
  method: HttpMethod;
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const isValidationErrorResponse = (response: any): response is ValidationErrorResponse => {
  return response && !response.success && Array.isArray(response.validation_errors);
};

export const isApiResponse = <T>(response: any): response is ApiResponse<T> => {
  return response && typeof response.success === 'boolean';
};

export const isPaginatedResponse = <T>(response: any): response is PaginatedResponse<T> => {
  return isApiResponse(response) && response.pagination && Array.isArray(response.data);
};