/**
 * Automated Follow-up Scheduling System
 * Implements intelligent follow-up scheduling and automation
 * Requirements: 3.8
 */

import { EnhancedLead, LeadPriority } from '@/lib/types/enterprise';
import { LeadScoreBreakdown, ConversionPrediction } from './lead-scoring';
import { RoutingDecision } from './lead-routing';

export interface FollowUpAction {
  id: string;
  leadId: string;
  type: 'email' | 'phone_call' | 'whatsapp' | 'meeting' | 'proposal' | 'reminder';
  scheduledAt: Date;
  status: 'pending' | 'completed' | 'skipped' | 'failed';
  priority: LeadPriority;
  assignedTo: string;
  template?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface FollowUpTemplate {
  id: string;
  name: string;
  type: FollowUpAction['type'];
  subject?: string;
  content: string;
  variables: string[];
  conditions: {
    leadScore?: { min?: number; max?: number };
    industry?: string[];
    budgetRange?: string[];
    urgency?: string[];
    daysSinceLastContact?: number;
  };
  isActive: boolean;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  description: string;
  triggers: {
    leadScore?: { min?: number; max?: number };
    industry?: string[];
    budgetRange?: string[];
    urgency?: string[];
    noResponse?: boolean;
  };
  actions: Array<{
    delay: number; // hours
    action: Omit<FollowUpAction, 'id' | 'leadId' | 'scheduledAt' | 'status' | 'createdAt'>;
  }>;
  isActive: boolean;
}

export interface FollowUpSchedule {
  leadId: string;
  sequenceId?: string;
  actions: FollowUpAction[];
  nextAction?: FollowUpAction;
  lastContactAt?: Date;
  responseReceived: boolean;
  conversionStatus: 'active' | 'converted' | 'lost' | 'nurturing';
}

class AutomatedFollowUpSystem {
  private templates: FollowUpTemplate[] = [];
  private sequences: FollowUpSequence[] = [];
  private schedules: Map<string, FollowUpSchedule> = new Map();

  constructor() {
    this.loadDefaultTemplates();
    this.loadDefaultSequences();
  }

  private loadDefaultTemplates(): void {
    this.templates = [
      {
        id: 'initial-response-high-value',
        name: 'Initial Response - High Value Lead',
        type: 'email',
        subject: 'Thank you for your inquiry - Al Mazahir Trading Est.',
        content: `Dear {{name}},

Thank you for your inquiry regarding {{product_category}} for your {{industry}} operations. We appreciate your interest in Al Mazahir Trading Est.

Based on your requirements for {{budget_range}} budget range, I would like to schedule a detailed discussion to understand your specific needs and provide you with a comprehensive solution.

Our expertise in {{industry}} sector includes:
- Premium quality industrial supplies
- Certified safety equipment
- Project management support
- Competitive pricing for bulk orders

I will call you within the next 2 hours to discuss your requirements in detail. Alternatively, you can reach me directly at +966-XXX-XXXX.

Best regards,
{{assigned_to_name}}
Al Mazahir Trading Est.`,
        variables: ['name', 'product_category', 'industry', 'budget_range', 'assigned_to_name'],
        conditions: {
          leadScore: { min: 70 },
          budgetRange: ['500k_1m', 'over_1m'],
        },
        isActive: true,
      },
      {
        id: 'initial-response-standard',
        name: 'Initial Response - Standard Lead',
        type: 'email',
        subject: 'Your inquiry - Al Mazahir Trading Est.',
        content: `Dear {{name}},

Thank you for contacting Al Mazahir Trading Est. regarding {{product_category}}.

We have received your inquiry and our team is reviewing your requirements. We will respond with detailed information and pricing within 4 hours.

In the meantime, you can:
- Browse our product catalog: [link]
- Download our company brochure: [link]
- Contact us directly: +966-XXX-XXXX

Best regards,
{{assigned_to_name}}
Al Mazahir Trading Est.`,
        variables: ['name', 'product_category', 'assigned_to_name'],
        conditions: {
          leadScore: { min: 30, max: 69 },
        },
        isActive: true,
      },
      {
        id: 'follow-up-no-response',
        name: 'Follow-up - No Response',
        type: 'email',
        subject: 'Following up on your inquiry - Al Mazahir Trading Est.',
        content: `Dear {{name}},

I wanted to follow up on the inquiry you submitted {{days_ago}} days ago regarding {{product_category}}.

We understand that you may be evaluating multiple suppliers. Here's why Al Mazahir Trading Est. stands out:

- {{years_experience}}+ years of experience in {{industry}}
- Certified quality management systems
- Competitive pricing with flexible payment terms
- Fast delivery across Saudi Arabia

Would you like to schedule a brief 15-minute call to discuss your requirements? I'm available at your convenience.

Best regards,
{{assigned_to_name}}
Al Mazahir Trading Est.`,
        variables: ['name', 'days_ago', 'product_category', 'years_experience', 'industry', 'assigned_to_name'],
        conditions: {
          daysSinceLastContact: 3,
        },
        isActive: true,
      },
      {
        id: 'urgent-phone-call',
        name: 'Urgent Phone Call',
        type: 'phone_call',
        content: 'Call immediately for urgent inquiry. Mention: {{urgency_reason}}. Budget: {{budget_range}}. Timeline: {{project_timeline}}.',
        variables: ['urgency_reason', 'budget_range', 'project_timeline'],
        conditions: {
          urgency: ['immediate'],
        },
        isActive: true,
      },
      {
        id: 'proposal-follow-up',
        name: 'Proposal Follow-up',
        type: 'email',
        subject: 'Proposal for {{company}} - Al Mazahir Trading Est.',
        content: `Dear {{name}},

I hope this email finds you well. I wanted to follow up on the proposal we sent for your {{product_category}} requirements.

Our proposal includes:
- Detailed technical specifications
- Competitive pricing structure
- Delivery timeline: {{delivery_timeline}}
- Quality certifications and warranties

Do you have any questions about our proposal? I'm happy to schedule a call to discuss any aspects in detail.

Looking forward to your feedback.

Best regards,
{{assigned_to_name}}
Al Mazahir Trading Est.`,
        variables: ['name', 'company', 'product_category', 'delivery_timeline', 'assigned_to_name'],
        conditions: {
          leadScore: { min: 60 },
        },
        isActive: true,
      },
    ];
  }

  private loadDefaultSequences(): void {
    this.sequences = [
      {
        id: 'high-value-sequence',
        name: 'High Value Lead Sequence',
        description: 'Intensive follow-up for high-value leads',
        triggers: {
          leadScore: { min: 70 },
          budgetRange: ['500k_1m', 'over_1m'],
        },
        actions: [
          {
            delay: 0.5, // 30 minutes
            action: {
              type: 'email',
              priority: 'critical',
              assignedTo: 'senior-sales-1',
              template: 'initial-response-high-value',
              metadata: { automated: true, sequence: 'high-value-sequence' },
            },
          },
          {
            delay: 2, // 2 hours
            action: {
              type: 'phone_call',
              priority: 'critical',
              assignedTo: 'senior-sales-1',
              template: 'urgent-phone-call',
              metadata: { automated: true, sequence: 'high-value-sequence' },
            },
          },
          {
            delay: 24, // 1 day
            action: {
              type: 'proposal',
              priority: 'high',
              assignedTo: 'senior-sales-1',
              metadata: { automated: false, sequence: 'high-value-sequence', requires_manual: true },
            },
          },
          {
            delay: 72, // 3 days
            action: {
              type: 'phone_call',
              priority: 'high',
              assignedTo: 'senior-sales-1',
              metadata: { automated: true, sequence: 'high-value-sequence', follow_up: 'proposal' },
            },
          },
        ],
        isActive: true,
      },
      {
        id: 'standard-sequence',
        name: 'Standard Lead Sequence',
        description: 'Regular follow-up for standard leads',
        triggers: {
          leadScore: { min: 30, max: 69 },
        },
        actions: [
          {
            delay: 1, // 1 hour
            action: {
              type: 'email',
              priority: 'medium',
              assignedTo: 'auto-assign',
              template: 'initial-response-standard',
              metadata: { automated: true, sequence: 'standard-sequence' },
            },
          },
          {
            delay: 4, // 4 hours
            action: {
              type: 'email',
              priority: 'medium',
              assignedTo: 'auto-assign',
              metadata: { automated: false, sequence: 'standard-sequence', requires_manual: true },
            },
          },
          {
            delay: 72, // 3 days
            action: {
              type: 'email',
              priority: 'low',
              assignedTo: 'auto-assign',
              template: 'follow-up-no-response',
              metadata: { automated: true, sequence: 'standard-sequence' },
            },
          },
          {
            delay: 168, // 7 days
            action: {
              type: 'phone_call',
              priority: 'low',
              assignedTo: 'auto-assign',
              metadata: { automated: false, sequence: 'standard-sequence' },
            },
          },
        ],
        isActive: true,
      },
      {
        id: 'urgent-sequence',
        name: 'Urgent Lead Sequence',
        description: 'Immediate response for urgent inquiries',
        triggers: {
          urgency: ['immediate'],
        },
        actions: [
          {
            delay: 0.25, // 15 minutes
            action: {
              type: 'phone_call',
              priority: 'critical',
              assignedTo: 'auto-assign',
              template: 'urgent-phone-call',
              metadata: { automated: true, sequence: 'urgent-sequence' },
            },
          },
          {
            delay: 0.5, // 30 minutes
            action: {
              type: 'whatsapp',
              priority: 'critical',
              assignedTo: 'auto-assign',
              metadata: { automated: true, sequence: 'urgent-sequence' },
            },
          },
          {
            delay: 1, // 1 hour
            action: {
              type: 'email',
              priority: 'critical',
              assignedTo: 'auto-assign',
              template: 'initial-response-high-value',
              metadata: { automated: true, sequence: 'urgent-sequence' },
            },
          },
        ],
        isActive: true,
      },
      {
        id: 'nurturing-sequence',
        name: 'Lead Nurturing Sequence',
        description: 'Long-term nurturing for planning-phase leads',
        triggers: {
          leadScore: { max: 40 },
          urgency: ['planning'],
        },
        actions: [
          {
            delay: 2, // 2 hours
            action: {
              type: 'email',
              priority: 'low',
              assignedTo: 'auto-assign',
              template: 'initial-response-standard',
              metadata: { automated: true, sequence: 'nurturing-sequence' },
            },
          },
          {
            delay: 168, // 7 days
            action: {
              type: 'email',
              priority: 'low',
              assignedTo: 'auto-assign',
              metadata: { automated: true, sequence: 'nurturing-sequence', content_type: 'educational' },
            },
          },
          {
            delay: 336, // 14 days
            action: {
              type: 'email',
              priority: 'low',
              assignedTo: 'auto-assign',
              metadata: { automated: true, sequence: 'nurturing-sequence', content_type: 'case_study' },
            },
          },
          {
            delay: 720, // 30 days
            action: {
              type: 'email',
              priority: 'low',
              assignedTo: 'auto-assign',
              metadata: { automated: true, sequence: 'nurturing-sequence', content_type: 'industry_update' },
            },
          },
        ],
        isActive: true,
      },
    ];
  }

  public scheduleFollowUp(
    lead: Partial<EnhancedLead>,
    scoreBreakdown: LeadScoreBreakdown,
    routingDecision: RoutingDecision,
    conversionPrediction?: ConversionPrediction
  ): FollowUpSchedule {
    const leadId = lead.id || `temp_${Date.now()}`;
    
    // Find matching sequence
    const matchingSequence = this.findMatchingSequence(lead, scoreBreakdown);
    
    // Create follow-up actions
    const actions: FollowUpAction[] = [];
    const baseTime = new Date();

    if (matchingSequence) {
      matchingSequence.actions.forEach((sequenceAction, index) => {
        const scheduledAt = new Date(baseTime.getTime() + (sequenceAction.delay * 60 * 60 * 1000));
        
        const action: FollowUpAction = {
          id: `${leadId}_${matchingSequence.id}_${index}`,
          leadId,
          type: sequenceAction.action.type,
          scheduledAt,
          status: 'pending',
          priority: sequenceAction.action.priority,
          assignedTo: sequenceAction.action.assignedTo === 'auto-assign' 
            ? (routingDecision.assignedTo || 'sales-rep-1')
            : sequenceAction.action.assignedTo,
          template: sequenceAction.action.template,
          metadata: {
            ...sequenceAction.action.metadata,
            leadScore: scoreBreakdown.total,
            conversionProbability: conversionPrediction?.probability,
            estimatedValue: conversionPrediction?.estimatedValue,
          },
          createdAt: new Date(),
        };

        actions.push(action);
      });
    } else {
      // Create default follow-up action
      const defaultAction: FollowUpAction = {
        id: `${leadId}_default_0`,
        leadId,
        type: 'email',
        scheduledAt: new Date(baseTime.getTime() + (2 * 60 * 60 * 1000)), // 2 hours
        status: 'pending',
        priority: routingDecision.priority,
        assignedTo: routingDecision.assignedTo || 'sales-rep-1',
        template: scoreBreakdown.total >= 50 ? 'initial-response-high-value' : 'initial-response-standard',
        metadata: {
          automated: true,
          default: true,
          leadScore: scoreBreakdown.total,
        },
        createdAt: new Date(),
      };

      actions.push(defaultAction);
    }

    const schedule: FollowUpSchedule = {
      leadId,
      sequenceId: matchingSequence?.id,
      actions,
      nextAction: actions.find(a => a.status === 'pending'),
      responseReceived: false,
      conversionStatus: 'active',
    };

    this.schedules.set(leadId, schedule);
    return schedule;
  }

  private findMatchingSequence(lead: Partial<EnhancedLead>, scoreBreakdown: LeadScoreBreakdown): FollowUpSequence | undefined {
    return this.sequences
      .filter(seq => seq.isActive)
      .find(seq => this.sequenceMatches(seq, lead, scoreBreakdown));
  }

  private sequenceMatches(sequence: FollowUpSequence, lead: Partial<EnhancedLead>, scoreBreakdown: LeadScoreBreakdown): boolean {
    const triggers = sequence.triggers;

    // Check lead score
    if (triggers.leadScore) {
      if (triggers.leadScore.min && scoreBreakdown.total < triggers.leadScore.min) return false;
      if (triggers.leadScore.max && scoreBreakdown.total > triggers.leadScore.max) return false;
    }

    // Check industry
    if (triggers.industry && lead.industry_sector && !triggers.industry.includes(lead.industry_sector)) return false;

    // Check budget range
    if (triggers.budgetRange && lead.budget_range && !triggers.budgetRange.includes(lead.budget_range)) return false;

    // Check urgency
    if (triggers.urgency && lead.urgency && !triggers.urgency.includes(lead.urgency)) return false;

    return true;
  }

  public processScheduledActions(): FollowUpAction[] {
    const now = new Date();
    const actionsToProcess: FollowUpAction[] = [];

    this.schedules.forEach(schedule => {
      const pendingActions = schedule.actions.filter(
        action => action.status === 'pending' && action.scheduledAt <= now
      );

      actionsToProcess.push(...pendingActions);
    });

    return actionsToProcess.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by scheduled time
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  public markActionCompleted(actionId: string, success: boolean = true): void {
    this.schedules.forEach(schedule => {
      const action = schedule.actions.find(a => a.id === actionId);
      if (action) {
        action.status = success ? 'completed' : 'failed';
        action.completedAt = new Date();
        
        // Update next action
        schedule.nextAction = schedule.actions.find(a => a.status === 'pending');
        
        // If this was a response-generating action and it succeeded, mark response received
        if (success && (action.type === 'email' || action.type === 'phone_call')) {
          schedule.lastContactAt = new Date();
        }
      }
    });
  }

  public markResponseReceived(leadId: string): void {
    const schedule = this.schedules.get(leadId);
    if (schedule) {
      schedule.responseReceived = true;
      schedule.lastContactAt = new Date();
      
      // Cancel pending automated actions (keep manual ones)
      schedule.actions.forEach(action => {
        if (action.status === 'pending' && action.metadata.automated) {
          action.status = 'skipped';
        }
      });
      
      // Update next action
      schedule.nextAction = schedule.actions.find(a => a.status === 'pending');
    }
  }

  public updateConversionStatus(leadId: string, status: FollowUpSchedule['conversionStatus']): void {
    const schedule = this.schedules.get(leadId);
    if (schedule) {
      schedule.conversionStatus = status;
      
      // If converted or lost, cancel remaining actions
      if (status === 'converted' || status === 'lost') {
        schedule.actions.forEach(action => {
          if (action.status === 'pending') {
            action.status = 'skipped';
          }
        });
        schedule.nextAction = undefined;
      }
    }
  }

  public getFollowUpSchedule(leadId: string): FollowUpSchedule | undefined {
    return this.schedules.get(leadId);
  }

  public getAllPendingActions(): FollowUpAction[] {
    const allActions: FollowUpAction[] = [];
    
    this.schedules.forEach(schedule => {
      const pendingActions = schedule.actions.filter(action => action.status === 'pending');
      allActions.push(...pendingActions);
    });

    return allActions.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  public getActionsByAssignee(assigneeId: string): FollowUpAction[] {
    const assigneeActions: FollowUpAction[] = [];
    
    this.schedules.forEach(schedule => {
      const actions = schedule.actions.filter(
        action => action.assignedTo === assigneeId && action.status === 'pending'
      );
      assigneeActions.push(...actions);
    });

    return assigneeActions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  public generateActionContent(action: FollowUpAction, lead: Partial<EnhancedLead>): string {
    if (!action.template) return '';

    const template = this.templates.find(t => t.id === action.template);
    if (!template) return '';

    let content = template.content;

    // Replace variables
    const variables = {
      name: lead.name || 'Valued Customer',
      company: lead.company || 'Your Company',
      product_category: lead.product_category || 'industrial supplies',
      industry: lead.industry_sector || 'industrial',
      budget_range: lead.budget_range || 'competitive pricing',
      urgency_reason: lead.urgency === 'immediate' ? 'urgent project requirements' : 'project planning',
      project_timeline: lead.project_timeline || 'as per your requirements',
      delivery_timeline: '2-3 weeks',
      years_experience: '15',
      days_ago: Math.floor((Date.now() - (lead.created_at?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)),
      assigned_to_name: 'Sales Team', // This should be populated from team member data
    };

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
    });

    return content;
  }

  public getFollowUpStatistics(): {
    totalSchedules: number;
    activeSchedules: number;
    pendingActions: number;
    completedActions: number;
    conversionRate: number;
    averageResponseTime: number;
  } {
    const totalSchedules = this.schedules.size;
    const activeSchedules = Array.from(this.schedules.values()).filter(
      s => s.conversionStatus === 'active' || s.conversionStatus === 'nurturing'
    ).length;

    let pendingActions = 0;
    let completedActions = 0;
    let convertedSchedules = 0;
    let totalResponseTime = 0;
    let responseCount = 0;

    this.schedules.forEach(schedule => {
      pendingActions += schedule.actions.filter(a => a.status === 'pending').length;
      completedActions += schedule.actions.filter(a => a.status === 'completed').length;
      
      if (schedule.conversionStatus === 'converted') {
        convertedSchedules++;
      }

      if (schedule.lastContactAt && schedule.responseReceived) {
        const firstAction = schedule.actions[0];
        if (firstAction) {
          totalResponseTime += schedule.lastContactAt.getTime() - firstAction.createdAt.getTime();
          responseCount++;
        }
      }
    });

    return {
      totalSchedules,
      activeSchedules,
      pendingActions,
      completedActions,
      conversionRate: totalSchedules > 0 ? convertedSchedules / totalSchedules : 0,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount / (1000 * 60 * 60) : 0, // hours
    };
  }
}

// Export singleton instance
let followUpSystemInstance: AutomatedFollowUpSystem | null = null;

export function getFollowUpSystem(): AutomatedFollowUpSystem {
  if (!followUpSystemInstance) {
    followUpSystemInstance = new AutomatedFollowUpSystem();
  }
  return followUpSystemInstance;
}

// Convenience functions
export function scheduleFollowUp(
  lead: Partial<EnhancedLead>,
  scoreBreakdown: LeadScoreBreakdown,
  routingDecision: RoutingDecision,
  conversionPrediction?: ConversionPrediction
): FollowUpSchedule {
  return getFollowUpSystem().scheduleFollowUp(lead, scoreBreakdown, routingDecision, conversionPrediction);
}

export function processScheduledActions(): FollowUpAction[] {
  return getFollowUpSystem().processScheduledActions();
}

export function markActionCompleted(actionId: string, success: boolean = true): void {
  getFollowUpSystem().markActionCompleted(actionId, success);
}

export function markResponseReceived(leadId: string): void {
  getFollowUpSystem().markResponseReceived(leadId);
}

export function getActionsByAssignee(assigneeId: string): FollowUpAction[] {
  return getFollowUpSystem().getActionsByAssignee(assigneeId);
}

export function getFollowUpStatistics() {
  return getFollowUpSystem().getFollowUpStatistics();
}