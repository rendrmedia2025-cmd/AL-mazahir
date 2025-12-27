/**
 * Progressive enhancement utilities for graceful degradation
 * Ensures functionality works without JavaScript and enhances with JS
 */

import React from 'react';

/**
 * Check if JavaScript is enabled and working
 */
export function isJavaScriptEnabled(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Check if the browser supports modern features
 */
export function isModernBrowser(): boolean {
  if (!isJavaScriptEnabled()) return false
  
  return !!(
    typeof window.fetch === 'function' &&
    typeof window.Promise === 'function' &&
    typeof window.IntersectionObserver === 'function' &&
    typeof document.querySelector === 'function' &&
    Array.prototype.includes
  )
}

/**
 * Check if the user is online
 */
export function isOnline(): boolean {
  if (!isJavaScriptEnabled()) return true // Assume online if no JS
  return navigator.onLine
}

/**
 * Progressive enhancement hook for React components
 */
export function useProgressiveEnhancement() {
  const [isEnhanced, setIsEnhanced] = React.useState(false)
  const [isOnlineStatus, setIsOnlineStatus] = React.useState(true)

  React.useEffect(() => {
    // Enable enhancements after hydration
    setIsEnhanced(isModernBrowser())
    setIsOnlineStatus(isOnline())

    // Listen for online/offline events
    const handleOnline = () => setIsOnlineStatus(true)
    const handleOffline = () => setIsOnlineStatus(false)

    if (isJavaScriptEnabled()) {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return {
    isEnhanced,
    isOnline: isOnlineStatus,
    canUseAdvancedFeatures: isEnhanced && isOnlineStatus
  }
}

/**
 * Graceful degradation wrapper for dynamic components
 */
export function withGracefulDegradation<P extends object>(
  EnhancedComponent: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<P>,
  options: {
    requiresOnline?: boolean
    requiresModernBrowser?: boolean
    loadingComponent?: React.ComponentType<P>
  } = {}
) {
  return function GracefullyDegradedComponent(props: P) {
    const { isEnhanced, isOnline } = useProgressiveEnhancement()
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
      // Small delay to prevent flash of loading state
      const timer = setTimeout(() => setIsLoading(false), 100)
      return () => clearTimeout(timer)
    }, [])

    // Show loading component if provided
    if (isLoading && options.loadingComponent) {
      const LoadingComponent = options.loadingComponent
      return React.createElement(LoadingComponent, props)
    }

    // Check requirements
    const needsOnline = options.requiresOnline ?? true
    const needsModernBrowser = options.requiresModernBrowser ?? true

    const shouldUseEnhanced = 
      (!needsModernBrowser || isEnhanced) &&
      (!needsOnline || isOnline)

    return shouldUseEnhanced 
      ? React.createElement(EnhancedComponent, props)
      : React.createElement(FallbackComponent, props)
  }
}

/**
 * Create a no-JavaScript fallback form
 */
export function createNoJSForm(
  action: string,
  method: 'GET' | 'POST' = 'POST',
  fields: Array<{
    name: string
    type: string
    label: string
    required?: boolean
    placeholder?: string
    options?: Array<{ value: string; label: string }>
  }>
): string {
  const fieldHTML = fields.map(field => {
    if (field.type === 'select' && field.options) {
      return `
        <div class="form-field">
          <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
          <select name="${field.name}" id="${field.name}" ${field.required ? 'required' : ''}>
            <option value="">Select an option</option>
            ${field.options.map(option => 
              `<option value="${option.value}">${option.label}</option>`
            ).join('')}
          </select>
        </div>
      `
    } else if (field.type === 'textarea') {
      return `
        <div class="form-field">
          <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
          <textarea 
            name="${field.name}" 
            id="${field.name}" 
            ${field.required ? 'required' : ''}
            placeholder="${field.placeholder || ''}"
            rows="4"
          ></textarea>
        </div>
      `
    } else {
      return `
        <div class="form-field">
          <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
          <input 
            type="${field.type}" 
            name="${field.name}" 
            id="${field.name}" 
            ${field.required ? 'required' : ''}
            placeholder="${field.placeholder || ''}"
          />
        </div>
      `
    }
  }).join('')

  return `
    <form action="${action}" method="${method}" class="no-js-form">
      ${fieldHTML}
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Submit</button>
      </div>
    </form>
  `
}

/**
 * Fallback state management for components
 */
export class FallbackStateManager {
  private static instance: FallbackStateManager
  private fallbackStates: Map<string, any> = new Map()

  static getInstance(): FallbackStateManager {
    if (!FallbackStateManager.instance) {
      FallbackStateManager.instance = new FallbackStateManager()
    }
    return FallbackStateManager.instance
  }

  setFallbackState(componentId: string, state: any): void {
    this.fallbackStates.set(componentId, state)
  }

  getFallbackState(componentId: string): any {
    return this.fallbackStates.get(componentId)
  }

  clearFallbackState(componentId: string): void {
    this.fallbackStates.delete(componentId)
  }

  getAllFallbackStates(): Record<string, any> {
    return Object.fromEntries(this.fallbackStates)
  }
}

/**
 * Progressive enhancement for availability indicators
 */
export function createAvailabilityFallback(categoryId: string): {
  html: string
  css: string
} {
  return {
    html: `
      <div class="availability-fallback" data-category="${categoryId}">
        <span class="status-dot status-unknown"></span>
        <span class="status-text">Contact for availability</span>
      </div>
    `,
    css: `
      .availability-fallback {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .status-dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        background-color: #9ca3af;
      }
      .status-text {
        font-size: 0.875rem;
        color: #6b7280;
      }
    `
  }
}

/**
 * Progressive enhancement for CTA buttons
 */
export function createCTAFallback(categoryId: string): {
  html: string
  css: string
} {
  return {
    html: `
      <div class="cta-fallback" data-category="${categoryId}">
        <a href="#contact" class="btn btn-primary">Enquire Now</a>
      </div>
    `,
    css: `
      .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        text-decoration: none;
        font-weight: 500;
        text-align: center;
        transition: all 0.2s;
      }
      .btn-primary {
        background-color: #dc2626;
        color: white;
        border: 1px solid #dc2626;
      }
      .btn-primary:hover {
        background-color: #b91c1c;
        border-color: #b91c1c;
      }
    `
  }
}

/**
 * Progressive enhancement for forms
 */
export function createFormFallback(): {
  html: string
  css: string
} {
  return {
    html: `
      <div class="form-fallback">
        <h3>Contact Us</h3>
        <p>Please contact us directly:</p>
        <div class="contact-methods">
          <div class="contact-method">
            <strong>Phone:</strong> 
            <a href="tel:+966501234567">+966 50 123 4567</a>
          </div>
          <div class="contact-method">
            <strong>Email:</strong> 
            <a href="mailto:info@almazahir.com">info@almazahir.com</a>
          </div>
          <div class="contact-method">
            <strong>WhatsApp:</strong> 
            <a href="https://wa.me/966501234567" target="_blank">+966 50 123 4567</a>
          </div>
        </div>
      </div>
    `,
    css: `
      .form-fallback {
        padding: 2rem;
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
      }
      .form-fallback h3 {
        margin-bottom: 1rem;
        color: #1f2937;
      }
      .contact-methods {
        margin-top: 1rem;
      }
      .contact-method {
        margin-bottom: 0.5rem;
      }
      .contact-method a {
        color: #dc2626;
        text-decoration: none;
      }
      .contact-method a:hover {
        text-decoration: underline;
      }
    `
  }
}

/**
 * Inject fallback CSS for no-JS scenarios
 */
export function injectFallbackCSS(): void {
  if (!isJavaScriptEnabled()) return

  const css = `
    /* Fallback styles for progressive enhancement */
    .no-js .js-only {
      display: none !important;
    }
    
    .no-js .no-js-fallback {
      display: block !important;
    }
    
    /* Default hidden state for fallbacks */
    .no-js-fallback {
      display: none;
    }
    
    /* Loading states */
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Offline indicators */
    .offline-indicator {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
    }
  `

  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

/**
 * Setup progressive enhancement on page load
 */
export function setupProgressiveEnhancement(): void {
  if (!isJavaScriptEnabled()) return

  // Remove no-js class if present
  document.documentElement.classList.remove('no-js')
  document.documentElement.classList.add('js')

  // Inject fallback CSS
  injectFallbackCSS()

  // Setup online/offline indicators
  const updateOnlineStatus = () => {
    document.documentElement.classList.toggle('offline', !navigator.onLine)
    document.documentElement.classList.toggle('online', navigator.onLine)
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()

  // Setup feature detection
  document.documentElement.classList.toggle('modern-browser', isModernBrowser())
}

export default {
  isJavaScriptEnabled,
  isModernBrowser,
  isOnline,
  useProgressiveEnhancement,
  withGracefulDegradation,
  createNoJSForm,
  FallbackStateManager,
  createAvailabilityFallback,
  createCTAFallback,
  createFormFallback,
  injectFallbackCSS,
  setupProgressiveEnhancement
}