// Google Analytics integration with enhanced error tracking and performance monitoring
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Enhanced error tracking
export const trackError = (error: Error, context?: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
  console.error(`[${severity.toUpperCase()}] ${context || 'Application Error'}:`, error);
  
  event({
    action: 'error',
    category: 'errors',
    label: `${context || 'unknown'}: ${error.message}`,
    value: severity === 'high' ? 3 : severity === 'medium' ? 2 : 1
  });

  // Send detailed error information to monitoring endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        severity,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    }).catch(err => {
      console.warn('Failed to send error report:', err);
    });
  }
};

// Track API performance
export const trackAPIPerformance = (
  endpoint: string,
  method: string,
  duration: number,
  status: number,
  cacheHit?: boolean
) => {
  event({
    action: 'api_performance',
    category: 'performance',
    label: `${method} ${endpoint}`,
    value: Math.round(duration)
  });

  // Log slow API calls
  if (duration > 1000) {
    console.warn(`Slow API call: ${method} ${endpoint} took ${duration}ms`);
    trackError(
      new Error(`Slow API response: ${duration}ms`),
      `${method} ${endpoint}`,
      duration > 3000 ? 'high' : 'medium'
    );
  }

  // Track cache effectiveness
  if (cacheHit !== undefined) {
    event({
      action: 'cache_hit',
      category: 'performance',
      label: endpoint,
      value: cacheHit ? 1 : 0
    });
  }
};

// Track dynamic feature performance
export const trackDynamicFeature = (
  featureName: string,
  action: 'load' | 'interact' | 'error',
  duration?: number,
  metadata?: Record<string, any>
) => {
  event({
    action: `dynamic_feature_${action}`,
    category: 'dynamic_features',
    label: featureName,
    value: duration ? Math.round(duration) : undefined
  });

  if (action === 'error') {
    trackError(
      new Error(`Dynamic feature error: ${featureName}`),
      `dynamic_feature_${featureName}`,
      'medium'
    );
  }
};

// Predefined event tracking functions
export const trackFormSubmission = (formType: 'contact' | 'inquiry' | 'smart_enquiry', duration?: number) => {
  event({
    action: 'form_submit',
    category: 'engagement',
    label: formType,
    value: duration ? Math.round(duration) : undefined
  });
};

export const trackWhatsAppClick = (productCategory?: string) => {
  event({
    action: 'whatsapp_click',
    category: 'communication',
    label: productCategory || 'general',
  });
};

export const trackProductInquiry = (productCategory: string, urgency?: string) => {
  event({
    action: 'product_inquiry',
    category: 'products',
    label: `${productCategory}${urgency ? `_${urgency}` : ''}`,
  });
};

export const trackCTAClick = (ctaType: 'primary' | 'secondary', location: string, availability?: string) => {
  event({
    action: 'cta_click',
    category: 'engagement',
    label: `${ctaType}_${location}${availability ? `_${availability}` : ''}`,
  });
};

export const trackScrollDepth = (percentage: number) => {
  event({
    action: 'scroll_depth',
    category: 'engagement',
    label: `${percentage}%`,
    value: percentage,
  });
};

export const trackAvailabilityCheck = (categoryId: string, status: string, loadTime?: number) => {
  event({
    action: 'availability_check',
    category: 'dynamic_features',
    label: `${categoryId}_${status}`,
    value: loadTime ? Math.round(loadTime) : undefined
  });
};

export const trackAdminAction = (action: string, resource: string, success: boolean) => {
  event({
    action: 'admin_action',
    category: 'admin',
    label: `${action}_${resource}`,
    value: success ? 1 : 0
  });
};

// Performance tracking
export const trackWebVitals = (metric: {
  name: string;
  value: number;
  id: string;
  rating?: string;
}) => {
  event({
    action: 'web_vitals',
    category: 'performance',
    label: metric.name,
    value: Math.round(metric.value),
  });

  // Alert on poor performance
  if (metric.rating === 'poor') {
    trackError(
      new Error(`Poor ${metric.name}: ${metric.value}`),
      'web_vitals',
      'high'
    );
  }
};

// Business metrics tracking
export const trackBusinessMetric = (
  metric: string,
  value: number,
  category: 'leads' | 'availability' | 'content' | 'engagement'
) => {
  event({
    action: 'business_metric',
    category: 'business',
    label: `${category}_${metric}`,
    value: Math.round(value)
  });
};

// Initialize error boundary tracking
export const initializeErrorTracking = () => {
  if (typeof window === 'undefined') return;

  // Global error handler
  window.addEventListener('error', (event) => {
    trackError(
      new Error(event.message),
      `${event.filename}:${event.lineno}:${event.colno}`,
      'high'
    );
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      'unhandled_promise',
      'high'
    );
  });

  // Resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      trackError(
        new Error(`Resource loading failed: ${target.tagName}`),
        'resource_loading',
        'medium'
      );
    }
  }, true);
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}