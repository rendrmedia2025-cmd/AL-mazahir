import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AvailabilityIndicator, { statusConfig } from './AvailabilityIndicator';
import { AvailabilityStatus } from '@/lib/types/database';

// Mock the useAvailabilitySubscription hook
jest.mock('@/lib/hooks', () => ({
  useAvailabilitySubscription: jest.fn()
}));

import { useAvailabilitySubscription } from '@/lib/hooks';

const mockUseAvailabilitySubscription = useAvailabilitySubscription as jest.MockedFunction<typeof useAvailabilitySubscription>;

describe('AvailabilityIndicator', () => {
  const mockCategoryId = 'test-category-id';
  const mockTimestamp = '2024-01-01T12:00:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('All four availability states rendering', () => {
    const availabilityStates: AvailabilityStatus[] = ['in_stock', 'limited', 'out_of_stock', 'on_order'];

    availabilityStates.forEach((status) => {
      it(`renders ${status} state correctly`, async () => {
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

        render(<AvailabilityIndicator categoryId={mockCategoryId} />);

        const config = statusConfig[status];
        
        // Check that the status label is displayed
        expect(screen.getByText(config.label)).toBeInTheDocument();
        
        // Check that the status indicator dot is present with correct color class
        const indicator = document.querySelector(`.${config.dotColor}`);
        expect(indicator).toBeInTheDocument();
        
        // Check that the text has the correct color class
        const statusText = screen.getByText(config.label);
        expect(statusText).toHaveClass(config.color);
      });
    });

    it('displays timestamp when showTimestamp is true', async () => {
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

      render(<AvailabilityIndicator categoryId={mockCategoryId} showTimestamp={true} />);

      // Check that timestamp is displayed
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });

    it('does not display timestamp when showTimestamp is false', async () => {
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

      render(<AvailabilityIndicator categoryId={mockCategoryId} showTimestamp={false} />);

      // Check that timestamp is not displayed
      expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
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

      render(<AvailabilityIndicator categoryId={mockCategoryId} />);

      // Check that skeleton loader is displayed
      const skeletonDot = document.querySelector('.animate-pulse .bg-gray-300.rounded-full');
      const skeletonText = document.querySelector('.animate-pulse .bg-gray-300.rounded');
      
      expect(skeletonDot).toBeInTheDocument();
      expect(skeletonText).toBeInTheDocument();
    });
  });

  describe('Fallback behavior when API fails', () => {
    it('displays error fallback when there is an error and no data', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: false,
        error: 'API Error',
        refetch: jest.fn()
      });

      render(<AvailabilityIndicator categoryId={mockCategoryId} />);

      // Check that fallback error message is displayed
      expect(screen.getByText('Contact for status')).toBeInTheDocument();
      
      // Check that gray indicator dot is displayed
      const grayDot = document.querySelector('.bg-gray-400.rounded-full');
      expect(grayDot).toBeInTheDocument();
    });

    it('uses fallback status when provided and no data available (no error)', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: false,
        error: null, // No error, so fallback should be used
        refetch: jest.fn()
      });

      const fallbackStatus: AvailabilityStatus = 'limited';
      render(
        <AvailabilityIndicator 
          categoryId={mockCategoryId} 
          fallbackStatus={fallbackStatus} 
        />
      );

      const config = statusConfig[fallbackStatus];
      
      // Check that fallback status is displayed
      expect(screen.getByText(config.label)).toBeInTheDocument();
      
      // Check that the correct color is applied
      const statusText = screen.getByText(config.label);
      expect(statusText).toHaveClass(config.color);
    });

    it('prioritizes error message over fallback status when there is an error', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: false,
        error: 'API Error',
        refetch: jest.fn()
      });

      const fallbackStatus: AvailabilityStatus = 'limited';
      render(
        <AvailabilityIndicator 
          categoryId={mockCategoryId} 
          fallbackStatus={fallbackStatus} 
        />
      );

      // Check that error message is displayed instead of fallback
      expect(screen.getByText('Contact for status')).toBeInTheDocument();
      expect(screen.queryByText('Limited Stock')).not.toBeInTheDocument();
    });

    it('returns null when no data and no fallback provided', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {},
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      const { container } = render(<AvailabilityIndicator categoryId={mockCategoryId} />);

      // Check that nothing is rendered
      expect(container.firstChild).toBeNull();
    });

    it('displays data when available even if there is an error', () => {
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: mockTimestamp
          }
        },
        loading: false,
        error: 'Some error',
        refetch: jest.fn()
      });

      render(<AvailabilityIndicator categoryId={mockCategoryId} />);

      // Check that actual data is displayed despite error
      expect(screen.getByText('In Stock')).toBeInTheDocument();
      expect(screen.queryByText('Contact for status')).not.toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className correctly', () => {
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
        <AvailabilityIndicator 
          categoryId={mockCategoryId} 
          className={customClass} 
        />
      );

      // Check that custom class is applied
      const indicatorElement = container.querySelector(`.${customClass}`);
      expect(indicatorElement).toBeInTheDocument();
    });
  });

  describe('Recent status animation', () => {
    it('shows pulse animation for recent updates', () => {
      // Create a timestamp that is less than 5 minutes ago
      const recentTimestamp = new Date(Date.now() - 2 * 60 * 1000).toISOString(); // 2 minutes ago
      
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: recentTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<AvailabilityIndicator categoryId={mockCategoryId} />);

      // Check that pulse animation is applied for recent updates
      const pulseDot = document.querySelector('.animate-pulse.bg-green-500');
      expect(pulseDot).toBeInTheDocument();
    });

    it('does not show pulse animation for old updates', () => {
      // Create a timestamp that is more than 5 minutes ago
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      
      mockUseAvailabilitySubscription.mockReturnValue({
        availabilityData: {
          [mockCategoryId]: {
            status: 'in_stock',
            lastUpdated: oldTimestamp
          }
        },
        loading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<AvailabilityIndicator categoryId={mockCategoryId} />);

      // Check that pulse animation is not applied for old updates
      const pulseDot = document.querySelector('.animate-pulse.bg-green-500');
      expect(pulseDot).not.toBeInTheDocument();
      
      // But the regular dot should still be there
      const regularDot = document.querySelector('.bg-green-500');
      expect(regularDot).toBeInTheDocument();
    });
  });
});