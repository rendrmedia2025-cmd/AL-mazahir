'use client'

import React, { ComponentType, ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface WithErrorBoundaryOptions {
  fallback?: ReactNode
  componentName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  className?: string
}

/**
 * Higher-order component that wraps components with error boundaries
 * Provides automatic error handling and graceful fallbacks for dynamic components
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const {
    fallback,
    componentName = Component.displayName || Component.name || 'Component',
    onError,
    resetOnPropsChange = false,
    resetKeys,
    className = ''
  } = options

  const WrappedComponent = (props: P) => {
    // Create reset keys from props if resetOnPropsChange is enabled
    const dynamicResetKeys = resetOnPropsChange && !resetKeys 
      ? Object.values(props).filter(value => 
          typeof value === 'string' || typeof value === 'number'
        ) as Array<string | number>
      : resetKeys

    return (
      <ErrorBoundary
        fallback={fallback}
        onError={(error, errorInfo) => {
          // Log component-specific error
          console.error(`Error in ${componentName}:`, error, errorInfo)
          
          // Call custom error handler
          if (onError) {
            onError(error, errorInfo)
          }

          // Report to monitoring with component context
          fetch('/api/monitoring/errors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
              context: `component_${componentName.toLowerCase()}`,
              severity: 'high',
              url: typeof window !== 'undefined' ? window.location.href : '',
              userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
              timestamp: Date.now(),
              componentName,
              props: JSON.stringify(props, null, 2)
            })
          }).catch(reportingError => {
            console.warn('Failed to report component error:', reportingError)
          })
        }}
        resetOnPropsChange={resetOnPropsChange}
        resetKeys={dynamicResetKeys}
        className={className}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${componentName})`
  
  return WrappedComponent
}

/**
 * Specialized HOC for dynamic components with built-in fallbacks
 */
export function withDynamicErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallbackComponent: ComponentType<any>,
  componentName?: string
) {
  return withErrorBoundary(Component, {
    fallback: React.createElement(fallbackComponent),
    componentName: componentName || Component.displayName || Component.name,
    resetOnPropsChange: true,
    onError: (error, errorInfo) => {
      console.warn(`Dynamic component ${componentName} failed:`, error.message)
    }
  })
}

/**
 * HOC specifically for admin components with enhanced error reporting
 */
export function withAdminErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
) {
  return withErrorBoundary(Component, {
    componentName: componentName || Component.displayName || Component.name,
    resetOnPropsChange: true,
    onError: (error, errorInfo) => {
      // Enhanced logging for admin components
      console.error(`Admin component error in ${componentName}:`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })

      // Send high-priority alert for admin component failures
      fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          context: 'admin_component_failure',
          severity: 'critical',
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          timestamp: Date.now(),
          componentName,
          alertType: 'admin_failure'
        })
      }).catch(reportingError => {
        console.warn('Failed to report admin component error:', reportingError)
      })
    },
    fallback: (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <svg className="w-8 h-8 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Admin Component Error
          </h3>
          <p className="text-red-700 mb-4">
            This admin feature is temporarily unavailable. The error has been logged.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  })
}

/**
 * HOC for API-dependent components with network error handling
 */
export function withNetworkErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
) {
  return withErrorBoundary(Component, {
    componentName: componentName || Component.displayName || Component.name,
    resetOnPropsChange: true,
    onError: (error, errorInfo) => {
      // Check if error is network-related
      const isNetworkError = error.message.includes('fetch') || 
                           error.message.includes('network') ||
                           error.message.includes('Failed to load')

      if (isNetworkError) {
        console.warn(`Network error in ${componentName}:`, error.message)
      } else {
        console.error(`Component error in ${componentName}:`, error, errorInfo)
      }
    },
    fallback: (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Content temporarily unavailable
            </p>
            <p className="text-xs text-yellow-600">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </div>
    )
  })
}

export default withErrorBoundary