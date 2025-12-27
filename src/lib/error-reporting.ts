/**
 * Error reporting and logging utilities for the dynamic enhancement layer
 * Provides centralized error handling, reporting, and monitoring
 */

export interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  context: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  url?: string
  userAgent?: string
  timestamp: number
  userId?: string
  sessionId?: string
  additionalData?: Record<string, any>
}

export interface ComponentError extends ErrorReport {
  componentName: string
  props?: Record<string, any>
  state?: Record<string, any>
}

/**
 * Report error to monitoring service
 */
export async function reportError(error: ErrorReport): Promise<void> {
  try {
    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error)
    })

    if (!response.ok) {
      throw new Error(`Error reporting failed: ${response.status}`)
    }
  } catch (reportingError) {
    // Fallback to console logging if reporting fails
    console.error('Failed to report error to monitoring service:', reportingError)
    console.error('Original error:', error)
    
    // Store in localStorage as fallback
    try {
      const storedErrors = JSON.parse(localStorage.getItem('failedErrorReports') || '[]')
      storedErrors.push({
        ...error,
        reportingError: reportingError.message,
        failedAt: Date.now()
      })
      
      // Keep only last 10 failed reports
      if (storedErrors.length > 10) {
        storedErrors.splice(0, storedErrors.length - 10)
      }
      
      localStorage.setItem('failedErrorReports', JSON.stringify(storedErrors))
    } catch (storageError) {
      console.warn('Failed to store error report in localStorage:', storageError)
    }
  }
}

/**
 * Report component-specific error
 */
export async function reportComponentError(
  error: Error,
  componentName: string,
  props?: Record<string, any>,
  state?: Record<string, any>,
  additionalContext?: Record<string, any>
): Promise<void> {
  const componentError: ComponentError = {
    message: error.message,
    stack: error.stack,
    context: `component_${componentName.toLowerCase()}`,
    severity: 'high',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timestamp: Date.now(),
    componentName,
    props: props ? sanitizeProps(props) : undefined,
    state: state ? sanitizeState(state) : undefined,
    additionalData: additionalContext
  }

  await reportError(componentError)
}

/**
 * Report network/API error
 */
export async function reportNetworkError(
  error: Error,
  endpoint: string,
  method: string = 'GET',
  requestData?: any
): Promise<void> {
  const networkError: ErrorReport = {
    message: `Network error: ${error.message}`,
    stack: error.stack,
    context: 'network_request',
    severity: 'medium',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timestamp: Date.now(),
    additionalData: {
      endpoint,
      method,
      requestData: requestData ? sanitizeRequestData(requestData) : undefined,
      networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : undefined
    }
  }

  await reportError(networkError)
}

/**
 * Report admin action error
 */
export async function reportAdminError(
  error: Error,
  action: string,
  userId?: string,
  additionalContext?: Record<string, any>
): Promise<void> {
  const adminError: ErrorReport = {
    message: `Admin error: ${error.message}`,
    stack: error.stack,
    context: 'admin_action',
    severity: 'critical',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timestamp: Date.now(),
    userId,
    additionalData: {
      action,
      ...additionalContext
    }
  }

  await reportError(adminError)
}

/**
 * Sanitize props for error reporting (remove sensitive data)
 */
function sanitizeProps(props: Record<string, any>): Record<string, any> {
  const sanitized = { ...props }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'auth']
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  })

  // Truncate large values
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '...[TRUNCATED]'
    }
  })

  return sanitized
}

/**
 * Sanitize state for error reporting
 */
function sanitizeState(state: Record<string, any>): Record<string, any> {
  const sanitized = { ...state }
  
  // Remove sensitive state
  const sensitiveFields = ['password', 'token', 'credentials', 'auth']
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  })

  return sanitized
}

/**
 * Sanitize request data for error reporting
 */
function sanitizeRequestData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data }
  
  // Remove sensitive request data
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'auth', 'authorization']
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  })

  return sanitized
}

/**
 * Create error boundary error handler
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Error in ${componentName}:`, error, errorInfo)
    
    reportComponentError(
      error,
      componentName,
      undefined,
      undefined,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    ).catch(reportingError => {
      console.warn('Failed to report error boundary error:', reportingError)
    })
  }
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return

  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    reportError({
      message: event.message,
      stack: event.error?.stack,
      context: 'global_error',
      severity: 'high',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    }).catch(console.warn)
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      context: 'unhandled_promise',
      severity: 'high',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      additionalData: {
        reason: event.reason
      }
    }).catch(console.warn)
  })

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement
      reportError({
        message: `Resource loading failed: ${target.tagName}`,
        context: 'resource_loading',
        severity: 'medium',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        additionalData: {
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
          outerHTML: target.outerHTML?.substring(0, 200)
        }
      }).catch(console.warn)
    }
  }, true)
}

/**
 * Retry failed error reports from localStorage
 */
export async function retryFailedErrorReports(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const failedReports = JSON.parse(localStorage.getItem('failedErrorReports') || '[]')
    
    if (failedReports.length === 0) return

    console.log(`Retrying ${failedReports.length} failed error reports...`)

    const retryPromises = failedReports.map(async (report: any) => {
      try {
        await reportError(report)
        return true
      } catch (error) {
        console.warn('Failed to retry error report:', error)
        return false
      }
    })

    const results = await Promise.allSettled(retryPromises)
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length

    console.log(`Successfully retried ${successCount}/${failedReports.length} error reports`)

    // Remove successfully retried reports
    if (successCount > 0) {
      const remainingReports = failedReports.filter((_, index) => {
        const result = results[index]
        return !(result.status === 'fulfilled' && result.value === true)
      })
      
      localStorage.setItem('failedErrorReports', JSON.stringify(remainingReports))
    }
  } catch (error) {
    console.warn('Failed to retry error reports:', error)
  }
}

export default {
  reportError,
  reportComponentError,
  reportNetworkError,
  reportAdminError,
  createErrorBoundaryHandler,
  setupGlobalErrorHandling,
  retryFailedErrorReports
}