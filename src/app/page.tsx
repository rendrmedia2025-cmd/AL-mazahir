'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { IndustriesSection } from '@/components/sections/IndustriesSection';
import { productCategories } from '@/lib/data/products';
import { ProductCategory, ContactInquiry, EnhancedInquiry } from '@/lib/types';
import type { CTAAction } from '@/components/ui/DynamicCTA';
import { preloadCriticalResources, addResourceHints, initializePerformanceMonitoring } from '@/lib/performance';
import { pageview, trackCTAClick, trackProductInquiry, trackWhatsAppClick, initializeErrorTracking } from '@/lib/analytics';
import { 
  LazyProductCatalog, 
  LazyContactSection, 
  LazyOnVisible,
  initializeLazyLoading 
} from '@/lib/lazy-loading';
import RealTimeStatusEngine from '@/components/enterprise/RealTimeStatusEngine';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We&apos;re sorry, but there was an error loading this section.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-red-600 text-white px-6 py-2 rounded-md hover:bg-brand-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Home() {
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Progressive enhancement for JavaScript features
  useEffect(() => {
    // JavaScript is available, enable enhanced features
  }, []);

  // Performance optimizations and analytics on mount
  useEffect(() => {
    try {
      // Initialize performance monitoring
      initializePerformanceMonitoring();
      
      // Initialize error tracking
      initializeErrorTracking();
      
      // Initialize lazy loading optimizations
      initializeLazyLoading();
      
      // Preload critical resources
      preloadCriticalResources();
      addResourceHints();
      
      // Track page view
      if (typeof window !== 'undefined') {
        pageview(window.location.pathname);
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      // Continue without analytics if there's an error
    }
  }, []);

  // Network error detection
  useEffect(() => {
    const handleOnline = () => setNetworkError(false);
    const handleOffline = () => setNetworkError(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Smooth scroll to section utility with error handling
  const scrollToSection = useCallback((sectionId: string, offset: number = 80) => {
    try {
      const section = document.getElementById(sectionId);
      if (section) {
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback: try to find section by alternative methods
        const fallbackSection = document.querySelector(`[data-section="${sectionId}"]`);
        if (fallbackSection) {
          fallbackSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (error) {
      console.error('Error scrolling to section:', error);
      // Fallback: use basic scroll without smooth behavior
      try {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView();
        }
      } catch (fallbackError) {
        console.error('Fallback scroll also failed:', fallbackError);
      }
    }
  }, []);

  // Handle CTA actions from DynamicCTA component
  const handleCTAAction = useCallback(async (action: CTAAction, category: ProductCategory) => {
    try {
      // Track the CTA action
      trackProductInquiry(`${category.name}_${action.type}`);
      
      // Set the selected category for pre-filling the form
      setSelectedProductCategory(category.name);
      
      // Handle different CTA action types
      switch (action.type) {
        case 'quote':
          // For "Request Quote" - scroll to contact form
          scrollToSection('contact');
          break;
        case 'availability':
          // For "Check Availability" - scroll to contact form with specific message
          scrollToSection('contact');
          break;
        case 'notify':
          // For "Notify Me" - scroll to contact form
          scrollToSection('contact');
          break;
        case 'alternative':
          // For "Alternative Available" - scroll to contact form
          scrollToSection('contact');
          break;
        case 'lead_time':
          // For "Request Lead Time" - scroll to contact form
          scrollToSection('contact');
          break;
        default:
          // Fallback to general enquiry
          scrollToSection('contact');
      }
      
      // Optional: Show a brief loading state for better UX
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    } catch (error) {
      console.error('Error handling CTA action:', error);
      // Fallback: still try to scroll to contact
      scrollToSection('contact');
      setSelectedProductCategory(category.name);
    }
  }, [scrollToSection]);

  // Handle product category enquiry with error handling (legacy support)
  const handleEnquireNow = useCallback((category: ProductCategory) => {
    try {
      // Track the enquiry action
      trackProductInquiry(category.name);
      
      // Set the selected category for pre-filling the form
      setSelectedProductCategory(category.name);
      
      // Scroll to contact section with smooth animation
      scrollToSection('contact');
      
      // Optional: Show a brief loading state for better UX
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    } catch (error) {
      console.error('Error handling enquiry:', error);
      // Fallback: still try to scroll to contact
      scrollToSection('contact');
      setSelectedProductCategory(category.name);
    }
  }, [scrollToSection]);

  // Handle hero section CTA clicks with error handling
  const handleHeroRequestQuote = useCallback(() => {
    try {
      trackCTAClick('primary', 'hero');
    } catch (error) {
      console.error('Error tracking CTA click:', error);
    }
    scrollToSection('contact');
  }, [scrollToSection]);

  const handleHeroWhatsAppClick = useCallback(() => {
    try {
      trackWhatsAppClick('hero');
    } catch (error) {
      console.error('Error tracking WhatsApp click:', error);
    }
    // WhatsApp handling is done in HeroSection component
  }, []);

  // Handle form submission with enhanced error handling
  const handleFormSubmit = useCallback(async (inquiry: ContactInquiry | EnhancedInquiry) => {
    setIsLoading(true);
    try {
      // The actual email sending is handled in ContactSection
      // This is for any additional processing needed at the page level
      console.log('Form submitted successfully:', inquiry);
      
      // Clear the selected product category after successful submission
      setSelectedProductCategory('');
      
      // Optional: Scroll to top or show success message
      setTimeout(() => {
        scrollToSection('hero');
      }, 2000);
      
    } catch (error) {
      console.error('Form submission error at page level:', error);
      // Don't clear the form data on error so user can retry
    } finally {
      setIsLoading(false);
    }
  }, [scrollToSection]);

  // Handle WhatsApp click with enhanced tracking and error handling
  const handleWhatsAppClick = useCallback((inquiry: ContactInquiry | EnhancedInquiry) => {
    try {
      // Handle both inquiry types for tracking
      const trackingValue = 'productRequirement' in inquiry 
        ? inquiry.productRequirement 
        : inquiry.productCategory || 'contact_form';
      trackWhatsAppClick(trackingValue);
    } catch (error) {
      console.error('Error tracking WhatsApp click:', error);
    }
    // WhatsApp handling is done in ContactSection component
    console.log('WhatsApp clicked from contact form:', inquiry);
  }, []);

  // Network error banner
  const NetworkErrorBanner = () => (
    networkError && (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
        You&apos;re currently offline. Some features may not work properly.
      </div>
    )
  );

  // No JavaScript fallback message
  const NoJavaScriptFallback = () => (
    <>
      <noscript>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">JavaScript is disabled</p>
          <p>For the best experience, please enable JavaScript in your browser.</p>
        </div>
      </noscript>
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <NetworkErrorBanner />
      <NoJavaScriptFallback />

      {/* Loading overlay for better UX during transitions */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600"></div>
        </div>
      )}

      {/* Header with error boundary */}
      <ErrorBoundary fallback={
        <div className="h-16 bg-white shadow-sm flex items-center justify-center">
          <span className="text-brand-navy-900 font-bold">Al Mazahir Trading Est.</span>
        </div>
      }>
        <Header />
      </ErrorBoundary>

      {/* Main Content */}
      <main>
        {/* Hero Section - Critical above-the-fold content */}
        <ErrorBoundary fallback={
          <section className="min-h-screen bg-brand-navy-900 flex items-center justify-center text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Al Mazahir Trading Est.</h1>
              <p className="text-xl mb-8">Your Trusted Partner for Industrial Safety & Equipment Solutions</p>
              <a href="#contact" className="bg-brand-red-600 text-white px-8 py-3 rounded-md hover:bg-brand-red-700">
                Contact Us
              </a>
            </div>
          </section>
        }>
          <HeroSection 
            onRequestQuote={handleHeroRequestQuote}
            onWhatsAppClick={handleHeroWhatsAppClick}
          />
        </ErrorBoundary>

        {/* About Section - Lazy loaded with error boundary */}
        <ErrorBoundary fallback={
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">About Al Mazahir Trading Est.</h2>
              <p className="text-gray-600">Leading provider of industrial safety equipment in Saudi Arabia.</p>
            </div>
          </section>
        }>
          <AboutSection />
        </ErrorBoundary>

        {/* Real-Time Status Engine - Enterprise operational transparency */}
        <ErrorBoundary fallback={
          <section className="py-16 bg-white">
            <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Operational Status</h2>
              <p className="text-gray-600">Real-time business operations monitoring temporarily unavailable.</p>
            </div>
          </section>
        }>
          <section className="py-16 bg-gray-50" id="operational-status">
            <div className="container mx-auto px-4">
              <RealTimeStatusEngine 
                layout="dashboard"
                updateInterval={30000}
                showTrends={true}
                className="max-w-7xl mx-auto"
              />
            </div>
          </section>
        </ErrorBoundary>

        {/* Industries Section - Separate section for better visibility */}
        <ErrorBoundary fallback={
          <section className="py-16 bg-white">
            <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Industries We Serve</h2>
              <p className="text-gray-600">We serve various industries across Saudi Arabia and the GCC region.</p>
            </div>
          </section>
        }>
          <IndustriesSection />
        </ErrorBoundary>

        {/* Product Catalog - Lazy loaded with enhanced enquiry integration */}
        <LazyOnVisible rootMargin="200px">
          <ErrorBoundary fallback={
            <section className="py-16">
              <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-8">Our Products</h2>
                <p className="text-gray-600 mb-8">We offer a wide range of industrial safety equipment.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {productCategories.map((category, index) => (
                    <div key={category.id} className="bg-gray-100 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-4">📦</div>
                      <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </div>
                  ))}
                </div>
                <a href="#contact" className="bg-brand-red-600 text-white px-6 py-3 rounded-md mt-8 inline-block">
                  Contact us for product information
                </a>
              </div>
            </section>
          }>
            <LazyProductCatalog 
              categories={productCategories}
              onCTAAction={handleCTAAction}
              onEnquireNow={handleEnquireNow}
            />
          </ErrorBoundary>
        </LazyOnVisible>

        {/* Contact Section - Lazy loaded with pre-filled data */}
        <LazyOnVisible rootMargin="100px">
          <ErrorBoundary fallback={
            <section className="py-16 bg-gray-50" id="contact">
              <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
                <div className="max-w-md mx-auto">
                  <p className="mb-4">Phone: +966 50 123 4567</p>
                  <p className="mb-4">Email: info@almazahir.com</p>
                  <a 
                    href="https://wa.me/966501234567" 
                    className="bg-green-600 text-white px-6 py-3 rounded-md inline-block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </section>
          }>
            <LazyContactSection 
              onSubmit={handleFormSubmit}
              onWhatsAppClick={handleWhatsAppClick}
              prefilledProductRequirement={selectedProductCategory}
            />
          </ErrorBoundary>
        </LazyOnVisible>
      </main>

      {/* Footer with error boundary */}
      <ErrorBoundary fallback={
        <footer className="bg-brand-navy-900 text-white py-8">
          <div className="container mx-auto text-center">
            <p>&copy; 2024 Al Mazahir Trading Est. All rights reserved.</p>
          </div>
        </footer>
      }>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}
