/**
 * Unit tests for enhanced WhatsApp integration
 * Tests WhatsApp URL generation with categories and enhanced inquiry formatting
 * Validates: Requirements 3.5
 */

import {
  WhatsAppServiceImpl,
  generateQuickWhatsAppUrl,
  openProductCategoryWhatsApp,
  openWhatsAppEnhancedInquiry,
  formatPhoneForWhatsApp,
  isValidWhatsAppNumber,
} from './whatsapp';
import { EnhancedInquiry } from './types';

// Mock window.open for testing
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('Enhanced WhatsApp Integration', () => {
  let whatsappService: WhatsAppServiceImpl;

  beforeEach(() => {
    whatsappService = new WhatsAppServiceImpl();
    jest.clearAllMocks();
  });

  describe('WhatsAppServiceImpl Enhanced Methods', () => {
    describe('formatEnhancedInquiryMessage', () => {
      it('should format enhanced inquiry with all fields', () => {
        const inquiry: EnhancedInquiry = {
          name: 'John Doe',
          company: 'Test Company',
          phone: '+966501234567',
          email: 'john@test.com',
          productCategory: 'safety-equipment',
          urgency: 'immediate',
          quantityEstimate: '100 units',
          message: 'Need safety equipment for construction project',
          sourceSection: 'contact',
          deviceType: 'desktop',
          userAgent: 'test-agent',
          referrer: 'https://test.com',
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
          source: 'form',
        };

        const message = whatsappService.formatEnhancedInquiryMessage(inquiry);

        expect(message).toContain('John Doe');
        expect(message).toContain('Test Company');
        expect(message).toContain('john@test.com');
        expect(message).toContain('+966501234567');
        expect(message).toContain('Safety Equipment');
        expect(message).toContain('Immediate (Within 24 hours)');
        expect(message).toContain('100 units');
        expect(message).toContain('contact');
        expect(message).toContain('Need safety equipment for construction project');
      });

      it('should format enhanced inquiry with minimal fields', () => {
        const inquiry: EnhancedInquiry = {
          name: 'Jane Smith',
          phone: '+966501234567',
          email: 'jane@test.com',
          urgency: 'planning',
          message: 'Planning future project',
          sourceSection: 'hero',
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
          source: 'form',
        };

        const message = whatsappService.formatEnhancedInquiryMessage(inquiry);

        expect(message).toContain('Jane Smith');
        expect(message).toContain('Individual'); // Default company
        expect(message).toContain('jane@test.com');
        expect(message).toContain('+966501234567');
        expect(message).toContain('general products'); // Default category
        expect(message).toContain('Planning phase (Future project)');
        expect(message).toContain('hero');
        expect(message).toContain('Planning future project');
        expect(message).not.toContain('Quantity Estimate:'); // Should not show if empty
      });

      it('should handle different urgency levels correctly', () => {
        const baseInquiry: Partial<EnhancedInquiry> = {
          name: 'Test User',
          phone: '+966501234567',
          email: 'test@test.com',
          message: 'Test message',
          sourceSection: 'test',
          timestamp: new Date(),
          source: 'form',
        };

        // Test immediate urgency
        const immediateInquiry = { ...baseInquiry, urgency: 'immediate' as const };
        const immediateMessage = whatsappService.formatEnhancedInquiryMessage(immediateInquiry as EnhancedInquiry);
        expect(immediateMessage).toContain('Immediate (Within 24 hours)');

        // Test 1-2 weeks urgency
        const standardInquiry = { ...baseInquiry, urgency: '1-2_weeks' as const };
        const standardMessage = whatsappService.formatEnhancedInquiryMessage(standardInquiry as EnhancedInquiry);
        expect(standardMessage).toContain('Within 1-2 weeks');

        // Test planning urgency
        const planningInquiry = { ...baseInquiry, urgency: 'planning' as const };
        const planningMessage = whatsappService.formatEnhancedInquiryMessage(planningInquiry as EnhancedInquiry);
        expect(planningMessage).toContain('Planning phase (Future project)');
      });

      it('should handle different product categories correctly', () => {
        const baseInquiry: Partial<EnhancedInquiry> = {
          name: 'Test User',
          phone: '+966501234567',
          email: 'test@test.com',
          urgency: 'immediate',
          message: 'Test message',
          sourceSection: 'test',
          timestamp: new Date(),
          source: 'form',
        };

        // Test known category
        const safetyInquiry = { ...baseInquiry, productCategory: 'safety-equipment' };
        const safetyMessage = whatsappService.formatEnhancedInquiryMessage(safetyInquiry as EnhancedInquiry);
        expect(safetyMessage).toContain('Safety Equipment');

        // Test unknown category (should format nicely)
        const unknownInquiry = { ...baseInquiry, productCategory: 'custom-category' };
        const unknownMessage = whatsappService.formatEnhancedInquiryMessage(unknownInquiry as EnhancedInquiry);
        expect(unknownMessage).toContain('Custom Category');

        // Test no category
        const noCategory = { ...baseInquiry };
        const noCategoryMessage = whatsappService.formatEnhancedInquiryMessage(noCategory as EnhancedInquiry);
        expect(noCategoryMessage).toContain('general products');
      });
    });
  });

  describe('Enhanced WhatsApp URL Generation', () => {
    describe('generateQuickWhatsAppUrl', () => {
      it('should generate URL with category-specific message', () => {
        const url = generateQuickWhatsAppUrl('safety-equipment');
        
        expect(url).toContain('wa.me/966501234567');
        expect(url).toContain('Safety%20Equipment'); // URL encoded
        expect(url).toContain('Available%20products%20in%20this%20category');
        expect(url).toContain('Pricing%20and%20quotations');
        expect(url).toContain('Delivery%20timeframes');
        expect(url).toContain('Technical%20specifications');
      });

      it('should generate URL with general message when no category provided', () => {
        const url = generateQuickWhatsAppUrl();
        
        expect(url).toContain('wa.me/966501234567');
        expect(url).toContain('industrial%20and%20safety%20equipment%20services');
        expect(url).not.toContain('Available%20products%20in%20this%20category');
      });

      it('should handle unknown categories gracefully', () => {
        const url = generateQuickWhatsAppUrl('unknown-category');
        
        expect(url).toContain('wa.me/966501234567');
        expect(url).toContain('Unknown%20Category'); // Should format the category name
      });

      it('should handle categories with multiple words', () => {
        const url = generateQuickWhatsAppUrl('construction-materials');
        
        expect(url).toContain('wa.me/966501234567');
        expect(url).toContain('Construction%20%26%20Building%20Materials');
      });
    });
  });

  describe('Enhanced WhatsApp Functions', () => {
    describe('openWhatsAppEnhancedInquiry', () => {
      it('should open WhatsApp with enhanced inquiry message', () => {
        const inquiry: EnhancedInquiry = {
          name: 'John Doe',
          company: 'Test Company',
          phone: '+966501234567',
          email: 'john@test.com',
          productCategory: 'fire-safety',
          urgency: 'immediate',
          quantityEstimate: '50 units',
          message: 'Need fire safety equipment urgently',
          sourceSection: 'contact',
          timestamp: new Date(),
          source: 'form',
        };

        openWhatsAppEnhancedInquiry(inquiry);

        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.stringContaining('wa.me/966501234567?text='),
          '_blank',
          'noopener,noreferrer'
        );

        const callArgs = mockWindowOpen.mock.calls[0][0];
        const decodedMessage = decodeURIComponent(callArgs.split('text=')[1]);
        
        expect(decodedMessage).toContain('John Doe');
        expect(decodedMessage).toContain('Fire & Safety');
        expect(decodedMessage).toContain('Immediate (Within 24 hours)');
        expect(decodedMessage).toContain('50 units');
        expect(decodedMessage).toContain('Need fire safety equipment urgently');
      });

      it('should handle inquiry without optional fields', () => {
        const inquiry: EnhancedInquiry = {
          name: 'Jane Smith',
          phone: '+966501234567',
          email: 'jane@test.com',
          urgency: 'planning',
          message: 'Planning future project',
          sourceSection: 'hero',
          timestamp: new Date(),
          source: 'form',
        };

        openWhatsAppEnhancedInquiry(inquiry);

        expect(mockWindowOpen).toHaveBeenCalled();
        
        const callArgs = mockWindowOpen.mock.calls[0][0];
        const decodedMessage = decodeURIComponent(callArgs.split('text=')[1]);
        
        expect(decodedMessage).toContain('Jane Smith');
        expect(decodedMessage).toContain('Individual');
        expect(decodedMessage).toContain('general products');
        expect(decodedMessage).toContain('Planning phase');
        expect(decodedMessage).not.toContain('Quantity Estimate:');
      });
    });

    describe('openProductCategoryWhatsApp', () => {
      it('should open WhatsApp with category-specific message', () => {
        openProductCategoryWhatsApp('tools-machinery');

        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.stringContaining('wa.me/966501234567?text='),
          '_blank',
          'noopener,noreferrer'
        );

        const callArgs = mockWindowOpen.mock.calls[0][0];
        const decodedMessage = decodeURIComponent(callArgs.split('text=')[1]);
        
        expect(decodedMessage).toContain('Tools & Machinery');
        expect(decodedMessage).toContain('Available products in this category');
      });
    });
  });

  describe('Phone Number Utilities', () => {
    describe('formatPhoneForWhatsApp', () => {
      it('should format Saudi numbers correctly', () => {
        expect(formatPhoneForWhatsApp('0501234567')).toBe('+966501234567');
        expect(formatPhoneForWhatsApp('501234567')).toBe('+966501234567');
        expect(formatPhoneForWhatsApp('966501234567')).toBe('+966501234567');
        expect(formatPhoneForWhatsApp('+966501234567')).toBe('+966501234567');
      });

      it('should handle formatted numbers', () => {
        expect(formatPhoneForWhatsApp('050 123 4567')).toBe('+966501234567');
        expect(formatPhoneForWhatsApp('(050) 123-4567')).toBe('+966501234567');
        expect(formatPhoneForWhatsApp('+966 50 123 4567')).toBe('+966501234567');
      });

      it('should preserve international numbers', () => {
        expect(formatPhoneForWhatsApp('+1234567890')).toBe('+1234567890');
        expect(formatPhoneForWhatsApp('+44123456789')).toBe('+44123456789');
      });
    });

    describe('isValidWhatsAppNumber', () => {
      it('should validate correct WhatsApp numbers', () => {
        expect(isValidWhatsAppNumber('+966501234567')).toBe(true);
        expect(isValidWhatsAppNumber('+1234567890')).toBe(true);
        expect(isValidWhatsAppNumber('+44123456789')).toBe(true);
      });

      it('should reject invalid WhatsApp numbers', () => {
        expect(isValidWhatsAppNumber('501234567')).toBe(false); // No country code
        expect(isValidWhatsAppNumber('+0501234567')).toBe(false); // Invalid country code
        expect(isValidWhatsAppNumber('invalid')).toBe(false); // Not a number
        expect(isValidWhatsAppNumber('')).toBe(false); // Empty
        expect(isValidWhatsAppNumber('+966')).toBe(false); // Too short
      });

      it('should handle formatted numbers', () => {
        expect(isValidWhatsAppNumber('+966 50 123 4567')).toBe(true);
        expect(isValidWhatsAppNumber('+966-50-123-4567')).toBe(true);
        expect(isValidWhatsAppNumber('+966 (50) 123-4567')).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle window.open failures gracefully', () => {
      // Mock window.open to throw an error
      const originalOpen = window.open;
      window.open = jest.fn(() => {
        throw new Error('Failed to open window');
      });

      const inquiry: EnhancedInquiry = {
        name: 'Test User',
        phone: '+966501234567',
        email: 'test@test.com',
        urgency: 'immediate',
        message: 'Test message',
        sourceSection: 'test',
        timestamp: new Date(),
        source: 'form',
      };

      // Should not throw an error
      expect(() => openWhatsAppEnhancedInquiry(inquiry)).not.toThrow();

      // Restore original window.open
      window.open = originalOpen;
    });

    it('should handle missing window object gracefully', () => {
      // Mock window as undefined
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const inquiry: EnhancedInquiry = {
        name: 'Test User',
        phone: '+966501234567',
        email: 'test@test.com',
        urgency: 'immediate',
        message: 'Test message',
        sourceSection: 'test',
        timestamp: new Date(),
        source: 'form',
      };

      // Should not throw an error
      expect(() => openWhatsAppEnhancedInquiry(inquiry)).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });
});