/**
 * Property-based tests for navigation behavior
 * Feature: corporate-website, Property 7: Navigation Smoothness
 * Validates: Requirements 1.2
 */

import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation, NavigationItem } from './Navigation';

// Create unique navigation items to avoid conflicts
const createUniqueNavItem = (label: string, index: number): NavigationItem => ({
  label: `${label}-${index}`,
  href: `#${label.toLowerCase()}-${index}`,
  isActive: false,
});

const createUniqueActiveNavItem = (label: string, index: number, isActive: boolean): NavigationItem => ({
  label: `${label}-${index}`,
  href: `#${label.toLowerCase()}-${index}`,
  isActive,
});

describe('Property-based tests for navigation behavior', () => {
  afterEach(() => {
    cleanup();
    // Clear any remaining DOM elements
    document.body.innerHTML = '';
  });

  /**
   * Property 7: Navigation Smoothness
   * For any scroll or navigation action, the website should provide smooth transitions 
   * and proper section navigation behavior.
   * Validates: Requirements 1.2
   */
  test('Property 7: Navigation should render all valid navigation items consistently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        (numItems) => {
          const navItems = Array.from({ length: numItems }, (_, i) => 
            createUniqueNavItem(['Home', 'About', 'Products', 'Services'][i % 4], i)
          );
          
          const { container } = render(<Navigation items={navItems} />);

          const nav = container.querySelector('nav');
          expect(nav).toBeInTheDocument();

          // Property: All navigation items should be rendered as buttons
          expect(nav?.children).toHaveLength(navItems.length);
          
          // Property: Each item should be a clickable button with proper attributes
          navItems.forEach(item => {
            const button = screen.getByText(item.label);
            expect(button).toBeInTheDocument();
            expect(button.tagName).toBe('BUTTON');
            expect(button).toHaveClass('transition-all');
            expect(button).toHaveClass('hover:text-red-600');
          });

          // Clean up after test
          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property: Navigation should handle different variants consistently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.constantFrom('horizontal', 'vertical'),
        (numItems, variant: 'horizontal' | 'vertical') => {
          const navItems = Array.from({ length: numItems }, (_, i) => 
            createUniqueNavItem(['Home', 'About', 'Products'][i % 3], i)
          );
          
          const { container } = render(
            <Navigation 
              items={navItems} 
              variant={variant}
            />
          );

          const nav = container.querySelector('nav');
          expect(nav).toBeInTheDocument();

          // Property: Navigation container should have appropriate flex direction
          if (variant === 'horizontal') {
            expect(nav).toHaveClass('flex-row');
          } else {
            expect(nav).toHaveClass('flex-col');
          }

          // Property: All items should be rendered regardless of variant
          expect(nav?.children).toHaveLength(navItems.length);

          // Clean up after test
          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property: Navigation should handle active states correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (numItems) => {
          const navItems = Array.from({ length: numItems }, (_, i) => 
            createUniqueActiveNavItem(['Home', 'About', 'Products'][i % 3], i, i === 0) // First item is active
          );
          
          render(<Navigation items={navItems} />);

          // Property: Active and inactive items should have different styling
          navItems.forEach(item => {
            const button = screen.getByText(item.label);
            
            if (item.isActive) {
              expect(button).toHaveClass('text-red-600');
            } else {
              expect(button).toHaveClass('text-gray-700');
            }
          });

          // Clean up after test
          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property: Navigation should maintain consistent styling', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (numItems) => {
          const navItems = Array.from({ length: numItems }, (_, i) => 
            createUniqueNavItem(['Home', 'About', 'Products'][i % 3], i)
          );
          
          render(<Navigation items={navItems} />);

          // Property: All navigation buttons should have consistent base styling
          navItems.forEach(item => {
            const button = screen.getByText(item.label);
            
            // Should have hover class for red color
            expect(button).toHaveClass('hover:text-red-600');
            
            // Should have transition class for smooth hover effect
            expect(button).toHaveClass('transition-all');
            
            // Should have proper text size
            expect(button).toHaveClass('text-sm');
            
            // Should have font weight
            expect(button).toHaveClass('font-medium');
          });

          // Clean up after test
          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property: Navigation should handle empty array gracefully', () => {
    const { container } = render(<Navigation items={[]} />);
    
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.children).toHaveLength(0);

    // Clean up after test
    cleanup();
  });

  test('Property: Navigation should handle single valid item', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }),
        (itemIndex) => {
          const navItem = createUniqueNavItem(['Home', 'About', 'Products', 'Services'][itemIndex], 0);
          
          render(<Navigation items={[navItem]} />);

          // Property: Single item should be rendered correctly
          const button = screen.getByText(navItem.label);
          expect(button).toBeInTheDocument();
          expect(button.tagName).toBe('BUTTON');

          // Clean up after test
          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });
});