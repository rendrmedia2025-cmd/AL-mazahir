'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Navigation } from './Navigation';
import { useScrollPosition } from '@/lib/hooks/useScrollPosition';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/NoJSFallback';
import { useProgressiveEnhancement } from '@/lib/progressive-enhancement';

export interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollPosition = useScrollPosition(50);
  const isScrolled = scrollPosition.y > 10;
  const { isEnhanced, isOnline } = useProgressiveEnhancement();

  // Navigation items - now includes dynamic sections
  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Status', href: '#operational-status' },
    { label: 'Products', href: '#products' },
    { label: 'Industries', href: '#industries' },
    { label: 'Contact', href: '#contact' }
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const handleGetQuoteClick = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Offline indicator */}
      <OfflineIndicator className="fixed top-0 left-0 right-0 z-50" />
      
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled ? 'bg-white shadow-md' : 'bg-transparent',
          className
        )}
      >
        <div className="container mx-auto mobile-padding">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Al Mazahir Trading Est."
                width={200}
                height={50}
                className={cn(
                  "h-8 sm:h-10 lg:h-12 w-auto transition-all duration-300",
                  !isScrolled && "brightness-0 invert"
                )}
                priority
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex">
              <ErrorBoundary
                fallback={
                  <nav className="flex space-x-6">
                    {navItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'text-sm font-medium transition-colors hover:text-red-600',
                          isScrolled ? 'text-gray-700' : 'text-white'
                        )}
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                }
              >
                <Navigation
                  items={navItems}
                  variant="horizontal"
                  className={cn(
                    'transition-colors',
                    isScrolled ? 'text-gray-700' : 'text-white'
                  )}
                />
              </ErrorBoundary>
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex">
              <Button
                variant="primary"
                size="sm"
                onClick={handleGetQuoteClick}
              >
                Get Quote
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 touch-target"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className={cn(
                  'w-6 h-6 transition-colors',
                  isScrolled ? 'text-gray-700' : 'text-white'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <div className="px-4 py-4">
                <ErrorBoundary
                  fallback={
                    <nav className="space-y-2">
                      {navItems.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className="block py-3 px-4 text-gray-700 hover:text-red-600 transition-colors"
                          onClick={handleNavClick}
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  }
                >
                  <Navigation
                    items={navItems}
                    variant="vertical"
                    onItemClick={handleNavClick}
                  />
                </ErrorBoundary>
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGetQuoteClick}
                  >
                    Get Quote
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export { Header };