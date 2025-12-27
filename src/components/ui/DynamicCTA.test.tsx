import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DynamicCTA, { ctaConfig } from './DynamicCTA';
import { AvailabilityStatus } from '@/lib/types/database';
import type { CTAAction } from './DynamicCTA';

// Mock the useAvailabilitySubscription hook
jest.mock('@/lib/hooks', () => ({
  useAvailabilitySubscription: jest.fn()
}));

// Mock analytics to avoid external calls
jest.mock('@/lib/analytics', () => ({
  event: jest.fn()
}));

import { useAvailabilitySubscription } from '@/lib/hooks';
import { event } from '@/lib/analytics';

const mockUseAvailabilitySubscription = useAvailabilitySubscription as jest.MockedFunction<typeof useAvailabilitySubscription>;
const mockEvent = event as jest.MockedFunction<typeof event>;

describe('DynamicCTA', () => {
  const mockCategoryId = 'test-category-id';
  const mockTimestamp = '2024-01-01T12:00:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('All availability state to CTA text mappings', () => {
    const availabilityStates: AvailabilityStatus[] = ['in_stock', 'limited', 'out_of_stock', 'on_order'];

    availabilityStates.forEach((status) => {
      it(`renders correct CTA text for ${status} status`, async () => {
        // Mock the hook to return the specific status
        mockUseAvailabilitySubscription.mockReturnValue({
          availabilityData: {
            [mockCategoryId]: {
              status,
              lastUpdated: mockTimestamp
            }
          },
          loading: false,
          error: null,
          refetch: jest.fn()
        });

        render(<DynamicCTA categoryId={mockCategoryId} />);

        const config = ctaConfig[status];
        
        // Check that the correct CTA text is displayed
        expect(screen.getByText(config.text)).toBeInTheDocument();
        
        // Check that the button has the correct title attribute
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', config.description);
      });

      it(`triggers correct action type for ${status} status`, async () => {
        mockUseAvailabilitySubscription.mockReturnValue({
          availabilityData: {
            [mockCategoryId]: {
              status,
              lastUpdated: mockTimestamp
            }
          },
          loading: false,
          error: null,
          refetch: jest.fn()
        });

        const mockOnAction = jest.fn();
        render(<DynamicCTA categoryId={mockCategoryId} onAction={mockOnAction} />);

        const config = ctaConfig[status];
        const button = screen.getByText(config.text);
        
        fireEvent.click(button);

        await waitFor(() => {
          expect(mockOnAction).toHaveBeenCalledWith(
            expect.objectContaining({
              type: config.type,
              categoryId: mockCategoryId,
              metadata: expect.objectContaining({
                availabilityStatus: status,
                source: 'dynamic_cta'
              })
            })
          );
        });
      });
    });
  });

  describe('Loading state', () => {
    it('displays skeleton loader while loading', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: true,
        error: null,
        refetch: jest.fn()
      });

      render(<DynamicCTA categoryId={mockCategoryId} />);

      // Check that skeleton loader is displayed
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('does not display skeleton when availability status is provided directly', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: true,
        error: null,
        refetch: jest.fn()
      });

      render(<DynamicCTA categoryId={mockCategoryId} availabilityStatus="in_stock" />);

      // Check that skeleton loader is not displayed when status is provided
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).not.toBeInTheDocument();
      
      // Check that the button is displayed
      expect(screen.getByText('Request Quote')).toBeInTheDocument();
    });
  });

  describe('Fallback behavior when status unavailable', () => {
    it('displays fallback text when no status available and error occurs', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: false,
        error: 'API Error',
        refetch: jest.fn()
      });

      const fallbackText = 'Custom Fallback';
      render(<DynamicCTA categoryId={mockCategoryId} fallbackText={fallbackText} />);

      // Check that fallback text is displayed
      expect(screen.getByText(fallbackText)).toBeInTheDocument();
      
      // Check that button has outline variant (error state)
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2'); // outline variant has border
    });

    it('uses default fallback text when none provided', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: false,
        error: 'API Error',
        refetch: jest.fn()
      });

      render(<DynamicCTA categoryId={mockCategoryId} />);

      // Check that default fallback text is displayed
      expect(screen.getByText('Enquire Now')).toBeInTheDocument();
    });

    it('scrolls to contact section when no onAction handler provided', async () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      // Mock getElementById to return a mock element
      const mockContactSection = { scrollIntoView: jest.fn() };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockContactSection as any);

      render(<DynamicCTA categoryId={mockCategoryId} />);

      const button = screen.getByText('Request Quote');
      fireEvent.click(button);

      await waitFor(() => {
        expect(document.getElementById).toHaveBeenCalledWith('contact');
        expect(mockContactSection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      });
    });
  });

  describe('Analytics tracking', () => {
    it('tracks CTA click events', async () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<DynamicCTA categoryId={mockCategoryId} />);

      const button = screen.getByText('Request Quote');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEvent).toHaveBeenCalledWith({
          action: 'dynamic_cta_click',
          category: 'engagement',
          label: `quote_${mockCategoryId}`,
          value: 1
        });

        expect(mockEvent).toHaveBeenCalledWith({
          action: 'cta_quote',
          category: 'conversion',
          label: mockCategoryId
        });
      });
    });

    it('tracks error events when action fails', async () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const mockOnAction = jest.fn().mockRejectedValue(new Error('Test error'));
      render(<DynamicCTA categoryId={mockCategoryId} onAction={mockOnAction} />);

      const button = screen.getByText('Request Quote');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockEvent).toHaveBeenCalledWith({
          action: 'cta_error',
          category: 'error',
          label: `quote_${mockCategoryId}`
        });
      });
    });
  });

  describe('Button variants and styling', () => {
    it('applies correct variant based on availability status', () => {
      const testCases = [
        { status: 'in_stock' as AvailabilityStatus, expectedVariant: 'primary' },
        { status: 'limited' as AvailabilityStatus, expectedVariant: 'primary' },
        { status: 'out_of_stock' as AvailabilityStatus, expectedVariant: 'secondary' },
        { status: 'on_order' as AvailabilityStatus, expectedVariant: 'outline' }
      ];

      testCases.forEach(({ status, expectedVariant }) => {
        mockUseAvailabilitySubscription.mockReturnValue({
          availabilityData: {
            [mockCategoryId]: {
              status,
              lastUpdated: mockTimestamp
            }
          },
          loading: false,
          error: null,
          refetch: jest.fn()
        });

        const { unmount } = render(<DynamicCTA categoryId={mockCategoryId} />);

        const button = screen.getByRole('button');
        
        // Check variant-specific classes
        switch (expectedVariant) {
          case 'primary':
            expect(button).toHaveClass('button-primary');
            break;
          case 'secondary':
            expect(button).toHaveClass('button-secondary');
            break;
          case 'outline':
            expect(button).toHaveClass('border-2');
            break;
        }

        unmount();
      });
    });

    it('allows custom variant override', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<DynamicCTA categoryId={mockCategoryId} variant="outline" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2'); // outline variant
    });

    it('applies custom className', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const customClass = 'custom-test-class';
      const { container } = render(
        <DynamicCTA categoryId={mockCategoryId} className={customClass} />
      );

      const wrapper = container.querySelector(`.${customClass}`);
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Processing state', () => {
    it('shows processing state during action execution', async () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const mockOnAction = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<DynamicCTA categoryId={mockCategoryId} onAction={mockOnAction} />);

      const button = screen.getByText('Request Quote');
      fireEvent.click(button);

      // Check that processing state is shown
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(button).toBeDisabled();

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.getByText('Request Quote')).toBeInTheDocument();
      });
    });

    it('prevents multiple clicks during processing', async () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const mockOnAction = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<DynamicCTA categoryId={mockCategoryId} onAction={mockOnAction} />);

      const button = screen.getByText('Request Quote');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only be called once
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Size variants', () => {
    it('applies correct size classes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        mockUseAvailabilitySubscription.mockReturnValue({
          availabilityData: {
            [mockCategoryId]: {
              status: 'in_stock',
              lastUpdated: mockTimestamp
            }
          },
          loading: false,
          error: null,
          refetch: jest.fn()
        });

        const { unmount } = render(<DynamicCTA categoryId={mockCategoryId} size={size} />);

        const button = screen.getByRole('button');
        
        // Check size-specific classes
        switch (size) {
          case 'sm':
            expect(button).toHaveClass('h-11');
            break;
          case 'md':
            expect(button).toHaveClass('h-12');
            break;
          case 'lg':
            expect(button).toHaveClass('h-14');
            break;
        }

        unmount();
      });
    });
  });
});