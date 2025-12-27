'use client';

import React from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useActiveCategories } from '@/lib/hooks/useActiveCategories';

interface TrustIndicatorsProps {
  /** Years of experience */
  yearsOfExperience?: number;
  /** Number of completed projects */
  projectCount?: number;
  /** Number of satisfied clients */
  clientCount?: number;
  /** Custom CSS classes */
  className?: string;
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  yearsOfExperience = 15,
  projectCount = 500,
  clientCount = 200,
  className = ''
}) => {
  const { activeCount: activeCategories } = useActiveCategories();

  const indicators = [
    {
      value: yearsOfExperience,
      suffix: '+',
      label: 'Years of Experience',
      description: 'Serving industrial clients across Saudi Arabia',
      icon: '🏆'
    },
    {
      value: projectCount,
      suffix: '+',
      label: 'Projects Completed',
      description: 'Successful industrial safety implementations',
      icon: '🏗️'
    },
    {
      value: clientCount,
      suffix: '+',
      label: 'Satisfied Clients',
      description: 'Trusted by leading industrial companies',
      icon: '🤝'
    },
    {
      value: activeCategories,
      suffix: '',
      label: 'Active Supply Categories',
      description: 'Comprehensive industrial solutions available',
      icon: '📦'
    }
  ];

  return (
    <section className={`section-padding bg-brand-navy-50 ${className}`}>
      <div className="container-industrial">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="heading-2 text-brand-navy-900 mb-6">
            Trusted by Industry Leaders
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-body-large text-brand-navy-600 leading-relaxed">
              Our commitment to excellence and safety has earned us the trust of hundreds of 
              industrial clients across the Kingdom of Saudi Arabia and the GCC region.
            </p>
          </div>
        </div>

        {/* Trust Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {indicators.map((indicator, index) => (
            <div
              key={index}
              className={`text-center group animate-fade-in-up animate-stagger-${index + 1}`}
            >
              {/* Icon */}
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {indicator.icon}
              </div>
              
              {/* Animated Counter */}
              <div className="mb-3">
                <AnimatedCounter
                  target={indicator.value}
                  suffix={indicator.suffix}
                  duration={2500}
                  className="heading-1 text-brand-orange-500 font-bold block"
                />
              </div>
              
              {/* Label */}
              <h3 className="heading-5 text-brand-navy-900 mb-2">
                {indicator.label}
              </h3>
              
              {/* Description */}
              <p className="text-body-small text-brand-navy-600 leading-relaxed">
                {indicator.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Trust Elements */}
        <div className="mt-16 text-center animate-fade-in-up animate-stagger-3">
          <div className="bg-white rounded-lg p-8 shadow-sm max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-2xl mb-2">🏅</div>
                <h4 className="heading-6 text-brand-navy-900 mb-1">Quality Certified</h4>
                <p className="text-body-small text-brand-navy-600">ISO standards compliance</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚚</div>
                <h4 className="heading-6 text-brand-navy-900 mb-1">Fast Delivery</h4>
                <p className="text-body-small text-brand-navy-600">Kingdom-wide logistics</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <h4 className="heading-6 text-brand-navy-900 mb-1">Safety First</h4>
                <p className="text-body-small text-brand-navy-600">Comprehensive safety solutions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;