'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface NavigationItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface NavigationProps {
  items: NavigationItem[];
  className?: string;
  variant?: 'horizontal' | 'vertical';
  onItemClick?: (href: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  className,
  variant = 'horizontal',
  onItemClick
}) => {
  const [activeSection, setActiveSection] = useState<string>('');

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = items.map(item => item.href.replace('#', ''));
      let currentSection = '';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider section active if it's in the top half of the viewport
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            currentSection = `#${section}`;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  // Smooth scroll to section
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    if (onItemClick) {
      onItemClick(href);
    }
  };

  const containerClasses = cn(
    'flex',
    variant === 'horizontal' ? 'flex-row space-x-6' : 'flex-col space-y-2',
    className
  );

  return (
    <nav className={containerClasses} role="navigation">
      {items.map((item) => {
        const isActive = activeSection === item.href || item.isActive;
        
        return (
          <button
            key={item.href}
            onClick={() => scrollToSection(item.href)}
            className={cn(
              'relative text-sm font-medium transition-all duration-200 hover:text-red-600',
              variant === 'horizontal' 
                ? 'py-2 px-1' 
                : 'py-3 px-4 text-left rounded-md hover:bg-gray-100',
              isActive 
                ? 'text-red-600' 
                : 'text-gray-700',
              // Active indicator for horizontal navigation
              variant === 'horizontal' && isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-600'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export { Navigation };