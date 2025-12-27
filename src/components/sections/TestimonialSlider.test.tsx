import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestimonialSlider } from './TestimonialSlider';

// Mock the useTestimonials hook
const mockUseTestimonials = jest.fn();
jest.mock('@/lib/hooks/useTestimonials', () => ({
  useTestimonials: () => mockUseTestimonials()
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

const mockTestimonials = [
  {
    id: '1',
    name: 'Ahmed Al-Rashid',
    company: 'Saudi Construction Co.',
    position: 'Safety Manager',
    content: 'Al Mazahir Trading has been our trusted partner for industrial safety equipment.',
    rating: 5,
    isActive: true
  },
  {
    id: '2',
    name: 'Fatima Al-Zahra',
    company: 'Gulf Manufacturing Ltd.',
    position: 'Procurement Director',
    content: 'The comprehensive range of safety solutions has improved our workplace safety.',
    rating: 5,
    isActive: true
  },
  {
    id: '3',
    name: 'Mohammed Al-Otaibi',
    company: 'Riyadh Infrastructure Projects',
    position: 'Project Manager',
    content: 'Outstanding service and high-quality industrial equipment.',
    rating: 4,
    isActive: false // Inactive testimonial
  }
];

describe('TestimonialSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: [],
        loading: true,
        error: null,
        refetch: jest.fn()
      });
    });

    it('displays loading skeleton', () => {
      render(<TestimonialSlider />);
      
      // Should show section title
      expect(screen.getByText('What Our Clients Say')).toBeInTheDocument();
      
      // Should show loading skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Success State with API Data', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: mockTestimonials,
        loading: false,
        error: null,
        refetch: jest.fn()
      });
    });

    it('renders testimonials from API', () => {
      render(<TestimonialSlider />);
      
      // Should show section title and description
      expect(screen.getByText('What Our Clients Say')).toBeInTheDocument();
      expect(screen.getByText(/Trusted by leading industrial companies/)).toBeInTheDocument();
      
      // Should show first active testimonial
      expect(screen.getByText('Ahmed Al-Rashid')).toBeInTheDocument();
      expect(screen.getByText('Safety Manager')).toBeInTheDocument();
      expect(screen.getByText('Saudi Construction Co.')).toBeInTheDocument();
      expect(screen.getByText(/Al Mazahir Trading has been our trusted partner/)).toBeInTheDocument();
    });

    it('only displays active testimonials', () => {
      render(<TestimonialSlider />);
      
      // Should not show inactive testimonial
      expect(screen.queryByText('Mohammed Al-Otaibi')).not.toBeInTheDocument();
    });

    it('displays rating stars correctly', () => {
      render(<TestimonialSlider />);
      
      // Should show 5 stars for first testimonial
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(5);
    });

    it('shows navigation dots when multiple testimonials', () => {
      render(<TestimonialSlider />);
      
      // Should show navigation dots (2 active testimonials)
      const dots = document.querySelectorAll('[role="tab"]');
      expect(dots).toHaveLength(2);
    });

    it('shows navigation arrows when multiple testimonials', () => {
      render(<TestimonialSlider />);
      
      // Should show previous and next buttons
      expect(screen.getByLabelText('Previous testimonial')).toBeInTheDocument();
      expect(screen.getByLabelText('Next testimonial')).toBeInTheDocument();
    });

    it('navigates to next testimonial when next button clicked', () => {
      render(<TestimonialSlider />);
      
      // Click next button
      const nextButton = screen.getByLabelText('Next testimonial');
      fireEvent.click(nextButton);
      
      // Should show second testimonial
      expect(screen.getByText('Fatima Al-Zahra')).toBeInTheDocument();
      expect(screen.getByText('Procurement Director')).toBeInTheDocument();
    });

    it('navigates to previous testimonial when previous button clicked', () => {
      render(<TestimonialSlider />);
      
      // First go to next testimonial
      const nextButton = screen.getByLabelText('Next testimonial');
      fireEvent.click(nextButton);
      
      // Then go back to previous
      const prevButton = screen.getByLabelText('Previous testimonial');
      fireEvent.click(prevButton);
      
      // Should show first testimonial again
      expect(screen.getByText('Ahmed Al-Rashid')).toBeInTheDocument();
    });

    it('navigates using dot navigation', () => {
      render(<TestimonialSlider />);
      
      // Click second dot
      const dots = document.querySelectorAll('[role="tab"]');
      fireEvent.click(dots[1]);
      
      // Should show second testimonial
      expect(screen.getByText('Fatima Al-Zahra')).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
      render(<TestimonialSlider />);
      
      const slider = screen.getByRole('region', { name: 'Testimonial slider' });
      
      // Press right arrow
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      
      // Should show second testimonial
      expect(screen.getByText('Fatima Al-Zahra')).toBeInTheDocument();
      
      // Press left arrow
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      
      // Should show first testimonial again
      expect(screen.getByText('Ahmed Al-Rashid')).toBeInTheDocument();
    });

    it('shows play/pause control', () => {
      render(<TestimonialSlider autoAdvanceInterval={5000} />);
      
      // Should show play/pause button
      expect(screen.getByLabelText('Pause slideshow')).toBeInTheDocument();
    });

    it('toggles play/pause when control clicked', () => {
      render(<TestimonialSlider autoAdvanceInterval={5000} />);
      
      const playPauseButton = screen.getByLabelText('Pause slideshow');
      fireEvent.click(playPauseButton);
      
      // Should change to play button
      expect(screen.getByLabelText('Play slideshow')).toBeInTheDocument();
    });
  });

  describe('Fallback State', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: [],
        loading: false,
        error: 'API Error',
        refetch: jest.fn()
      });
    });

    it('uses fallback testimonials when API fails', () => {
      render(<TestimonialSlider />);
      
      // Should show fallback testimonials
      expect(screen.getByText('Ahmed Al-Rashid')).toBeInTheDocument();
      expect(screen.getByText('Saudi Construction Co.')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: [],
        loading: false,
        error: null,
        refetch: jest.fn()
      });
    });

    it('renders nothing when no testimonials and no fallback', () => {
      const { container } = render(<TestimonialSlider fallbackTestimonials={[]} />);
      
      // Should render nothing
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Configuration Options', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: mockTestimonials,
        loading: false,
        error: null,
        refetch: jest.fn()
      });
    });

    it('hides navigation dots when showDots is false', () => {
      render(<TestimonialSlider showDots={false} />);
      
      // Should not show navigation dots
      const dots = document.querySelectorAll('[role="tab"]');
      expect(dots).toHaveLength(0);
    });

    it('hides navigation arrows when showArrows is false', () => {
      render(<TestimonialSlider showArrows={false} />);
      
      // Should not show navigation arrows
      expect(screen.queryByLabelText('Previous testimonial')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next testimonial')).not.toBeInTheDocument();
    });

    it('disables auto-advance when interval is 0', () => {
      render(<TestimonialSlider autoAdvanceInterval={0} />);
      
      // Should not show play/pause control
      expect(screen.queryByLabelText('Pause slideshow')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<TestimonialSlider className="custom-class" />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });
  });

  describe('Single Testimonial', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: [mockTestimonials[0]], // Only one testimonial
        loading: false,
        error: null,
        refetch: jest.fn()
      });
    });

    it('hides navigation when only one testimonial', () => {
      render(<TestimonialSlider />);
      
      // Should not show navigation elements
      expect(screen.queryByLabelText('Previous testimonial')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next testimonial')).not.toBeInTheDocument();
      
      const dots = document.querySelectorAll('[role="tab"]');
      expect(dots).toHaveLength(0);
      
      expect(screen.queryByLabelText('Pause slideshow')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseTestimonials.mockReturnValue({
        testimonials: mockTestimonials,
        loading: false,
        error: null,
        refetch: jest.fn()
      });
    });

    it('has proper ARIA labels and roles', () => {
      render(<TestimonialSlider />);
      
      // Should have proper section label
      expect(screen.getByLabelText('Customer testimonials')).toBeInTheDocument();
      
      // Should have proper slider region
      expect(screen.getByRole('region', { name: 'Testimonial slider' })).toBeInTheDocument();
      
      // Should have proper tablist for navigation
      expect(screen.getByRole('tablist', { name: 'Testimonial navigation' })).toBeInTheDocument();
      
      // Should have proper rating label
      expect(screen.getByLabelText('Rating: 5 out of 5 stars')).toBeInTheDocument();
    });

    it('has keyboard navigation support', () => {
      render(<TestimonialSlider />);
      
      const slider = screen.getByRole('region', { name: 'Testimonial slider' });
      expect(slider).toHaveAttribute('tabIndex', '0');
    });
  });
});