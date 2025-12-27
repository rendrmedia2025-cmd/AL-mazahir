/**
 * No-JavaScript fallback components
 * Provides functional alternatives when JavaScript is disabled
 */

import React from 'react'

/**
 * No-JS fallback for the entire contact form
 */
export function NoJSContactForm({ 
  className = '',
  action = '/api/public/leads',
  method = 'POST'
}: {
  className?: string
  action?: string
  method?: 'GET' | 'POST'
}) {
  return (
    <div className={`no-js-contact-form ${className}`}>
      <noscript>
        <div className="card-industrial p-8">
          <h3 className="heading-3 text-brand-navy-900 mb-6">
            Contact Us
          </h3>
          
          <form action={action} method={method} className="space-y-6">
            <div className="form-field">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-field">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="company"
                name="company"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                placeholder="Enter your company name (optional)"
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone / WhatsApp *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                placeholder="+966 50 123 4567"
              />
            </div>

            <div className="form-field">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                placeholder="your.email@company.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-2">
                Product Category
              </label>
              <select
                id="productCategory"
                name="productCategory"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
              >
                <option value="">Select a product category (optional)</option>
                <option value="safety-equipment">Safety Equipment</option>
                <option value="fire-safety">Fire & Safety Systems</option>
                <option value="construction-materials">Construction & Building Materials</option>
                <option value="tools-machinery">Tools & Machinery</option>
                <option value="industrial-supplies">Industrial Supplies</option>
                <option value="rental-logistics">Rental & Logistics Equipment</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <select
                id="urgency"
                name="urgency"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
              >
                <option value="">Select urgency level</option>
                <option value="immediate">Immediate (Within 24 hours)</option>
                <option value="1-2_weeks">1-2 Weeks</option>
                <option value="planning">Planning Phase (Future project)</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="quantityEstimate" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Estimate
              </label>
              <input
                type="text"
                id="quantityEstimate"
                name="quantityEstimate"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                placeholder="e.g., 100 units, 5 tons, 10 sets (optional)"
              />
            </div>

            <div className="form-field">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message / Requirements *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                placeholder="Describe your specific requirements, project details, or any questions..."
              ></textarea>
            </div>

            {/* Hidden fields for tracking */}
            <input type="hidden" name="source" value="no_js_form" />
            <input type="hidden" name="sourceSection" value="contact" />

            <div className="form-actions">
              <button
                type="submit"
                className="w-full bg-brand-red-600 text-white py-3 px-6 rounded-md hover:bg-brand-red-700 transition-colors font-medium"
              >
                Send Inquiry
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Alternative Contact Methods:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Phone:</strong> 
                <a href="tel:+966501234567" className="text-brand-red-600 hover:text-brand-red-700 ml-2">
                  +966 50 123 4567
                </a>
              </div>
              <div>
                <strong>Email:</strong> 
                <a href="mailto:info@almazahir.com" className="text-brand-red-600 hover:text-brand-red-700 ml-2">
                  info@almazahir.com
                </a>
              </div>
              <div>
                <strong>WhatsApp:</strong> 
                <a 
                  href="https://wa.me/966501234567?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20your%20industrial%20products%20and%20services." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-red-600 hover:text-brand-red-700 ml-2"
                >
                  +966 50 123 4567
                </a>
              </div>
            </div>
          </div>
        </div>
      </noscript>
    </div>
  )
}

/**
 * No-JS fallback for availability indicators
 */
export function NoJSAvailabilityIndicator({ 
  categoryId,
  className = ''
}: {
  categoryId: string
  className?: string
}) {
  return (
    <div className={`no-js-availability ${className}`}>
      <noscript>
        <div className="inline-flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-sm text-gray-500">Contact for current availability</span>
        </div>
      </noscript>
    </div>
  )
}

/**
 * No-JS fallback for dynamic CTA buttons
 */
export function NoJSDynamicCTA({ 
  categoryId,
  className = '',
  size = 'md'
}: {
  categoryId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg'
  }

  return (
    <div className={`no-js-cta ${className}`}>
      <noscript>
        <a
          href="#contact"
          className={`inline-block bg-brand-red-600 text-white rounded-md hover:bg-brand-red-700 transition-colors font-medium text-center ${sizeClasses[size]}`}
        >
          Enquire Now
        </a>
      </noscript>
    </div>
  )
}

/**
 * No-JS fallback for trust indicators
 */
export function NoJSTrustIndicators({ className = '' }: { className?: string }) {
  return (
    <div className={`no-js-trust-indicators ${className}`}>
      <noscript>
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto text-center">
            <h2 className="heading-2 text-brand-navy-900 mb-8">
              Trusted Industrial Partner
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-red-600 mb-2">15+</div>
                <p className="text-gray-600">Years of Experience</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-red-600 mb-2">500+</div>
                <p className="text-gray-600">Projects Completed</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-red-600 mb-2">6</div>
                <p className="text-gray-600">Product Categories</p>
              </div>
            </div>
          </div>
        </section>
      </noscript>
    </div>
  )
}

/**
 * No-JS fallback for testimonials
 */
export function NoJSTestimonials({ className = '' }: { className?: string }) {
  return (
    <div className={`no-js-testimonials ${className}`}>
      <noscript>
        <section className="py-16 bg-white">
          <div className="container mx-auto text-center">
            <h2 className="heading-2 text-brand-navy-900 mb-8">
              Client Testimonials
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <blockquote className="text-lg text-gray-600 italic">
                "Al Mazahir Trading has been our trusted partner for industrial supplies. 
                Their commitment to quality and timely delivery makes them our preferred choice 
                for all our construction and safety equipment needs."
              </blockquote>
              <cite className="text-brand-navy-900 font-semibold">
                — Construction Project Manager, Major Saudi Contractor
              </cite>
            </div>
          </div>
        </section>
      </noscript>
    </div>
  )
}

/**
 * No-JS fallback for admin panels
 */
export function NoJSAdminFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`no-js-admin ${className}`}>
      <noscript>
        <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            JavaScript Required
          </h3>
          <p className="text-yellow-700 mb-4">
            The admin panel requires JavaScript to function properly. 
            Please enable JavaScript in your browser and refresh the page.
          </p>
          <div className="space-y-2 text-sm text-yellow-600">
            <p>If you continue to have issues:</p>
            <p>1. Clear your browser cache</p>
            <p>2. Disable browser extensions</p>
            <p>3. Try a different browser</p>
            <p>4. Contact technical support</p>
          </div>
        </div>
      </noscript>
    </div>
  )
}

/**
 * Offline indicator component
 */
export function OfflineIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`offline-indicator ${className}`} style={{ display: 'none' }}>
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">You are currently offline</span>
        </div>
        <p className="text-sm mt-1">
          Some features may not work properly. Please check your internet connection.
        </p>
      </div>
    </div>
  )
}

export default {
  NoJSContactForm,
  NoJSAvailabilityIndicator,
  NoJSDynamicCTA,
  NoJSTrustIndicators,
  NoJSTestimonials,
  NoJSAdminFallback,
  OfflineIndicator
}