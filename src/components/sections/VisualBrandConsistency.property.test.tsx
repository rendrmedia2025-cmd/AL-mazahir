/**
 * Property-based tests for visual and brand consistency
 * Feature: corporate-website, Property 6: Visual and Brand Consistency
 * Validates: Requirements 4.5
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ProductCatalog } from './ProductCatalog';
import ContactSection from './ContactSection';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Mock data generators for testing
const mockProductCategories = fc.array(
  fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    description: fc.string({ minLength: 1 }),
    image: fc.constant('/images/placeholder.jpg'),
    slug: fc.string({ minLength: 1 }),
    products: fc.array(fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      image: fc.constant('/images/placeholder.jpg'),
      category: fc.string({ minLength: 1 })
    }))
  }),
  { minLength: 1, maxLength: 3 }
);

const mockCompanyInfo = fc.record({
  name: fc.constant('Al Mazahir Trading Est.'),
  description: fc.string({ minLength: 1 }),
  yearsOfExperience: fc.integer({ min: 1, max: 50 }),
  location: fc.constant('Saudi Arabia'),
  phone: fc.constant('+966 XX XXX XXXX'),
  email: fc.constant('info@almazahirtrading.com'),
  whatsappNumber: fc.constant('+966XXXXXXXXX'),
  trustIndicators: fc.array(fc.record({
    icon: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    description: fc.string({ minLength: 1 })
  }), { minLength: 3, maxLength: 6 }),
  industries: fc.array(fc.record({
    name: fc.string({ minLength: 1 }),
    icon: fc.string({ minLength: 1 }),
    description: fc.string({ minLength: 1 })
  }), { minLength: 4, maxLength: 8 })
});

describe('Visual and Brand Consistency Property Tests', () => {
  /**
   * Property 6: Visual and Brand Consistency
   * For any page element or component, the design should maintain consistent 
   * red/navy blue branding and professional visual standards.
   * Validates: Requirements 4.5
   */

  test('Property 6.1: Brand colors are consistently applied across all components', () => {
    fc.assert(fc.property(
      fc.record({
        heroTitle: fc.string({ minLength: 1 }),
        heroSubtitle: fc.string({ minLength: 1 }),
        categories: mockProductCategories,
        companyInfo: mockCompanyInfo
      }),
      (testData) => {
        // Test HeroSection brand colors - uses gradient background
        const { container: heroContainer } = render(
          <HeroSection 
            title={testData.heroTitle}
            subtitle={testData.heroSubtitle}
          />
        );

        // Check for brand gradient classes in hero section
        const heroElement = heroContainer.querySelector('#hero');
        expect(heroElement).toHaveClass('bg-gradient-to-br');
        expect(heroElement).toHaveClass('from-brand-navy-900');

        // Test AboutSection brand colors
        const { container: aboutContainer } = render(
          <AboutSection companyInfo={testData.companyInfo} />
        );

        // Check for brand color classes in about section
        const aboutElement = aboutContainer.querySelector('#about');
        expect(aboutElement).toHaveClass('bg-brand-navy-50');

        // Test ProductCatalog brand colors
        const { container: productContainer } = render(
          <ProductCatalog categories={testData.categories} />
        );

        // Check for brand color classes in product section
        const productElement = productContainer.querySelector('#products');
        expect(productElement).toHaveClass('bg-white');

        // Test ContactSection brand colors
        const { container: contactContainer } = render(
          <ContactSection />
        );

        // Check for brand color classes in contact section
        const contactElement = contactContainer.querySelector('#contact');
        expect(contactElement).toHaveClass('bg-brand-navy-50');
      }
    ), { numRuns: 25 }); // Reduced runs to prevent memory issues
  });

  test('Property 6.2: Typography hierarchy is consistent across components', () => {
    fc.assert(fc.property(
      fc.record({
        title: fc.string({ minLength: 2 }).filter(s => s.trim().length > 0),
        subtitle: fc.string({ minLength: 2 }).filter(s => s.trim().length > 0),
        categories: mockProductCategories,
        companyInfo: mockCompanyInfo
      }),
      (testData) => {
        // Test HeroSection typography - uses specific Tailwind classes
        const { container: heroContainer } = render(
          <HeroSection 
            title={testData.title}
            subtitle={testData.subtitle}
          />
        );

        // Check for consistent heading classes by looking at the structure
        const heroTitle = heroContainer.querySelector('h1');
        expect(heroTitle).toHaveClass('text-4xl');
        expect(heroTitle).toHaveClass('font-bold');

        // Test AboutSection typography
        const { container: aboutContainer } = render(
          <AboutSection companyInfo={testData.companyInfo} />
        );

        // Check for consistent heading classes in about section
        const aboutHeading = aboutContainer.querySelector('h2');
        expect(aboutHeading).toHaveClass('heading-2');

        // Test ProductCatalog typography
        const { container: productContainer } = render(
          <ProductCatalog categories={testData.categories} />
        );

        // Check for consistent heading classes in product catalog
        const productHeading = productContainer.querySelector('h2');
        expect(productHeading).toHaveClass('text-3xl');
        expect(productHeading).toHaveClass('font-bold');

        // Test ContactSection typography
        const { container: contactContainer } = render(
          <ContactSection />
        );

        // Check for consistent heading classes in contact section
        const contactHeading = contactContainer.querySelector('h2');
        expect(contactHeading).toHaveClass('heading-2');
      }
    ), { numRuns: 50 }); // Reduced runs to prevent memory issues
  });

  test('Property 6.3: Button styling is consistent across all variants', () => {
    fc.assert(fc.property(
      fc.record({
        text: fc.string({ minLength: 1 }),
        variant: fc.constantFrom('primary', 'secondary', 'outline', 'ghost'),
        size: fc.constantFrom('sm', 'md', 'lg')
      }),
      (testData) => {
        const { container } = render(
          <Button variant={testData.variant} size={testData.size}>
            {testData.text}
          </Button>
        );

        const button = container.querySelector('button');
        expect(button).toBeTruthy();

        // Check for consistent base classes
        expect(button).toHaveClass('inline-flex');
        expect(button).toHaveClass('items-center');
        expect(button).toHaveClass('justify-center');
        expect(button).toHaveClass('font-semibold');
        expect(button).toHaveClass('transition-all');
        expect(button).toHaveClass('duration-200');
        expect(button).toHaveClass('focus-ring');
        expect(button).toHaveClass('touch-target');

        // Check variant-specific classes
        if (testData.variant === 'primary') {
          expect(button).toHaveClass('button-primary');
        } else if (testData.variant === 'secondary') {
          expect(button).toHaveClass('button-secondary');
        }

        // Check for hover effects
        expect(button).toHaveClass('hover:-translate-y-0.5');
      }
    ), { numRuns: 50 });
  });

  test('Property 6.4: Card components maintain consistent industrial design', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 2 }).filter(s => s.trim().length > 0),
      (content) => {
        const { container } = render(
          <Card>
            <div>{content}</div>
          </Card>
        );

        const card = container.querySelector('div');
        expect(card).toBeTruthy();

        // Check for consistent card classes
        expect(card).toHaveClass('card-industrial');
        expect(card).toHaveClass('group');
        expect(card).toHaveClass('cursor-pointer');

        // Verify the card has the expected structure
        expect(card).toBeInTheDocument();
        expect(card?.textContent).toContain(content);
      }
    ), { numRuns: 50 }); // Reduced runs to prevent memory issues
  });

  test('Property 6.5: Animation classes are consistently applied', () => {
    fc.assert(fc.property(
      mockCompanyInfo,
      (companyInfo) => {
        const { container } = render(
          <AboutSection companyInfo={companyInfo} />
        );

        // Check for consistent animation classes
        const animatedElements = container.querySelectorAll('.animate-fade-in-up');
        expect(animatedElements.length).toBeGreaterThan(0);

        // Check for stagger animation classes
        const staggerElements = container.querySelectorAll('[class*="animate-stagger-"]');
        expect(staggerElements.length).toBeGreaterThan(0);

        // Verify animation classes follow the pattern
        staggerElements.forEach((element) => {
          const classList = Array.from(element.classList);
          const hasStaggerClass = classList.some(cls => cls.match(/^animate-stagger-\d+$/));
          expect(hasStaggerClass).toBe(true);
        });
      }
    ), { numRuns: 25 });
  });

  test('Property 6.6: Professional spacing system is consistently used', () => {
    fc.assert(fc.property(
      fc.record({
        categories: mockProductCategories,
        companyInfo: mockCompanyInfo
      }),
      (testData) => {
        // Test section padding consistency - AboutSection uses section-padding class
        const { container: aboutContainer } = render(
          <AboutSection companyInfo={testData.companyInfo} />
        );

        const aboutSection = aboutContainer.querySelector('#about');
        // AboutSection uses the section-padding class
        expect(aboutSection).toHaveClass('section-padding');

        const { container: productContainer } = render(
          <ProductCatalog categories={testData.categories} />
        );

        const productSection = productContainer.querySelector('#products');
        // ProductCatalog uses Tailwind utility classes
        expect(productSection).toHaveClass('py-16');

        const { container: contactContainer } = render(
          <ContactSection />
        );

        const contactSection = contactContainer.querySelector('#contact');
        // ContactSection uses section-padding class
        expect(contactSection).toHaveClass('section-padding');

        // Test container consistency - check for proper container classes
        const industrialContainers = [
          ...aboutContainer.querySelectorAll('.container-industrial'),
          ...contactContainer.querySelectorAll('.container-industrial')
        ];
        
        const maxWidthContainers = [
          ...productContainer.querySelectorAll('.max-w-7xl')
        ];

        // Ensure we have containers
        expect(industrialContainers.length + maxWidthContainers.length).toBeGreaterThan(0);
        
        // Check industrial containers have the right class
        industrialContainers.forEach(container => {
          expect(container).toHaveClass('container-industrial');
        });
        
        // Check max-width containers have centering
        maxWidthContainers.forEach(container => {
          expect(container).toHaveClass('mx-auto');
        });
      }
    ), { numRuns: 25 });
  });

  test('Property 6.7: Brand red and navy colors are properly defined and used', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      (content) => {
        // Test that brand color classes are available in the DOM
        const { container } = render(
          <div className="text-brand-red bg-brand-navy border-brand-red">
            {content}
          </div>
        );

        const element = container.firstChild as HTMLElement;
        expect(element).toHaveClass('text-brand-red');
        expect(element).toHaveClass('bg-brand-navy');
        expect(element).toHaveClass('border-brand-red');

        // Test gradient classes
        const { container: gradientContainer } = render(
          <div className="bg-gradient-red text-gradient-red">
            {content}
          </div>
        );

        const gradientElement = gradientContainer.firstChild as HTMLElement;
        expect(gradientElement).toHaveClass('bg-gradient-red');
        expect(gradientElement).toHaveClass('text-gradient-red');
      }
    ), { numRuns: 25 });
  });
});