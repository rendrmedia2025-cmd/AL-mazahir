'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  eventId?: string
}

/**
 * Comprehensive Error Boundary for dynamic components
 * Provides graceful fallback UI and error reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique event ID for error tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      eventId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo })

    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    // Reset error state when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || []
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevResetKeys[idx] !== resetKey
      )

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Send error report to monitoring endpoint
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          context: 'error_boundary',
          severity: 'high',
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          timestamp: Date.now(),
          eventId: this.state.eventId
        })
      })
    } catch (reportingError) {
      console.warn('Failed to report error to monitoring service:', reportingError)
    }
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      eventId: undefined
    })
  }

  private handleRetry = () => {
    this.resetErrorBoundary()
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    const { hasError, error, eventId } = this.state
    const { children, fallback, className = '' } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <div className={className}>{fallback}</div>
      }

      // Default error UI
      return (
        <div className={`error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Something went wrong
              </h3>
              <p className="text-red-700 mb-4">
                We're sorry, but this section encountered an error. Our team has been notified.
              </p>
              
              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}

              {/* Event ID for support */}
              {eventId && (
                <p className="text-xs text-red-600 mb-4">
                  Error ID: {eventId}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReload}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Reload Page
                </Button>
              </div>

              {/* Contact information */}
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-sm text-red-600">
                  If this problem persists, please contact us:
                </p>
                <div className="mt-2 text-sm text-red-700">
                  <p>Phone: +966 50 123 4567</p>
                  <p>Email: info@almazahir.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return <div className={className}>{children}</div>
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // Report error to monitoring service
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context: 'use_error_handler',
        severity: 'medium',
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now()
      })
    }).catch(reportingError => {
      console.warn('Failed to report error:', reportingError)
    })
  }
}

/**
 * Specialized error boundary for dynamic components
 */
export function DynamicComponentErrorBoundary({ 
  children, 
  componentName,
  className = ''
}: { 
  children: ReactNode
  componentName: string
  className?: string
}) {
  const fallback = (
    <div className="dynamic-component-error p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-yellow-800">
            {componentName} temporarily unavailable
          </p>
          <p className="text-xs text-yellow-600">
            Please refresh the page or contact us if this persists
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <ErrorBoundary 
      fallback={fallback}
      className={className}
      onError={(error, errorInfo) => {
        console.error(`Error in ${componentName}:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary