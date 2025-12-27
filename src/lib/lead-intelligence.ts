/**
 * Lead Intelligence Capture Utilities
 * Provides functions for capturing and processing lead metadata while ensuring privacy compliance
 */

export interface LeadIntelligence {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  referrer?: string;
  ipAddress?: string;
  timestamp: Date;
  sourceSection: string;
  sessionId?: string;
}

/**
 * Detects device type from user agent string
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad/.test(userAgent)) return 'tablet';
  if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
  return 'desktop';
}

/**
 * Sanitizes user agent string for privacy and security
 */
export function sanitizeUserAgent(userAgent: string): string {
  // Limit length and remove potentially sensitive information
  return userAgent.substring(0, 500).replace(/[<>]/g, '');
}

/**
 * Sanitizes and validates referrer URL
 */
export function sanitizeReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  
  try {
    const url = new URL(referrer);
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.href.substring(0, 500);
  } catch {
    return null;
  }
}

/**
 * Generates a simple session ID for tracking user sessions
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Captures lead intelligence from browser environment
 */
export function captureClientSideIntelligence(sourceSection: string): Partial<LeadIntelligence> {
  if (typeof window === 'undefined') {
    return {
      sourceSection,
      timestamp: new Date(),
    };
  }

  const userAgent = navigator.userAgent;
  const referrer = document.referrer;

  return {
    deviceType: detectDeviceType(userAgent),
    userAgent: sanitizeUserAgent(userAgent),
    referrer: sanitizeReferrer(referrer),
    timestamp: new Date(),
    sourceSection,
    sessionId: generateSessionId(),
  };
}

/**
 * Captures lead intelligence from server-side request
 */
export function captureServerSideIntelligence(
  request: Request,
  sourceSection: string,
  ipAddress?: string
): LeadIntelligence {
  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer');

  return {
    deviceType: detectDeviceType(userAgent),
    userAgent: sanitizeUserAgent(userAgent),
    referrer: sanitizeReferrer(referrer),
    ipAddress,
    timestamp: new Date(),
    sourceSection,
  };
}

/**
 * Validates lead intelligence data for privacy compliance
 */
export function validateLeadIntelligence(intelligence: Partial<LeadIntelligence>): boolean {
  // Ensure required fields are present
  if (!intelligence.sourceSection || !intelligence.timestamp) {
    return false;
  }

  // Validate device type if present
  if (intelligence.deviceType && !['mobile', 'tablet', 'desktop'].includes(intelligence.deviceType)) {
    return false;
  }

  // Validate user agent length
  if (intelligence.userAgent && intelligence.userAgent.length > 500) {
    return false;
  }

  // Validate referrer URL if present
  if (intelligence.referrer) {
    try {
      new URL(intelligence.referrer);
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Anonymizes lead intelligence for privacy compliance
 */
export function anonymizeLeadIntelligence(intelligence: LeadIntelligence): Partial<LeadIntelligence> {
  return {
    deviceType: intelligence.deviceType,
    // Remove specific user agent details, keep only general info
    userAgent: intelligence.userAgent.replace(/\d+\.\d+\.\d+/g, 'X.X.X'),
    // Remove query parameters from referrer
    referrer: intelligence.referrer ? intelligence.referrer.split('?')[0] : undefined,
    timestamp: intelligence.timestamp,
    sourceSection: intelligence.sourceSection,
  };
}

/**
 * Logs lead intelligence capture for audit purposes
 */
export function auditLeadIntelligenceCapture(
  intelligence: LeadIntelligence,
  leadId?: string
): void {
  const auditData = {
    leadId,
    sourceSection: intelligence.sourceSection,
    deviceType: intelligence.deviceType,
    hasReferrer: !!intelligence.referrer,
    hasUserAgent: !!intelligence.userAgent,
    timestamp: intelligence.timestamp.toISOString(),
  };

  // Log for audit trail (in production, this would go to a proper audit log)
  console.log('Lead intelligence captured:', auditData);
}

/**
 * Privacy-compliant data retention helper
 */
export function shouldRetainLeadIntelligence(captureDate: Date, retentionDays: number = 365): boolean {
  const now = new Date();
  const daysSinceCapture = Math.floor((now.getTime() - captureDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceCapture <= retentionDays;
}