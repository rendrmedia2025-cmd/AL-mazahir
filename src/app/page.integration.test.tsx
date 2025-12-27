/**
 * Integration tests for the main page
 * Tests end-to-end user flows and cross-browser compatibility
 * Requirements: 1.1, 3.2, 5.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Home from './page';

// Mock external dependencies
jest.mock('@/lib/analytics', () => ({
  pageview: jest.fn(),
  trackCTAClick: jest.fn(),
  trackProductInquiry: jest.fn(),
  trackWhatsAppClick: jest.fn(),
  trackFormSubmission: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendInquiryWithAutoReply: jest.fn(),
}));

jest.mock('@/lib/whatsapp', () => ({
  openWhatsAppInquiry: jest.fn(),
}));

jest.mock('@/lib/performance', () => ({
  preloadCriticalResources: jest.fn(),
  addResourceHints: jest.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

describe('Home Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful email sending
    const { sendInquiryWithAutoReply } = require('@/lib/email');
    sendInquiryWithAutoReply.mockResolvedValue({
      inquiry: { success: true },
      autoReply: { success: true }
    });
  });

  describe('End-to-End User Flows', () => {
    test('Complete inquiry flow: Hero CTA -> Form Fill -> Submit', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Step 1: User clicks "Request a Quote" in hero section
      const heroQuoteButton = screen.getByRole('button', { name: /request a quote/i });
      await user.click(heroQuoteButton);

      // Verify scroll to contact section was triggered
      expect(window.scrollTo).toHaveBeenCalled();

      // Step 2: User fills out the contact form
      const nameInput = screen.getByLabelText(/full name/i);
      const companyInput = screen.getByLabelText(/company name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const productInput = screen.getByLabelText(/product requirement/i);
      const messageInput = screen.getByLabelText(/additional message/i);

      await user.type(nameInput, 'John Doe');
      await user.type(companyInput, 'Test Company Ltd');
      await user.type(phoneInput, '+966 50 123 4567');
      await user.type(emailInput, 'john@testcompany.com');
      await user.type(productInput, 'Safety helmets and protective equipment');
      await user.type(messageInput, 'Need quote for 100 units');

      // Step 3: User submits the form
      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Step 4: Verify form submission and success message
      await waitFor(() => {
        expect(screen.getByText(/thank you! your inquiry has been sent successfully/i)).toBeInTheDocument();
      });

      // Verify email service was called
      const { sendInquiryWithAutoReply } = require('@/lib/email');
      expect(sendInquiryWithAutoReply).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          company: 'Test Company Ltd',
          phone: '+966 50 123 4567',
          email: 'john@testcompany.com',
          productRequirement: 'Safety helmets and protective equipment',
          message: 'Need quote for 100 units',
          source: 'form'
        })
      );
    });

    test('Product enquiry flow: Product Category -> Enquire Now -> Pre-filled Form', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Step 1: Find and click "Enquire Now" on first product category
      const enquireButtons = screen.getAllByText(/enquire now/i);
      const firstEnquireButton = enquireButtons[0];
      
      await user.click(firstEnquireButton);

      // Step 2: Verify scroll to contact section
      expect(window.scrollTo).toHaveBeenCalled();

      // Step 3: Verify product requirement field is pre-filled
      await waitFor(() => {
        const productInput = screen.getByLabelText(/product requirement/i);
        expect(productInput).toHaveValue(expect.stringContaining('Safety Equipment'));
      });

      // Step 4: Fill remaining form fields and submit
      await user.type(screen.getByLabelText(/full name/i), 'Jane Smith');
      await user.type(screen.getByLabelText(/company name/i), 'Industrial Corp');
      await user.type(screen.getByLabelText(/phone/i), '+966 55 987 6543');
      await user.type(screen.getByLabelText(/email address/i), 'jane@industrial.com');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Step 5: Verify successful submission
      await waitFor(() => {
        expect(screen.getByText(/thank you! your inquiry has been sent successfully/i)).toBeInTheDocument();
      });
    });

    test('WhatsApp flow: Hero WhatsApp -> Opens WhatsApp', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Find and click WhatsApp button in hero section (first one)
      const whatsappButtons = screen.getAllByRole('button', { name: /talk on whatsapp/i });
      const heroWhatsappButton = whatsappButtons[0]; // First one is in hero section
      await user.click(heroWhatsappButton);

      // Verify WhatsApp was opened
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/966501234567'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('Contact form WhatsApp flow: Fill Form -> WhatsApp Button -> Opens with data', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill form with data
      await user.type(screen.getByLabelText(/full name/i), 'Ahmed Ali');
      await user.type(screen.getByLabelText(/company name/i), 'Construction Co');
      await user.type(screen.getByLabelText(/phone/i), '+966 50 555 1234');
      await user.type(screen.getByLabelText(/product requirement/i), 'Construction materials');

      // Click WhatsApp button in contact form
      const contactWhatsappButtons = screen.getAllByText(/talk on whatsapp/i);
      const contactWhatsappButton = contactWhatsappButtons[contactWhatsappButtons.length - 1];
      await user.click(contactWhatsappButton);

      // Verify WhatsApp service was called with form data
      const { openWhatsAppInquiry } = require('@/lib/whatsapp');
      expect(openWhatsAppInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ahmed Ali',
          company: 'Construction Co',
          phone: '+966 50 555 1234',
          productRequirement: 'Construction materials',
          source: 'whatsapp'
        })
      );
    });
  });

  describe('Error Scenarios and Recovery', () => {
    test('Form submission error handling and retry', async () => {
      const user = userEvent.setup();
      
      // Mock email service to fail first, then succeed
      const { sendInquiryWithAutoReply } = require('@/lib/email');
      sendInquiryWithAutoReply
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          inquiry: { success: true },
          autoReply: { success: true }
        });

      render(<Home />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/company name/i), 'Test Co');
      await user.type(screen.getByLabelText(/phone/i), '+966 50 123 4567');
      await user.type(screen.getByLabelText(/email address/i), 'test@test.com');
      await user.type(screen.getByLabelText(/product requirement/i), 'Test products');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      });

      // Verify form data is preserved (not cleared on error)
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User');
      expect(screen.getByLabelText(/company name/i)).toHaveValue('Test Co');

      // Retry submission
      await user.click(submitButton);

      // Verify success on retry
      await waitFor(() => {
        expect(screen.getByText(/thank you! your inquiry has been sent successfully/i)).toBeInTheDocument();
      });
    });

    test('WhatsApp fallback when service fails', async () => {
      const user = userEvent.setup();
      
      // Mock WhatsApp service to fail
      const { openWhatsAppInquiry } = require('@/lib/whatsapp');
      openWhatsAppInquiry.mockImplementation(() => {
        throw new Error('WhatsApp service error');
      });

      render(<Home />);

      // Fill form and click WhatsApp
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/company name/i), 'Test Co');

      const contactWhatsappButtons = screen.getAllByText(/talk on whatsapp/i);
      const contactWhatsappButton = contactWhatsappButtons[contactWhatsappButtons.length - 1];
      await user.click(contactWhatsappButton);

      // Verify fallback WhatsApp URL was used
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/966501234567'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('Network offline detection and user feedback', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<Home />);

      // Verify offline indicator appears
      await waitFor(() => {
        expect(screen.getByText(/you appear to be offline/i)).toBeInTheDocument();
      });

      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        value: true,
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    test('Smooth scroll fallback when not supported', async () => {
      const user = userEvent.setup();
      
      // Mock scrollTo to not support smooth behavior
      const originalScrollTo = window.scrollTo;
      window.scrollTo = jest.fn().mockImplementation(() => {
        throw new Error('Smooth scroll not supported');
      });

      // Mock scrollIntoView as fallback
      Element.prototype.scrollIntoView = jest.fn();

      render(<Home />);

      // Click hero CTA
      const heroQuoteButton = screen.getByRole('button', { name: /request a quote/i });
      await user.click(heroQuoteButton);

      // Verify fallback scrollIntoView was called
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

      // Restore original scrollTo
      window.scrollTo = originalScrollTo;
    });

    test('JavaScript disabled fallback content', () => {
      // Mock hasJavaScript state to false
      const { useState } = require('react');
      const mockUseState = jest.fn();
      mockUseState
        .mockReturnValueOnce(['', jest.fn()]) // selectedProductCategory
        .mockReturnValueOnce([false, jest.fn()]) // isLoading
        .mockReturnValueOnce([false, jest.fn()]) // hasJavaScript
        .mockReturnValueOnce([false, jest.fn()]); // networkError

      jest.spyOn(React, 'useState').mockImplementation(mockUseState);

      render(<Home />);

      // Verify noscript content would be shown
      // Note: noscript content is not rendered in jsdom, but we can verify the structure exists
      expect(document.querySelector('noscript')).toBeTruthy();
    });

    test('Popup blocker handling for WhatsApp', async () => {
      const user = userEvent.setup();
      
      // Mock window.open to return null (popup blocked)
      window.open = jest.fn().mockReturnValue(null);
      
      // Mock location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<Home />);

      // Click WhatsApp button (use first one from hero section)
      const whatsappButtons = screen.getAllByRole('button', { name: /talk on whatsapp/i });
      const heroWhatsappButton = whatsappButtons[0];
      await user.click(heroWhatsappButton);

      // Verify fallback to location.href was attempted
      expect(window.location.href).toContain('wa.me');
    });
  });

  describe('Performance and Loading States', () => {
    test('Loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock email service with delay
      const { sendInquiryWithAutoReply } = require('@/lib/email');
      sendInquiryWithAutoReply.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            inquiry: { success: true },
            autoReply: { success: true }
          }), 100)
        )
      );

      render(<Home />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/company name/i), 'Test Co');
      await user.type(screen.getByLabelText(/phone/i), '+966 50 123 4567');
      await user.type(screen.getByLabelText(/email address/i), 'test@test.com');
      await user.type(screen.getByLabelText(/product requirement/i), 'Test products');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Verify loading state
      expect(screen.getByText(/sending.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/thank you! your inquiry has been sent successfully/i)).toBeInTheDocument();
      });

      // Verify loading state is cleared
      expect(screen.queryByText(/sending.../i)).not.toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    test('Performance monitoring initialization', () => {
      render(<Home />);

      // Verify performance utilities were called
      const { preloadCriticalResources, addResourceHints } = require('@/lib/performance');
      expect(preloadCriticalResources).toHaveBeenCalled();
      expect(addResourceHints).toHaveBeenCalled();
    });
  });

  describe('Analytics Integration', () => {
    test('Page view tracking on mount', () => {
      render(<Home />);

      const { pageview } = require('@/lib/analytics');
      expect(pageview).toHaveBeenCalledWith('/');
    });

    test('CTA click tracking', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const heroQuoteButton = screen.getByRole('button', { name: /request a quote/i });
      await user.click(heroQuoteButton);

      const { trackCTAClick } = require('@/lib/analytics');
      expect(trackCTAClick).toHaveBeenCalledWith('primary', 'hero');
    });

    test('Product inquiry tracking', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const enquireButtons = screen.getAllByText(/enquire now/i);
      await user.click(enquireButtons[0]);

      const { trackProductInquiry } = require('@/lib/analytics');
      expect(trackProductInquiry).toHaveBeenCalled();
    });

    test('Form submission tracking', async () => {
      const user = userEvent.setup();
      render(<Home />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/company name/i), 'Test Co');
      await user.type(screen.getByLabelText(/phone/i), '+966 50 123 4567');
      await user.type(screen.getByLabelText(/email address/i), 'test@test.com');
      await user.type(screen.getByLabelText(/product requirement/i), 'Test products');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        const { trackFormSubmission } = require('@/lib/analytics');
        expect(trackFormSubmission).toHaveBeenCalledWith('contact');
      });
    });
  });
});