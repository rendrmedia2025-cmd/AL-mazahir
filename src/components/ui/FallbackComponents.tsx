'use client'

import React from 'react'
import { Button } from './Button'

/**
 * Fallback component for availability indicators
 */
export function AvailabilityFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
      <span className="text-sm text-gray-500">Contact for status</span>
    </div>
  )
}

/**
 * Fallback component for dynamic CTA buttons
 */
export function CTAFallback({ 
  className = '',
  onClick,
  size = 'md'
}: { 
  className?: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className={className}>
      <Button
        variant="outline"
        size={size}
        onClick={onClick}
        title="Contact us for more information"
      >
        Enquire Now
      </Button>
    </div>
  )
}

/**
 * Fallback component for smart enquiry forms
 */
export function EnquiryFormFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`card-industrial p-8 ${className}`}>
      <h3 className="heading-3 text-brand-navy-900 mb-6">
        Contact Us
      </h3>
      <div className="space-y-4">
        <p className="text-gray-600">
          Our contact form is temporarily unavailable. Please reach out to us directly:
        </p>
        <div className="space-y-2 text-sm">
          <p><strong>Phone:</strong> +966 50 123 4567</p>
          <p><strong>Email:</strong> info@almazahir.com</p>
          <p><strong>WhatsApp:</strong> +966 50 123 4567</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button
            variant="primary"
            onClick={() => window.location.href = 'tel:+966501234567'}
            className="flex-1"
          >
            Call Now
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://wa.me/966501234567', '_blank')}
            className="flex-1 bg-green-600 text-white border-green-600 hover:bg-green-700"
          >
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Fallback component for admin panels
 */
export function AdminPanelFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`p-8 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="text-center">
        <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Admin Panel Unavailable
        </h3>
        <p className="text-red-700 mb-4">
          The admin panel is temporarily unavailable. Please try refreshing the page.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  )
}

/**
 * Fallback component for trust indicators
 */
export function TrustIndicatorsFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`py-16 bg-gray-50 ${className}`}>
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
    </div>
  )
}

/**
 * Fallback component for testimonial sliders
 */
export function TestimonialFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`py-16 bg-white ${className}`}>
      <div className="container mx-auto text-center">
        <h2 className="heading-2 text-brand-navy-900 mb-8">
          Client Testimonials
        </h2>
        <div className="max-w-3xl mx-auto">
          <blockquote className="text-lg text-gray-600 italic mb-6">
            "Al Mazahir Trading has been our trusted partner for industrial supplies. 
            Their commitment to quality and timely delivery makes them our preferred choice."
          </blockquote>
          <cite className="text-brand-navy-900 font-semibold">
            — Satisfied Customer
          </cite>
        </div>
      </div>
    </div>
  )
}

/**
 * Generic loading fallback with skeleton
 */
export function LoadingFallback({ 
  className = '',
  lines = 3,
  showTitle = true
}: { 
  className?: string
  lines?: number
  showTitle?: boolean
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showTitle && (
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      )}
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`h-4 bg-gray-200 rounded mb-2 ${
            index === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  )
}

/**
 * Network error fallback
 */
export function NetworkErrorFallback({ 
  className = '',
  onRetry
}: { 
  className?: string
  onRetry?: () => void
}) {
  return (
    <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center ${className}`}>
      <svg className="w-8 h-8 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        Connection Issue
      </h3>
      <p className="text-yellow-700 mb-4">
        Unable to load content. Please check your internet connection.
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
        >
          Try Again
        </Button>
      )}
    </div>
  )
}

/**
 * Maintenance mode fallback
 */
export function MaintenanceFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-blue-50 border border-blue-200 rounded-lg text-center ${className}`}>
      <svg className="w-8 h-8 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        Under Maintenance
      </h3>
      <p className="text-blue-700">
        This feature is temporarily under maintenance. Please try again later.
      </p>
    </div>
  )
}

export default {
  AvailabilityFallback,
  CTAFallback,
  EnquiryFormFallback,
  AdminPanelFallback,
  TrustIndicatorsFallback,
  TestimonialFallback,
  LoadingFallback,
  NetworkErrorFallback,
  MaintenanceFallback
}