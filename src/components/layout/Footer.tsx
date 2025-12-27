import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useProgressiveEnhancement } from '@/lib/progressive-enhancement';

export interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  const contactInfo = {
    phone: '+966 XX XXX XXXX',
    email: 'info@almazahirtrading.com',
    address: 'Saudi Arabia',
    whatsapp: '+966 XX XXX XXXX'
  };

  const quickLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Products', href: '#products' },
    { label: 'Industries', href: '#industries' },
    { label: 'Contact', href: '#contact' }
  ];

  // Updated product categories to match dynamic system
  const productCategories = [
    'Safety Equipment',
    'Fire & Safety Systems',
    'Construction & Building Materials',
    'Tools & Machinery',
    'Industrial Supplies',
    'Rental & Logistics Equipment'
  ];

  // Enhanced smooth scroll function with error handling
  const scrollToSection = (href: string) => {
    try {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.warn('Error scrolling to section:', error);
      // Fallback to simple navigation
      window.location.hash = href;
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <footer className={cn('bg-navy-900 text-white py-8', className)}>
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-300">
              © {currentYear} Al Mazahir Trading Est. All rights reserved.
            </p>
          </div>
        </footer>
      }
    >
      <footer className={cn('bg-navy-900 text-white', className)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <Image
                src="/images/logo.png"
                alt="Al Mazahir Trading Est."
                width={180}
                height={45}
                className="h-10 w-auto filter brightness-0 invert"
              />
              <p className="text-gray-300 text-sm leading-relaxed">
                Your trusted partner for industrial trading and safety equipment in Saudi Arabia and the GCC region. 
                Committed to quality, reliability, and excellence in service.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Icons - Enhanced for future implementation */}
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <span className="text-xs">FB</span>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <span className="text-xs">LI</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-300 hover:text-white transition-colors text-sm text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product Categories - Now integrated with dynamic system */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Our Products</h4>
              <ul className="space-y-2">
                {productCategories.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => scrollToSection('#products')}
                      className="text-gray-300 hover:text-white transition-colors text-sm text-left"
                    >
                      {category}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information - Enhanced with dynamic features */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Contact Us</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a 
                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {contactInfo.email}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300 text-sm">{contactInfo.address}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a 
                    href={`https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20your%20industrial%20products%20and%20services.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    WhatsApp: {contactInfo.whatsapp}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © {currentYear} Al Mazahir Trading Est. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <button className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </button>
                <button className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </ErrorBoundary>
  );
};

export { Footer };