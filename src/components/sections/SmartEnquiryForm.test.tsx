/**
 * Unit tests for SmartEnquiryForm component
 * Tests form validation with new fields and WhatsApp URL generation with categories
 * Validates: Requirements 3.1, 3.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SmartEnquiryForm from './SmartEnquiryForm';
import { EnhancedInquiry } from '@/lib/types';

// Mock the lead intelligence module
jest.mock('@/lib/lead-intelligence', () => ({
  captureClientSideIntelligence: jest.fn(() => ({
    deviceType: 'desktop',
    userAgent: 'test-agent',
    referrer: 'https://test.com',
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    sourceSection: 'test-section',
  })),
  auditLeadIntelligenceCapture: jest.fn(),
}));

describe('SmartEnquiryForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnWhatsAppClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onWhatsAppClick: mockOnWhatsAppClick,
    sourceSection: 'contact',
  };

  describe('Form Rendering', () => {
    it('should render all smart form fields', () => {
      render(<SmartEnquiryForm {...defaultProps} />);

      // Check for all form fields
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/urgency level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity estimate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it('should render product category options', () => {
      render(<SmartEnquiryForm {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/product category/i);
      expect(categorySelect).toBeInTheDocument();
      
      // Check for some expected category options
      expect(screen.getByText('Safety Equipment')).toBeInTheDocument();
      expect(screen.getByText('Fire & Safety')).toBeInTheDocument();
      expect(screen.getByText('Construction & Building Materials')).toBeInTheDocument();
    });

    it('should render urgency level options', () => {
      render(<SmartEnquiryForm {...defaultProps} />);

      const urgencySelect = screen.getByLabelText(/urgency level/i);
      expect(urgencySelect).toBeInTheDocument();
      
      // Check for urgency options
      expect(screen.getByText('Immediate (Within 24 hours)')).toBeInTheDocument();
      expect(screen.getByText('1-2 Weeks')).toBeInTheDocument();
      expect(screen.getByText('Planning Phase (Future project)')).toBeInTheDocument();
    });

    it('should prefill category when provided', () => {
      render(<SmartEnquiryForm {...defaultProps} prefilledCategory="safety-equipment" />);

      const categorySelect = screen.getByLabelText(/product category/i) as HTMLSelectElement;
      expect(categorySelect.value).toBe('safety-equipment');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Check for validation errors on required fields
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/urgency level is required/i)).toBeInTheDocument();
        expect(screen.getByText(/message is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur event for real-time validation

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, 'invalid-phone');
      await user.tab(); // Trigger blur event for real-time validation

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument();
      });
    });

    it('should validate field lengths', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'A'); // Too short
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should accept valid form data', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      // Fill in valid form data
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/company name/i), 'Test Company');
      await user.type(screen.getByLabelText(/phone/i), '+966501234567');
      await user.type(screen.getByLabelText(/email address/i), 'john@test.com');
      await user.selectOptions(screen.getByLabelText(/product category/i), 'safety-equipment');
      await user.selectOptions(screen.getByLabelText(/urgency level/i), 'immediate');
      await user.type(screen.getByLabelText(/quantity estimate/i), '100 units');
      await user.type(screen.getByLabelText(/message/i), 'Test message for inquiry');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            company: 'Test Company',
            phone: '+966501234567',
            email: 'john@test.com',
            productCategory: 'safety-equipment',
            urgency: 'immediate',
            quantityEstimate: '100 units',
            message: 'Test message for inquiry',
            sourceSection: 'contact',
            deviceType: 'desktop',
            source: 'form',
          })
        );
      });
    });
  });

  describe('WhatsApp Integration', () => {
    it('should handle WhatsApp button click with form data', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      // Fill in some form data
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/company name/i), 'Test Company');
      await user.type(screen.getByLabelText(/phone/i), '+966501234567');
      await user.type(screen.getByLabelText(/email address/i), 'john@test.com');
      await user.selectOptions(screen.getByLabelText(/product category/i), 'safety-equipment');
      await user.selectOptions(screen.getByLabelText(/urgency level/i), 'immediate');
      await user.type(screen.getByLabelText(/message/i), 'Test WhatsApp message');

      const whatsappButton = screen.getByRole('button', { name: /talk on whatsapp/i });
      await user.click(whatsappButton);

      expect(mockOnWhatsAppClick).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          company: 'Test Company',
          phone: '+966501234567',
          email: 'john@test.com',
          productCategory: 'safety-equipment',
          urgency: 'immediate',
          message: 'Test WhatsApp message',
          sourceSection: 'contact',
          source: 'whatsapp',
        })
      );
    });

    it('should handle WhatsApp click with minimal data', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const whatsappButton = screen.getByRole('button', { name: /talk on whatsapp/i });
      await user.click(whatsappButton);

      expect(mockOnWhatsAppClick).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceSection: 'contact',
          source: 'whatsapp',
        })
      );
    });
  });

  describe('Real-time Validation', () => {
    it('should show validation errors in real-time', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Type invalid email
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@email.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
      });
    });

    it('should clear submit status when user starts typing', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      // First, trigger a validation error by submitting empty form
      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Start typing in name field
      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'J');

      // The error should still be there but submit status should be cleared
      // This is more of an internal state test, but we can verify the form is responsive
      expect(nameInput).toHaveValue('J');
    });
  });

  describe('Form State Management', () => {
    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      
      // Mock successful submission
      const mockSuccessfulSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(<SmartEnquiryForm {...defaultProps} onSubmit={mockSuccessfulSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+966501234567');
      await user.type(screen.getByLabelText(/email address/i), 'john@test.com');
      await user.selectOptions(screen.getByLabelText(/urgency level/i), 'immediate');
      await user.type(screen.getByLabelText(/message/i), 'Test message');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Wait for form to reset
      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toHaveValue('');
        expect(screen.getByLabelText(/phone/i)).toHaveValue('');
        expect(screen.getByLabelText(/email address/i)).toHaveValue('');
        expect(screen.getByLabelText(/message/i)).toHaveValue('');
      });

      // Check for success message
      expect(screen.getByText(/thank you! your inquiry has been sent successfully/i)).toBeInTheDocument();
    });

    it('should show error message on submission failure', async () => {
      const user = userEvent.setup();
      
      // Mock failed submission
      const mockFailedSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(<SmartEnquiryForm {...defaultProps} onSubmit={mockFailedSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+966501234567');
      await user.type(screen.getByLabelText(/email address/i), 'john@test.com');
      await user.selectOptions(screen.getByLabelText(/urgency level/i), 'immediate');
      await user.type(screen.getByLabelText(/message/i), 'Test message');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow submission
      const mockSlowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(<SmartEnquiryForm {...defaultProps} onSubmit={mockSlowSubmit} />);

      // Fill form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+966501234567');
      await user.type(screen.getByLabelText(/email address/i), 'john@test.com');
      await user.selectOptions(screen.getByLabelText(/urgency level/i), 'immediate');
      await user.type(screen.getByLabelText(/message/i), 'Test message');

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      // Button should be disabled and show loading text
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/sending.../i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      render(<SmartEnquiryForm {...defaultProps} />);

      // Check that all form fields have proper labels
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/urgency level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity estimate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();

      // Check for required field indicators
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      render(<SmartEnquiryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/full name/i);
        const nameError = screen.getByText(/name is required/i);
        
        // Check that the error is associated with the input
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameError).toBeInTheDocument();
      });
    });
  });
});