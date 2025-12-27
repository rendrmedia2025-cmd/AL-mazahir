/**
 * Property-based tests for mobile responsiveness preservation
 * Feature: dynamic-enhancement-layer, Property 8: Mobile Responsiveness Preservation
 * Validates: Requirements 6.5, 5.7
 */

import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import AvailabilityIndicator from './AvailabilityIndicator'
import DynamicCTA from './DynamicCTA'
import ActiveCategoriesIndicator from './ActiveCategoriesIndicator'
import { SmartEnquiryForm } from '../sections/SmartEnquiryForm'
import { TestimonialSlider } from '../sections/TestimonialSlider'

// Mock hooks and dependencies
jest.mock('@/lib/hooks', () => ({
  useAvailabilitySubscription: () => ({
    availabilityData: {},
    loading: false,
    error: null
  }),
  useActiveCategories: () => ({
    activeCount: 6,
    loading: false,
    error: null
  }),
  useTestimonials: () => ({
    testimonials: [],
    loading: false,
    error: null
  })
}))

jest.mock('@/lib/lead-intelligence', () => ({
  captureClientSideIntelligence: jest.fn(() => ({
    deviceType: 'mobile',
    userAgent: 'test-agent',
    referrer: 'test-referrer',
    timestamp: new Date()
  })),
  auditLeadIntelligenceCapture: jest.fn()
}))

jest.mock('@/lib/validation', () => ({
  validateEnhancedInquiry: () => ({ isValid: true, errors: [] }),
  enhancedInquiryValidationRules: {}
}))

jest.mock('@/lib/data/products', () => ({
  productCategories: [
    { id: 'cat1', name: 'Category 1' },
    { id: 'cat2', name: 'Category 2' }
  ]
}))

// Viewport size generator for different device types
const viewportArbitrary = fc.record({
  width: fc.integer({ min: 320, max: 1920 }),
  height: fc.integer({ min: 568, max: 1080 }),
  deviceType: fc.constantFrom('mobile', 'tablet', 'desktop')
})

// Component props generators
const availabilityStatusArbitrary = fc.constantFrom('in_stock', 'limited', 'out_of_stock', 'on_order')

const categoryIdArbitrary = fc.string({ minLength: 1, maxLength: 20 })

const classNameArbitrary = fc.string({ maxLength: 50 })

describe('Mobile Responsiveness Property Tests', () => {
  // Mock window.matchMedia for responsive tests
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  /**
   * Property 8: Mobile Responsiveness Preservation
   * For any new dynamic component, the mobile experience should maintain 
   * the same functionality and usability as the desktop version across all device sizes.
   */
  describe('Property 8: Mobile Responsiveness Preservation', () => {
    test('AvailabilityIndicator maintains functionality across all viewport sizes', () => {
      fc.assert(fc.property(
        viewportArbitrary,
        availabilityStatusArbitrary,
        categoryIdArbitrary,
        classNameArbitrary,
        (viewport, status, categoryId, className) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          })

          // Render component
          const { container } = render(
            <AvailabilityIndicator
              categoryId={categoryId}
              fallbackStatus={status}
              showTimestamp={true}
              className={className}
            />
          )

          // Component should render without errors
          expect(container.firstChild).toBeTruthy()

          // Should have proper ARIA attributes for accessibility
          const statusElement = container.querySelector('[role="status"]')
          expect(statusElement).toBeTruthy()

          // Should have readable text content
          const textContent = container.textContent
          expect(textContent).toBeTruthy()
          expect(textContent.length).toBeGreaterThan(0)

          // Should have proper responsive classes
          const hasResponsiveClasses = container.innerHTML.includes('sm:') || 
                                     container.innerHTML.includes('md:') || 
                                     container.innerHTML.includes('lg:')
          expect(hasResponsiveClasses).toBe(true)

          // Touch targets should be appropriately sized (minimum 44px for mobile)
          if (viewport.width <= 768) { // Mobile/tablet
            const touchElements = container.querySelectorAll('button, [role="button"], input, select, textarea')
            touchElements.forEach(element => {
              const styles = window.getComputedStyle(element)
              const minHeight = parseInt(styles.minHeight) || parseInt(styles.height) || 0
              const minWidth = parseInt(styles.minWidth) || parseInt(styles.width) || 0
              
              // Allow for elements that are not interactive touch targets
              if (element.tagName.toLowerCase() !== 'div') {
                expect(minHeight).toBeGreaterThanOrEqual(44)
                expect(minWidth).toBeGreaterThanOrEqual(44)
              }
            })
          }

          return true
        }
      ), { numRuns: 100 })
    })

    test('DynamicCTA maintains functionality across all viewport sizes', () => {
      fc.assert(fc.property(
        viewportArbitrary,
        availabilityStatusArbitrary,
        categoryIdArbitrary,
        (viewport, status, categoryId) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })

          const { container } = render(
            <DynamicCTA
              categoryId={categoryId}
              availabilityStatus={status}
              fallbackText="Contact Us"
            />
          )

          // Component should render without errors
          expect(container.firstChild).toBeTruthy()

          // Should contain a button element
          const button = container.querySelector('button')
          expect(button).toBeTruthy()

          // Button should have proper accessibility attributes
          expect(button?.getAttribute('aria-label')).toBeTruthy()
          expect(button?.getAttribute('title')).toBeTruthy()

          // Button should have touch-friendly sizing on mobile
          if (viewport.width <= 768) {
            expect(button?.classList.toString()).toContain('touch-target')
          }

          // Should have responsive text content
          const textContent = button?.textContent
          expect(textContent).toBeTruthy()
          expect(textContent.length).toBeGreaterThan(0)

          return true
        }
      ), { numRuns: 100 })
    })

    test('ActiveCategoriesIndicator adapts properly to different viewport sizes', () => {
      fc.assert(fc.property(
        viewportArbitrary,
        fc.constantFrom('compact', 'detailed', 'badge'),
        (viewport, variant) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })

          const { container } = render(
            <ActiveCategoriesIndicator variant={variant} />
          )

          // Component should render without errors
          expect(container.firstChild).toBeTruthy()

          // Should have proper ARIA attributes
          const statusElement = container.querySelector('[role="status"]')
          expect(statusElement).toBeTruthy()

          // Should have responsive text sizing
          const hasResponsiveText = container.innerHTML.includes('sm:text-') || 
                                   container.innerHTML.includes('md:text-') || 
                                   container.innerHTML.includes('lg:text-')
          expect(hasResponsiveText).toBe(true)

          // Content should be readable
          const textContent = container.textContent
          expect(textContent).toBeTruthy()

          // Should show appropriate content based on viewport
          if (viewport.width <= 640) { // Mobile
            // Mobile should show abbreviated content where applicable
            const hasAbbreviatedContent = container.innerHTML.includes('sm:hidden') ||
                                        container.innerHTML.includes('sm:inline')
            expect(hasAbbreviatedContent).toBe(true)
          }

          return true
        }
      ), { numRuns: 100 })
    })

    test('SmartEnquiryForm maintains usability across all viewport sizes', () => {
      fc.assert(fc.property(
        viewportArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (viewport, sourceSection) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })

          const { container } = render(
            <SmartEnquiryForm sourceSection={sourceSection} />
          )

          // Component should render without errors
          expect(container.firstChild).toBeTruthy()

          // Should contain form elements
          const form = container.querySelector('form')
          expect(form).toBeTruthy()

          // All form inputs should have proper labels
          const inputs = container.querySelectorAll('input, select, textarea')
          inputs.forEach(input => {
            const id = input.getAttribute('id')
            if (id) {
              const label = container.querySelector(`label[for="${id}"]`)
              expect(label).toBeTruthy()
            }
          })

          // Buttons should have touch-friendly sizing
          const buttons = container.querySelectorAll('button')
          buttons.forEach(button => {
            expect(button.classList.toString()).toContain('touch-target')
          })

          // Form should have responsive layout
          const hasResponsiveLayout = container.innerHTML.includes('sm:flex-row') ||
                                    container.innerHTML.includes('flex-col') ||
                                    container.innerHTML.includes('sm:space-')
          expect(hasResponsiveLayout).toBe(true)

          // Mobile layout should stack buttons vertically
          if (viewport.width <= 640) {
            const buttonContainer = container.querySelector('.flex.flex-col')
            expect(buttonContainer).toBeTruthy()
          }

          return true
        }
      ), { numRuns: 100 })
    })

    test('TestimonialSlider navigation works properly on all device sizes', () => {
      fc.assert(fc.property(
        viewportArbitrary,
        fc.boolean(),
        fc.boolean(),
        (viewport, showArrows, showDots) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })

          const { container } = render(
            <TestimonialSlider 
              showArrows={showArrows}
              showDots={showDots}
              fallbackTestimonials={[
                {
                  id: '1',
                  name: 'Test User',
                  company: 'Test Company',
                  position: 'Test Position',
                  content: 'Test content',
                  isActive: true
                }
              ]}
            />
          )

          // Component should render without errors
          expect(container.firstChild).toBeTruthy()

          // Should have proper section structure
          const section = container.querySelector('section')
          expect(section).toBeTruthy()
          expect(section?.getAttribute('aria-label')).toBeTruthy()

          // Navigation arrows should be touch-friendly on mobile
          if (showArrows) {
            const arrows = container.querySelectorAll('button[aria-label*="testimonial"]')
            arrows.forEach(arrow => {
              expect(arrow.classList.toString()).toContain('touch-target')
              
              // Mobile arrows should be appropriately sized
              if (viewport.width <= 640) {
                expect(arrow.classList.toString()).toContain('w-10') // Mobile size
              } else {
                expect(arrow.classList.toString()).toContain('w-12') // Desktop size
              }
            })
          }

          // Navigation dots should be touch-friendly
          if (showDots) {
            const dots = container.querySelectorAll('[role="tab"]')
            dots.forEach(dot => {
              expect(dot.classList.toString()).toContain('touch-target')
            })
          }

          // Content should be responsive
          const testimonialContent = container.querySelector('blockquote')
          if (testimonialContent) {
            expect(testimonialContent.classList.toString()).toContain('text-readable')
          }

          return true
        }
      ), { numRuns: 100 })
    })

    test('All components maintain minimum touch target sizes on mobile', () => {
      fc.assert(fc.property(
        fc.record({
          width: fc.integer({ min: 320, max: 768 }), // Mobile range
          height: fc.integer({ min: 568, max: 1024 })
        }),
        categoryIdArbitrary,
        (viewport, categoryId) => {
          // Set mobile viewport
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })

          // Test multiple components
          const components = [
            <AvailabilityIndicator key="1" categoryId={categoryId} />,
            <DynamicCTA key="2" categoryId={categoryId} />,
            <ActiveCategoriesIndicator key="3" variant="badge" />
          ]

          components.forEach((component, index) => {
            const { container } = render(component)
            
            // Find all interactive elements
            const interactiveElements = container.querySelectorAll(
              'button, [role="button"], input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
            )

            interactiveElements.forEach(element => {
              // Check if element has touch-target class or appropriate sizing
              const classList = element.classList.toString()
              const hasProperSizing = classList.includes('touch-target') ||
                                    classList.includes('h-11') ||
                                    classList.includes('h-12') ||
                                    classList.includes('h-14') ||
                                    classList.includes('min-h-')

              expect(hasProperSizing).toBe(true)
            })
          })

          return true
        }
      ), { numRuns: 100 })
    })

    test('Text remains readable across all viewport sizes', () => {
      fc.assert(fc.property(
        viewportArbitrary,
        categoryIdArbitrary,
        (viewport, categoryId) => {
          // Set viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          })

          const components = [
            <AvailabilityIndicator key="1" categoryId={categoryId} showTimestamp={true} />,
            <ActiveCategoriesIndicator key="2" variant="detailed" />
          ]

          components.forEach(component => {
            const { container } = render(component)
            
            // Check for readable text classes
            const textElements = container.querySelectorAll('span, p, div, h1, h2, h3, h4, h5, h6')
            let hasReadableText = false

            textElements.forEach(element => {
              const classList = element.classList.toString()
              if (classList.includes('text-readable') || 
                  classList.includes('text-sm') ||
                  classList.includes('text-base') ||
                  classList.includes('text-lg') ||
                  classList.includes('leading-')) {
                hasReadableText = true
              }
            })

            // Should have at least some readable text styling
            expect(hasReadableText).toBe(true)

            // Text content should not be empty
            const textContent = container.textContent?.trim()
            expect(textContent).toBeTruthy()
            expect(textContent.length).toBeGreaterThan(0)
          })

          return true
        }
      ), { numRuns: 100 })
    })
  })
})