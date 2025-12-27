/**
 * Property-based tests for product catalog interactions
 * Feature: corporate-website, Property 1: Product Catalog Interaction Consistency
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5
 */

import * as fc from 'fast-check';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductCatalog } from './ProductCatalog';

// Mock the LazyLoad component to always render children immediately
jest.mock('@/lib/performance', () => ({
  ...jest.requireActual('@/lib/performance'),
  LazyLoad: ({ children }: { children: React.ReactNode }) => children,
  getOptimizedImageProps: (src: string, alt: string) => ({
    src,
    alt,
  }),
}));

// Safe string generator for names and descriptions using predefined realistic values
const safeProductNameGenerator = fc.constantFrom(
  'Safety Helmet', 'Work Gloves', 'Safety Glasses', 'Fire Extinguisher', 
  'Steel Rebar', 'Concrete Blocks', 'Power Drill', 'Angle Grinder',
  'Industrial Adhesive', 'Fasteners Set', 'Forklift Rental', 'Scaffolding System'
);

const safeDescriptionGenerator = fc.constantFrom(
  'High-quality safety equipment for industrial use and construction sites',
  'Professional-grade tools and machinery for construction and maintenance operations',
  'Fire prevention and safety systems including extinguishers and emergency lighting',
  'Quality construction materials including cement steel and building supplies',
  'Essential industrial supplies including fasteners adhesives and maintenance materials',
  'Equipment rental and logistics solutions including lifting equipment and transportation tools'
);

// Generators for test data with unique category names to avoid duplicate element matches
const categoryNames = ['Safety Equipment', 'Fire Safety', 'Construction Materials', 'Tools Machinery', 'Industrial Supplies', 'Rental Logistics'];

// Create a simple category generator that ensures unique categories per test
const createUniqueCategory = (index: number, testId: string) => ({
  id: `${testId}-cat-${index}`,
  name: `${categoryNames[index]}-${testId}`,
  description: `${categoryNames[index]} description for test ${testId}`,
  image: `/assets/${testId}-cat-${index}.jpg`,
  slug: `${testId}-cat-${index}`,
  products: [],
});

describe('Property-based tests for ProductCatalog', () => {
  beforeEach(() => {
    cleanup();
    // Clear any remaining DOM elements
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    // Clear any remaining DOM elements
    document.body.innerHTML = '';
  });

  /**
   * Property 1: Product Catalog Interaction Consistency
   * For any product category in the catalog, clicking on it should display relevant products 
   * with images, descriptions, and an "Enquire Now" button in a consistent grid layout.
   * Validates: Requirements 2.2, 2.3, 2.4, 2.5
   */
  test('Property 1: Product catalog should consistently display categories with required elements', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.uuid(),
        (numCategories, testId) => {
          const categories = Array.from({ length: numCategories }, (_, i) => createUniqueCategory(i, testId));
          const mockEnquireNow = jest.fn();
          
          render(
            <ProductCatalog 
              categories={categories} 
              onEnquireNow={mockEnquireNow}
            />
          );

          // Property: All categories should be displayed in the grid
          categories.forEach(category => {
            expect(screen.getByText(category.name)).toBeInTheDocument();
            expect(screen.getByText(category.description)).toBeInTheDocument();
          });

          // Property: Each category should have an "Enquire Now" button
          const enquireButtons = screen.getAllByText('Enquire Now');
          expect(enquireButtons.length).toBe(categories.length);

          // Property: Category images should be present with proper alt text
          categories.forEach(category => {
            const categoryImage = screen.getByAltText(category.name);
            expect(categoryImage).toBeInTheDocument();
            expect(categoryImage).toHaveAttribute('src', expect.stringContaining(category.image));
          });

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  test('Property 1: Clicking on category should open modal with product details', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        fc.uuid(),
        (numCategories, testId) => {
          const categories = Array.from({ length: numCategories }, (_, i) => createUniqueCategory(i, testId));
          const mockEnquireNow = jest.fn();
          
          const { container } = render(
            <ProductCatalog 
              categories={categories} 
              onEnquireNow={mockEnquireNow}
            />
          );

          // Test clicking on the first category
          const firstCategory = categories[0];
          const categoryCard = screen.getByText(firstCategory.name).closest('.group');
          
          if (categoryCard) {
            fireEvent.click(categoryCard);

            // Property: Modal should open with category name as title (check for modal specifically)
            const modalTitle = container.querySelector('[id="modal-title"]');
            expect(modalTitle).toBeInTheDocument();
            expect(modalTitle).toHaveTextContent(firstCategory.name);
            
            // Property: Modal should display category description
            expect(screen.getByText(firstCategory.description)).toBeInTheDocument();

            // Property: If category has products, they should be displayed in grid
            if (firstCategory.products && firstCategory.products.length > 0) {
              expect(screen.getByText('Available Products')).toBeInTheDocument();
              
              firstCategory.products.forEach(product => {
                expect(screen.getByText(product.name)).toBeInTheDocument();
                expect(screen.getByText(product.description)).toBeInTheDocument();
                
                const productImage = screen.getByAltText(product.name);
                expect(productImage).toBeInTheDocument();
              });
            }

            // Property: Modal should have an enquire button for the category
            const modalEnquireButton = screen.getByText(`Enquire About ${firstCategory.name}`);
            expect(modalEnquireButton).toBeInTheDocument();
          }

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  test('Property 1: Enquire Now buttons should trigger callback with correct category', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        fc.uuid(),
        (numCategories, testId) => {
          const categories = Array.from({ length: numCategories }, (_, i) => createUniqueCategory(i, testId));
          const mockEnquireNow = jest.fn();
          
          render(
            <ProductCatalog 
              categories={categories} 
              onEnquireNow={mockEnquireNow}
            />
          );

          // Property: Each "Enquire Now" button should call callback with correct category
          const enquireButtons = screen.getAllByText('Enquire Now');
          
          // Test the first enquire button
          if (enquireButtons.length > 0) {
            fireEvent.click(enquireButtons[0]);
            
            expect(mockEnquireNow).toHaveBeenCalledWith(categories[0]);
            expect(mockEnquireNow).toHaveBeenCalledTimes(1);
          }

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  test('Property 1: Grid layout should be responsive and consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.uuid(),
        (numCategories, testId) => {
          const categories = Array.from({ length: numCategories }, (_, i) => createUniqueCategory(i, testId));
          
          const { container } = render(
            <ProductCatalog categories={categories} />
          );

          // Property: Categories should be displayed in a grid layout
          const gridContainer = container.querySelector('.grid');
          expect(gridContainer).toBeInTheDocument();
          
          // Property: Grid should have responsive classes
          expect(gridContainer).toHaveClass('grid-cols-1');
          expect(gridContainer).toHaveClass('md:grid-cols-2');
          expect(gridContainer).toHaveClass('lg:grid-cols-3');

          // Property: Each category card should have consistent structure
          const categoryCards = container.querySelectorAll('.group');
          expect(categoryCards.length).toBe(categories.length);

          categoryCards.forEach(card => {
            // Each card should have image, content, and footer sections
            expect(card.querySelector('img')).toBeInTheDocument();
            expect(card.querySelector('h3')).toBeInTheDocument();
            expect(card.querySelector('p')).toBeInTheDocument();
            expect(card.querySelector('button')).toBeInTheDocument();
          });

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  test('Property 1: Empty product list should display appropriate message', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        fc.uuid(),
        (numCategories, testId) => {
          const categories = Array.from({ length: numCategories }, (_, i) => createUniqueCategory(i, testId));
          
          render(
            <ProductCatalog categories={categories} />
          );

          // Click on first category to open modal
          const firstCategory = categories[0];
          const categoryCard = screen.getByText(firstCategory.name).closest('.group');
          
          if (categoryCard) {
            fireEvent.click(categoryCard);

            // Property: Should display message when no products available (use getAllByText to handle multiple instances)
            const messages = screen.getAllByText('Product details will be available soon. Contact us for more information.');
            expect(messages.length).toBeGreaterThan(0);
            
            // Property: Should not display "Available Products" section
            expect(screen.queryByText('Available Products')).not.toBeInTheDocument();
          }

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  test('Property 1: Component should handle missing onEnquireNow callback gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        fc.uuid(),
        (numCategories, testId) => {
          const categories = Array.from({ length: numCategories }, (_, i) => createUniqueCategory(i, testId));
          
          // Property: Component should render without onEnquireNow callback
          expect(() => {
            render(<ProductCatalog categories={categories} />);
          }).not.toThrow();

          // Property: Enquire buttons should still be clickable without errors
          const enquireButtons = screen.getAllByText('Enquire Now');
          expect(() => {
            if (enquireButtons.length > 0) {
              fireEvent.click(enquireButtons[0]);
            }
          }).not.toThrow();

          return true;
        }
      ),
      { numRuns: 5 }
    );
  });
});