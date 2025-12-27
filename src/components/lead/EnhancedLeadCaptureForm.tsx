/**
 * Enhanced Lead Capture Form with Behavioral Analytics
 * Comprehensive lead profile capture with company profiling and behavioral tracking
 * Requirements: 3.1, 3.2
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Form, FormField, Label, Input, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { EnhancedLead, DecisionAuthority, BudgetRange, ProjectTimeline } from '@/lib/types/enterprise';
import { productCategories } from '@/lib/data/products';
import { captureClientSideIntelligence, auditLeadIntelligenceCapture } from '@/lib/lead-intelligence';

export interface EnhancedLeadCaptureFormProps {
  onSubmit?: (lead: Partial<EnhancedLead>) => Promise<void>;
  onWhatsAppClick?: (lead: Partial<EnhancedLead>) => void;
  sourceSection: string;
  prefilledCategory?: string;
  className?: string;
}

interface FormData {
  // Basic contact information
  name: string;
  email: string;
  phone: string;
  
  // Company profiling
  company: string;
  company_size: string;
  industry_sector: string;
  decision_authority: DecisionAuthority | '';
  
  // Project information
  product_category: string;
  urgency: 'immediate' | '1-2_weeks' | 'planning' | '';
  project_timeline: ProjectTimeline | '';
  budget_range: BudgetRange | '';
  quantity_estimate: string;
  message: string;
}

export default function EnhancedLeadCaptureForm({
  onSubmit,
  onWhatsAppClick,
  sourceSection,
  prefilledCategory = '',
  className = ''
}: EnhancedLeadCaptureFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    company_size: '',
    industry_sector: '',
    decision_authority: '',
    product_category: prefilledCategory,
    urgency: '',
    project_timeline: '',
    budget_range: '',
    quantity_estimate: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [behaviorData, setBehaviorData] = useState<any>({});

  // Capture behavioral analytics on component mount
  useEffect(() => {
    const intelligence = captureClientSideIntelligence(sourceSection);
    setBehaviorData({
      deviceType: intelligence.deviceType,
      userAgent: intelligence.userAgent,
      referrer: intelligence.referrer,
      sessionId: intelligence.sessionId,
      timestamp: intelligence.timestamp,
    });

    // Track form view event
    if (typeof window !== 'undefined') {
      const startTime = Date.now();
      const handleBeforeUnload = () => {
        const engagementTime = Math.floor((Date.now() - startTime) / 1000);
        // Store engagement time for later use
        sessionStorage.setItem('form_engagement_time', engagementTime.toString());
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [sourceSection]);

  // Real-time field validation
  const validateField = useCallback((fieldName: keyof FormData, value: string) => {
    let error = '';
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          error = 'Invalid phone number format';
        }
        break;
      case 'company':
        if (!value.trim()) error = 'Company name is required';
        break;
      case 'urgency':
        if (!value) error = 'Urgency level is required';
        break;
      case 'message':
        if (!value.trim()) error = 'Message is required';
        else if (value.trim().length < 10) error = 'Message must be at least 10 characters';
        break;
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  }, []);

  // Handle input changes with real-time validation
  const handleInputChange = useCallback((fieldName: keyof FormData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      validateField(fieldName, value);
      
      if (submitStatus !== 'idle') {
        setSubmitStatus('idle');
      }
    }, [validateField, submitStatus]);

  // Company size detection based on company name patterns
  const detectCompanySize = useCallback((companyName: string): string => {
    const name = companyName.toLowerCase();
    if (name.includes('corporation') || name.includes('corp') || name.includes('international') || 
        name.includes('group') || name.includes('holdings')) {
      return 'large';
    }
    if (name.includes('limited') || name.includes('ltd') || name.includes('llc') || 
        name.includes('company') || name.includes('co.')) {
      return 'medium';
    }
    return 'small';
  }, []);

  // Industry sector detection based on keywords
  const detectIndustrySector = useCallback((companyName: string, message: string): string => {
    const text = `${companyName} ${message}`.toLowerCase();
    
    if (text.includes('construction') || text.includes('building') || text.includes('contractor')) {
      return 'construction';
    }
    if (text.includes('oil') || text.includes('gas') || text.includes('petroleum') || text.includes('energy')) {
      return 'oil_gas';
    }
    if (text.includes('manufacturing') || text.includes('factory') || text.includes('production')) {
      return 'manufacturing';
    }
    if (text.includes('mining') || text.includes('extraction')) {
      return 'mining';
    }
    if (text.includes('transport') || text.includes('logistics') || text.includes('shipping')) {
      return 'transportation';
    }
    
    return 'other';
  }, []);

  // Auto-detect company information when company name changes
  useEffect(() => {
    if (formData.company && !formData.company_size) {
      const detectedSize = detectCompanySize(formData.company);
      setFormData(prev => ({ ...prev, company_size: detectedSize }));
    }
  }, [formData.company, formData.company_size, detectCompanySize]);

  // Auto-detect industry sector when company or message changes
  useEffect(() => {
    if ((formData.company || formData.message) && !formData.industry_sector) {
      const detectedSector = detectIndustrySector(formData.company, formData.message);
      setFormData(prev => ({ ...prev, industry_sector: detectedSector }));
    }
  }, [formData.company, formData.message, formData.industry_sector, detectIndustrySector]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const requiredFields: (keyof FormData)[] = ['name', 'email', 'phone', 'company', 'urgency', 'message'];
    let hasErrors = false;
    
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field] as string)) {
        hasErrors = true;
      }
    });
    
    if (hasErrors) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Get engagement time from session storage
      const engagementTime = parseInt(sessionStorage.getItem('form_engagement_time') || '0');
      
      // Create enhanced lead object
      const enhancedLead: Partial<EnhancedLead> = {
        // Basic information
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        product_category: formData.product_category || undefined,
        urgency: formData.urgency as any,
        quantity_estimate: formData.quantity_estimate || undefined,
        message: formData.message,
        source_section: sourceSection,
        
        // Enhanced intelligence
        company_size: formData.company_size || undefined,
        industry_sector: formData.industry_sector || undefined,
        decision_authority: formData.decision_authority || undefined,
        budget_range: formData.budget_range || undefined,
        project_timeline: formData.project_timeline || undefined,
        
        // Behavioral data
        device_type: behaviorData.deviceType,
        user_agent: behaviorData.userAgent,
        referrer: behaviorData.referrer,
        
        // Analytics
        total_engagement_time: engagementTime,
        page_views_count: 1, // At least this page
        documents_downloaded: 0,
        
        // Status
        status: 'new',
        priority: 'medium',
        lead_score: 0, // Will be calculated server-side
      };

      if (onSubmit) {
        await onSubmit(enhancedLead);
      }
      
      // Audit the lead capture
      auditLeadIntelligenceCapture({
        deviceType: behaviorData.deviceType || 'desktop',
        userAgent: behaviorData.userAgent || '',
        referrer: behaviorData.referrer,
        timestamp: behaviorData.timestamp || new Date(),
        sourceSection,
      });
      
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        company_size: '',
        industry_sector: '',
        decision_authority: '',
        product_category: '',
        urgency: '',
        project_timeline: '',
        budget_range: '',
        quantity_estimate: '',
        message: '',
      });
      setErrors({});
      
      // Clear engagement time
      sessionStorage.removeItem('form_engagement_time');
      
    } catch (error) {
      console.error('Enhanced lead submission error:', error);
      setSubmitStatus('error');
      setErrors({ general: 'Failed to submit inquiry. Please try again or contact us directly.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    if (onWhatsAppClick) {
      const enhancedLead: Partial<EnhancedLead> = {
        ...formData,
        source_section: `${sourceSection}_whatsapp`,
        device_type: behaviorData.deviceType,
        user_agent: behaviorData.userAgent,
        referrer: behaviorData.referrer,
      };
      onWhatsAppClick(enhancedLead);
    }
  };

  // Options for dropdowns
  const companySizeOptions = [
    { value: 'small', label: 'Small (1-50 employees)' },
    { value: 'medium', label: 'Medium (51-500 employees)' },
    { value: 'large', label: 'Large (500+ employees)' },
  ];

  const industrySectorOptions = [
    { value: 'construction', label: 'Construction & Building' },
    { value: 'oil_gas', label: 'Oil & Gas' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'mining', label: 'Mining & Extraction' },
    { value: 'transportation', label: 'Transportation & Logistics' },
    { value: 'utilities', label: 'Utilities & Infrastructure' },
    { value: 'government', label: 'Government & Public Sector' },
    { value: 'other', label: 'Other' },
  ];

  const decisionAuthorityOptions = [
    { value: 'decision_maker', label: 'Decision Maker' },
    { value: 'influencer', label: 'Influencer' },
    { value: 'end_user', label: 'End User' },
    { value: 'gatekeeper', label: 'Gatekeeper/Coordinator' },
  ];

  const projectTimelineOptions = [
    { value: 'immediate', label: 'Immediate (Within 1 week)' },
    { value: 'within_month', label: 'Within 1 month' },
    { value: 'within_quarter', label: 'Within 3 months' },
    { value: 'within_year', label: 'Within 1 year' },
    { value: 'planning_phase', label: 'Planning phase' },
  ];

  const budgetRangeOptions = [
    { value: 'under_10k', label: 'Under $10,000' },
    { value: '10k_50k', label: '$10,000 - $50,000' },
    { value: '50k_100k', label: '$50,000 - $100,000' },
    { value: '100k_500k', label: '$100,000 - $500,000' },
    { value: '500k_1m', label: '$500,000 - $1,000,000' },
    { value: 'over_1m', label: 'Over $1,000,000' },
  ];

  const urgencyOptions = [
    { value: 'immediate', label: 'Immediate (Within 24 hours)' },
    { value: '1-2_weeks', label: '1-2 Weeks' },
    { value: 'planning', label: 'Planning Phase (Future project)' },
  ];

  return (
    <div className={`card-industrial p-4 sm:p-6 md:p-8 animate-fade-in-up ${className}`}>
      <h3 className="heading-3 text-brand-navy-900 mb-6">
        Request Detailed Quote
      </h3>
      
      <Form onSubmit={handleSubmit}>
        {/* Contact Information Section */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-brand-navy-900 mb-4 border-b border-gray-200 pb-2">
            Contact Information
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <FormField error={errors.name}>
              <Label htmlFor="name" required>Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                placeholder="Enter your full name"
                required
              />
            </FormField>

            <FormField error={errors.email}>
              <Label htmlFor="email" required>Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                placeholder="your.email@company.com"
                required
              />
            </FormField>
          </div>

          <FormField error={errors.phone}>
            <Label htmlFor="phone" required>Phone / WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              error={!!errors.phone}
              placeholder="+966 50 123 4567"
              required
            />
          </FormField>
        </div>

        {/* Company Profiling Section */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-brand-navy-900 mb-4 border-b border-gray-200 pb-2">
            Company Information
          </h4>
          
          <FormField error={errors.company}>
            <Label htmlFor="company" required>Company Name</Label>
            <Input
              id="company"
              type="text"
              value={formData.company}
              onChange={handleInputChange('company')}
              error={!!errors.company}
              placeholder="Enter your company name"
              required
            />
          </FormField>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField error={errors.company_size}>
              <Label htmlFor="company_size">Company Size</Label>
              <select
                id="company_size"
                value={formData.company_size}
                onChange={handleInputChange('company_size')}
                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
              >
                <option value="">Select company size (auto-detected)</option>
                {companySizeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField error={errors.industry_sector}>
              <Label htmlFor="industry_sector">Industry Sector</Label>
              <select
                id="industry_sector"
                value={formData.industry_sector}
                onChange={handleInputChange('industry_sector')}
                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
              >
                <option value="">Select industry (auto-detected)</option>
                {industrySectorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField error={errors.decision_authority}>
            <Label htmlFor="decision_authority">Your Role in Decision Making</Label>
            <select
              id="decision_authority"
              value={formData.decision_authority}
              onChange={handleInputChange('decision_authority')}
              className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
            >
              <option value="">Select your role (optional)</option>
              {decisionAuthorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Project Information Section */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-brand-navy-900 mb-4 border-b border-gray-200 pb-2">
            Project Details
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <FormField error={errors.product_category}>
              <Label htmlFor="product_category">Product Category</Label>
              <select
                id="product_category"
                value={formData.product_category}
                onChange={handleInputChange('product_category')}
                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
              >
                <option value="">Select product category (optional)</option>
                {productCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField error={errors.urgency}>
              <Label htmlFor="urgency" required>Urgency Level</Label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={handleInputChange('urgency')}
                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
                required
              >
                <option value="">Select urgency level</option>
                {urgencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField error={errors.project_timeline}>
              <Label htmlFor="project_timeline">Project Timeline</Label>
              <select
                id="project_timeline"
                value={formData.project_timeline}
                onChange={handleInputChange('project_timeline')}
                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
              >
                <option value="">Select project timeline (optional)</option>
                {projectTimelineOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField error={errors.budget_range}>
              <Label htmlFor="budget_range">Budget Range</Label>
              <select
                id="budget_range"
                value={formData.budget_range}
                onChange={handleInputChange('budget_range')}
                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors"
              >
                <option value="">Select budget range (optional)</option>
                {budgetRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField error={errors.quantity_estimate}>
            <Label htmlFor="quantity_estimate">Quantity Estimate</Label>
            <Input
              id="quantity_estimate"
              type="text"
              value={formData.quantity_estimate}
              onChange={handleInputChange('quantity_estimate')}
              error={!!errors.quantity_estimate}
              placeholder="e.g., 100 units, 5 tons, 10 sets (optional)"
            />
          </FormField>

          <FormField error={errors.message}>
            <Label htmlFor="message" required>Detailed Requirements</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={handleInputChange('message')}
              error={!!errors.message}
              placeholder="Describe your specific requirements, project details, technical specifications, or any questions..."
              rows={4}
              required
            />
          </FormField>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md animate-fade-in mb-6">
            <p className="text-green-800 text-sm">
              Thank you! Your detailed inquiry has been submitted successfully. Our team will analyze your requirements and get back to you with a comprehensive quote.
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-fade-in mb-6">
            <p className="text-red-800 text-sm">
              {errors.general || 'Sorry, there was an error submitting your inquiry. Please try again or contact us directly.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Detailed Inquiry'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsAppClick}
            className="w-full sm:flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="hidden sm:inline">Discuss on WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </Button>
        </div>
      </Form>
    </div>
  );
}