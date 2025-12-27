/**
 * Component integration utilities for connecting dynamic and static components
 * Provides seamless integration between existing website components and new dynamic features
 */

import { ProductCategory } from '@/lib/types'
import { productCategories } from '@/lib/data/products'

/**
 * Integration context for sharing data between components
 */
export interface IntegrationContext {
  selectedProductCategory?: string
  availabilityData?: Record<string, any>
  leadData?: Record<string, any>
  userPreferences?: Record<string, any>
}

/**
 * Global integration state manager
 */
class ComponentIntegrationManager {
  private static instance: ComponentIntegrationManager
  private context: IntegrationContext = {}
  private subscribers: Map<string, (context: IntegrationContext) => void> = new Map()

  static getInstance(): ComponentIntegrationManager {
    if (!ComponentIntegrationManager.instance) {
      ComponentIntegrationManager.instance = new ComponentIntegrationManager()
    }
    return ComponentIntegrationManager.instance
  }

  /**
   * Update integration context
   */
  updateContext(updates: Partial<IntegrationContext>): void {
    this.context = { ...this.context, ...updates }
    this.notifySubscribers()
  }

  /**
   * Get current integration context
   */
  getContext(): IntegrationContext {
    return { ...this.context }
  }

  /**
   * Subscribe to context changes
   */
  subscribe(id: string, callback: (context: IntegrationContext) => void): void {
    this.subscribers.set(id, callback)
  }

  /**
   * Unsubscribe from context changes
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id)
  }

  /**
   * Notify all subscribers of context changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.context)
      } catch (error) {
        console.warn('Error in integration context subscriber:', error)
      }
    })
  }

  /**
   * Clear all context data
   */
  clearContext(): void {
    this.context = {}
    this.notifySubscribers()
  }
}

/**
 * Hook for using integration context in React components
 */
export function useIntegrationContext() {
  const [context, setContext] = React.useState<IntegrationContext>({})
  const manager = ComponentIntegrationManager.getInstance()

  React.useEffect(() => {
    const id = `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Subscribe to context changes
    manager.subscribe(id, setContext)
    
    // Get initial context
    setContext(manager.getContext())

    return () => {
      manager.unsubscribe(id)
    }
  }, [manager])

  const updateContext = React.useCallback((updates: Partial<IntegrationContext>) => {
    manager.updateContext(updates)
  }, [manager])

  return {
    context,
    updateContext,
    clearContext: () => manager.clearContext()
  }
}

/**
 * Product category integration utilities
 */
export const ProductCategoryIntegration = {
  /**
   * Get product category by ID
   */
  getCategoryById(id: string): ProductCategory | undefined {
    return productCategories.find(category => category.id === id)
  },

  /**
   * Get category display name
   */
  getCategoryDisplayName(id: string): string {
    const category = this.getCategoryById(id)
    return category?.name || 'Unknown Category'
  },

  /**
   * Get all active categories
   */
  getActiveCategories(): ProductCategory[] {
    return productCategories.filter(category => category.isActive !== false)
  },

  /**
   * Create category selector options
   */
  getCategorySelectorOptions(): Array<{ value: string; label: string }> {
    return this.getActiveCategories().map(category => ({
      value: category.id,
      label: category.name
    }))
  }
}

/**
 * Navigation integration utilities
 */
export const NavigationIntegration = {
  /**
   * Smooth scroll to section with error handling
   */
  scrollToSection(sectionId: string, offset: number = 80): void {
    try {
      const element = document.querySelector(sectionId)
      if (element) {
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    } catch (error) {
      console.warn('Error scrolling to section:', error)
      // Fallback to hash navigation
      window.location.hash = sectionId
    }
  },

  /**
   * Get current active section
   */
  getCurrentActiveSection(sections: string[]): string {
    try {
      for (const section of sections) {
        const element = document.getElementById(section.replace('#', ''))
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            return `#${section.replace('#', '')}`
          }
        }
      }
    } catch (error) {
      console.warn('Error detecting active section:', error)
    }
    return sections[0] || ''
  },

  /**
   * Preload section content
   */
  preloadSection(sectionId: string): void {
    try {
      const element = document.querySelector(sectionId)
      if (element) {
        // Trigger any lazy loading in the section
        const lazyElements = element.querySelectorAll('[data-lazy]')
        lazyElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.dataset.lazy = 'loaded'
          }
        })
      }
    } catch (error) {
      console.warn('Error preloading section:', error)
    }
  }
}

/**
 * Form integration utilities
 */
export const FormIntegration = {
  /**
   * Pre-fill form with integration context
   */
  prefillForm(formData: Record<string, any>, context: IntegrationContext): Record<string, any> {
    const prefilled = { ...formData }

    // Pre-fill product category if selected
    if (context.selectedProductCategory && !prefilled.productCategory) {
      prefilled.productCategory = context.selectedProductCategory
    }

    // Pre-fill other context data
    if (context.userPreferences) {
      Object.keys(context.userPreferences).forEach(key => {
        if (!prefilled[key] && context.userPreferences![key]) {
          prefilled[key] = context.userPreferences![key]
        }
      })
    }

    return prefilled
  },

  /**
   * Generate WhatsApp URL with context
   */
  generateWhatsAppURL(
    phone: string, 
    message: string, 
    context: IntegrationContext
  ): string {
    let enhancedMessage = message

    // Add product category context
    if (context.selectedProductCategory) {
      const categoryName = ProductCategoryIntegration.getCategoryDisplayName(context.selectedProductCategory)
      enhancedMessage += `\n\nProduct Category: ${categoryName}`
    }

    // Add availability context
    if (context.availabilityData && context.selectedProductCategory) {
      const availability = context.availabilityData[context.selectedProductCategory]
      if (availability) {
        enhancedMessage += `\nCurrent Status: ${availability.status}`
      }
    }

    const encodedMessage = encodeURIComponent(enhancedMessage)
    const cleanPhone = phone.replace(/[^\d]/g, '')
    
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  }
}

/**
 * Analytics integration utilities
 */
export const AnalyticsIntegration = {
  /**
   * Track component interaction with context
   */
  trackInteraction(
    action: string, 
    component: string, 
    context: IntegrationContext,
    additionalData?: Record<string, any>
  ): void {
    try {
      // Track with analytics library
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, {
          event_category: 'component_interaction',
          event_label: component,
          custom_map: {
            selected_category: context.selectedProductCategory,
            ...additionalData
          }
        })
      }

      // Log for debugging
      console.log('Analytics:', {
        action,
        component,
        context,
        additionalData
      })
    } catch (error) {
      console.warn('Error tracking interaction:', error)
    }
  },

  /**
   * Track form submission with context
   */
  trackFormSubmission(
    formType: string,
    context: IntegrationContext,
    success: boolean
  ): void {
    this.trackInteraction(
      success ? 'form_submit_success' : 'form_submit_error',
      formType,
      context,
      { success }
    )
  }
}

/**
 * Error integration utilities
 */
export const ErrorIntegration = {
  /**
   * Handle component error with context
   */
  handleComponentError(
    error: Error,
    componentName: string,
    context: IntegrationContext
  ): void {
    console.error(`Error in ${componentName}:`, error)

    // Report error with context
    fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context: 'component_integration',
        severity: 'medium',
        componentName,
        integrationContext: context,
        url: window.location.href,
        timestamp: Date.now()
      })
    }).catch(console.warn)
  }
}

/**
 * Main integration manager instance
 */
export const integrationManager = ComponentIntegrationManager.getInstance()

export default {
  useIntegrationContext,
  ProductCategoryIntegration,
  NavigationIntegration,
  FormIntegration,
  AnalyticsIntegration,
  ErrorIntegration,
  integrationManager
}