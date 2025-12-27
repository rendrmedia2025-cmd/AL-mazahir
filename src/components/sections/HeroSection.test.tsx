import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from './HeroSection';

// Mock window.open for WhatsApp functionality
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

// Mock scrollIntoView for smooth scrolling
const mockScrollIntoView = jest.fn();
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: mockScrollIntoView,
  writable: true,
});

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays default company information correctly', () => {
    render(<HeroSection />);
    
    // Test that company name is displayed
    expect(screen.getByText('Al Mazahir Trading Est.')).toBeInTheDocument();
    
    // Test that tagline is displayed
    expect(screen.getByText('Your Trusted Partner for Industrial Safety & Equipment Solutions')).toBeInTheDocument();
    
    // Test that value proposition is displayed
    expect(screen.getByText(/Serving Saudi Arabia and the GCC/)).toBeInTheDocument();
  });

  it('displays all required trust indicators', () => {
    render(<HeroSection />);
    
    // Test that all trust indicators are present
    expect(screen.getByText('10+')).toBeInTheDocument();
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    
    expect(screen.getByText('1000+')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Satisfied Clients')).toBeInTheDocument();
    
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('displays primary and secondary CTA buttons', () => {
    render(<HeroSection />);
    
    // Test that both CTA buttons are present
    const requestQuoteButton = screen.getByText('Request a Quote');
    const whatsappButton = screen.getByText('Talk on WhatsApp');
    
    expect(requestQuoteButton).toBeInTheDocument();
    expect(whatsappButton).toBeInTheDocument();
  });

  it('handles Request a Quote button click correctly', () => {
    const mockOnRequestQuote = jest.fn();
    
    // Create a mock contact section element
    const mockContactSection = document.createElement('div');
    mockContactSection.id = 'contact';
    document.body.appendChild(mockContactSection);
    
    render(<HeroSection onRequestQuote={mockOnRequestQuote} />);
    
    const requestQuoteButton = screen.getByText('Request a Quote');
    fireEvent.click(requestQuoteButton);
    
    // Test that scroll function was called
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    
    // Test that callback was called
    expect(mockOnRequestQuote).toHaveBeenCalled();
    
    // Cleanup
    document.body.removeChild(mockContactSection);
  });

  it('handles WhatsApp button click correctly', () => {
    const mockOnWhatsAppClick = jest.fn();
    
    render(<HeroSection onWhatsAppClick={mockOnWhatsAppClick} />);
    
    const whatsappButton = screen.getByText('Talk on WhatsApp');
    fireEvent.click(whatsappButton);
    
    // Test that WhatsApp URL was opened
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/966XXXXXXXXX?text='),
      '_blank'
    );
    
    // Test that callback was called
    expect(mockOnWhatsAppClick).toHaveBeenCalled();
  });

  it('accepts custom props correctly', () => {
    const customProps = {
      title: 'Custom Company Name',
      subtitle: 'Custom Tagline',
      backgroundImage: '/custom-bg.jpg'
    };
    
    render(<HeroSection {...customProps} />);
    
    expect(screen.getByText('Custom Company Name')).toBeInTheDocument();
    expect(screen.getByText('Custom Tagline')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<HeroSection />);
    
    // Test that section has proper id for navigation
    const heroSection = document.getElementById('hero');
    expect(heroSection).toBeInTheDocument();
    
    // Test that buttons are properly accessible
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    buttons.forEach(button => {
      expect(button).toBeVisible();
    });
  });
});