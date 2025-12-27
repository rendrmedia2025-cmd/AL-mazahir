/**
 * Advanced Lead Scoring System
 * Machine learning-based lead scoring with predictive analytics
 * Requirements: 3.3, 3.4, 3.8
 */

import { EnhancedLead, LeadScoringRule, BudgetRange, DecisionAuthority, ProjectTimeline } from '@/lib/types/enterprise';

export interface LeadScoreBreakdown {
  total: number;
  profile: number;
  behavior: number;
  engagement: number;
  urgency: number;
  company: number;
  project: number;
  details: {
    [key: string]: {
      score: number;
      weight: number;
      reason: string;
    };
  };
}

export interface ScoringWeights {
  profile: number;
  behavior: number;
  engagement: number;
  urgency: number;
  company: number;
  project: number;
}

export interface ConversionPrediction {
  probability: number;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  timeToConversion: number; // days
  estimatedValue: number; // USD
}

export interface LeadScoringModel {
  version: string;
  weights: ScoringWeights;
  rules: LeadScoringRule[];
  thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
  conversionFactors: {
    [key: string]: number;
  };
}

class AdvancedLeadScoring {
  private model: LeadScoringModel;

  constructor(model?: LeadScoringModel) {
    this.model = model || this.getDefaultModel();
  }

  private getDefaultModel(): LeadScoringModel {
    return {
      version: '1.0.0',
      weights: {
        profile: 0.25,
        behavior: 0.20,
        engagement: 0.15,
        urgency: 0.15,
        company: 0.15,
        project: 0.10,
      },
      rules: [], // Will be loaded from database
      thresholds: {
        hot: 80,
        warm: 50,
        cold: 20,
      },
      conversionFactors: {
        // Company size factors
        'company_size_large': 1.5,
        'company_size_medium': 1.2,
        'company_size_small': 1.0,
        
        // Industry factors
        'industry_oil_gas': 1.8,
        'industry_construction': 1.6,
        'industry_manufacturing': 1.4,
        'industry_mining': 1.3,
        'industry_utilities': 1.2,
        'industry_government': 1.1,
        'industry_other': 1.0,
        
        // Budget factors
        'budget_over_1m': 2.0,
        'budget_500k_1m': 1.8,
        'budget_100k_500k': 1.5,
        'budget_50k_100k': 1.2,
        'budget_10k_50k': 1.0,
        'budget_under_10k': 0.8,
        
        // Decision authority factors
        'authority_decision_maker': 1.8,
        'authority_influencer': 1.4,
        'authority_end_user': 1.1,
        'authority_gatekeeper': 0.9,
        
        // Urgency factors
        'urgency_immediate': 2.0,
        'urgency_1-2_weeks': 1.5,
        'urgency_planning': 1.0,
        
        // Timeline factors
        'timeline_immediate': 2.0,
        'timeline_within_month': 1.6,
        'timeline_within_quarter': 1.3,
        'timeline_within_year': 1.1,
        'timeline_planning_phase': 0.9,
        
        // Behavioral factors
        'high_engagement': 1.5,
        'medium_engagement': 1.2,
        'low_engagement': 1.0,
        'multiple_pages': 1.3,
        'long_session': 1.4,
        'return_visitor': 1.6,
        'form_completion': 1.8,
        'document_download': 1.5,
      },
    };
  }

  public calculateLeadScore(lead: Partial<EnhancedLead>): LeadScoreBreakdown {
    const breakdown: LeadScoreBreakdown = {
      total: 0,
      profile: 0,
      behavior: 0,
      engagement: 0,
      urgency: 0,
      company: 0,
      project: 0,
      details: {},
    };

    // Profile scoring (25%)
    breakdown.profile = this.calculateProfileScore(lead, breakdown.details);
    
    // Behavior scoring (20%)
    breakdown.behavior = this.calculateBehaviorScore(lead, breakdown.details);
    
    // Engagement scoring (15%)
    breakdown.engagement = this.calculateEngagementScore(lead, breakdown.details);
    
    // Urgency scoring (15%)
    breakdown.urgency = this.calculateUrgencyScore(lead, breakdown.details);
    
    // Company scoring (15%)
    breakdown.company = this.calculateCompanyScore(lead, breakdown.details);
    
    // Project scoring (10%)
    breakdown.project = this.calculateProjectScore(lead, breakdown.details);

    // Calculate weighted total
    breakdown.total = Math.round(
      breakdown.profile * this.model.weights.profile +
      breakdown.behavior * this.model.weights.behavior +
      breakdown.engagement * this.model.weights.engagement +
      breakdown.urgency * this.model.weights.urgency +
      breakdown.company * this.model.weights.company +
      breakdown.project * this.model.weights.project
    );

    // Ensure score is within 0-100 range
    breakdown.total = Math.max(0, Math.min(100, breakdown.total));

    return breakdown;
  }

  private calculateProfileScore(lead: Partial<EnhancedLead>, details: any): number {
    let score = 0;
    const baseScore = 50; // Base score for having complete profile

    // Email domain analysis
    if (lead.email) {
      const domain = lead.email.split('@')[1]?.toLowerCase();
      if (domain && !this.isPersonalEmailDomain(domain)) {
        score += 20;
        details['business_email'] = {
          score: 20,
          weight: this.model.weights.profile,
          reason: 'Business email domain indicates professional inquiry',
        };
      } else {
        score += 5;
        details['personal_email'] = {
          score: 5,
          weight: this.model.weights.profile,
          reason: 'Personal email domain',
        };
      }
    }

    // Company information completeness
    if (lead.company) {
      score += 15;
      details['company_provided'] = {
        score: 15,
        weight: this.model.weights.profile,
        reason: 'Company name provided',
      };
    }

    // Phone number provided
    if (lead.phone) {
      score += 10;
      details['phone_provided'] = {
        score: 10,
        weight: this.model.weights.profile,
        reason: 'Phone number provided for direct contact',
      };
    }

    // Decision authority
    if (lead.decision_authority) {
      const authorityScore = this.getAuthorityScore(lead.decision_authority);
      score += authorityScore;
      details['decision_authority'] = {
        score: authorityScore,
        weight: this.model.weights.profile,
        reason: `Decision authority: ${lead.decision_authority}`,
      };
    }

    return Math.min(100, score);
  }

  private calculateBehaviorScore(lead: Partial<EnhancedLead>, details: any): number {
    let score = 0;

    // Device type (mobile users might be less serious for B2B)
    if (lead.device_type) {
      const deviceScore = lead.device_type === 'desktop' ? 15 : 
                         lead.device_type === 'tablet' ? 10 : 5;
      score += deviceScore;
      details['device_type'] = {
        score: deviceScore,
        weight: this.model.weights.behavior,
        reason: `Accessed from ${lead.device_type}`,
      };
    }

    // Page views count
    if (lead.page_views_count && lead.page_views_count > 1) {
      const pageScore = Math.min(25, lead.page_views_count * 5);
      score += pageScore;
      details['page_views'] = {
        score: pageScore,
        weight: this.model.weights.behavior,
        reason: `Viewed ${lead.page_views_count} pages`,
      };
    }

    // Documents downloaded
    if (lead.documents_downloaded && lead.documents_downloaded > 0) {
      const docScore = Math.min(20, lead.documents_downloaded * 10);
      score += docScore;
      details['documents_downloaded'] = {
        score: docScore,
        weight: this.model.weights.behavior,
        reason: `Downloaded ${lead.documents_downloaded} documents`,
      };
    }

    // Referrer analysis
    if (lead.referrer) {
      const referrerScore = this.analyzeReferrer(lead.referrer);
      score += referrerScore;
      details['referrer'] = {
        score: referrerScore,
        weight: this.model.weights.behavior,
        reason: `Came from: ${this.getReferrerSource(lead.referrer)}`,
      };
    }

    return Math.min(100, score);
  }

  private calculateEngagementScore(lead: Partial<EnhancedLead>, details: any): number {
    let score = 0;

    // Total engagement time
    if (lead.total_engagement_time) {
      const minutes = lead.total_engagement_time / 60;
      const timeScore = Math.min(40, minutes * 2); // 2 points per minute, max 40
      score += timeScore;
      details['engagement_time'] = {
        score: timeScore,
        weight: this.model.weights.engagement,
        reason: `Spent ${Math.round(minutes)} minutes on site`,
      };
    }

    // Form completion (reaching this point means they completed the form)
    score += 30;
    details['form_completion'] = {
      score: 30,
      weight: this.model.weights.engagement,
      reason: 'Completed detailed inquiry form',
    };

    // Message length (longer messages indicate higher interest)
    if (lead.message) {
      const messageLength = lead.message.length;
      const messageScore = messageLength > 200 ? 20 : 
                          messageLength > 100 ? 15 : 
                          messageLength > 50 ? 10 : 5;
      score += messageScore;
      details['message_detail'] = {
        score: messageScore,
        weight: this.model.weights.engagement,
        reason: `Provided ${messageLength > 200 ? 'detailed' : 'basic'} requirements`,
      };
    }

    return Math.min(100, score);
  }

  private calculateUrgencyScore(lead: Partial<EnhancedLead>, details: any): number {
    let score = 0;

    // Urgency level
    if (lead.urgency) {
      const urgencyScore = lead.urgency === 'immediate' ? 50 :
                          lead.urgency === '1-2_weeks' ? 30 : 15;
      score += urgencyScore;
      details['urgency_level'] = {
        score: urgencyScore,
        weight: this.model.weights.urgency,
        reason: `Urgency: ${lead.urgency}`,
      };
    }

    // Project timeline
    if (lead.project_timeline) {
      const timelineScore = this.getTimelineScore(lead.project_timeline);
      score += timelineScore;
      details['project_timeline'] = {
        score: timelineScore,
        weight: this.model.weights.urgency,
        reason: `Timeline: ${lead.project_timeline}`,
      };
    }

    return Math.min(100, score);
  }

  private calculateCompanyScore(lead: Partial<EnhancedLead>, details: any): number {
    let score = 0;

    // Company size
    if (lead.company_size) {
      const sizeScore = lead.company_size === 'large' ? 40 :
                       lead.company_size === 'medium' ? 25 : 15;
      score += sizeScore;
      details['company_size'] = {
        score: sizeScore,
        weight: this.model.weights.company,
        reason: `Company size: ${lead.company_size}`,
      };
    }

    // Industry sector
    if (lead.industry_sector) {
      const industryScore = this.getIndustryScore(lead.industry_sector);
      score += industryScore;
      details['industry_sector'] = {
        score: industryScore,
        weight: this.model.weights.company,
        reason: `Industry: ${lead.industry_sector}`,
      };
    }

    return Math.min(100, score);
  }

  private calculateProjectScore(lead: Partial<EnhancedLead>, details: any): number {
    let score = 0;

    // Budget range
    if (lead.budget_range) {
      const budgetScore = this.getBudgetScore(lead.budget_range);
      score += budgetScore;
      details['budget_range'] = {
        score: budgetScore,
        weight: this.model.weights.project,
        reason: `Budget: ${lead.budget_range}`,
      };
    }

    // Quantity estimate provided
    if (lead.quantity_estimate) {
      score += 20;
      details['quantity_estimate'] = {
        score: 20,
        weight: this.model.weights.project,
        reason: 'Provided quantity estimate',
      };
    }

    // Product category specified
    if (lead.product_category) {
      score += 15;
      details['product_category'] = {
        score: 15,
        weight: this.model.weights.project,
        reason: 'Specified product category',
      };
    }

    return Math.min(100, score);
  }

  public predictConversion(lead: Partial<EnhancedLead>, scoreBreakdown: LeadScoreBreakdown): ConversionPrediction {
    const factors = this.analyzeConversionFactors(lead, scoreBreakdown);
    
    // Base probability from score
    let probability = scoreBreakdown.total / 100;
    
    // Apply conversion factors
    factors.positive.forEach(factor => {
      const multiplier = this.model.conversionFactors[factor] || 1.0;
      probability *= multiplier;
    });
    
    factors.negative.forEach(factor => {
      const multiplier = this.model.conversionFactors[factor] || 1.0;
      probability /= multiplier;
    });
    
    // Ensure probability is within 0-1 range
    probability = Math.max(0, Math.min(1, probability));
    
    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(lead);
    
    // Estimate time to conversion
    const timeToConversion = this.estimateTimeToConversion(lead, probability);
    
    // Estimate deal value
    const estimatedValue = this.estimateDealValue(lead);

    return {
      probability: Math.round(probability * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      timeToConversion,
      estimatedValue,
    };
  }

  private analyzeConversionFactors(lead: Partial<EnhancedLead>, scoreBreakdown: LeadScoreBreakdown): {
    positive: string[];
    negative: string[];
  } {
    const positive: string[] = [];
    const negative: string[] = [];

    // Company size factors
    if (lead.company_size === 'large') positive.push('company_size_large');
    else if (lead.company_size === 'medium') positive.push('company_size_medium');

    // Industry factors
    if (lead.industry_sector) {
      positive.push(`industry_${lead.industry_sector}`);
    }

    // Budget factors
    if (lead.budget_range) {
      positive.push(`budget_${lead.budget_range}`);
    }

    // Authority factors
    if (lead.decision_authority) {
      positive.push(`authority_${lead.decision_authority}`);
    }

    // Urgency factors
    if (lead.urgency) {
      positive.push(`urgency_${lead.urgency}`);
    }

    // Timeline factors
    if (lead.project_timeline) {
      positive.push(`timeline_${lead.project_timeline}`);
    }

    // Engagement factors
    if (scoreBreakdown.engagement > 70) positive.push('high_engagement');
    else if (scoreBreakdown.engagement > 40) positive.push('medium_engagement');
    else negative.push('low_engagement');

    // Behavioral factors
    if (lead.page_views_count && lead.page_views_count > 3) positive.push('multiple_pages');
    if (lead.total_engagement_time && lead.total_engagement_time > 300) positive.push('long_session');
    if (scoreBreakdown.engagement > 60) positive.push('form_completion');
    if (lead.documents_downloaded && lead.documents_downloaded > 0) positive.push('document_download');

    return { positive, negative };
  }

  private calculateConfidence(lead: Partial<EnhancedLead>): number {
    let confidence = 0.5; // Base confidence
    
    // Data completeness factors
    const fields = [
      'name', 'email', 'phone', 'company', 'company_size', 'industry_sector',
      'decision_authority', 'budget_range', 'project_timeline', 'message'
    ];
    
    const completedFields = fields.filter(field => lead[field as keyof typeof lead]).length;
    confidence += (completedFields / fields.length) * 0.3;
    
    // Behavioral data availability
    if (lead.total_engagement_time) confidence += 0.1;
    if (lead.page_views_count && lead.page_views_count > 1) confidence += 0.1;
    
    return Math.min(1, confidence);
  }

  private estimateTimeToConversion(lead: Partial<EnhancedLead>, probability: number): number {
    let baseDays = 30; // Default 30 days
    
    // Urgency adjustments
    if (lead.urgency === 'immediate') baseDays = 3;
    else if (lead.urgency === '1-2_weeks') baseDays = 10;
    else if (lead.urgency === 'planning') baseDays = 90;
    
    // Timeline adjustments
    if (lead.project_timeline === 'immediate') baseDays = Math.min(baseDays, 7);
    else if (lead.project_timeline === 'within_month') baseDays = Math.min(baseDays, 30);
    else if (lead.project_timeline === 'within_quarter') baseDays = Math.min(baseDays, 90);
    else if (lead.project_timeline === 'planning_phase') baseDays = Math.max(baseDays, 180);
    
    // Probability adjustments (higher probability = faster conversion)
    baseDays = Math.round(baseDays / (probability + 0.1));
    
    return Math.max(1, baseDays);
  }

  private estimateDealValue(lead: Partial<EnhancedLead>): number {
    let baseValue = 50000; // Default $50k
    
    // Budget range adjustments
    if (lead.budget_range === 'over_1m') baseValue = 1500000;
    else if (lead.budget_range === '500k_1m') baseValue = 750000;
    else if (lead.budget_range === '100k_500k') baseValue = 300000;
    else if (lead.budget_range === '50k_100k') baseValue = 75000;
    else if (lead.budget_range === '10k_50k') baseValue = 30000;
    else if (lead.budget_range === 'under_10k') baseValue = 7500;
    
    // Company size adjustments
    if (lead.company_size === 'large') baseValue *= 1.5;
    else if (lead.company_size === 'medium') baseValue *= 1.2;
    
    // Industry adjustments
    if (lead.industry_sector === 'oil_gas') baseValue *= 2.0;
    else if (lead.industry_sector === 'construction') baseValue *= 1.5;
    else if (lead.industry_sector === 'manufacturing') baseValue *= 1.3;
    
    return Math.round(baseValue);
  }

  // Helper methods
  private isPersonalEmailDomain(domain: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
      'aol.com', 'live.com', 'msn.com', 'ymail.com', 'mail.com'
    ];
    return personalDomains.includes(domain);
  }

  private getAuthorityScore(authority: DecisionAuthority): number {
    switch (authority) {
      case 'decision_maker': return 25;
      case 'influencer': return 20;
      case 'end_user': return 15;
      case 'gatekeeper': return 10;
      default: return 0;
    }
  }

  private getTimelineScore(timeline: ProjectTimeline): number {
    switch (timeline) {
      case 'immediate': return 25;
      case 'within_month': return 20;
      case 'within_quarter': return 15;
      case 'within_year': return 10;
      case 'planning_phase': return 5;
      default: return 0;
    }
  }

  private getIndustryScore(industry: string): number {
    const industryScores: { [key: string]: number } = {
      'oil_gas': 30,
      'construction': 25,
      'manufacturing': 20,
      'mining': 18,
      'utilities': 15,
      'government': 12,
      'transportation': 10,
      'other': 5,
    };
    return industryScores[industry] || 5;
  }

  private getBudgetScore(budget: BudgetRange): number {
    switch (budget) {
      case 'over_1m': return 50;
      case '500k_1m': return 40;
      case '100k_500k': return 30;
      case '50k_100k': return 20;
      case '10k_50k': return 15;
      case 'under_10k': return 10;
      default: return 0;
    }
  }

  private analyzeReferrer(referrer: string): number {
    try {
      const url = new URL(referrer);
      const domain = url.hostname.toLowerCase();
      
      if (domain.includes('google')) return 15;
      if (domain.includes('linkedin')) return 20;
      if (domain.includes('industry') || domain.includes('trade')) return 25;
      if (domain.includes('facebook') || domain.includes('twitter')) return 10;
      
      return 12; // General referral
    } catch {
      return 5;
    }
  }

  private getReferrerSource(referrer: string): string {
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return 'unknown';
    }
  }

  public getLeadPriority(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.model.thresholds.hot) return 'critical';
    if (score >= this.model.thresholds.warm) return 'high';
    if (score >= this.model.thresholds.cold) return 'medium';
    return 'low';
  }

  public getLeadTemperature(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= this.model.thresholds.hot) return 'hot';
    if (score >= this.model.thresholds.warm) return 'warm';
    return 'cold';
  }
}

// Export singleton instance
let leadScoringInstance: AdvancedLeadScoring | null = null;

export function getLeadScoringEngine(model?: LeadScoringModel): AdvancedLeadScoring {
  if (!leadScoringInstance) {
    leadScoringInstance = new AdvancedLeadScoring(model);
  }
  return leadScoringInstance;
}

// Convenience functions
export function calculateLeadScore(lead: Partial<EnhancedLead>): LeadScoreBreakdown {
  return getLeadScoringEngine().calculateLeadScore(lead);
}

export function predictConversion(lead: Partial<EnhancedLead>, scoreBreakdown: LeadScoreBreakdown): ConversionPrediction {
  return getLeadScoringEngine().predictConversion(lead, scoreBreakdown);
}

export function getLeadPriority(score: number): 'low' | 'medium' | 'high' | 'critical' {
  return getLeadScoringEngine().getLeadPriority(score);
}

export function getLeadTemperature(score: number): 'hot' | 'warm' | 'cold' {
  return getLeadScoringEngine().getLeadTemperature(score);
}