/**
 * Property-based tests for Lead Intelligence Completeness
 * Feature: dynamic-enhancement-layer, Property 2: Lead Intelligence Completeness
 * Validates: Requirements 3.4, 3.7
 */

import fc from 'fast-check';
import {
  captureClientSideIntelligence,
  captureServerSideIntelligence,
  detectDeviceType,
  sanitizeUserAgent,
  sanitizeReferrer,
  validateLeadIntelligence,
  anonymizeLeadIntelligence,
  shouldRetainLeadIntelligence,
  LeadIntelligence
} from './lead-intelligence';

// Mock browser environment for client-side tests
const mockBrowserEnvironment = (userAgent: string, referrer: string) => {
  Object.defineProperty(global, 'navigator', {
    value: { userAgent },
    writable: true
  });
  
  Object.defineProperty(global, 'document', {
    value: { referrer },
    writable: true
  });
  
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true
  });
};

// Generators for property-based testing
const userAgentArb = fc.string({ minLength: 10, maxLength: 200 });
const referrerArb = fc.webUrl();
const sourceSectionArb = fc.string({ minLength: 1, maxLength: 50 });
const deviceTypeArb = fc.constantFrom('mobile', 'tablet', 'desktop');
const ipAddressArb = fc.ipV4();

// Generator for valid lead intelligence
const leadIntelligenceArb = fc.record({
  deviceType: deviceTypeArb,
  userAgent: userAgentArb,
  referrer: fc.option(referrerArb),
  ipAddress: fc.option(ipAddressArb),
  timestamp: fc.date(),
  sourceSection: sourceSectionArb,
  sessionId: fc.option(fc.string({ minLength: 10, maxLength: 20 }))
});

describe('Lead Intelligence Completeness Property Tests', () => {
  /**
   * Property 2: Lead Intelligence Completeness
   * For any form submission through the Smart Enquiry System, all required lead metadata 
   * (source section, timestamp, device type) should be captured and stored with the inquiry.
   */
  
  describe('Client-side intelligence capture completeness', () => {
    it('should always capture required metadata fields for any source section', () => {
      fc.assert(fc.property(
        sourceSectionArb,
        userAgentArb,
        fc.option(referrerArb),
        (sourceSection, userAgent, referrer) => {
          // Setup mock browser environment
          mockBrowserEnvironment(userAgent, referrer || '');
          
          // Capture intelligence
          const intelligence = captureClientSideIntelligence(sourceSection);
          
          // Verify required fields are always present
          expect(intelligence.sourceSection).toBe(sourceSection);
          expect(intelligence.timestamp).toBeInstanceOf(Date);
          expect(intelligence.deviceType).toBeDefined();
          expect(['mobile', 'tablet', 'desktop']).toContain(intelligence.deviceType);
          
          // Verify optional fields are handled correctly
          if (userAgent) {
            expect(intelligence.userAgent).toBeDefined();
            expect(intelligence.userAgent!.length).toBeLessThanOrEqual(500);
          }
          
          if (referrer) {
            expect(intelligence.referrer).toBeDefined();
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Server-side intelligence capture completeness', () => {
    it('should always capture required metadata from any HTTP request', () => {
      fc.assert(fc.property(
        sourceSectionArb,
        userAgentArb,
        fc.option(referrerArb),
        fc.option(ipAddressArb),
        (sourceSection, userAgent, referrer, ipAddress) => {
          // Create mock request
          const headers = new Map();
          headers.set('user-agent', userAgent);
          if (referrer) {
            headers.set('referer', referrer);
          }
          
          const mockRequest = {
            headers: {
              get: (name: string) => headers.get(name) || null
            }
          } as Request;
          
          // Capture intelligence
          const intelligence = captureServerSideIntelligence(mockRequest, sourceSection, ipAddress);
          
          // Verify required fields are always present
          expect(intelligence.sourceSection).toBe(sourceSection);
          expect(intelligence.timestamp).toBeInstanceOf(Date);
          expect(intelligence.deviceType).toBeDefined();
          expect(['mobile', 'tablet', 'desktop']).toContain(intelligence.deviceType);
          expect(intelligence.userAgent).toBeDefined();
          
          // Verify optional fields
          if (referrer) {
            expect(intelligence.referrer).toBeDefined();
          }
          
          if (ipAddress) {
            expect(intelligence.ipAddress).toBe(ipAddress);
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Device type detection consistency', () => {
    it('should consistently detect device type for any user agent string', () => {
      fc.assert(fc.property(
        userAgentArb,
        (userAgent) => {
          const deviceType = detectDeviceType(userAgent);
          
          // Device type should always be one of the valid values
          expect(['mobile', 'tablet', 'desktop']).toContain(deviceType);
          
          // Test consistency - same input should produce same output
          const deviceType2 = detectDeviceType(userAgent);
          expect(deviceType).toBe(deviceType2);
          
          // Test specific patterns
          if (userAgent.includes('iPad')) {
            expect(deviceType).toBe('tablet');
          } else if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            expect(deviceType).toBe('mobile');
          } else {
            expect(deviceType).toBe('desktop');
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('User agent sanitization safety', () => {
    it('should safely sanitize any user agent string', () => {
      fc.assert(fc.property(
        fc.string({ maxLength: 1000 }), // Allow longer strings to test truncation
        (userAgent) => {
          const sanitized = sanitizeUserAgent(userAgent);
          
          // Should never exceed maximum length
          expect(sanitized.length).toBeLessThanOrEqual(500);
          
          // Should not contain dangerous characters
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
          
          // Should be a string
          expect(typeof sanitized).toBe('string');
        }
      ), { numRuns: 100 });
    });
  });

  describe('Referrer sanitization safety', () => {
    it('should safely handle any referrer input', () => {
      fc.assert(fc.property(
        fc.option(fc.string()),
        (referrer) => {
          const sanitized = sanitizeReferrer(referrer);
          
          if (sanitized !== null) {
            // Should be a valid URL if not null
            expect(() => new URL(sanitized)).not.toThrow();
            
            // Should not exceed maximum length
            expect(sanitized.length).toBeLessThanOrEqual(500);
          }
          
          // Null input should return null
          if (referrer === null) {
            expect(sanitized).toBeNull();
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Lead intelligence validation completeness', () => {
    it('should correctly validate any lead intelligence data', () => {
      fc.assert(fc.property(
        leadIntelligenceArb,
        (intelligence) => {
          const isValid = validateLeadIntelligence(intelligence);
          
          // Should return boolean
          expect(typeof isValid).toBe('boolean');
          
          // If valid, required fields should be present
          if (isValid) {
            expect(intelligence.sourceSection).toBeDefined();
            expect(intelligence.timestamp).toBeDefined();
            
            if (intelligence.deviceType) {
              expect(['mobile', 'tablet', 'desktop']).toContain(intelligence.deviceType);
            }
            
            if (intelligence.userAgent) {
              expect(intelligence.userAgent.length).toBeLessThanOrEqual(500);
            }
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Lead intelligence anonymization preservation', () => {
    it('should preserve essential data while anonymizing sensitive information', () => {
      fc.assert(fc.property(
        leadIntelligenceArb,
        (intelligence) => {
          const anonymized = anonymizeLeadIntelligence(intelligence as LeadIntelligence);
          
          // Essential fields should be preserved
          expect(anonymized.deviceType).toBe(intelligence.deviceType);
          expect(anonymized.sourceSection).toBe(intelligence.sourceSection);
          expect(anonymized.timestamp).toBe(intelligence.timestamp);
          
          // User agent should be anonymized (version numbers replaced)
          if (intelligence.userAgent && anonymized.userAgent) {
            expect(anonymized.userAgent).toContain('X.X.X');
          }
          
          // Referrer should have query parameters removed
          if (intelligence.referrer && anonymized.referrer) {
            expect(anonymized.referrer).not.toContain('?');
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Data retention policy compliance', () => {
    it('should correctly determine retention status for any date and retention period', () => {
      fc.assert(fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        fc.integer({ min: 1, max: 1000 }),
        (captureDate, retentionDays) => {
          const shouldRetain = shouldRetainLeadIntelligence(captureDate, retentionDays);
          
          // Should return boolean
          expect(typeof shouldRetain).toBe('boolean');
          
          // Calculate expected result
          const now = new Date();
          const daysSinceCapture = Math.floor((now.getTime() - captureDate.getTime()) / (1000 * 60 * 60 * 24));
          const expectedResult = daysSinceCapture <= retentionDays;
          
          expect(shouldRetain).toBe(expectedResult);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Cross-platform intelligence capture consistency', () => {
    it('should capture consistent intelligence across different environments', () => {
      fc.assert(fc.property(
        sourceSectionArb,
        userAgentArb,
        fc.option(referrerArb),
        (sourceSection, userAgent, referrer) => {
          // Test client-side capture
          mockBrowserEnvironment(userAgent, referrer || '');
          const clientIntelligence = captureClientSideIntelligence(sourceSection);
          
          // Test server-side capture
          const headers = new Map();
          headers.set('user-agent', userAgent);
          if (referrer) {
            headers.set('referer', referrer);
          }
          
          const mockRequest = {
            headers: {
              get: (name: string) => headers.get(name) || null
            }
          } as Request;
          
          const serverIntelligence = captureServerSideIntelligence(mockRequest, sourceSection);
          
          // Core fields should be consistent
          expect(clientIntelligence.sourceSection).toBe(serverIntelligence.sourceSection);
          expect(clientIntelligence.deviceType).toBe(serverIntelligence.deviceType);
          
          // Both should have timestamps
          expect(clientIntelligence.timestamp).toBeInstanceOf(Date);
          expect(serverIntelligence.timestamp).toBeInstanceOf(Date);
        }
      ), { numRuns: 100 });
    });
  });
});