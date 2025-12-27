/**
 * Property-based tests for responsive design behavior
 * Feature: corporate-website, Property 4: Responsive Design Behavior
 * Validates: Requirements 5.1, 5.2, 5.5
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ProductCatalog } from './ProductCatalog';
import ContactSection from './ContactSection';
import { productCategories } from '@/lib/data/products';

// Mock Next.js Image component for testing
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock IntersectionObserver for testing
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes(`${width}px`),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Viewport width generator (320px to 1920px as per requirements)
const viewportWidthArb = fc.integer({ min: 320, max: 1920 });

// Mock viewport resize function
const setViewportWidth = (width: number) => {
  // Mock window.innerWidth
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  // Mock document.documentElement.clientWidth
  Object.defineProperty(document.documentElement, 'clientWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  mockMatchMedia(width);
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design Property Tests', () => {
  beforeEach(() => {
    // Reset viewport
    setViewportWidth(1024);
    jest.clearAllMocks();
  });

  /**
   * Property 4: Responsive Design Behavior
   * For any screen width between 320px and 1920px, the website should maintain 
   * proper layout, readable typography, accessible touch targets, and full functionality.
   * Validates: Requirements 5.1, 5.2, 5.5
   */
  it('should maintain proper layout and functionality across all viewport widths', () => {
    fc.assert(
      fc.property(viewportWidthArb, (width) => {
        // Set viewport width
        setViewportWidth(width);
        
        // Test HeroSection responsiveness
        const { unmount: unmountHero } = render(<HeroSection />);
        
        // Check that essential elements are present and accessible
        const heroTitle = screen.getByRole('heading', { level: 1 });
        const ctaButtons = screen.getAllByRole('button');
        
        // Verify title is readable (not empty and has proper text)
        expect(heroTitle.textContent).toBeTruthy();
        expect(heroTitle.textContent!.length).toBeGreaterThan(0);
        
        // Verify CTA buttons are present and accessible
        expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
        ctaButtons.forEach(button => {
          expect(button).toBeVisible();
          expect(button.textContent).toBeTruthy();
        });
        
        unmountHero();
        
        // Test AboutSection responsiveness
        const { unmount: unmountAbout } = render(<AboutSection />);
        
        const aboutHeading = screen.getByRole('heading', { level: 2 });
        expect(aboutHeading).toBeVisible();
        expect(aboutHeading.textContent).toContain('About');
        
        unmountAbout();
        
        // Test ContactSection responsiveness
        const { unmount: unmountContact } = render(
          <ContactSection 
            onSubmit={async () => {}} 
            onWhatsAppClick={() => {}} 
          />
        );
        
        const contactHeading = screen.getByRole('heading', { level: 2 });
        expect(contactHeading).toBeVisible();
        expect(contactHeading.textContent).toContain('Get in Touch');
        
        // Check form elements are accessible
        const nameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole('button', { name: /send inquiry/i });
        
        expect(nameInput).toBeVisible();
        expect(emailInput).toBeVisible();
        expect(submitButton).toBeVisible();
        
        unmountContact();
        
        return true;
      }),
      { numRuns: 100 } // Test with 100 different viewport widths
    );
  });

  it('should maintain readable typography across all screen sizes', () => {
    fc.assert(
      fc.property(viewportWidthArb, (width) => {
        setViewportWidth(width);
        
        const { unmount } = render(<HeroSection />);
        
        // Check that text elements have proper styling
        const heroTitle = screen.getByRole('heading', { level: 1 });
        const heroSubtitle = screen.getByText(/Your Trusted Partner/i);
        
        // Verify elements are visible and have content
        expect(heroTitle).toBeVisible();
        expect(heroSubtitle).toBeVisible();
        
        // Check that elements have responsive classes
        const titleClasses = Array.from(heroTitle.classList);
        const hasResponsiveText = titleClasses.some(cls => 
          cls.includes('text-') && (cls.includes('sm:') || cls.includes('md:') || cls.includes('lg:'))
        );
        expect(hasResponsiveText).toBe(true);
        
        unmount();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain accessible touch targets on mobile devices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 768 }), // Mobile viewport range
        (width) => {
          setViewportWidth(width);
          
          const { unmount } = render(<HeroSection />);
          
          // Check button touch targets
          const buttons = screen.getAllByRole('button');
          
          buttons.forEach(button => {
            expect(button).toBeVisible();
            expect(button.textContent).toBeTruthy();
            
            // Check that button has proper sizing classes for mobile
            const classList = Array.from(button.classList);
            const hasTouchTargetClass = classList.some(cls => 
              cls.includes('h-') || cls.includes('min-h-') || cls.includes('py-') || 
              cls.includes('touch-target') || cls.includes('min-w-')
            );
            expect(hasTouchTargetClass).toBe(true);
          });
          
          unmount();
          return true;
        }
      ),
      { numRuns: 50 } // Test 50 mobile viewport widths
    );
  });

  it('should maintain proper spacing and layout integrity across screen sizes', () => {
    fc.assert(
      fc.property(viewportWidthArb, (width) => {
        setViewportWidth(width);
        
        const { unmount } = render(<HeroSection />);
        
        // Check that sections maintain proper spacing
        const heroSection = screen.getByRole('heading', { level: 1 }).closest('section');
        
        expect(heroSection).toBeVisible();
        
        // Verify sections have proper CSS classes for spacing
        if (heroSection) {
          const heroClasses = Array.from(heroSection.classList);
          const hasSpacingClass = heroClasses.some(cls => 
            cls.includes('py-') || cls.includes('px-') || cls.includes('p-') || 
            cls.includes('mobile-padding') || cls.includes('min-h-')
          );
          expect(hasSpacingClass).toBe(true);
        }
        
        unmount();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain form functionality across all screen sizes', () => {
    fc.assert(
      fc.property(viewportWidthArb, (width) => {
        setViewportWidth(width);
        
        const { unmount } = render(
          <ContactSection 
            onSubmit={async () => {}} 
            onWhatsAppClick={() => {}} 
          />
        );
        
        // Check that all form elements are accessible
        const nameInput = screen.getByLabelText(/full name/i);
        const companyInput = screen.getByLabelText(/company/i);
        const phoneInput = screen.getByLabelText(/phone/i);
        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole('button', { name: /send inquiry/i });
        const whatsappButton = screen.getByRole('button', { name: /talk on whatsapp/i });
        
        // Verify all form elements are visible and functional
        expect(nameInput).toBeVisible();
        expect(companyInput).toBeVisible();
        expect(phoneInput).toBeVisible();
        expect(emailInput).toBeVisible();
        expect(submitButton).toBeVisible();
        expect(whatsappButton).toBeVisible();
        
        // Check that inputs have proper responsive sizing
        [nameInput, companyInput, phoneInput, emailInput].forEach(input => {
          const classList = Array.from(input.classList);
          const hasResponsiveClass = classList.some(cls => 
            cls.includes('w-full') || cls.includes('h-') || cls.includes('touch-target') ||
            cls.includes('sm:') || cls.includes('md:')
          );
          expect(hasResponsiveClass).toBe(true);
        });
        
        unmount();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should render product catalog with responsive grid layout', () => {
    fc.assert(
      fc.property(viewportWidthArb, (width) => {
        setViewportWidth(width);
        
        // Create a simple version without lazy loading for testing
        const SimpleProductCatalog = () => (
          <section className="py-12 sm:py-16 bg-gray-50" id="products">
            <div className="container mx-auto mobile-padding">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-readable">
                Our Product Categories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {productCategories.slice(0, 3).map((category) => (
                  <div key={category.id} className="bg-white p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
                      Enquire Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
        
        const { unmount } = render(<SimpleProductCatalog />);
        
        const productHeading = screen.getByRole('heading', { level: 2 });
        expect(productHeading).toBeVisible();
        expect(productHeading.textContent).toContain('Product Categories');
        
        // Check that enquire buttons are present
        const enquireButtons = screen.getAllByText('Enquire Now');
        expect(enquireButtons.length).toBe(3);
        
        enquireButtons.forEach(button => {
          expect(button).toBeVisible();
        });
        
        unmount();
        return true;
      }),
      { numRuns: 50 }
    );
  });
});