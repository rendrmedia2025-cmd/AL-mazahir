/**
 * Application Performance Monitoring and Alerting System
 * Tracks performance metrics, errors, and business KPIs
 * Requirements: 9.3, 10.2
 */

import { createClient } from '@/lib/supabase/client';
import { createServerClient } from '@/lib/supabase/server';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'score';
  timestamp: Date;
  context?: Record<string, any>;
  tags?: string[];
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: Date;
}

export interface BusinessMetric {
  name: string;
  value: number;
  category: string;
  date: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'slack' | 'webhook')[];
  isActive: boolean;
}

/**
 * Client-side monitoring service
 */
export class MonitoringService {
  private supabase = createClient();
  private metricsBuffer: PerformanceMetric[] = [];
  private errorsBuffer: ErrorEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeClientMonitoring();
    this.startPeriodicFlush();
  }

  /**
   * Track a performance metric
   */
  trackMetric(metric: PerformanceMetric): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date()
    });

    // Flush immediately for critical metrics
    if (metric.name.includes('error') || metric.value > 10000) {
      this.flushMetrics();
    }
  }

  /**
   * Track an error event
   */
  trackError(error: Omit<ErrorEvent, 'timestamp'>): void {
    const errorEvent: ErrorEvent = {
      ...error,
      timestamp: new Date()
    };

    this.errorsBuffer.push(errorEvent);

    // Flush immediately for high/critical errors
    if (error.severity === 'high' || error.severity === 'critical') {
      this.flushErrors();
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Track LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.trackMetric({
        name: 'web_vitals_lcp',
        value: lastEntry.startTime,
        unit: 'ms',
        timestamp: new Date(),
        context: { url: window.location.pathname }
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.trackMetric({
          name: 'web_vitals_fid',
          value: entry.processingStart - entry.startTime,
          unit: 'ms',
          timestamp: new Date(),
          context: { url: window.location.pathname }
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.trackMetric({
        name: 'web_vitals_cls',
        value: clsValue,
        unit: 'score',
        timestamp: new Date(),
        context: { url: window.location.pathname }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Track page load performance
   */
  trackPageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.trackMetric({
        name: 'page_load_time',
        value: navigation.loadEventEnd - navigation.fetchStart,
        unit: 'ms',
        timestamp: new Date(),
        context: { 
          url: window.location.pathname,
          referrer: document.referrer
        }
      });

      this.trackMetric({
        name: 'dom_content_loaded',
        value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        unit: 'ms',
        timestamp: new Date(),
        context: { url: window.location.pathname }
      });

      this.trackMetric({
        name: 'first_byte_time',
        value: navigation.responseStart - navigation.fetchStart,
        unit: 'ms',
        timestamp: new Date(),
        context: { url: window.location.pathname }
      });
    });
  }

  /**
   * Track API response times
   */
  trackApiCall(url: string, method: string, duration: number, status: number): void {
    this.trackMetric({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      context: { url, method, status },
      tags: [`api:${url}`, `method:${method}`, `status:${status}`]
    });

    // Track API errors
    if (status >= 400) {
      this.trackError({
        message: `API Error: ${method} ${url}`,
        severity: status >= 500 ? 'high' : 'medium',
        context: { url, method, status, duration }
      });
    }
  }

  /**
   * Track business events
   */
  trackBusinessEvent(event: string, properties?: Record<string, any>): void {
    this.trackMetric({
      name: `business_event_${event}`,
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      context: properties,
      tags: [`event:${event}`]
    });
  }

  private initializeClientMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        severity: 'high',
        context: {
          line: event.lineno,
          column: event.colno,
          url: window.location.pathname
        }
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        severity: 'high',
        context: {
          reason: event.reason,
          url: window.location.pathname
        }
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackMetric({
        name: 'page_visibility',
        value: document.hidden ? 0 : 1,
        unit: 'count',
        timestamp: new Date(),
        context: { url: window.location.pathname }
      });
    });
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.supabase
        .from('performance_metrics')
        .insert(
          metrics.map(metric => ({
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            timestamp: metric.timestamp.toISOString(),
            context: metric.context,
            tags: metric.tags,
            session_id: this.sessionId,
            url: typeof window !== 'undefined' ? window.location.pathname : null,
            user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
          }))
        );
    } catch (error) {
      console.warn('Failed to flush performance metrics:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics);
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorsBuffer.length === 0) return;

    const errors = [...this.errorsBuffer];
    this.errorsBuffer = [];

    try {
      await this.supabase
        .from('error_events')
        .insert(
          errors.map(error => ({
            message: error.message,
            stack: error.stack,
            url: error.url || (typeof window !== 'undefined' ? window.location.pathname : null),
            user_agent: error.userAgent || (typeof window !== 'undefined' ? navigator.userAgent : null),
            user_id: error.userId,
            session_id: error.sessionId || this.sessionId,
            severity: error.severity,
            context: error.context,
            timestamp: error.timestamp.toISOString()
          }))
        );
    } catch (error) {
      console.warn('Failed to flush error events:', error);
      // Re-add errors to buffer for retry
      this.errorsBuffer.unshift(...errors);
    }
  }

  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
      this.flushErrors();
    }, 30000); // Flush every 30 seconds
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up monitoring service
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushMetrics();
    this.flushErrors();
  }
}

/**
 * Server-side monitoring service
 */
export class ServerMonitoringService {
  private supabase = createServerClient();

  /**
   * Track server-side performance metric
   */
  async trackMetric(metric: PerformanceMetric): Promise<void> {
    try {
      await this.supabase
        .from('performance_metrics')
        .insert({
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp.toISOString(),
          context: metric.context,
          tags: metric.tags,
          server_side: true
        });
    } catch (error) {
      console.error('Failed to track server metric:', error);
    }
  }

  /**
   * Track server-side error
   */
  async trackError(error: ErrorEvent): Promise<void> {
    try {
      await this.supabase
        .from('error_events')
        .insert({
          message: error.message,
          stack: error.stack,
          url: error.url,
          user_agent: error.userAgent,
          user_id: error.userId,
          session_id: error.sessionId,
          severity: error.severity,
          context: error.context,
          timestamp: error.timestamp.toISOString(),
          server_side: true
        });

      // Trigger alerts for critical errors
      if (error.severity === 'critical') {
        await this.triggerAlert('critical_error', {
          message: error.message,
          timestamp: error.timestamp
        });
      }
    } catch (dbError) {
      console.error('Failed to track server error:', dbError);
    }
  }

  /**
   * Record business metric
   */
  async recordBusinessMetric(metric: BusinessMetric): Promise<void> {
    try {
      await this.supabase
        .from('business_metrics')
        .upsert({
          metric_name: metric.name,
          metric_value: metric.value,
          metric_date: metric.date,
          category: metric.category,
          metadata: metric.metadata
        }, {
          onConflict: 'metric_name,metric_date,category'
        });
    } catch (error) {
      console.error('Failed to record business metric:', error);
    }
  }

  /**
   * Get performance metrics for dashboard
   */
  async getPerformanceMetrics(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<any[]> {
    const hours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeRange];

    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select('*')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get error events for dashboard
   */
  async getErrorEvents(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<any[]> {
    const hours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[timeRange];

    let query = this.supabase
      .from('error_events')
      .select('*')
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch error events: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check alert rules and trigger alerts
   */
  async checkAlertRules(): Promise<void> {
    try {
      const { data: rules, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('is_active', true);

      if (error || !rules) {
        console.warn('Failed to fetch alert rules:', error);
        return;
      }

      for (const rule of rules) {
        await this.evaluateAlertRule(rule);
      }
    } catch (error) {
      console.error('Failed to check alert rules:', error);
    }
  }

  private async evaluateAlertRule(rule: AlertRule): Promise<void> {
    try {
      // Get recent metrics for this rule
      const { data: metrics, error } = await this.supabase
        .from('performance_metrics')
        .select('value, timestamp')
        .eq('name', rule.metric)
        .gte('timestamp', new Date(Date.now() - rule.timeWindow * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error || !metrics || metrics.length === 0) {
        return;
      }

      // Calculate aggregate value (average for now)
      const avgValue = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;

      // Check if alert condition is met
      let shouldAlert = false;
      switch (rule.condition) {
        case 'greater_than':
          shouldAlert = avgValue > rule.threshold;
          break;
        case 'less_than':
          shouldAlert = avgValue < rule.threshold;
          break;
        case 'equals':
          shouldAlert = avgValue === rule.threshold;
          break;
        case 'not_equals':
          shouldAlert = avgValue !== rule.threshold;
          break;
      }

      if (shouldAlert) {
        await this.triggerAlert(rule.name, {
          metric: rule.metric,
          value: avgValue,
          threshold: rule.threshold,
          condition: rule.condition,
          severity: rule.severity
        });
      }
    } catch (error) {
      console.error(`Failed to evaluate alert rule ${rule.name}:`, error);
    }
  }

  private async triggerAlert(alertName: string, data: any): Promise<void> {
    try {
      // Record alert in database
      await this.supabase
        .from('alerts')
        .insert({
          name: alertName,
          severity: data.severity || 'medium',
          message: `Alert triggered: ${alertName}`,
          data: data,
          triggered_at: new Date().toISOString(),
          status: 'active'
        });

      // Send notifications (implement based on channels)
      console.log(`🚨 ALERT: ${alertName}`, data);
      
      // TODO: Implement actual notification sending
      // - Email notifications
      // - Slack webhooks
      // - Custom webhooks
      
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }
}

// Singleton instances
export const monitoring = new MonitoringService();
export const serverMonitoring = new ServerMonitoringService();

// React hook for monitoring
export function useMonitoring() {
  return {
    trackMetric: monitoring.trackMetric.bind(monitoring),
    trackError: monitoring.trackError.bind(monitoring),
    trackBusinessEvent: monitoring.trackBusinessEvent.bind(monitoring),
    trackApiCall: monitoring.trackApiCall.bind(monitoring)
  };
}