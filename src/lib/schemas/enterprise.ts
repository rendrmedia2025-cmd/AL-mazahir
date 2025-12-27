/**
 * Enterprise Dynamic Platform - Zod Validation Schemas
 * Comprehensive validation for all enterprise business entities
 * Requirements: 1.1, 3.1, 4.1, 5.1
 */

import { z } from 'zod';

// ============================================================================
// CORE VALIDATION UTILITIES
// ============================================================================

const UUIDSchema = z.string().uuid();
const EmailSchema = z.string().email();
const URLSchema = z.string().url();
const OptionalURLSchema = z.string().url().optional();
const TimestampSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid datetime string",
});
const IPAddressSchema = z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/).optional();
const PhoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional();

// ============================================================================
// ENUM SCHEMAS (Enterprise-specific only, avoiding duplicates)
// ============================================================================

export const OperationalStatusSchema = z.enum(['optimal', 'good', 'limited', 'critical']);
export const TrendDirectionSchema = z.enum(['improving', 'stable', 'declining']);
export const TrustIndicatorTypeSchema = z.enum(['performance_metric', 'certification', 'testimonial', 'case_study', 'award', 'compliance']);
export const VerificationStatusSchema = z.enum(['verified', 'pending', 'expired', 'invalid']);
export const DecisionAuthoritySchema = z.enum(['decision_maker', 'influencer', 'end_user', 'gatekeeper']);
export const BudgetRangeSchema = z.enum(['under_10k', '10k_50k', '50k_100k', '100k_500k', '500k_1m', 'over_1m']);
export const ProjectTimelineSchema = z.enum(['immediate', 'within_month', 'within_quarter', 'within_year', 'planning_phase']);
export const LeadPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const InteractionTypeSchema = z.enum(['page_view', 'form_submission', 'document_download', 'email_click', 'phone_call', 'meeting', 'quote_request']);
export const SecurityEventSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const SystemHealthStatusSchema = z.enum(['healthy', 'degraded', 'down']);
export const AlertStatusSchema = z.enum(['active', 'acknowledged', 'resolved']);
export const DeploymentStatusSchema = z.enum(['pending', 'success', 'failed', 'rollback', 'cancelled']);
export const ContentValueTypeSchema = z.enum(['text', 'json', 'html', 'markdown']);
export const CommunicationTypeSchema = z.enum(['email', 'phone', 'whatsapp', 'meeting']);
export const CommunicationDirectionSchema = z.enum(['inbound', 'outbound']);
export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

// Import existing schemas from database to avoid duplication
import { DeviceTypeSchema } from './database';

export {
  UrgencyLevelSchema,
  DeviceTypeSchema,
  LeadStatusSchema
} from './database';

// ============================================================================
// OPERATIONAL STATUS SCHEMAS
// ============================================================================

export const OperationalMetricSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.number(),
  unit: z.string().max(20),
  target: z.number().optional(),
  trend: z.number().optional(),
});

export const OperationalAreaSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const OperationalStatusRecordSchema = z.object({
  id: UUIDSchema,
  area_id: UUIDSchema,
  status: OperationalStatusSchema,
  metrics: z.record(z.string(), z.any()).default({}),
  trend: TrendDirectionSchema.default('stable'),
  details: z.string().max(1000).optional(),
  last_updated: TimestampSchema,
  updated_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
});

export const OperationalAreaStatusSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  status: OperationalStatusSchema,
  metrics: z.array(OperationalMetricSchema),
  trend: TrendDirectionSchema,
  lastUpdated: z.string(),
  details: z.string().optional(),
});

// ============================================================================
// TRUST AUTHORITY SCHEMAS
// ============================================================================

export const TrustIndicatorSchema = z.object({
  id: UUIDSchema,
  type: TrustIndicatorTypeSchema,
  title: z.string().min(1).max(255),
  value_text: z.string().max(255).optional(),
  value_numeric: z.number().optional(),
  verification_status: VerificationStatusSchema.default('pending'),
  verification_url: OptionalURLSchema,
  display_priority: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  last_updated: TimestampSchema,
  created_at: TimestampSchema,
});

export const TrendDataSchema = z.object({
  direction: TrendDirectionSchema,
  percentage: z.number(),
  period: z.string(),
});

export const IndustryBenchmarkSchema = z.object({
  value: z.number(),
  percentile: z.number().min(0).max(100),
  source: z.string(),
});

export const PerformanceMetricSchema = z.object({
  name: z.string(),
  currentValue: z.number(),
  target: z.number().optional(),
  trend: TrendDataSchema,
  benchmark: IndustryBenchmarkSchema.optional(),
  verification: VerificationStatusSchema,
});

export const CertificationSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  issuer: z.string().min(1).max(255),
  issued_date: TimestampSchema,
  expiry_date: TimestampSchema.optional(),
  verification_url: OptionalURLSchema,
  status: VerificationStatusSchema,
});

export const TestimonialSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  position: z.string().min(1).max(255),
  content: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  image_url: OptionalURLSchema,
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

// ============================================================================
// ENHANCED LEAD INTELLIGENCE SCHEMAS
// ============================================================================

export const ContactInfoSchema = z.object({
  name: z.string().min(1).max(255),
  email: EmailSchema,
  phone: PhoneSchema,
});

export const CompanyInfoSchema = z.object({
  name: z.string().max(255).optional(),
  size: z.string().max(50).optional(),
  industry_sector: z.string().max(100).optional(),
});

export const ProjectInfoSchema = z.object({
  timeline: ProjectTimelineSchema,
  budget_range: BudgetRangeSchema.optional(),
  quantity_estimate: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});

export const LeadProfileSchema = z.object({
  contact: ContactInfoSchema,
  company: CompanyInfoSchema,
  project: ProjectInfoSchema,
  authority: DecisionAuthoritySchema,
});

export const DeviceInfoSchema = z.object({
  type: DeviceTypeSchema.optional(),
  user_agent: z.string().max(500).optional(),
  screen_resolution: z.string().max(50).optional(),
  browser: z.string().max(100).optional(),
});

export const InteractionPatternSchema = z.object({
  session_duration: z.number().int().min(0),
  pages_per_session: z.number().int().min(0),
  bounce_rate: z.number().min(0).max(1),
  return_visitor: z.boolean(),
});

export const PageViewSchema = z.object({
  url: z.string().max(500),
  title: z.string().max(255),
  duration: z.number().int().min(0),
  timestamp: TimestampSchema,
});

export const BehaviorDataSchema = z.object({
  pageViews: z.array(PageViewSchema),
  engagementTime: z.number().int().min(0),
  documentsDownloaded: z.array(z.string()),
  interactionPattern: InteractionPatternSchema,
  deviceInfo: DeviceInfoSchema,
});

export const LeadScoreSchema = z.object({
  total: z.number().int().min(0),
  breakdown: z.object({
    profile: z.number().int().min(0),
    behavior: z.number().int().min(0),
    engagement: z.number().int().min(0),
    urgency: z.number().int().min(0),
  }),
  lastCalculated: TimestampSchema,
});

export const RoutingDecisionSchema = z.object({
  assignedTo: UUIDSchema.optional(),
  teamName: z.string().max(100).optional(),
  priority: LeadPrioritySchema,
  estimatedResponseTime: z.number().int().min(0),
  recommendedApproach: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

export const LeadEventSchema = z.object({
  id: UUIDSchema,
  lead_id: UUIDSchema,
  event_type: InteractionTypeSchema,
  event_data: z.record(z.string(), z.any()).default({}),
  page_url: z.string().max(500).optional(),
  session_id: z.string().max(255).optional(),
  duration_seconds: z.number().int().min(0).optional(),
  timestamp: TimestampSchema,
  user_id: UUIDSchema.optional(),
  ip_address: IPAddressSchema,
  user_agent: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export const LeadPredictionSchema = z.object({
  id: UUIDSchema,
  lead_id: UUIDSchema,
  prediction_type: z.string().max(100),
  probability: z.number().min(0).max(1),
  confidence_level: z.number().min(0).max(1),
  model_version: z.string().max(50),
  prediction_data: z.record(z.string(), z.any()).default({}),
  created_at: TimestampSchema,
  expires_at: TimestampSchema.optional(),
});

// Import existing EnhancedLead schema from database to avoid duplication
export type {
  EnhancedLead,
  EnhancedLeadInsert,
  EnhancedLeadUpdate
} from './database';

import {
  EnhancedLeadSchema
} from './database';

// Enhanced Lead schema with additional enterprise fields
export const EnterpriseEnhancedLeadSchema = EnhancedLeadSchema.extend({
  // Enhanced intelligence fields
  company_size: z.string().max(50).optional(),
  industry_sector: z.string().max(100).optional(),
  decision_authority: DecisionAuthoritySchema.optional(),
  budget_range: BudgetRangeSchema.optional(),
  project_timeline: ProjectTimelineSchema.optional(),
  lead_score: z.number().int().min(0).default(0),
  priority: LeadPrioritySchema.default('medium'),
  routing_notes: z.string().max(1000).optional(),
  conversion_probability: z.number().min(0).max(1).optional(),
  last_interaction: TimestampSchema.optional(),
  total_engagement_time: z.number().int().min(0).default(0),
  page_views_count: z.number().int().min(0).default(0),
  documents_downloaded: z.number().int().min(0).default(0),
});

// ============================================================================
// LEAD MANAGEMENT SCHEMAS
// ============================================================================

export const LeadScoringRuleSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  condition_field: z.string().max(100),
  condition_operator: z.string().max(20),
  condition_value: z.string().max(255),
  score_points: z.number().int(),
  is_active: z.boolean().default(true),
  created_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const LeadRoutingRuleSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(0).default(0),
  conditions: z.record(z.string(), z.any()),
  assigned_to: UUIDSchema.optional(),
  team_name: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
  created_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const LeadFollowupTaskSchema = z.object({
  id: UUIDSchema,
  lead_id: UUIDSchema,
  task_type: z.string().max(100),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  due_date: TimestampSchema,
  assigned_to: UUIDSchema.optional(),
  status: TaskStatusSchema.default('pending'),
  priority: LeadPrioritySchema.default('medium'),
  automated: z.boolean().default(false),
  completed_at: TimestampSchema.optional(),
  completed_by: UUIDSchema.optional(),
  notes: z.string().max(1000).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const LeadCommunicationSchema = z.object({
  id: UUIDSchema,
  lead_id: UUIDSchema,
  communication_type: CommunicationTypeSchema,
  direction: CommunicationDirectionSchema,
  subject: z.string().max(255).optional(),
  content: z.string().optional(),
  sent_by: UUIDSchema.optional(),
  sent_at: TimestampSchema,
  response_received: z.boolean().default(false),
  response_at: TimestampSchema.optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: TimestampSchema,
});

export const LeadBehaviorAnalyticsSchema = z.object({
  id: UUIDSchema,
  lead_id: UUIDSchema,
  session_id: z.string().max(255),
  total_session_time: z.number().int().min(0),
  pages_visited: z.number().int().min(0),
  bounce_rate: z.number().min(0).max(1).optional(),
  engagement_score: z.number().int().min(0).optional(),
  device_info: z.record(z.string(), z.any()).default({}),
  location_data: z.record(z.string(), z.any()).default({}),
  referrer_data: z.record(z.string(), z.any()).default({}),
  conversion_events: z.array(z.any()).default([]),
  session_start: TimestampSchema,
  session_end: TimestampSchema.optional(),
  created_at: TimestampSchema,
});

// ============================================================================
// BUSINESS INTELLIGENCE SCHEMAS
// ============================================================================

export const BusinessMetricSchema = z.object({
  id: UUIDSchema,
  metric_name: z.string().max(100),
  metric_category: z.string().max(100),
  value: z.number(),
  target_value: z.number().optional(),
  unit: z.string().max(50).optional(),
  measurement_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string",
  }),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: TimestampSchema,
});

export const EnterpriseAnalyticsEventSchema = z.object({
  id: UUIDSchema,
  event_type: z.string().max(100),
  event_category: z.string().max(100),
  event_data: z.record(z.string(), z.any()),
  user_session: z.string().max(255).optional(),
  ip_address: IPAddressSchema,
  user_agent: z.string().optional(),
  timestamp: TimestampSchema,
});

export const PredictiveModelSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  type: z.string().max(100),
  version: z.string().max(50),
  accuracy: z.number().min(0).max(1).optional(),
  training_data_size: z.number().int().min(0).optional(),
  last_trained: TimestampSchema.optional(),
  model_parameters: z.record(z.string(), z.any()).default({}),
  is_active: z.boolean().default(true),
  created_at: TimestampSchema,
});

// ============================================================================
// MONITORING AND SECURITY SCHEMAS
// ============================================================================

export const SecurityEventSchema = z.object({
  id: UUIDSchema,
  event_type: z.string().max(100),
  severity: SecurityEventSeveritySchema,
  description: z.string().min(1),
  ip_address: IPAddressSchema,
  user_agent: z.string().optional(),
  user_id: UUIDSchema.optional(),
  session_id: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  resolved: z.boolean().default(false),
  resolved_at: TimestampSchema.optional(),
  resolved_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
});

export const SessionActivitySchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  session_id: z.string().max(255),
  ip_address: IPAddressSchema,
  user_agent: z.string().optional(),
  activity_type: z.string().max(100),
  url: z.string().max(500).optional(),
  timestamp: TimestampSchema,
  metadata: z.record(z.string(), z.any()).default({}),
});

export const PerformanceMetricRecordSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  value: z.number(),
  unit: z.string().max(20),
  timestamp: TimestampSchema,
  context: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
  session_id: z.string().max(255).optional(),
  user_id: UUIDSchema.optional(),
  url: z.string().max(500).optional(),
  user_agent: z.string().optional(),
  server_side: z.boolean().default(false),
  created_at: TimestampSchema,
});

export const ErrorEventSchema = z.object({
  id: UUIDSchema,
  message: z.string().min(1),
  stack: z.string().optional(),
  url: z.string().max(500).optional(),
  user_agent: z.string().optional(),
  user_id: UUIDSchema.optional(),
  session_id: z.string().max(255).optional(),
  severity: SecurityEventSeveritySchema,
  context: z.record(z.string(), z.any()).optional(),
  timestamp: TimestampSchema,
  server_side: z.boolean().default(false),
  resolved: z.boolean().default(false),
  resolved_at: TimestampSchema.optional(),
  resolved_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
});

export const AlertRuleSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  metric: z.string().max(255),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'not_equals']),
  threshold: z.number(),
  time_window: z.number().int().min(1),
  severity: SecurityEventSeveritySchema,
  channels: z.array(z.string()).default(['email']),
  is_active: z.boolean().default(true),
  created_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const AlertSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  severity: SecurityEventSeveritySchema,
  message: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
  triggered_at: TimestampSchema,
  status: AlertStatusSchema.default('active'),
  acknowledged_at: TimestampSchema.optional(),
  acknowledged_by: UUIDSchema.optional(),
  resolved_at: TimestampSchema.optional(),
  resolved_by: UUIDSchema.optional(),
  alert_rule_id: UUIDSchema.optional(),
  created_at: TimestampSchema,
});

export const SystemHealthSchema = z.object({
  id: UUIDSchema,
  component: z.string().max(100),
  status: SystemHealthStatusSchema,
  response_time_ms: z.number().int().min(0).optional(),
  error_rate: z.number().min(0).max(100).optional(),
  last_check: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: TimestampSchema,
});

// ============================================================================
// DEPLOYMENT AND OPERATIONS SCHEMAS
// ============================================================================

export const DeploymentSchema = z.object({
  id: UUIDSchema,
  commit_sha: z.string().max(40),
  deployment_url: OptionalURLSchema,
  environment: z.string().max(50).default('production'),
  status: DeploymentStatusSchema.default('pending'),
  deployed_at: TimestampSchema,
  completed_at: TimestampSchema.optional(),
  deployed_by: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  rollback_target_id: UUIDSchema.optional(),
  health_check_passed: z.boolean().optional(),
  performance_score: z.number().int().min(0).max(100).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const DeploymentHealthCheckSchema = z.object({
  id: UUIDSchema,
  deployment_id: UUIDSchema,
  check_name: z.string().max(100),
  status: z.enum(['passed', 'failed', 'warning']),
  response_time_ms: z.number().int().min(0).optional(),
  error_message: z.string().optional(),
  checked_at: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// CONTENT MANAGEMENT SCHEMAS
// ============================================================================

export const ContentSettingSchema = z.object({
  id: UUIDSchema,
  section: z.string().max(100),
  key: z.string().max(100),
  value: z.string().optional(),
  value_type: ContentValueTypeSchema.default('text'),
  is_active: z.boolean().default(true),
  updated_by: UUIDSchema.optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const StatusEngineResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    operationalAreas: z.array(OperationalAreaStatusSchema),
    lastUpdated: z.string(),
    systemHealth: SystemHealthSchema,
  }),
  metadata: z.object({
    cacheStatus: z.enum(['live', 'cached']),
    nextUpdate: z.string(),
    dataFreshness: z.number(),
  }),
});

export const LeadOrchestrationRequestSchema = z.object({
  leadData: EnhancedLeadSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    lead_score: true,
    priority: true,
    total_engagement_time: true,
    page_views_count: true,
    documents_downloaded: true,
  }),
  behaviorContext: BehaviorDataSchema,
  sourceMetadata: z.record(z.string(), z.any()),
});

export const AutomatedActionSchema = z.object({
  type: z.string(),
  description: z.string(),
  scheduled_at: TimestampSchema.optional(),
  parameters: z.record(z.string(), z.any()),
});

export const RecommendedActionSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  priority: LeadPrioritySchema,
  estimated_effort: z.number().min(0),
});

export const LeadOrchestrationResponseSchema = z.object({
  success: z.boolean(),
  leadId: UUIDSchema,
  leadScore: z.number().int().min(0),
  routingDecision: RoutingDecisionSchema,
  automatedActions: z.array(AutomatedActionSchema),
  nextSteps: z.array(RecommendedActionSchema),
});

export const TimeRangeSchema = z.object({
  start: TimestampSchema,
  end: TimestampSchema,
});

export const AnalyticsFilterSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.any(),
});

export const AggregationConfigSchema = z.object({
  groupBy: z.array(z.string()),
  metrics: z.array(z.string()),
  timeGrain: z.string().optional(),
});

export const BusinessIntelligenceRequestSchema = z.object({
  dashboard: z.string(),
  timeRange: TimeRangeSchema,
  filters: z.array(AnalyticsFilterSchema),
  aggregation: AggregationConfigSchema,
});

export const TrendAnalysisSchema = z.object({
  metric: z.string(),
  trend: TrendDirectionSchema,
  change_percentage: z.number(),
  period: z.string(),
  significance: z.number().min(0).max(1),
});

export const PredictiveInsightSchema = z.object({
  type: z.string(),
  prediction: z.any(),
  confidence: z.number().min(0).max(1),
  time_horizon: z.string(),
  factors: z.array(z.string()),
});

export const BusinessIntelligenceResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    metrics: z.array(BusinessMetricSchema),
    trends: z.array(TrendAnalysisSchema),
    predictions: z.array(PredictiveInsightSchema),
    benchmarks: z.array(IndustryBenchmarkSchema),
  }),
  metadata: z.object({
    dataQuality: z.number().min(0).max(1),
    lastUpdated: z.string(),
    sampleSize: z.number().int().min(0),
  }),
});

// ============================================================================
// INSERT/UPDATE SCHEMAS
// ============================================================================

export const OperationalAreaInsertSchema = OperationalAreaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const OperationalAreaUpdateSchema = OperationalAreaInsertSchema.partial();

export const OperationalStatusInsertSchema = OperationalStatusRecordSchema.omit({
  id: true,
  created_at: true,
});

export const OperationalStatusUpdateSchema = OperationalStatusInsertSchema.partial();

export const TrustIndicatorInsertSchema = TrustIndicatorSchema.omit({
  id: true,
  created_at: true,
});

export const TrustIndicatorUpdateSchema = TrustIndicatorInsertSchema.partial();

export const LeadEventInsertSchema = LeadEventSchema.omit({
  id: true,
});

export const LeadPredictionInsertSchema = LeadPredictionSchema.omit({
  id: true,
});

export const LeadScoringRuleInsertSchema = LeadScoringRuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const LeadScoringRuleUpdateSchema = LeadScoringRuleInsertSchema.partial();

export const LeadRoutingRuleInsertSchema = LeadRoutingRuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const LeadRoutingRuleUpdateSchema = LeadRoutingRuleInsertSchema.partial();

export const BusinessMetricInsertSchema = BusinessMetricSchema.omit({
  id: true,
  created_at: true,
});

export const SecurityEventInsertSchema = SecurityEventSchema.omit({
  id: true,
  created_at: true,
});

export const ContentSettingInsertSchema = ContentSettingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const ContentSettingUpdateSchema = ContentSettingInsertSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OperationalArea = z.infer<typeof OperationalAreaSchema>;
export type OperationalAreaInsert = z.infer<typeof OperationalAreaInsertSchema>;
export type OperationalAreaUpdate = z.infer<typeof OperationalAreaUpdateSchema>;

export type OperationalStatusRecord = z.infer<typeof OperationalStatusRecordSchema>;
export type OperationalStatusInsert = z.infer<typeof OperationalStatusInsertSchema>;
export type OperationalStatusUpdate = z.infer<typeof OperationalStatusUpdateSchema>;

export type TrustIndicator = z.infer<typeof TrustIndicatorSchema>;
export type TrustIndicatorInsert = z.infer<typeof TrustIndicatorInsertSchema>;
export type TrustIndicatorUpdate = z.infer<typeof TrustIndicatorUpdateSchema>;

export type EnterpriseEnhancedLead = z.infer<typeof EnterpriseEnhancedLeadSchema>;

export type LeadEvent = z.infer<typeof LeadEventSchema>;
export type LeadEventInsert = z.infer<typeof LeadEventInsertSchema>;

export type LeadPrediction = z.infer<typeof LeadPredictionSchema>;
export type LeadPredictionInsert = z.infer<typeof LeadPredictionInsertSchema>;

export type LeadScoringRule = z.infer<typeof LeadScoringRuleSchema>;
export type LeadScoringRuleInsert = z.infer<typeof LeadScoringRuleInsertSchema>;
export type LeadScoringRuleUpdate = z.infer<typeof LeadScoringRuleUpdateSchema>;

export type LeadRoutingRule = z.infer<typeof LeadRoutingRuleSchema>;
export type LeadRoutingRuleInsert = z.infer<typeof LeadRoutingRuleInsertSchema>;
export type LeadRoutingRuleUpdate = z.infer<typeof LeadRoutingRuleUpdateSchema>;

export type BusinessMetric = z.infer<typeof BusinessMetricSchema>;
export type BusinessMetricInsert = z.infer<typeof BusinessMetricInsertSchema>;

export type SecurityEvent = z.infer<typeof SecurityEventSchema>;
export type SecurityEventInsert = z.infer<typeof SecurityEventInsertSchema>;

export type ContentSetting = z.infer<typeof ContentSettingSchema>;
export type ContentSettingInsert = z.infer<typeof ContentSettingInsertSchema>;
export type ContentSettingUpdate = z.infer<typeof ContentSettingUpdateSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

export const validateOperationalArea = (data: unknown) => OperationalAreaSchema.parse(data);
export const validateOperationalStatus = (data: unknown) => OperationalStatusRecordSchema.parse(data);
export const validateTrustIndicator = (data: unknown) => TrustIndicatorSchema.parse(data);
export const validateLeadEvent = (data: unknown) => LeadEventSchema.parse(data);
export const validateLeadPrediction = (data: unknown) => LeadPredictionSchema.parse(data);
export const validateBusinessMetric = (data: unknown) => BusinessMetricSchema.parse(data);
export const validateSecurityEvent = (data: unknown) => SecurityEventSchema.parse(data);
export const validateContentSetting = (data: unknown) => ContentSettingSchema.parse(data);

// Safe validation functions
export const safeValidateOperationalArea = (data: unknown) => OperationalAreaSchema.safeParse(data);
export const safeValidateOperationalStatus = (data: unknown) => OperationalStatusRecordSchema.safeParse(data);
export const safeValidateTrustIndicator = (data: unknown) => TrustIndicatorSchema.safeParse(data);
export const safeValidateLeadEvent = (data: unknown) => LeadEventSchema.safeParse(data);
export const safeValidateLeadPrediction = (data: unknown) => LeadPredictionSchema.safeParse(data);
export const safeValidateBusinessMetric = (data: unknown) => BusinessMetricSchema.safeParse(data);
export const safeValidateSecurityEvent = (data: unknown) => SecurityEventSchema.safeParse(data);
export const safeValidateContentSetting = (data: unknown) => ContentSettingSchema.safeParse(data);

// Request/Response validation
export const validateLeadOrchestrationRequest = (data: unknown) => LeadOrchestrationRequestSchema.parse(data);
export const validateBusinessIntelligenceRequest = (data: unknown) => BusinessIntelligenceRequestSchema.parse(data);
export const safeValidateLeadOrchestrationRequest = (data: unknown) => LeadOrchestrationRequestSchema.safeParse(data);
export const safeValidateBusinessIntelligenceRequest = (data: unknown) => BusinessIntelligenceRequestSchema.safeParse(data);