/**
 * Tests for component integration utilities
 * Tests the integration manager and utility functions
 */

import { 
  integrationManager,
  ProductCategoryIntegration,
  NavigationIntegration,
  FormIntegration,
  AnalyticsIntegration,
  ErrorIntegration
} from './component-integration'

// Mock product categories
jest.mock('@/lib/data/products', () => ({
  productCategories: [
    {
      id: 'safety-equipment',
      name: 'Safety Equipment',
      isActive: true
    },
    {
      id: 'fire-safety',
      name: 'Fire & Safety Systems',
      isActive: true
    },
    {
      id: 'inactive-category',
      name: 'Inactive Category',
      isActive: false
    }
  ]
}))

describe('Component Integration Utilities', () => {
  beforeEach(() => {
    integrationManager.clearContext()
    jest.clearAllMocks()
  })

  describe('Integration Manager', () => {
    it('should manage context state correctly', () => {
      const initialContext = integrationManager.getContext()
      expect(initialContext).toEqual({})

      // Update context
      integrationManager.updateContext({
        selectedProductCategory: 'safety-equipment'
      })

      const updatedContext = integrationManager.getContext()
      expect(updatedContext.selectedProductCategory).toBe('safety-equipment')
    })

    it('should notify subscribers of context changes', () => {
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      integrationManager.subscribe('test1', subscriber1)
      integrationManager.subscribe('test2', subscriber2)

      integrationManager.updateContext({
        selectedProductCategory: 'fire-safety'
      })

      expect(subscriber1).toHaveBeenCalledWith({
        selectedProductCategory: 'fire-safety'
      })
      expect(subscriber2).toHaveBeenCalledWith({
        selectedProductCategory: 'fire-safety'
      })
    })

    it('should handle subscriber errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const errorSubscriber = jest.fn(() => {
        throw new Error('Subscriber error')
      })

      integrationManager.subscribe('error-test', errorSubscriber)
      
      // Should not throw when subscriber errors
      expect(() => {
        integrationManager.updateContext({ test: 'value' })
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in integration context subscriber:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should unsubscribe correctly', () => {
      const subscriber = jest.fn()

      integrationManager.subscribe('test', subscriber)
      integrationManager.updateContext({ test: 'value1' })
      expect(subscriber).toHaveBeenCalledTimes(1)

      integrationManager.unsubscribe('test')
      integrationManager.updateContext({ test: 'value2' })
      expect(subscriber).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should clear context correctly', () => {
      integrationManager.updateContext({
        selectedProductCategory: 'safety-equipment',
        availabilityData: { test: 'data' }
      })

      expect(integrationManager.getContext()).not.toEqual({})

      integrationManager.clearContext()
      expect(integrationManager.getContext()).toEqual({})
    })
  })

  describe('Product Category Integration', () => {
    it('should get category by ID', () => {
      const category = ProductCategoryIntegration.getCategoryById('safety-equipment')
      expect(category).toEqual({
        id: 'safety-equipment',
        name: 'Safety Equipment',
        isActive: true
      })
    })

    it('should return undefined for non-existent category', () => {
      const category = ProductCategoryIntegration.getCategoryById('non-existent')
      expect(category).toBeUndefined()
    })

    it('should get category display name', () => {
      const name = ProductCategoryIntegration.getCategoryDisplayName('safety-equipment')
      expect(name).toBe('Safety Equipment')

      const unknownName = ProductCategoryIntegration.getCategoryDisplayName('unknown')
      expect(unknownName).toBe('Unknown Category')
    })

    it('should get only active categories', () => {
      const activeCategories = ProductCategoryIntegration.getActiveCategories()
      expect(activeCategories).toHaveLength(2)
      expect(activeCategories.every(cat => cat.isActive !== false)).toBe(true)
    })

    it('should create selector options', () => {
      const options = ProductCategoryIntegration.getCategorySelectorOptions()
      expect(options).toEqual([
        { value: 'safety-equipment', label: 'Safety Equipment' },
        { value: 'fire-safety', label: 'Fire & Safety Systems' }
      ])
    })
  })

  describe('Navigation Integration', () => {
    beforeEach(() => {
      // Mock DOM methods
      Element.prototype.scrollIntoView = jest.fn()
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        bottom: 200,
        left: 0,
        right: 0,
        width: 0,
        height: 100
      }))

      Object.defineProperty(window, 'pageYOffset', {
        value: 0,
        writable: true
      })

      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true
      })

      window.scrollTo = jest.fn()
    })

    it('should scroll to section with offset', () => {
      const mockElement = document.createElement('div')
      jest.spyOn(document, 'querySelector').mockReturnValue(mockElement)

      NavigationIntegration.scrollToSection('#test-section', 100)

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth'
      })
    })

    it('should handle scroll errors gracefully', () => {
      jest.spyOn(document, 'querySelector').mockImplementation(() => {
        throw new Error('Query error')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Should not throw
      expect(() => {
        NavigationIntegration.scrollToSection('#test-section')
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error scrolling to section:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should detect current active section', () => {
      const mockElement = document.createElement('div')
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement)

      // Mock element in viewport
      mockElement.getBoundingClientRect = jest.fn(() => ({
        top: 300,
        bottom: 500,
        left: 0,
        right: 0,
        width: 0,
        height: 200
      }))

      const activeSection = NavigationIntegration.getCurrentActiveSection([
        '#section1', '#section2', '#section3'
      ])

      expect(activeSection).toBe('#section1')
    })

    it('should preload section content', () => {
      const mockSection = document.createElement('div')
      const mockLazyElement = document.createElement('img')
      mockLazyElement.dataset.lazy = 'pending'
      mockSection.appendChild(mockLazyElement)

      jest.spyOn(document, 'querySelector').mockReturnValue(mockSection)
      jest.spyOn(mockSection, 'querySelectorAll').mockReturnValue([mockLazyElement])

      NavigationIntegration.preloadSection('#test-section')

      expect(mockLazyElement.dataset.lazy).toBe('loaded')
    })
  })

  describe('Form Integration', () => {
    it('should prefill form with context', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const context = {
        selectedProductCategory: 'safety-equipment',
        userPreferences: {
          company: 'Test Company',
          phone: '+966501234567'
        }
      }

      const prefilled = FormIntegration.prefillForm(formData, context)

      expect(prefilled).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        productCategory: 'safety-equipment',
        company: 'Test Company',
        phone: '+966501234567'
      })
    })

    it('should not override existing form data', () => {
      const formData = {
        name: 'John Doe',
        productCategory: 'existing-category'
      }

      const context = {
        selectedProductCategory: 'safety-equipment'
      }

      const prefilled = FormIntegration.prefillForm(formData, context)

      expect(prefilled.productCategory).toBe('existing-category')
    })

    it('should generate WhatsApp URL with context', () => {
      const context = {
        selectedProductCategory: 'safety-equipment',
        availabilityData: {
          'safety-equipment': {
            status: 'in_stock'
          }
        }
      }

      const url = FormIntegration.generateWhatsAppURL(
        '+966 50 123 4567',
        'Hello, I need a quote',
        context
      )

      expect(url).toContain('wa.me/966501234567')
      expect(url).toContain('Safety%20Equipment')
      expect(url).toContain('in_stock')
    })
  })

  describe('Analytics Integration', () => {
    beforeEach(() => {
      // Mock gtag
      ;(window as any).gtag = jest.fn()
    })

    it('should track interaction with context', () => {
      const context = {
        selectedProductCategory: 'safety-equipment'
      }

      AnalyticsIntegration.trackInteraction(
        'button_click',
        'dynamic_cta',
        context,
        { additional: 'data' }
      )

      expect((window as any).gtag).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'component_interaction',
        event_label: 'dynamic_cta',
        custom_map: {
          selected_category: 'safety-equipment',
          additional: 'data'
        }
      })
    })

    it('should track form submission', () => {
      const context = {
        selectedProductCategory: 'fire-safety'
      }

      AnalyticsIntegration.trackFormSubmission('contact_form', context, true)

      expect((window as any).gtag).toHaveBeenCalledWith('event', 'form_submit_success', {
        event_category: 'component_interaction',
        event_label: 'contact_form',
        custom_map: {
          selected_category: 'fire-safety',
          success: true
        }
      })
    })

    it('should handle analytics errors gracefully', () => {
      // Mock gtag to throw error
      ;(window as any).gtag = jest.fn(() => {
        throw new Error('Analytics error')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      expect(() => {
        AnalyticsIntegration.trackInteraction('test', 'component', {})
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error tracking interaction:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Error Integration', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue(
        new Response('{}', { status: 200 })
      )
    })

    it('should handle component error with context', async () => {
      const error = new Error('Test error')
      const context = {
        selectedProductCategory: 'safety-equipment'
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      ErrorIntegration.handleComponentError(error, 'TestComponent', context)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in TestComponent:',
        error
      )

      expect(fetch).toHaveBeenCalledWith('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test error',
          stack: error.stack,
          context: 'component_integration',
          severity: 'medium',
          componentName: 'TestComponent',
          integrationContext: context,
          url: window.location.href,
          timestamp: expect.any(Number)
        })
      })

      consoleSpy.mockRestore()
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      ErrorIntegration.handleComponentError(
        new Error('Test error'),
        'TestComponent',
        {}
      )

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})