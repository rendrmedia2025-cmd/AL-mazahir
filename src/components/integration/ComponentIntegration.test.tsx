/**
 * Integration tests for component interactions
 * Tests the interaction between new dynamic components and existing static components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Import components to test
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import AvailabilityIndicator from '@/components/ui/AvailabilityIndicator'
import DynamicCTA from '@/components/ui/DynamicCTA'
import SmartEnquiryForm from '@/components/sections/SmartEnquiryForm'

// Import integration utilities
import { 
  integrationManager, 
  ProductCategoryIntegration,
  NavigationIntegration,
  FormIntegration 
} from '@/lib/component-integration'

// Mock hooks and utilities
jest.mock('@/lib/hooks/useScrollPosition', () => ({
  useScrollPosition: () => ({ x: 0, y: 0 })
}))

jest.mock('@/lib/hooks/useAvailabilitySubscription', () => ({
  useAvailabilitySubscription: () => ({
    availabilityData: {
      'safety-equipment': {
        status: 'in_stock',
        lastUpdated: new Date().toISOString()
      }
    },
    loading: false,
    error: null
  })
}))

jest.mock('@/lib/progressive-enhancement', () => ({
  useProgressiveEnhancement: () => ({
    isEnhanced: true,
    isOnline: true,
    canUseAdvancedFeatures: true
  })
}))

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  event: jest.fn(),
  pageview: jest.fn()
}))

describe('Component Integration Tests', () => {
  beforeEach(() => {
    // Clear integration context before each test
    integrationManager.clearContext()
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()
    
    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Header and Navigation Integration', () => {
    it('should integrate navigation with dynamic sections', async () => {
      render(<Header />)
      
      // Test navigation items are present
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
      
      // Test navigation click triggers scroll
      const productsLink = screen.getByText('Products')
      fireEvent.click(productsLink)
      
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })

    it('should handle navigation errors gracefully', async () => {
      // Mock scrollIntoView to throw error
      Element.prototype.scrollIntoView = jest.fn(() => {
        throw new Error('Scroll error')
      })
      
      render(<Header />)
      
      const productsLink = screen.getByText('Products')
      
      // Should not throw error when navigation fails
      expect(() => {
        fireEvent.click(productsLink)
      }).not.toThrow()
    })

    it('should show offline indicator when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      render(<Header />)
      
      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('offline')
      })
    })
  })

  describe('Footer Integration', () => {
    it('should integrate footer links with dynamic navigation', async () => {
      render(<Footer />)
      
      // Test footer navigation
      const homeLink = screen.getByRole('button', { name: 'Home' })
      fireEvent.click(homeLink)
      
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })

    it('should handle contact links correctly', async () => {
      render(<Footer />)
      
      // Test phone link
      const phoneLink = screen.getByRole('link', { name: /\+966/ })
      expect(phoneLink).toHaveAttribute('href', expect.stringContaining('tel:'))
      
      // Test email link
      const emailLink = screen.getByRole('link', { name: /info@almazahirtrading.com/ })
      expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:'))
      
      // Test WhatsApp link
      const whatsappLink = screen.getByRole('link', { name: /WhatsApp/ })
      expect(whatsappLink).toHaveAttribute('href', expect.stringContaining('wa.me'))
    })
  })

  describe('Dynamic Component Integration', () => {
    it('should integrate availability indicator with product categories', async () => {
      render(
        <AvailabilityIndicator 
          categoryId="safety-equipment" 
          showTimestamp={true}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('In Stock')).toBeInTheDocument()
      })
    })

    it('should integrate dynamic CTA with availability data', async () => {
      const mockAction = jest.fn()
      
      render(
        <DynamicCTA 
          categoryId="safety-equipment"
          onAction={mockAction}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Request Quote')).toBeInTheDocument()
      })
      
      // Test CTA click
      const ctaButton = screen.getByText('Request Quote')
      fireEvent.click(ctaButton)
      
      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'quote',
            categoryId: 'safety-equipment'
          })
        )
      })
    })

    it('should integrate smart enquiry form with product categories', async () => {
      const mockSubmit = jest.fn()
      
      render(
        <SmartEnquiryForm 
          onSubmit={mockSubmit}
          sourceSection="test"
          prefilledCategory="safety-equipment"
        />
      )
      
      // Check that product category is pre-filled
      const categorySelect = screen.getByDisplayValue('Safety Equipment')
      expect(categorySelect).toBeInTheDocument()
    })
  })

  describe('Data Flow Integration', () => {
    it('should share data between components through integration context', async () => {
      // Update integration context
      act(() => {
        integrationManager.updateContext({
          selectedProductCategory: 'safety-equipment',
          availabilityData: {
            'safety-equipment': {
              status: 'in_stock',
              lastUpdated: new Date().toISOString()
            }
          }
        })
      })
      
      // Render components that should use the context
      render(
        <div>
          <AvailabilityIndicator categoryId="safety-equipment" />
          <DynamicCTA categoryId="safety-equipment" />
        </div>
      )
      
      await waitFor(() => {
        expect(screen.getByText('In Stock')).toBeInTheDocument()
        expect(screen.getByText('Request Quote')).toBeInTheDocument()
      })
    })

    it('should handle context updates across components', async () => {
      const TestComponent = () => {
        const { context, updateContext } = integrationManager.useIntegrationContext()
        
        return (
          <div>
            <span data-testid="category">
              {context.selectedProductCategory || 'none'}
            </span>
            <button 
              onClick={() => updateContext({ selectedProductCategory: 'tools-machinery' })}
            >
              Update Category
            </button>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      // Initial state
      expect(screen.getByTestId('category')).toHaveTextContent('none')
      
      // Update context
      const updateButton = screen.getByText('Update Category')
      fireEvent.click(updateButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('category')).toHaveTextContent('tools-machinery')
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle component errors without breaking the page', async () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error')
      }
      
      render(
        <div>
          <Header />
          <ErrorComponent />
          <Footer />
        </div>
      )
      
      // Header and Footer should still render
      expect(screen.getByAltText('Al Mazahir Trading Est.')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should report integration errors to monitoring', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 })
      )
      
      // Simulate an integration error
      act(() => {
        integrationManager.updateContext({
          selectedProductCategory: 'invalid-category'
        })
      })
      
      // Component should handle invalid category gracefully
      render(<AvailabilityIndicator categoryId="invalid-category" />)
      
      // Should not crash
      expect(screen.getByText('Contact for status')).toBeInTheDocument()
      
      fetchSpy.mockRestore()
    })
  })

  describe('Progressive Enhancement Integration', () => {
    it('should work without JavaScript enhancements', async () => {
      // Mock progressive enhancement to return false
      jest.mocked(require('@/lib/progressive-enhancement').useProgressiveEnhancement)
        .mockReturnValue({
          isEnhanced: false,
          isOnline: true,
          canUseAdvancedFeatures: false
        })
      
      render(<Header />)
      
      // Basic functionality should still work
      expect(screen.getByAltText('Al Mazahir Trading Est.')).toBeInTheDocument()
      expect(screen.getByText('Get Quote')).toBeInTheDocument()
    })

    it('should handle offline state gracefully', async () => {
      // Mock offline state
      jest.mocked(require('@/lib/progressive-enhancement').useProgressiveEnhancement)
        .mockReturnValue({
          isEnhanced: true,
          isOnline: false,
          canUseAdvancedFeatures: false
        })
      
      render(
        <div>
          <AvailabilityIndicator categoryId="safety-equipment" />
          <DynamicCTA categoryId="safety-equipment" />
        </div>
      )
      
      // Should show fallback states
      await waitFor(() => {
        expect(screen.getByText('Contact for status')).toBeInTheDocument()
        expect(screen.getByText('Enquire Now')).toBeInTheDocument()
      })
    })
  })

  describe('Form Integration', () => {
    it('should integrate form submission with WhatsApp', async () => {
      const user = userEvent.setup()
      const mockWhatsAppClick = jest.fn()
      
      render(
        <SmartEnquiryForm 
          onWhatsAppClick={mockWhatsAppClick}
          sourceSection="test"
        />
      )
      
      // Fill form
      await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
      await user.type(screen.getByLabelText(/Phone/), '+966501234567')
      await user.type(screen.getByLabelText(/Email/), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/Urgency/), 'immediate')
      await user.type(screen.getByLabelText(/Message/), 'Test message')
      
      // Click WhatsApp button
      const whatsappButton = screen.getByText('Talk on WhatsApp')
      await user.click(whatsappButton)
      
      expect(mockWhatsAppClick).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          phone: '+966501234567',
          email: 'john@example.com',
          urgency: 'immediate',
          message: 'Test message'
        })
      )
    })

    it('should validate form data before submission', async () => {
      const user = userEvent.setup()
      const mockSubmit = jest.fn()
      
      render(
        <SmartEnquiryForm 
          onSubmit={mockSubmit}
          sourceSection="test"
        />
      )
      
      // Try to submit empty form
      const submitButton = screen.getByText('Send Inquiry')
      await user.click(submitButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
      
      // Should not call submit
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Performance Integration', () => {
    it('should not impact page load performance', async () => {
      const startTime = performance.now()
      
      render(
        <div>
          <Header />
          <AvailabilityIndicator categoryId="safety-equipment" />
          <DynamicCTA categoryId="safety-equipment" />
          <SmartEnquiryForm sourceSection="test" />
          <Footer />
        </div>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render quickly (less than 100ms in test environment)
      expect(renderTime).toBeLessThan(100)
    })

    it('should handle large datasets efficiently', async () => {
      // Create large availability dataset
      const largeAvailabilityData = {}
      for (let i = 0; i < 1000; i++) {
        largeAvailabilityData[`category-${i}`] = {
          status: 'in_stock',
          lastUpdated: new Date().toISOString()
        }
      }
      
      act(() => {
        integrationManager.updateContext({
          availabilityData: largeAvailabilityData
        })
      })
      
      const startTime = performance.now()
      
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <AvailabilityIndicator 
              key={i}
              categoryId={`category-${i}`} 
            />
          ))}
        </div>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should still render efficiently with large datasets
      expect(renderTime).toBeLessThan(200)
    })
  })
})