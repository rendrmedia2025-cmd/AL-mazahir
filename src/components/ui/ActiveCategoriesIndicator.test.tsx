import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ActiveCategoriesIndicator } from './ActiveCategoriesIndicator';

// Mock the useActiveCategories hook with different states
const mockUseActiveCategories = jest.fn();
jest.mock('@/lib/hooks/useActiveCategories', () => ({
  useActiveCategories: () => mockUseActiveCategories()
}));

// Mock AnimatedCounter component
jest.mock('@/components/ui/AnimatedCounter', () => ({
  AnimatedCounter: ({ target, className }: any) => (
    <span className={className}>{target}</span>
  )
}));

describe('ActiveCategoriesIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseActiveCategories.mockReturnValue({
        activeCount: 0,
        loading: true,
        error: null
      });
    });

    it('displays loading skeleton for detailed variant', () => {
      render(<ActiveCategoriesIndicator variant="detailed" showLoading />);
      
      // Should show loading skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('displays loading skeleton for badge variant', () => {
      render(<ActiveCategoriesIndicator variant="badge" showLoading />);
      
      // Should show loading skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('does not show loading when showLoading is false', () => {
      render(<ActiveCategoriesIndicator variant="detailed" showLoading={false} />);
      
      // Should not show loading skeleton, but detailed variant has a pulse dot which is expected
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      // Detailed variant has one pulse dot for the indicator, which is not a loading skeleton
      expect(skeletonElements.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      mockUseActiveCategories.mockReturnValue({
        activeCount: 8,
        loading: false,
        error: null
      });
    });

    it('renders compact variant correctly', () => {
      render(<ActiveCategoriesIndicator variant="compact" />);
      
      // Should show just the number
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.queryByText('Active Categories')).not.toBeInTheDocument();
    });

    it('renders badge variant correctly', () => {
      render(<ActiveCategoriesIndicator variant="badge" />);
      
      // Should show badge with number and text
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Active Categories')).toBeInTheDocument();
      
      // Should have badge styling
      const badge = screen.getByText('Active Categories').closest('div');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    });

    it('renders detailed variant correctly', () => {
      render(<ActiveCategoriesIndicator variant="detailed" />);
      
      // Should show number, title, and description
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Active Supply Categories')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive industrial solutions available now')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ActiveCategoriesIndicator variant="compact" className="custom-class" />
      );
      
      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    beforeEach(() => {
      mockUseActiveCategories.mockReturnValue({
        activeCount: 6, // fallback value
        loading: false,
        error: 'API Error'
      });
    });

    it('continues to render with fallback value on error', () => {
      // Mock console.warn to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<ActiveCategoriesIndicator variant="detailed" />);
      
      // Should show fallback value
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Active Supply Categories')).toBeInTheDocument();
      
      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith('ActiveCategoriesIndicator error:', 'API Error');
      
      consoleSpy.mockRestore();
    });

    it('does not crash on error', () => {
      // Mock console.warn to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => {
        render(<ActiveCategoriesIndicator variant="badge" />);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Variant Styling', () => {
    beforeEach(() => {
      mockUseActiveCategories.mockReturnValue({
        activeCount: 5,
        loading: false,
        error: null
      });
    });

    it('applies correct styling for compact variant', () => {
      const { container } = render(<ActiveCategoriesIndicator variant="compact" />);
      
      const element = container.querySelector('.font-bold.text-brand-orange-500');
      expect(element).toBeInTheDocument();
    });

    it('applies correct styling for badge variant', () => {
      render(<ActiveCategoriesIndicator variant="badge" />);
      
      const badge = screen.getByText('Active Categories').closest('div');
      expect(badge).toHaveClass(
        'bg-brand-orange-100',
        'text-brand-orange-700',
        'text-sm',
        'font-medium'
      );
    });

    it('applies correct styling for detailed variant', () => {
      const { container } = render(<ActiveCategoriesIndicator variant="detailed" />);
      
      // Should have text-center class
      const wrapper = container.querySelector('.text-center');
      expect(wrapper).toBeInTheDocument();
      
      // Should have animated pulse dot
      const pulseDot = container.querySelector('.animate-pulse');
      expect(pulseDot).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    beforeEach(() => {
      mockUseActiveCategories.mockReturnValue({
        activeCount: 4,
        loading: false,
        error: null
      });
    });

    it('uses detailed variant as default', () => {
      render(<ActiveCategoriesIndicator />);
      
      // Should render detailed variant by default
      expect(screen.getByText('Active Supply Categories')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive industrial solutions available now')).toBeInTheDocument();
    });

    it('shows loading by default', () => {
      mockUseActiveCategories.mockReturnValue({
        activeCount: 0,
        loading: true,
        error: null
      });
      
      render(<ActiveCategoriesIndicator />);
      
      // Should show loading skeleton by default
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });
});