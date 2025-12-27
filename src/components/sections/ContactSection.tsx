/**
 * ContactSection component for Al Mazahir Trading Est. corporate website
 * Provides contact form with real-time validation and submission handling
 * Enhanced with smart enquiry form for enterprise features
 */

'use client';

import React from 'react';
import { ContactInquiry, EnhancedInquiry } from '@/lib/types';
import { sendInquiryWithAutoReply } from '@/lib/email';
import { openWhatsAppInquiry, openWhatsAppEnhancedInquiry } from '@/lib/whatsapp';
import { trackFormSubmission, trackWhatsAppClick } from '@/lib/analytics';
import SmartEnquiryForm from './SmartEnquiryForm';
import EnhancedLeadCaptureForm from '../lead/EnhancedLeadCaptureForm';

export interface ContactSectionProps {
  onSubmit?: (inquiry: ContactInquiry | EnhancedInquiry) => Promise<void>;
  onWhatsAppClick?: (inquiry: ContactInquiry | EnhancedInquiry) => void;
  prefilledProductRequirement?: string;
  useSmartForm?: boolean;
  className?: string;
}

export default function ContactSection({ 
  onSubmit, 
  onWhatsAppClick, 
  prefilledProductRequirement = '',
  useSmartForm = true,
  className = '' 
}: ContactSectionProps) {

  // Handle enhanced inquiry submission
  const handleEnhancedSubmit = async (inquiry: EnhancedInquiry | any) => {
    try {
      // Submit to enhanced leads API
      const response = await fetch('/api/leads/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inquiry),
      });

      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }

      const result = await response.json();
      
      // Track form submission
      try {
        trackFormSubmission('enhanced_lead_capture', result.leadId);
      } catch (trackingError) {
        console.error('Error tracking form submission:', trackingError);
      }
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        await onSubmit(inquiry);
      }
    } catch (error) {
      console.error('Enhanced inquiry submission error:', error);
      throw error;
    }
  };

  // Handle WhatsApp click with enhanced inquiry
  const handleEnhancedWhatsAppClick = (inquiry: EnhancedInquiry) => {
    try {
      // Track WhatsApp click with category information
      try {
        trackWhatsAppClick(inquiry.productCategory || 'general');
      } catch (trackingError) {
        console.error('Error tracking WhatsApp click:', trackingError);
      }

      // Use enhanced WhatsApp integration
      openWhatsAppEnhancedInquiry(inquiry);

      if (onWhatsAppClick) {
        onWhatsAppClick(inquiry);
      }
    } catch (error) {
      console.error('Error handling enhanced WhatsApp click:', error);
      // Fallback to basic WhatsApp link
      window.open('https://wa.me/966501234567', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="contact" className={`section-padding bg-brand-navy-50 ${className}`}>
      <div className="container-industrial max-w-6xl">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="heading-2 text-brand-navy-900 mb-6">
            Get in Touch
          </h2>
          <p className="text-body-large text-brand-navy-600 max-w-2xl mx-auto">
            Ready to discuss your industrial and safety equipment needs? 
            Contact us today for competitive quotes and expert consultation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Enhanced Lead Capture Form */}
          {useSmartForm ? (
            <EnhancedLeadCaptureForm
              onSubmit={handleEnhancedSubmit}
              onWhatsAppClick={handleEnhancedWhatsAppClick}
              sourceSection="contact"
              prefilledCategory={prefilledProductRequirement}
              className="animate-fade-in-up animate-stagger-1"
            />
          ) : (
            <SmartEnquiryForm
              onSubmit={handleEnhancedSubmit}
              onWhatsAppClick={handleEnhancedWhatsAppClick}
              sourceSection="contact"
              prefilledCategory={prefilledProductRequirement}
              className="animate-fade-in-up animate-stagger-1"
            />
          )}

          {/* Contact Information */}
          <div className="space-y-8 animate-fade-in-up animate-stagger-2">
            <div className="card-industrial p-8">
              <h3 className="heading-3 text-brand-navy-900 mb-6">
                Contact Information
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-8 h-8 bg-gradient-red rounded-full flex items-center justify-center mt-1 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-sm">📍</span>
                  </div>
                  <div>
                    <h4 className="heading-6 text-brand-navy-900">Address</h4>
                    <p className="text-body text-brand-navy-600">
                      Al Mazahir Trading Est.<br />
                      Saudi Arabia
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-8 h-8 bg-gradient-red rounded-full flex items-center justify-center mt-1 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-sm">📞</span>
                  </div>
                  <div>
                    <h4 className="heading-6 text-brand-navy-900">Phone</h4>
                    <p className="text-body text-brand-navy-600">+966 50 123 4567</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-8 h-8 bg-gradient-red rounded-full flex items-center justify-center mt-1 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-sm">✉️</span>
                  </div>
                  <div>
                    <h4 className="heading-6 text-brand-navy-900">Email</h4>
                    <p className="text-body text-brand-navy-600">info@almazahir.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mt-1 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-sm">💬</span>
                  </div>
                  <div>
                    <h4 className="heading-6 text-brand-navy-900">WhatsApp</h4>
                    <p className="text-body text-brand-navy-600">+966 50 123 4567</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-red text-white rounded-lg p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                Why Choose Al Mazahir?
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="text-white">✓</span>
                  <span>15+ years of industry experience</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-white">✓</span>
                  <span>Competitive pricing and quality assurance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-white">✓</span>
                  <span>Reliable sourcing and on-time delivery</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-white">✓</span>
                  <span>Expert consultation and support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-white">✓</span>
                  <span>Wide range of industrial products</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}