import React from 'react';
import { Button } from '@/components/ui/Button';
import { trackWhatsAppClick, trackCTAClick } from '@/lib/analytics';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  onRequestQuote?: () => void;
  onWhatsAppClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Al Mazahir Trading Est.",
  subtitle = "Your Trusted Partner for Industrial Safety & Equipment Solutions",
  backgroundImage = "/images/hero-bg.svg",
  onRequestQuote,
  onWhatsAppClick
}) => {
  const handleScrollToContact = () => {
    // Track CTA click
    trackCTAClick('primary', 'hero');
    
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
    onRequestQuote?.();
  };

  const handleWhatsAppClick = () => {
    try {
      // Track WhatsApp click
      trackWhatsAppClick('hero');
    } catch (trackingError) {
      console.error('Error tracking WhatsApp click:', trackingError);
      // Continue even if tracking fails
    }
    
    try {
      // Generate WhatsApp URL with pre-filled message
      const message = encodeURIComponent("Hello Al Mazahir Trading Est., I'm interested in your industrial safety equipment and would like to discuss my requirements.");
      const whatsappUrl = `https://wa.me/966501234567?text=${message}`;
      
      // Try to open WhatsApp
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback: try direct navigation
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      // Ultimate fallback: basic WhatsApp link
      try {
        window.open('https://wa.me/966501234567', '_blank', 'noopener,noreferrer');
      } catch (fallbackError) {
        console.error('Fallback WhatsApp link also failed:', fallbackError);
        // Show user-friendly message
        alert('Unable to open WhatsApp. Please contact us at +966 50 123 4567');
      }
    }
    
    try {
      onWhatsAppClick?.();
    } catch (callbackError) {
      console.error('Error in WhatsApp callback:', callbackError);
      // Don't fail the entire action if callback fails
    }
  };

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900/80 via-brand-navy-800/70 to-brand-navy-900/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Company Name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {title}
          </h1>
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-200 mb-4 font-medium">
            {subtitle}
          </p>
          
          {/* Value Proposition */}
          <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Serving Saudi Arabia and the GCC with premium industrial safety equipment, 
            construction materials, and reliable logistics solutions for over a decade.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              variant="primary"
              size="lg"
              onClick={handleScrollToContact}
              className="w-full sm:w-auto min-w-[200px] text-lg font-semibold shadow-xl hover:shadow-2xl"
            >
              Request a Quote
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleWhatsAppClick}
              className="w-full sm:w-auto min-w-[200px] text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-brand-navy-900 hover:border-white shadow-lg hover:shadow-xl"
            >
              Talk on WhatsApp
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white group">
              <div className="text-3xl sm:text-4xl font-bold text-brand-red-500 mb-2 group-hover:scale-110 transition-transform duration-300">10+</div>
              <div className="text-sm text-gray-300 font-medium">Years Experience</div>
            </div>
            <div className="text-white group">
              <div className="text-3xl sm:text-4xl font-bold text-brand-red-500 mb-2 group-hover:scale-110 transition-transform duration-300">1000+</div>
              <div className="text-sm text-gray-300 font-medium">Products</div>
            </div>
            <div className="text-white group">
              <div className="text-3xl sm:text-4xl font-bold text-brand-red-500 mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
              <div className="text-sm text-gray-300 font-medium">Satisfied Clients</div>
            </div>
            <div className="text-white group">
              <div className="text-3xl sm:text-4xl font-bold text-brand-red-500 mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-sm text-gray-300 font-medium">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center opacity-80 hover:opacity-100 transition-opacity">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};