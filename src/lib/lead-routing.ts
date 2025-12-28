/**
 * Intelligent Lead Routing System
 * Routes leads based on expertise, capacity, and lead characteristics
 * Requirements: 3.3, 3.4, 3.8
 */

import { EnhancedLead, LeadRoutingRule, LeadPriority } from '@/lib/types/enterprise';
import { LeadScoreBreakdown } from './lead-scoring';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  expertise: string[];
  industries: string[];
  languages: string[];
  capacity: {
    current: number;
    maximum: number;
    availability: 'available' | 'busy' | 'unavailable';
  };
  performance: {
    conversionRate: number;
    averageResponseTime: number; // minutes
    customerSatisfaction: number; // 1-5
    activeLeads: number;
  };
  workingHours: {
    timezone: string;
    schedule: {
      [key: string]: { start: string; end: string } | null;
    };
  };
  isActive: boolean;
}

export interface RoutingDecision {
  assignedTo?: string;
  teamName?: string;
  priority: LeadPriority;
  estimatedResponseTime: number; // minutes
  recommendedApproach: string;
  confidence: number; // 0-1
  reasoning: string[];
  alternativeAssignees?: string[];
}

export interface RoutingCriteria {
  industry?: string;
  productCategory?: string;
  budgetRange?: string;
  urgency?: string;
  companySize?: string;
  leadScore?: number;
  language?: string;
  timezone?: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCriteria;
  assignTo?: string;
  teamName?: string;
  isActive: boolean;
}

class IntelligentLeadRouting {
  private teamMembers: TeamMember[] = [];
  private routingRules: RoutingRule[] = [];

  constructor(teamMembers: TeamMember[] = [], routingRules: RoutingRule[] = []) {
    this.teamMembers = teamMembers;
    this.routingRules = routingRules;
    
    // Load default configuration if none provided
    if (this.teamMembers.length === 0) {
      this.loadDefaultTeamMembers();
    }
    if (this.routingRules.length === 0) {
      this.loadDefaultRoutingRules();
    }
  }

  private loadDefaultTeamMembers(): void {
    this.teamMembers = [
      {
        id: 'senior-sales-1',
        name: 'Ahmed Al-Rashid',
        email: 'ahmed@almazahir.com',
        role: 'Senior Sales Manager',
        expertise: ['industrial_equipment', 'safety_systems', 'project_management'],
        industries: ['oil_gas', 'construction', 'manufacturing'],
        languages: ['arabic', 'english'],
        capacity: {
          current: 8,
          maximum: 15,
          availability: 'available',
        },
        performance: {
          conversionRate: 0.35,
          averageResponseTime: 45,
          customerSatisfaction: 4.7,
          activeLeads: 8,
        },
        workingHours: {
          timezone: 'Asia/Riyadh',
          schedule: {
            sunday: { start: '08:00', end: '17:00' },
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: null, // Day off
            saturday: null, // Day off
          },
        },
        isActive: true,
      },
      {
        id: 'technical-specialist-1',
        name: 'Omar Hassan',
        email: 'omar@almazahir.com',
        role: 'Technical Specialist',
        expertise: ['safety_equipment', 'fire_safety', 'technical_consulting'],
        industries: ['oil_gas', 'manufacturing', 'utilities'],
        languages: ['arabic', 'english'],
        capacity: {
          current: 5,
          maximum: 12,
          availability: 'available',
        },
        performance: {
          conversionRate: 0.42,
          averageResponseTime: 30,
          customerSatisfaction: 4.8,
          activeLeads: 5,
        },
        workingHours: {
          timezone: 'Asia/Riyadh',
          schedule: {
            sunday: { start: '08:00', end: '17:00' },
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: null,
            saturday: null,
          },
        },
        isActive: true,
      },
      {
        id: 'sales-rep-1',
        name: 'Fatima Al-Zahra',
        email: 'fatima@almazahir.com',
        role: 'Sales Representative',
        expertise: ['construction_materials', 'tools_machinery', 'customer_relations'],
        industries: ['construction', 'government', 'transportation'],
        languages: ['arabic', 'english'],
        capacity: {
          current: 12,
          maximum: 20,
          availability: 'busy',
        },
        performance: {
          conversionRate: 0.28,
          averageResponseTime: 60,
          customerSatisfaction: 4.5,
          activeLeads: 12,
        },
        workingHours: {
          timezone: 'Asia/Riyadh',
          schedule: {
            sunday: { start: '08:00', end: '17:00' },
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: null,
            saturday: null,
          },
        },
        isActive: true,
      },
      {
        id: 'project-manager-1',
        name: 'Khalid Al-Mansouri',
        email: 'khalid@almazahir.com',
        role: 'Project Manager',
        expertise: ['project_management', 'logistics', 'large_scale_projects'],
        industries: ['oil_gas', 'construction', 'mining'],
        languages: ['arabic', 'english'],
        capacity: {
          current: 3,
          maximum: 8,
          availability: 'available',
        },
        performance: {
          conversionRate: 0.55,
          averageResponseTime: 90,
          customerSatisfaction: 4.9,
          activeLeads: 3,
        },
        workingHours: {
          timezone: 'Asia/Riyadh',
          schedule: {
            sunday: { start: '08:00', end: '17:00' },
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: null,
            saturday: null,
          },
        },
        isActive: true,
           
      },
    ];
  }

  private loadDefaultRoutingRules(): void {
    this.routingRules = [
      {
        id: 'high-value-leads',
        name: 'High Value Leads to Senior Sales',
        priority: 1,
        conditions: {
          budgetRange: 'over_1m',
          leadScore: 80,
        },
        assignTo: 'senior-sales-1',
        isActive: true,
      },
      {
        id: 'technical-inquiries',
        name: 'Technical Inquiries to Specialist',
        priority: 2,
        conditions: {
          productCategory: 'safety_equipment',
        },
        assignTo: 'technical-specialist-1',
        isActive: true,
      },
      {
        id: 'oil-gas-industry',
        name: 'Oil & Gas to Project Manager',
        priority: 3,
        conditions: {
          industry: 'oil_gas',
          budgetRange: '500k_1m',
        },
        assignTo: 'project-manager-1',
        isActive: true,
      },
      {
        id: 'construction-projects',
        name: 'Construction Projects',
        priority: 4,
        conditions: {
          industry: 'construction',
        },
        assignTo: 'sales-rep-1',
        isActive: true,
      },
      {
        id: 'urgent-leads',
        name: 'Urgent Leads to Available Team',
        priority: 5,
        conditions: {
          urgency: 'immediate',
        },
        isActive: true,
      },
    ];
  }

  public routeLead(
    lead: Partial<EnhancedLead>,
    scoreBreakdown: LeadScoreBreakdown,
    criteria?: RoutingCriteria
  ): RoutingDecision {
    const routingCriteria: RoutingCriteria = {
      industry: lead.industry_sector,
      productCategory: lead.product_category,
      budgetRange: lead.budget_range,
      urgency: lead.urgency,
      companySize: lead.company_size,
      leadScore: scoreBreakdown.total,
      language: lead.preferred_language || 'arabic',
      timezone: lead.timezone || 'Asia/Riyadh',
      ...criteria,
    };

    // Find matching routing rules
    const matchingRules = this.findMatchingRules(routingCriteria);
    
    // Get available team members
    const availableMembers = this.getAvailableTeamMembers();
    
    // Apply routing logic
    const routingDecision = this.applyRoutingLogic(
      routingCriteria,
      matchingRules,
      availableMembers,
      scoreBreakdown
    );

    return routingDecision;
  }

  private findMatchingRules(criteria: RoutingCriteria): RoutingRule[] {
    return this.routingRules
      .filter(rule => rule.isActive)
      .filter(rule => this.ruleMatches(rule, criteria))
      .sort((a, b) => a.priority - b.priority);
  }

  private ruleMatches(rule: RoutingRule, criteria: RoutingCriteria): boolean {
    const conditions = rule.conditions;
    
    // Check each condition
    if (conditions.industry && conditions.industry !== criteria.industry) return false;
    if (conditions.productCategory && conditions.productCategory !== criteria.productCategory) return false;
    if (conditions.budgetRange && conditions.budgetRange !== criteria.budgetRange) return false;
    if (conditions.urgency && conditions.urgency !== criteria.urgency) return false;
    if (conditions.companySize && conditions.companySize !== criteria.companySize) return false;
    if (conditions.leadScore && criteria.leadScore && criteria.leadScore < conditions.leadScore) return false;
    if (conditions.language && conditions.language !== criteria.language) return false;
    if (conditions.timezone && conditions.timezone !== criteria.timezone) return false;

    return true;
  }

  private getAvailableTeamMembers(): TeamMember[] {
    return this.teamMembers
      .filter(member => member.isActive)
      .filter(member => member.capacity.availability !== 'unavailable')
      .sort((a, b) => {
        // Sort by availability and performance
        if (a.capacity.availability === 'available' && b.capacity.availability !== 'available') return -1;
        if (b.capacity.availability === 'available' && a.capacity.availability !== 'available') return 1;
        
        // Then by capacity utilization (lower is better)
        const aUtilization = a.capacity.current / a.capacity.maximum;
        const bUtilization = b.capacity.current / b.capacity.maximum;
        if (aUtilization !== bUtilization) return aUtilization - bUtilization;
        
        // Then by performance (higher is better)
        return b.performance.conversionRate - a.performance.conversionRate;
      });
  }

  private applyRoutingLogic(
    criteria: RoutingCriteria,
    matchingRules: RoutingRule[],
    availableMembers: TeamMember[],
    scoreBreakdown: LeadScoreBreakdown
  ): RoutingDecision {
    const reasoning: string[] = [];
    let assignedMember: TeamMember | undefined;
    let confidence = 0.5;

    // Try to apply matching rules first
    for (const rule of matchingRules) {
      if (rule.assignTo) {
        const member = this.teamMembers.find(m => m.id === rule.assignTo && m.isActive);
        if (member && member.capacity.current < member.capacity.maximum) {
          assignedMember = member;
          reasoning.push(`Matched rule: ${rule.name}`);
          confidence += 0.3;
          break;
        } else if (member) {
          reasoning.push(`Rule matched but ${member.name} is at capacity`);
        }
      }
    }

    // If no rule-based assignment, use intelligent routing
    if (!assignedMember && availableMembers.length > 0) {
      assignedMember = this.findBestMatch(criteria, availableMembers, reasoning);
      confidence += 0.2;
    }

    // Fallback to round-robin if no intelligent match
    if (!assignedMember && availableMembers.length > 0) {
      assignedMember = availableMembers[0];
      reasoning.push('Assigned to next available team member');
      confidence = 0.3;
    }

    // Determine priority based on score and urgency
    const priority = this.determinePriority(criteria, scoreBreakdown);
    
    // Calculate estimated response time
    const estimatedResponseTime = assignedMember 
      ? this.calculateResponseTime(assignedMember, priority)
      : 240; // 4 hours default

    // Generate recommended approach
    const recommendedApproach = this.generateRecommendedApproach(criteria, scoreBreakdown, assignedMember);

    // Find alternative assignees
    const alternativeAssignees = availableMembers
      .filter(m => m.id !== assignedMember?.id)
      .slice(0, 2)
      .map(m => m.id);

    return {
      assignedTo: assignedMember?.id,
      teamName: assignedMember?.role,
      priority,
      estimatedResponseTime,
      recommendedApproach,
      confidence: Math.min(1, confidence),
      reasoning,
      alternativeAssignees: alternativeAssignees.length > 0 ? alternativeAssignees : undefined,
    };
  }

  private findBestMatch(
    criteria: RoutingCriteria,
    availableMembers: TeamMember[],
    reasoning: string[]
  ): TeamMember | undefined {
    let bestMember: TeamMember | undefined;
    let bestScore = 0;

    for (const member of availableMembers) {
      let score = 0;
      const memberReasons: string[] = [];

      // Industry expertise match
      if (criteria.industry && member.industries.includes(criteria.industry)) {
        score += 30;
        memberReasons.push(`Industry expertise: ${criteria.industry}`);
      }

      // Product category expertise
      if (criteria.productCategory) {
        const categoryMatch = member.expertise.some(exp => 
          exp.includes(criteria.productCategory!) || criteria.productCategory!.includes(exp)
        );
        if (categoryMatch) {
          score += 25;
          memberReasons.push(`Product expertise match`);
        }
      }

      // Language preference
      if (criteria.language && member.languages.includes(criteria.language)) {
        score += 10;
        memberReasons.push(`Language: ${criteria.language}`);
      }

      // Capacity availability
      const utilizationRate = member.capacity.current / member.capacity.maximum;
      if (utilizationRate < 0.5) {
        score += 20;
        memberReasons.push('Low workload');
      } else if (utilizationRate < 0.8) {
        score += 10;
        memberReasons.push('Moderate workload');
      }

      // Performance factors
      score += member.performance.conversionRate * 10;
      score += (5 - member.performance.customerSatisfaction) * -5;
      score += Math.max(0, (120 - member.performance.averageResponseTime) / 10);

      // Working hours alignment
      if (this.isInWorkingHours(member)) {
        score += 15;
        memberReasons.push('Currently in working hours');
      }

      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
        reasoning.push(`Best match: ${member.name} (${memberReasons.join(', ')})`);
      }
    }

    return bestMember;
  }

  private isInWorkingHours(member: TeamMember): boolean {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const schedule = member.workingHours.schedule[dayOfWeek];
    
    if (!schedule) return false;

    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: member.workingHours.timezone 
    });
    
    return currentTime >= schedule.start && currentTime <= schedule.end;
  }

  private determinePriority(criteria: RoutingCriteria, scoreBreakdown: LeadScoreBreakdown): LeadPriority {
    // High priority conditions
    if (criteria.urgency === 'immediate') return 'critical';
    if (criteria.budgetRange === 'over_1m') return 'critical';
    if (scoreBreakdown.total >= 80) return 'critical';

    // Medium-high priority
    if (criteria.urgency === '1-2_weeks') return 'high';
    if (criteria.budgetRange === '500k_1m') return 'high';
    if (scoreBreakdown.total >= 60) return 'high';

    // Medium priority
    if (scoreBreakdown.total >= 40) return 'medium';

    return 'low';
  }

  private calculateResponseTime(member: TeamMember, priority: LeadPriority): number {
    let baseTime = member.performance.averageResponseTime;

    // Adjust based on priority
    switch (priority) {
      case 'critical':
        baseTime *= 0.5;
        break;
      case 'high':
        baseTime *= 0.7;
        break;
      case 'medium':
        baseTime *= 1.0;
        break;
      case 'low':
        baseTime *= 1.5;
        break;
    }

    // Adjust based on current workload
    const utilizationRate = member.capacity.current / member.capacity.maximum;
    baseTime *= (1 + utilizationRate);

    // Adjust based on working hours
    if (!this.isInWorkingHours(member)) {
      baseTime += 480; // Add 8 hours if outside working hours
    }

    return Math.round(baseTime);
  }

  private generateRecommendedApproach(
    criteria: RoutingCriteria,
    scoreBreakdown: LeadScoreBreakdown,
    assignedMember?: TeamMember
  ): string {
    const approaches: string[] = [];

    // Urgency-based approach
    if (criteria.urgency === 'immediate') {
      approaches.push('Immediate phone call within 30 minutes');
    } else if (criteria.urgency === '1-2_weeks') {
      approaches.push('Priority email response within 2 hours, follow-up call same day');
    } else {
      approaches.push('Professional email response within 4 hours');
    }

    // Budget-based approach
    if (criteria.budgetRange === 'over_1m' || criteria.budgetRange === '500k_1m') {
      approaches.push('Prepare comprehensive proposal with technical specifications');
      approaches.push('Schedule in-person or video meeting');
    } else if (criteria.budgetRange === '100k_500k') {
      approaches.push('Provide detailed quotation with options');
    } else {
      approaches.push('Send standard product information and pricing');
    }

    // Industry-specific approach
    if (criteria.industry === 'oil_gas') {
      approaches.push('Emphasize safety certifications and compliance standards');
    } else if (criteria.industry === 'construction') {
      approaches.push('Focus on project timeline and bulk pricing options');
    } else if (criteria.industry === 'manufacturing') {
      approaches.push('Highlight quality standards and technical support');
    }

    // Score-based approach
    if (scoreBreakdown.total >= 80) {
      approaches.push('High-priority lead: Assign senior team member');
    } else if (scoreBreakdown.total >= 60) {
      approaches.push('Qualified lead: Provide detailed information');
    } else {
      approaches.push('Nurture lead: Send educational content');
    }

    return approaches.join('. ');
  }

  // Public utility methods
  public updateTeamMemberCapacity(memberId: string, newCapacity: Partial<TeamMember['capacity']>): void {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (member) {
      member.capacity = { ...member.capacity, ...newCapacity };
    }
  }

  public updateTeamMemberPerformance(memberId: string, newPerformance: Partial<TeamMember['performance']>): void {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (member) {
      member.performance = { ...member.performance, ...newPerformance };
    }
  }

  public getTeamMemberWorkload(): Array<{ memberId: string; name: string; utilization: number; availability: string }> {
    return this.teamMembers.map(member => ({
      memberId: member.id,
      name: member.name,
      utilization: member.capacity.current / member.capacity.maximum,
      availability: member.capacity.availability,
    }));
  }

  public getRoutingStatistics(): {
    totalRules: number;
    activeRules: number;
    teamMembers: number;
    availableMembers: number;
    averageUtilization: number;
  } {
    const availableMembers = this.getAvailableTeamMembers();
    const totalUtilization = this.teamMembers.reduce(
      (sum, member) => sum + (member.capacity.current / member.capacity.maximum),
      0
    );

    return {
      totalRules: this.routingRules.length,
      activeRules: this.routingRules.filter(r => r.isActive).length,
      teamMembers: this.teamMembers.length,
      availableMembers: availableMembers.length,
      averageUtilization: totalUtilization / this.teamMembers.length,
    };
  }
}

// Export singleton instance
let leadRoutingInstance: IntelligentLeadRouting | null = null;

export function getLeadRoutingEngine(
  teamMembers?: TeamMember[],
  routingRules?: RoutingRule[]
): IntelligentLeadRouting {
  if (!leadRoutingInstance) {
    leadRoutingInstance = new IntelligentLeadRouting(teamMembers, routingRules);
  }
  return leadRoutingInstance;
}

// Convenience functions
export function routeLead(
  lead: Partial<EnhancedLead>,
  scoreBreakdown: LeadScoreBreakdown,
  criteria?: RoutingCriteria
): RoutingDecision {
  return getLeadRoutingEngine().routeLead(lead, scoreBreakdown, criteria);
}

export function updateTeamMemberCapacity(memberId: string, newCapacity: Partial<TeamMember['capacity']>): void {
  getLeadRoutingEngine().updateTeamMemberCapacity(memberId, newCapacity);
}

export function getTeamMemberWorkload(): Array<{ memberId: string; name: string; utilization: number; availability: string }> {
  return getLeadRoutingEngine().getTeamMemberWorkload();
}

export function getRoutingStatistics(): {
  totalRules: number;
  activeRules: number;
  teamMembers: number;
  availableMembers: number;
  averageUtilization: number;
} {
  return getLeadRoutingEngine().getRoutingStatistics();
}