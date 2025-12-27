/**
 * SmartEnquiryForm component for Al Mazahir Trading Est. enterprise enhancement
 * Enhanced contact form with smart fields including product category, urgency, and quantity estimate
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Form, FormField, Label, Input, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { EnhancedInquiry } from '@/lib/types';
import { validateEnhancedInquiry, enhancedInquiryValidationRules } from '@/lib/validation';
import { productCategories } from '@/lib/data/products';
import { captureClientSideIntelligence, auditLeadIntelligenceCapture } from '@/lib/lead-intelligence';
import { withNetworkErrorBoundary } from '@/components/ui/withErrorBoundary';
import { EnquiryFormFallback } from '@/components/ui/FallbackComponents';

export interface SmartEnquiryFormProps {
  onSubmit?: (inquiry: EnhancedInquiry) => Promise<void>;
  onWhatsAppClick?: (inquiry: EnhancedInquiry) => void;
  sourceSection: string;
  prefilledCategory?: string;
  className?: string;
}

function SmartEnquiryFormCore({ 
  onSubmit, 
  onWhatsAppClick, 
  sourceSection,
  prefilledCategory = '',
  className = '' 
}: SmartEnquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    productCategory: prefilledCategory,
    urgency: '' as 'immediate' | '1-2_weeks' | 'planning' | '',
    quantityEstimate: '',
    message: '',
  });

  // Update form data when prefilledCategory changes
  useEffect(() => {
    if (prefilledCategory && prefilledCategory !== formData.productCategory) {
      setFormData(prev => ({
        ...prev,
        productCategory: prefilledCategory
      }));
    }
  }, [prefilledCategory, formData.productCategory]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Real-time field validation
  const validateFieldRealTime = useCallback((fieldName: keyof typeof formData, value: string) => {
    const rule = enhancedInquiryValidationRules[fieldName as keyof typeof enhancedInquiryValidationRules];
    if (!rule) return;

    let error = '';
    const trimmedValue = value.trim();

    // Required field validation
    if (rule.required && !trimmedValue) {
      error = `${fieldName} is required`;
    }
    // Special validation for urgency
    else if (fieldName === 'urgency' && value && !['immediate', '1-2_weeks', 'planning'].includes(value)) {
      error = 'Invalid urgency level';
    }
    // Length validations
    else if (rule.minLength && trimmedValue.length < rule.minLength) {
      error = `${fieldName} must be at least ${rule.minLength} characters`;
    }
    else if (rule.maxLength && trimmedValue.length > rule.maxLength) {
      error = `${fieldName} must not exceed ${rule.maxLength} characters`;
    }
    // Email validation
    else if (fieldName === 'email' && trimmedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
      error = 'Invalid email format';
    }
    // Phone validation
    else if (fieldName === 'phone' && trimmedValue && !/^[\+]?[1-9][\d]{0,15}$/.test(trimmedValue.replace(/[\s\-\(\)]/g, ''))) {
      error = 'Invalid phone number format';
    }
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Handle input changes with real-time validation
  const handleInputChange = useCallback((fieldName: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      validateFieldRealTime(fieldName, value);
      
      // Clear submit status when user starts typing
      if (submitStatus !== 'idle') {
        setSubmitStatus('idle');
      }
    }, [validateFieldRealTime, submitStatus]);

  // Detect device type
  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = navigator.userAgent;
    if (/iPad/.test(userAgent)) return 'tablet';
    if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Capture lead intelligence
    const intelligence = captureClientSideIntelligence(sourceSection);
    
    // Create enhanced inquiry object with intelligence data
    const inquiry: Partial<EnhancedInquiry> = {
      ...formData,
      sourceSection,
      deviceType: intelligence.deviceType,
      userAgent: intelligence.userAgent,
      referrer: intelligence.referrer,
      timestamp: intelligence.timestamp || new Date(),
      source: 'form'
    };

    // Validate entire form
    const validation = validateEnhancedInquiry(inquiry);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      if (onSubmit) {
        await onSubmit(inquiry as EnhancedInquiry);
      }
      
      // Audit the lead intelligence capture
      auditLeadIntelligenceCapture({
        deviceType: intelligence.deviceType || 'desktop',
        userAgent: intelligence.userAgent || '',
        referrer: intelligence.referrer,
        timestamp: intelligence.timestamp || new Date(),
        sourceSection,
      });
      
      setSubmitStatus('success');
      
      // Reset form on successful submission
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
        productCategory: '',
        urgency: '' as any,
        quantityEstimate: '',
        message: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      setErrors({ general: 'Failed to send message. Please try again or contact us directly.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle WhatsApp button click
  const handleWhatsAppClick = () => {
    try {
      // Capture lead intelligence for WhatsApp interaction
      const intelligence = captureClientSideIntelligence(sourceSection);
      
      const inquiry: EnhancedInquiry = {
        ...formData,
        sourceSection,
        deviceType: intelligence.deviceType || 'desktop',
        userAgent: intelligence.userAgent,
        referrer: intelligence.referrer,
        timestamp: intelligence.timestamp || new Date(),
        source: 'whatsapp'
      };

      // Audit the WhatsApp interaction
      auditLeadIntelligenceCapture({
        deviceType: intelligence.deviceType || 'desktop',
        userAgent: intelligence.userAgent || '',
        referrer: intelligence.referrer,
        timestamp: intelligence.timestamp || new Date(),
        sourceSection: `${sourceSection}_whatsapp`,
      });

      if (onWhatsAppClick) {
        onWhatsAppClick(inquiry);
      }
    } catch (error) {
      console.error('Error handling WhatsApp click:', error);
    }
  };

  // Urgency options
  const urgencyOptions = [
    { value: 'immediate', label: 'Immediate (Within 24 hours)' },
    { value: '1-2_weeks', label: '1-2 Weeks' },
    { value: 'planning', label: 'Planning Phase (Future project)' }
  ];

  return (
    <div className={`card-industrial p-4 sm:p-6 md:p-8 animate-fade-in-up ${className}`}>
      <h3 className="heading-3 sm:heading-3 text-brand-navy-900 mb-4 sm:mb-6">
        Request a Quote
      </h3>
      
      <Form onSubmit={handleSubmit}>
        <FormField error={errors.name}>
          <Label htmlFor="name" required>
            Full Name
          </Label>
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

        <FormField error={errors.company}>
          <Label htmlFor="company">
            Company Name
          </Label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={handleInputChange('company')}
            error={!!errors.company}
            placeholder="Enter your company name (optional)"
          />
        </FormField>

        <FormField error={errors.phone}>
          <Label htmlFor="phone" required>
            Phone / WhatsApp
          </Label>
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

        <FormField error={errors.email}>
          <Label htmlFor="email" required>
            Email Address
          </Label>
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

        {/* Smart Field: Product Category Selector - Enhanced accessibility */}
        <FormField error={errors.productCategory}>
          <Label htmlFor="productCategory">
            Product Category
          </Label>
          <select
            id="productCategory"
            value={formData.productCategory}
            onChange={handleInputChange('productCategory')}
            className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors touch-target ${
              errors.productCategory ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-describedby={errors.productCategory ? 'productCategory-error' : 'productCategory-help'}
            aria-invalid={!!errors.productCategory}
          >
            <option value="">Select a product category (optional)</option>
            {productCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div id="productCategory-help" className="sr-only">
            Choose the product category that best matches your inquiry to help us route your request appropriately
          </div>
        </FormField>

        {/* Smart Field: Urgency Level Selection - Enhanced accessibility */}
        <FormField error={errors.urgency}>
          <Label htmlFor="urgency" required>
            Urgency Level
          </Label>
          <select
            id="urgency"
            value={formData.urgency}
            onChange={handleInputChange('urgency')}
            className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 transition-colors touch-target ${
              errors.urgency ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            aria-describedby={errors.urgency ? 'urgency-error' : 'urgency-help'}
            aria-invalid={!!errors.urgency}
          >
            <option value="">Select urgency level</option>
            {urgencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div id="urgency-help" className="sr-only">
            Select how quickly you need this product or service to help us prioritize your request
          </div>
        </FormField>

        {/* Smart Field: Quantity Estimate */}
        <FormField error={errors.quantityEstimate}>
          <Label htmlFor="quantityEstimate">
            Quantity Estimate
          </Label>
          <Input
            id="quantityEstimate"
            type="text"
            value={formData.quantityEstimate}
            onChange={handleInputChange('quantityEstimate')}
            error={!!errors.quantityEstimate}
            placeholder="e.g., 100 units, 5 tons, 10 sets (optional)"
          />
        </FormField>

        <FormField error={errors.message}>
          <Label htmlFor="message" required>
            Message / Requirements
          </Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={handleInputChange('message')}
            error={!!errors.message}
            placeholder="Describe your specific requirements, project details, or any questions..."
            rows={4}
            required
          />
        </FormField>

        {/* Submit Status Messages - Enhanced accessibility */}
        {submitStatus === 'success' && (
          <div 
            className="p-4 bg-green-50 border border-green-200 rounded-md animate-fade-in"
            role="status"
            aria-live="polite"
            aria-label="Success message"
          >
            <p className="text-green-800 text-sm">
              Thank you! Your inquiry has been sent successfully. We'll get back to you soon.
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-md animate-fade-in"
            role="alert"
            aria-live="assertive"
            aria-label="Error message"
          >
            <p className="text-red-800 text-sm">
              {errors.general || 'Sorry, there was an error sending your message. Please try again or contact us directly.'}
            </p>
            <div className="mt-2 text-xs text-red-600">
              <p>Alternative contact methods:</p>
              <p>Phone: +966 50 123 4567</p>
              <p>Email: info@almazahir.com</p>
            </div>
          </div>
        )}

        {/* Network status indicator - Enhanced accessibility */}
        {typeof navigator !== 'undefined' && !navigator.onLine && (
          <div 
            className="p-4 bg-yellow-50 border border-yellow-200 rounded-md animate-fade-in"
            role="status"
            aria-live="polite"
            aria-label="Network status"
          >
            <p className="text-yellow-800 text-sm">
              You appear to be offline. Please check your internet connection.
            </p>
          </div>
        )}

        {/* Action Buttons - Mobile optimized layout */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 shadow-lg hover:shadow-xl transition-shadow duration-300 touch-target"
          >
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsAppClick}
            className="w-full sm:flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300 touch-target"
          >
            <span className="hidden sm:inline">Talk on WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </Button>
        </div>
      </Form>
    </div>
  );
}

// Wrap with error boundary and export
const SmartEnquiryForm = withNetworkErrorBoundary(
  SmartEnquiryFormCore,
  'SmartEnquiryForm'
)

export default SmartEnquiryForm