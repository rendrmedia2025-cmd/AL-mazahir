/**
 * Unit tests for analytics integration
 */

import { 
  pageview, 
  event, 
  trackFormSubmission, 
  trackWhatsAppClick, 
  trackProductInquiry, 
  trackCTAClick, 
  trackScrollDepth, 
  trackWebVitals 
} from './analytics';

// Mock gtag function
const mockGtag = jest.fn();

// Mock window object
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

describe('Analytics', () => {
  beforeEach(() => {
    mockGtag.mockClear();
  });

  describe('pageview', () => {
    it('should call gtag with correct config parameters', () => {
      const url = 'https://example.com/test';
      pageview(url);

      expect(mockGtag).toHaveBeenCalledWith('config', '', {
        page_location: url,
      });
    });

    it('should not call gtag when window.gtag is undefined', () => {
      const originalGtag = window.gtag;
      // @ts-expect-error - Intentionally deleting gtag for testing
      delete window.gtag;

      pageview('https://example.com');

      expect(mockGtag).not.toHaveBeenCalled();

      window.gtag = originalGtag;
    });
  });

  describe('event', () => {
    it('should call gtag with correct event parameters', () => {
      const eventData = {
        action: 'test_action',
        category: 'test_category',
        label: 'test_label',
        value: 100,
      };

      event(eventData);

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_action', {
        event_category: 'test_category',
        event_label: 'test_label',
        value: 100,
      });
    });

    it('should handle optional parameters', () => {
      const eventData = {
        action: 'test_action',
        category: 'test_category',
      };

      event(eventData);

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_action', {
        event_category: 'test_category',
        event_label: undefined,
        value: undefined,
      });
    });
  });

  describe('trackFormSubmission', () => {
    it('should track contact form submission', () => {
      trackFormSubmission('contact');

      expect(mockGtag).toHaveBeenCalledWith('event', 'form_submit', {
        event_category: 'engagement',
        event_label: 'contact',
        value: undefined,
      });
    });

    it('should track inquiry form submission', () => {
      trackFormSubmission('inquiry');

      expect(mockGtag).toHaveBeenCalledWith('event', 'form_submit', {
        event_category: 'engagement',
        event_label: 'inquiry',
        value: undefined,
      });
    });
  });

  describe('trackWhatsAppClick', () => {
    it('should track WhatsApp click with product category', () => {
      trackWhatsAppClick('Safety Equipment');

      expect(mockGtag).toHaveBeenCalledWith('event', 'whatsapp_click', {
        event_category: 'communication',
        event_label: 'Safety Equipment',
        value: undefined,
      });
    });

    it('should track WhatsApp click without product category', () => {
      trackWhatsAppClick();

      expect(mockGtag).toHaveBeenCalledWith('event', 'whatsapp_click', {
        event_category: 'communication',
        event_label: 'general',
        value: undefined,
      });
    });
  });

  describe('trackProductInquiry', () => {
    it('should track product inquiry with category', () => {
      trackProductInquiry('Fire & Safety Systems');

      expect(mockGtag).toHaveBeenCalledWith('event', 'product_inquiry', {
        event_category: 'products',
        event_label: 'Fire & Safety Systems',
        value: undefined,
      });
    });
  });

  describe('trackCTAClick', () => {
    it('should track primary CTA click', () => {
      trackCTAClick('primary', 'hero');

      expect(mockGtag).toHaveBeenCalledWith('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'primary_hero',
        value: undefined,
      });
    });

    it('should track secondary CTA click', () => {
      trackCTAClick('secondary', 'footer');

      expect(mockGtag).toHaveBeenCalledWith('event', 'cta_click', {
        event_category: 'engagement',
        event_label: 'secondary_footer',
        value: undefined,
      });
    });
  });

  describe('trackScrollDepth', () => {
    it('should track scroll depth percentage', () => {
      trackScrollDepth(75);

      expect(mockGtag).toHaveBeenCalledWith('event', 'scroll_depth', {
        event_category: 'engagement',
        event_label: '75%',
        value: 75,
      });
    });
  });

  describe('trackWebVitals', () => {
    it('should track web vitals metrics', () => {
      const metric = {
        name: 'LCP',
        value: 2500.5,
        id: 'test-id',
      };

      trackWebVitals(metric);

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
        event_category: 'performance',
        event_label: 'LCP',
        value: 2501, // Rounded value
      });
    });

    it('should round metric values correctly', () => {
      const metric = {
        name: 'FID',
        value: 123.7,
        id: 'test-id',
      };

      trackWebVitals(metric);

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
        event_category: 'performance',
        event_label: 'FID',
        value: 124,
      });
    });
  });
});