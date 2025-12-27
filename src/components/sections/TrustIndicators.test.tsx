import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TrustIndicators } from './TrustIndicators';

// Mock the useActiveCategories hook
jest.mock('@/lib/hooks/useActiveCategories', () => ({
  useActiveCategories: () => ({
    activeCount: 6,
    loading: false,
    error: null
  })
}));

// Mock AnimatedCounter component
jest.mock('@/components/ui/AnimatedCounter', () => ({
  AnimatedCounter: ({ target, suffix, className }: any) => (
    <span className={className}>{target}{suffix}</span>
  )
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('TrustIndicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default values', () => {
    render(<TrustIndicators />);
    
    // Check section title
    expect(screen.getByText('Trusted by Industry Leaders')).toBeInTheDocument();
    
    // Check section description
    expect(screen.getByText(/Our commitment to excellence and safety/)).toBeInTheDocument();
    
    // Check default indicators
    expect(screen.getByText('15+')).toBeInTheDocument(); // Years of experience
    expect(screen.getByText('500+')).toBeInTheDocument(); // Projects
    expect(screen.getByText('200+')).toBeInTheDocument(); // Clients
    expect(screen.getByText('6')).toBeInTheDocument(); // Active categories
  });

  it('renders with custom values', () => {
    render(
      <TrustIndicators
        yearsOfExperience={20}
        projectCount={750}
        clientCount={300}
      />
    );
    
    // Check custom values
    expect(screen.getByText('20+')).toBeInTheDocument();
    expect(screen.getByText('750+')).toBeInTheDocument();
    expect(screen.getByText('300+')).toBeInTheDocument();
  });

  it('displays all indicator labels correctly', () => {
    render(<TrustIndicators />);
    
    // Check all indicator labels
    expect(screen.getByText('Years of Experience')).toBeInTheDocument();
    expect(screen.getByText('Projects Completed')).toBeInTheDocument();
    expect(screen.getByText('Satisfied Clients')).toBeInTheDocument();
    expect(screen.getByText('Active Supply Categories')).toBeInTheDocument();
  });

  it('displays all indicator descriptions correctly', () => {
    render(<TrustIndicators />);
    
    // Check all indicator descriptions
    expect(screen.getByText('Serving industrial clients across Saudi Arabia')).toBeInTheDocument();
    expect(screen.getByText('Successful industrial safety implementations')).toBeInTheDocument();
    expect(screen.getByText('Trusted by leading industrial companies')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive industrial solutions available')).toBeInTheDocument();
  });

  it('displays all indicator icons correctly', () => {
    render(<TrustIndicators />);
    
    // Check all indicator icons
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('🏗️')).toBeInTheDocument();
    expect(screen.getByText('🤝')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('displays additional trust elements', () => {
    render(<TrustIndicators />);
    
    // Check additional trust elements
    expect(screen.getByText('Quality Certified')).toBeInTheDocument();
    expect(screen.getByText('ISO standards compliance')).toBeInTheDocument();
    
    expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
    expect(screen.getByText('Kingdom-wide logistics')).toBeInTheDocument();
    
    expect(screen.getByText('Safety First')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive safety solutions')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TrustIndicators className="custom-class" />);
    
    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('has proper section structure and styling', () => {
    const { container } = render(<TrustIndicators />);
    
    // Check section has proper classes
    const section = container.querySelector('section');
    expect(section).toHaveClass('section-padding', 'bg-brand-navy-50');
    
    // Check container has proper class
    const containerDiv = container.querySelector('.container-industrial');
    expect(containerDiv).toBeInTheDocument();
  });

  it('renders indicators in a grid layout', () => {
    const { container } = render(<TrustIndicators />);
    
    // Check grid layout classes
    const gridContainer = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    render(
      <TrustIndicators
        yearsOfExperience={0}
        projectCount={0}
        clientCount={0}
      />
    );
    
    // Should display zero values without crashing - use getAllByText since there are multiple 0+ values
    const zeroElements = screen.getAllByText('0+');
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it('uses dynamic active categories count from hook', async () => {
    render(<TrustIndicators />);
    
    // Should use the mocked value from useActiveCategories hook
    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });
});