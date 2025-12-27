/**
 * Enterprise Dynamic Platform - TypeScript Interfaces
 * Comprehensive type system for all business entities
 * Requirements: 1.1, 3.1, 4.1, 5.1
 */

// ============================================================================
// CORE ENTERPRISE ENUMS
// ============================================================================

export type OperationalStatus = 'optimal' | 'good' | 'limited' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type TrustIndicatorType = 'performance_metric' | 'certification' | 'testimonial' | 'case_study' | 'award' | 'compliance';
export type VerificationStatus = 'verified' | 'pending' | 'expired' | 'invalid';
export type DecisionAuthority = 'decision_maker' | 'influencer' | 'end_user' | 'gatekeeper';
export type BudgetRange = 'under_10k' | '10k_50k' | '50k_100k' | '100k_500k' | '500k_1m' | 'over_1m';
export type ProjectTimeline = 'immediate' | 'within_month' | 'within_quarter' | 'within_year' | 'planning_phase';
export type LeadPriority = 'low' | 'medium' | 'high' | 'critical';
export type InteractionType = 'page_view' | 'form_submission' | 'document_download' | 'email_click' | 'phone_call' | 'meeting' | 'quote_request';
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SystemHealthStatus = 'healthy' | 'degraded' | 'down';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type DeploymentStatus = 'pending' | 'success' | 'failed' | 'rollback' | 'cancelled';
export type ContentValueType = 'text' | 'json' | 'html' | 'markdown';
export type CommunicationType = 'email' | 'phone' | 'whatsapp' | 'meeting';
export type CommunicationDirection = 'inbound' | 'outbound';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// ============================================================================
// OPERATIONAL STATUS INTERFACES
// ============================================================================

export interface OperationalMetric {
  name: string;
  value: number;
  unit: string;
  target?: number;
  trend?: number;
}

export interface OperationalArea {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperationalStatusRecord {
  id: string;
  area_id: string;
  status: OperationalStatus;
  metrics: Record<string, any>;
  trend: TrendDirection;
  details?: string;
  last_updated: string;
  updated_by?: string;
  created_at: string;
}

export interface OperationalAreaStatus {
  id: string;
  name: string;
  status: OperationalStatus;
  metrics: OperationalMetric[];
  trend: TrendDirection;
  lastUpdated: string;
  details?: string;
}

// ============================================================================
// TRUST AUTHORITY INTERFACES
// ============================================================================

export interface TrustIndicator {
  id: string;
  type: TrustIndicatorType;
  title: string;
  value_text?: string;
  value_numeric?: number;
  verification_status: VerificationStatus;
  verification_url?: string;
  display_priority: number;
  is_active: boolean;
  last_updated: string;
  created_at: string;
}

export interface PerformanceMetric {
  name: string;
  currentValue: number;
  target?: number;
  trend: TrendData;
  benchmark?: IndustryBenchmark;
  verification: VerificationStatus;
}

export interface TrendData {
  direction: TrendDirection;
  percentage: number;
  period: string;
}

export interface IndustryBenchmark {
  value: number;
  percentile: number;
  source: string;
}

// ============================================================================
// ENHANCED LEAD INTELLIGENCE INTERFACES
// ============================================================================

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface CompanyInfo {
  name?: string;
  size?: string;
  industry_sector?: string;
}

export interface ProjectInfo {
  timeline: ProjectTimeline;
  budget_range?: BudgetRange;
  quantity_estimate?: string;
  description?: string;
}

export interface LeadProfile {
  contact: ContactInfo;
  company: CompanyInfo;
  project: ProjectInfo;
  authority: DecisionAuthority;
}

export interface DeviceInfo {
  type?: 'mobile' | 'tablet' | 'desktop';
  user_agent?: string;
  screen_resolution?: string;
  browser?: string;
}

export interface InteractionPattern {
  session_duration: number;
  pages_per_session: number;
  bounce_rate: number;
  return_visitor: boolean;
}

export interface PageView {
  url: string;
  title: string;
  duration: number;
  timestamp: string;
}

export interface BehaviorData {
  pageViews: PageView[];
  engagementTime: number;
  documentsDownloaded: string[];
  interactionPattern: InteractionPattern;
  deviceInfo: DeviceInfo;
}

export interface LeadScore {
  total: number;
  breakdown: {
    profile: number;
    behavior: number;
    engagement: number;
    urgency: number;
  };
  lastCalculated: string;
}

export interface RoutingDecision {
  assignedTo?: string;
  teamName?: string;
  priority: LeadPriority;
  estimatedResponseTime: number;
  recommendedApproach: string;
  confidence: number;
}

export interface LeadEvent {
  id: string;
  event_type: InteractionType;
  event_data: Record<string, any>;
  page_url?: string;
  session_id?: string;
  duration_seconds?: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface LeadPrediction {
  id: string;
  prediction_type: string;
  probability: number;
  confidence_level: number;
  model_version: string;
  prediction_data: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface EnhancedLead {
  id: string;
  // Basic info (existing)
  name: string;
  company?: string;
  phone?: string;
  email: string;
  product_category?: string;
  urgency: 'immediate' | '1-2_weeks' | 'planning';
  quantity_estimate?: string;
  message?: string;
  source_section?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  user_agent?: string;
  referrer?: string;
  ip_address?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  assigned_to?: string;
  
  // Enhanced intelligence fields
  company_size?: string;
  industry_sector?: string;
  decision_authority?: DecisionAuthority;
  budget_range?: BudgetRange;
  project_timeline?: ProjectTimeline;
  lead_score: number;
  priority: LeadPriority;
  routing_notes?: string;
  conversion_probability?: number;
  last_interaction?: string;
  total_engagement_time: number;
  page_views_count: number;
  documents_downloaded: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LEAD MANAGEMENT INTERFACES
// ============================================================================

export interface LeadScoringRule {
  id: string;
  name: string;
  description?: string;
  condition_field: string;
  condition_operator: string;
  condition_value: string;
  score_points: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadRoutingRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  conditions: Record<string, any>;
  assigned_to?: string;
  team_name?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFollowupTask {
  id: string;
  lead_id: string;
  task_type: string;
  title: string;
  description?: string;
  due_date: string;
  assigned_to?: string;
  status: TaskStatus;
  priority: LeadPriority;
  automated: boolean;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCommunication {
  id: string;
  lead_id: string;
  communication_type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content?: string;
  sent_by?: string;
  sent_at: string;
  response_received: boolean;
  response_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LeadBehaviorAnalytics {
  id: string;
  lead_id: string;
  session_id: string;
  total_session_time: number;
  pages_visited: number;
  bounce_rate?: number;
  engagement_score?: number;
  device_info: Record<string, any>;
  location_data: Record<string, any>;
  referrer_data: Record<string, any>;
  conversion_events: any[];
  session_start: string;
  session_end?: string;
  created_at: string;
}

// ============================================================================
// BUSINESS INTELLIGENCE INTERFACES
// ============================================================================

export interface BusinessMetric {
  id: string;
  metric_name: string;
  metric_category: string;
  value: number;
  target_value?: number;
  unit?: string;
  measurement_date: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_category: string;
  event_data: Record<string, any>;
  user_session?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: string;
  version: string;
  accuracy?: number;
  training_data_size?: number;
  last_trained?: string;
  model_parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// MONITORING AND SECURITY INTERFACES
// ============================================================================

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: SecurityEventSeverity;
  description: string;
  ip_address?: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface SessionActivity {
  id: string;
  user_id: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  activity_type: string;
  url?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface PerformanceMetricRecord {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, any>;
  tags?: string[];
  session_id?: string;
  user_id?: string;
  url?: string;
  user_agent?: string;
  server_side: boolean;
  created_at: string;
}

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  url?: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  severity: SecurityEventSeverity;
  context?: Record<string, any>;
  timestamp: string;
  server_side: boolean;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  time_window: number;
  severity: SecurityEventSeverity;
  channels: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  name: string;
  severity: SecurityEventSeverity;
  message: string;
  data?: Record<string, any>;
  triggered_at: string;
  status: AlertStatus;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  alert_rule_id?: string;
  created_at: string;
}

export interface SystemHealth {
  id: string;
  component: string;
  status: SystemHealthStatus;
  response_time_ms?: number;
  error_rate?: number;
  last_check: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// DEPLOYMENT AND OPERATIONS INTERFACES
// ============================================================================

export interface Deployment {
  id: string;
  commit_sha: string;
  deployment_url?: string;
  environment: string;
  status: DeploymentStatus;
  deployed_at: string;
  completed_at?: string;
  deployed_by?: string;
  metadata?: Record<string, any>;
  rollback_target_id?: string;
  health_check_passed?: boolean;
  performance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface DeploymentHealthCheck {
  id: string;
  deployment_id: string;
  check_name: string;
  status: 'passed' | 'failed' | 'warning';
  response_time_ms?: number;
  error_message?: string;
  checked_at: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONTENT MANAGEMENT INTERFACES
// ============================================================================

export interface ContentSetting {
  id: string;
  section: string;
  key: string;
  value?: string;
  value_type: ContentValueType;
  is_active: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface StatusEngineResponse {
  success: boolean;
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

export interface LeadOrchestrationRequest {
  leadData: Omit<EnhancedLead, 'id' | 'created_at' | 'updated_at' | 'lead_score' | 'priority' | 'total_engagement_time' | 'page_views_count' | 'documents_downloaded'>;
  behaviorContext: BehaviorData;
  sourceMetadata: Record<string, any>;
}

export interface AutomatedAction {
  type: string;
  description: string;
  scheduled_at?: string;
  parameters: Record<string, any>;
}

export interface RecommendedAction {
  type: string;
  title: string;
  description: string;
  priority: LeadPriority;
  estimated_effort: number;
}

export interface LeadOrchestrationResponse {
  success: boolean;
  leadId: string;
  leadScore: number;
  routingDecision: RoutingDecision;
  automatedActions: AutomatedAction[];
  nextSteps: RecommendedAction[];
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface AnalyticsFilter {
  field: string;
  operator: string;
  value: any;
}

export interface AggregationConfig {
  groupBy: string[];
  metrics: string[];
  timeGrain?: string;
}

export interface BusinessIntelligenceRequest {
  dashboard: string;
  timeRange: TimeRange;
  filters: AnalyticsFilter[];
  aggregation: AggregationConfig;
}

export interface TrendAnalysis {
  metric: string;
  trend: TrendDirection;
  change_percentage: number;
  period: string;
  significance: number;
}

export interface PredictiveInsight {
  type: string;
  prediction: any;
  confidence: number;
  time_horizon: string;
  factors: string[];
}

export interface BusinessIntelligenceResponse {
  success: boolean;
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
  };
}

// ============================================================================
// DASHBOARD AND UI INTERFACES
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: 'metrics' | 'chart' | 'table' | 'status' | 'alerts';
  title: string;
  dataSource: string;
  configuration: Record<string, any>;
  position: GridPosition;
}

export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardConfiguration {
  layout: 'executive' | 'operational' | 'analytical';
  widgets: DashboardWidget[];
  refreshInterval: number;
  alertThresholds: AlertThreshold[];
}

export interface AlertThreshold {
  metric: string;
  warning: number;
  critical: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  full_name?: string;
  last_login?: string;
  is_active: boolean;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

export interface RealTimeStatusEngineProps {
  layout: 'dashboard' | 'compact' | 'detailed';
  operationalAreas: OperationalAreaStatus[];
  updateInterval: number;
  showTrends: boolean;
  className?: string;
}

export interface EnterpriseAdminCommandCenterProps {
  user: AdminUser;
  permissions: Permission[];
  dashboardConfig: DashboardConfiguration;
  realTimeData: boolean;
}

export interface IntelligentLeadOrchestrationProps {
  leadSources: LeadSource[];
  routingRules: LeadRoutingRule[];
  scoringModel: ScoringModel;
  automationConfig: AutomationConfig;
}

export interface LeadSource {
  id: string;
  name: string;
  type: string;
  configuration: Record<string, any>;
}

export interface ScoringModel {
  version: string;
  rules: LeadScoringRule[];
  weights: Record<string, number>;
}

export interface AutomationConfig {
  enabled: boolean;
  rules: AutomationRule[];
  defaultActions: AutomatedAction[];
}

export interface AutomationRule {
  id: string;
  name: string;
  conditions: Record<string, any>;
  actions: AutomatedAction[];
  is_active: boolean;
}

export interface TrustAuthorityFrameworkProps {
  trustIndicators: TrustIndicator[];
  certifications: Certification[];
  testimonials: Testimonial[];
  performanceMetrics: PerformanceMetric[];
  layout: 'comprehensive' | 'compact' | 'focused';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issued_date: string;
  expiry_date?: string;
  verification_url?: string;
  status: VerificationStatus;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  position: string;
  content: string;
  rating: number;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DatabaseInsert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

export type DatabaseUpdate<T> = Partial<DatabaseInsert<T>>;

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export * from './database';