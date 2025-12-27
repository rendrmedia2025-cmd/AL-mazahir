/**
 * Behavioral Analytics System
 * Tracks user behavior and engagement patterns for lead intelligence
 * Requirements: 3.1, 3.2
 */

export interface PageEngagement {
  url: string;
  title: string;
  timeOnPage: number;
  scrollDepth: number;
  interactions: InteractionEvent[];
  entryTime: Date;
  exitTime?: Date;
}

export interface InteractionEvent {
  type: 'click' | 'scroll' | 'form_focus' | 'form_input' | 'download' | 'video_play' | 'hover';
  element: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SessionAnalytics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  pageViews: PageEngagement[];
  deviceInfo: DeviceInfo;
  referrerInfo: ReferrerInfo;
  engagementScore: number;
  bounceRate: number;
  conversionEvents: ConversionEvent[];
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  screenResolution: string;
  viewport: { width: number; height: number };
  browser: string;
  os: string;
  touchSupport: boolean;
}

export interface ReferrerInfo {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrerUrl?: string;
}

export interface ConversionEvent {
  type: 'form_submission' | 'phone_click' | 'email_click' | 'whatsapp_click' | 'download' | 'quote_request';
  timestamp: Date;
  value?: number;
  metadata: Record<string, any>;
}

export interface CompanyProfile {
  name: string;
  size: 'small' | 'medium' | 'large';
  industry: string;
  confidence: number;
  detectionMethod: 'user_input' | 'domain_analysis' | 'content_analysis';
}

class BehavioralAnalytics {
  private sessionId: string;
  private startTime: Date;
  private currentPage: PageEngagement | null = null;
  private pageViews: PageEngagement[] = [];
  private interactions: InteractionEvent[] = [];
  private conversionEvents: ConversionEvent[] = [];
  private deviceInfo: DeviceInfo;
  private referrerInfo: ReferrerInfo;
  private isTracking = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.deviceInfo = this.detectDeviceInfo();
    this.referrerInfo = this.analyzeReferrer();
    
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        userAgent: '',
        screenResolution: '0x0',
        viewport: { width: 0, height: 0 },
        browser: 'unknown',
        os: 'unknown',
        touchSupport: false,
      };
    }

    const userAgent = navigator.userAgent;
    const screen = window.screen;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    return {
      type: this.detectDeviceType(userAgent),
      userAgent: userAgent.substring(0, 500), // Limit length for privacy
      screenResolution: `${screen.width}x${screen.height}`,
      viewport,
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent),
      touchSupport: 'ontouchstart' in window,
    };
  }

  private detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/iPad/.test(userAgent)) return 'tablet';
    if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Other';
  }

  private analyzeReferrer(): ReferrerInfo {
    if (typeof document === 'undefined') {
      return {
        source: 'direct',
        medium: 'none',
      };
    }

    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);

    // Check for UTM parameters
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmTerm = urlParams.get('utm_term');
    const utmContent = urlParams.get('utm_content');

    if (utmSource) {
      return {
        source: utmSource,
        medium: utmMedium || 'unknown',
        campaign: utmCampaign || undefined,
        term: utmTerm || undefined,
        content: utmContent || undefined,
        referrerUrl: referrer || undefined,
      };
    }

    // Analyze referrer domain
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const domain = referrerUrl.hostname.toLowerCase();

        if (domain.includes('google')) {
          return { source: 'google', medium: 'organic', referrerUrl: referrer };
        }
        if (domain.includes('bing')) {
          return { source: 'bing', medium: 'organic', referrerUrl: referrer };
        }
        if (domain.includes('facebook')) {
          return { source: 'facebook', medium: 'social', referrerUrl: referrer };
        }
        if (domain.includes('linkedin')) {
          return { source: 'linkedin', medium: 'social', referrerUrl: referrer };
        }
        if (domain.includes('twitter')) {
          return { source: 'twitter', medium: 'social', referrerUrl: referrer };
        }

        return { source: domain, medium: 'referral', referrerUrl: referrer };
      } catch {
        return { source: 'unknown', medium: 'referral', referrerUrl: referrer };
      }
    }

    return { source: 'direct', medium: 'none' };
  }

  private initializeTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track page view
    this.trackPageView();

    // Track interactions
    this.setupInteractionTracking();

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endCurrentPage();
      this.sendAnalytics();
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endCurrentPage();
      } else {
        this.trackPageView();
      }
    });
  }

  private trackPageView(): void {
    // End current page tracking
    this.endCurrentPage();

    // Start new page tracking
    this.currentPage = {
      url: window.location.href,
      title: document.title,
      timeOnPage: 0,
      scrollDepth: 0,
      interactions: [],
      entryTime: new Date(),
    };

    // Track scroll depth
    this.trackScrollDepth();
  }

  private endCurrentPage(): void {
    if (this.currentPage) {
      this.currentPage.exitTime = new Date();
      this.currentPage.timeOnPage = this.currentPage.exitTime.getTime() - this.currentPage.entryTime.getTime();
      this.pageViews.push(this.currentPage);
      this.currentPage = null;
    }
  }

  private trackScrollDepth(): void {
    let maxScrollDepth = 0;

    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollDepth = Math.min(100, Math.round(((scrollTop + windowHeight) / documentHeight) * 100));
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (this.currentPage) {
          this.currentPage.scrollDepth = scrollDepth;
        }

        // Track significant scroll milestones
        if (scrollDepth >= 25 && scrollDepth < 50) {
          this.trackInteraction('scroll', 'page', { depth: '25%' });
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          this.trackInteraction('scroll', 'page', { depth: '50%' });
        } else if (scrollDepth >= 75 && scrollDepth < 100) {
          this.trackInteraction('scroll', 'page', { depth: '75%' });
        } else if (scrollDepth >= 100) {
          this.trackInteraction('scroll', 'page', { depth: '100%' });
        }
      }
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    updateScrollDepth(); // Initial call
  }

  private setupInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const elementInfo = this.getElementInfo(target);
      this.trackInteraction('click', elementInfo, {
        x: event.clientX,
        y: event.clientY,
      });
    });

    // Track form interactions
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const elementInfo = this.getElementInfo(target);
        this.trackInteraction('form_focus', elementInfo);
      }
    });

    document.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const elementInfo = this.getElementInfo(target);
        this.trackInteraction('form_input', elementInfo, {
          fieldType: (target as HTMLInputElement).type,
          hasValue: !!(target as HTMLInputElement).value,
        });
      }
    });

    // Track hover on important elements
    const importantSelectors = ['button', 'a', '[data-track]', '.cta', '.product-card'];
    importantSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('mouseenter', () => {
          const elementInfo = this.getElementInfo(element as HTMLElement);
          this.trackInteraction('hover', elementInfo);
        });
      });
    });
  }

  private getElementInfo(element: HTMLElement): string {
    // Create a descriptive identifier for the element
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.trim().substring(0, 50) || '';
    
    return `${tagName}${id}${className}${text ? ` "${text}"` : ''}`;
  }

  public trackInteraction(type: InteractionEvent['type'], element: string, metadata?: Record<string, any>): void {
    const interaction: InteractionEvent = {
      type,
      element,
      timestamp: new Date(),
      metadata,
    };

    this.interactions.push(interaction);
    
    if (this.currentPage) {
      this.currentPage.interactions.push(interaction);
    }
  }

  public trackConversion(type: ConversionEvent['type'], value?: number, metadata: Record<string, any> = {}): void {
    const conversion: ConversionEvent = {
      type,
      timestamp: new Date(),
      value,
      metadata,
    };

    this.conversionEvents.push(conversion);
  }

  public analyzeCompanyFromEmail(email: string): CompanyProfile | null {
    if (!email || !email.includes('@')) return null;

    const domain = email.split('@')[1].toLowerCase();
    
    // Skip common email providers
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (commonProviders.includes(domain)) return null;

    // Analyze domain for company information
    const companyName = domain.split('.')[0];
    const size = this.estimateCompanySize(domain);
    const industry = this.estimateIndustry(companyName);

    return {
      name: companyName,
      size,
      industry,
      confidence: 0.7, // Medium confidence for domain-based detection
      detectionMethod: 'domain_analysis',
    };
  }

  private estimateCompanySize(domain: string): 'small' | 'medium' | 'large' {
    // Simple heuristics - in production, this could use external APIs
    const domainParts = domain.split('.');
    if (domainParts.length > 2) return 'large'; // Subdomains suggest larger organization
    if (domain.includes('corp') || domain.includes('group') || domain.includes('international')) return 'large';
    if (domain.includes('ltd') || domain.includes('llc') || domain.includes('inc')) return 'medium';
    return 'small';
  }

  private estimateIndustry(companyName: string): string {
    const name = companyName.toLowerCase();
    
    if (name.includes('construct') || name.includes('build')) return 'construction';
    if (name.includes('oil') || name.includes('gas') || name.includes('energy')) return 'oil_gas';
    if (name.includes('manufact') || name.includes('industrial')) return 'manufacturing';
    if (name.includes('transport') || name.includes('logistics')) return 'transportation';
    if (name.includes('tech') || name.includes('software')) return 'technology';
    if (name.includes('consult')) return 'consulting';
    
    return 'other';
  }

  public calculateEngagementScore(): number {
    const totalTime = this.pageViews.reduce((sum, page) => sum + page.timeOnPage, 0);
    const avgScrollDepth = this.pageViews.reduce((sum, page) => sum + page.scrollDepth, 0) / Math.max(this.pageViews.length, 1);
    const interactionCount = this.interactions.length;
    const conversionCount = this.conversionEvents.length;

    // Scoring algorithm (0-100)
    let score = 0;
    
    // Time on site (max 30 points)
    score += Math.min(30, (totalTime / 1000) / 60 * 5); // 5 points per minute, max 6 minutes
    
    // Scroll depth (max 20 points)
    score += (avgScrollDepth / 100) * 20;
    
    // Interactions (max 30 points)
    score += Math.min(30, interactionCount * 2);
    
    // Conversions (max 20 points)
    score += Math.min(20, conversionCount * 10);

    return Math.round(Math.min(100, score));
  }

  public calculateBounceRate(): number {
    if (this.pageViews.length <= 1) return 1.0;
    
    const shortVisits = this.pageViews.filter(page => page.timeOnPage < 30000).length; // Less than 30 seconds
    return shortVisits / this.pageViews.length;
  }

  public getSessionAnalytics(): SessionAnalytics {
    this.endCurrentPage(); // Ensure current page is captured

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: new Date(),
      totalDuration: Date.now() - this.startTime.getTime(),
      pageViews: this.pageViews,
      deviceInfo: this.deviceInfo,
      referrerInfo: this.referrerInfo,
      engagementScore: this.calculateEngagementScore(),
      bounceRate: this.calculateBounceRate(),
      conversionEvents: this.conversionEvents,
    };
  }

  private async sendAnalytics(): Promise<void> {
    try {
      const analytics = this.getSessionAnalytics();
      
      // Send to analytics endpoint
      await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analytics),
      });
    } catch (error) {
      console.error('Failed to send behavioral analytics:', error);
    }
  }

  // Public methods for manual tracking
  public trackFormSubmission(formType: string, leadId?: string): void {
    this.trackConversion('form_submission', undefined, { formType, leadId });
  }

  public trackPhoneClick(phoneNumber: string): void {
    this.trackConversion('phone_click', undefined, { phoneNumber });
  }

  public trackEmailClick(email: string): void {
    this.trackConversion('email_click', undefined, { email });
  }

  public trackWhatsAppClick(phoneNumber: string): void {
    this.trackConversion('whatsapp_click', undefined, { phoneNumber });
  }

  public trackDownload(fileName: string, fileType: string): void {
    this.trackConversion('download', undefined, { fileName, fileType });
  }
}

// Singleton instance
let behavioralAnalytics: BehavioralAnalytics | null = null;

export function getBehavioralAnalytics(): BehavioralAnalytics {
  if (!behavioralAnalytics) {
    behavioralAnalytics = new BehavioralAnalytics();
  }
  return behavioralAnalytics;
}

// Convenience functions
export function trackFormSubmission(formType: string, leadId?: string): void {
  getBehavioralAnalytics().trackFormSubmission(formType, leadId);
}

export function trackPhoneClick(phoneNumber: string): void {
  getBehavioralAnalytics().trackPhoneClick(phoneNumber);
}

export function trackEmailClick(email: string): void {
  getBehavioralAnalytics().trackEmailClick(email);
}

export function trackWhatsAppClick(phoneNumber: string): void {
  getBehavioralAnalytics().trackWhatsAppClick(phoneNumber);
}

export function trackDownload(fileName: string, fileType: string): void {
  getBehavioralAnalytics().trackDownload(fileName, fileType);
}

export function getSessionAnalytics(): SessionAnalytics {
  return getBehavioralAnalytics().getSessionAnalytics();
}

export function analyzeCompanyFromEmail(email: string): CompanyProfile | null {
  return getBehavioralAnalytics().analyzeCompanyFromEmail(email);
}