import React from 'react';
import { CompanyInfo } from '@/lib/types';

interface IndustriesSectionProps {
  industries?: CompanyInfo['industries'];
}

const defaultIndustries: CompanyInfo['industries'] = [
  {
    name: "Construction",
    icon: "🏗️",
    description: "Building materials, safety equipment, and construction tools for residential, commercial, and infrastructure projects"
  },
  {
    name: "Oil & Gas",
    icon: "⛽",
    description: "Specialized safety equipment, protective gear, and industrial tools for petroleum industry operations"
  },
  {
    name: "Manufacturing",
    icon: "🏭",
    description: "Industrial machinery, production tools, and comprehensive safety solutions for manufacturing facilities"
  },
  {
    name: "Infrastructure",
    icon: "🌉",
    description: "Heavy equipment, materials, and specialized tools for large-scale infrastructure development projects"
  },
  {
    name: "Warehousing",
    icon: "📦",
    description: "Storage solutions, material handling equipment, and logistics tools for efficient warehouse operations"
  },
  {
    name: "Logistics",
    icon: "🚛",
    description: "Transportation equipment, supply chain solutions, and logistics management tools"
  },
  {
    name: "Government Projects",
    icon: "🏛️",
    description: "Comprehensive industrial solutions and safety equipment for public sector infrastructure initiatives"
  },
  {
    name: "Mining",
    icon: "⛏️",
    description: "Heavy-duty equipment, safety gear, and specialized tools for mining and extraction operations"
  }
];

export const IndustriesSection: React.FC<IndustriesSectionProps> = ({
  industries = defaultIndustries
}) => {
  return (
    <section id="industries" className="section-padding bg-white">
      <div className="container-industrial">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="heading-2 text-brand-navy-900 mb-6">
            Industries We Serve
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-body-large text-brand-navy-600 leading-relaxed">
              Al Mazahir Trading Est. provides specialized industrial safety equipment and solutions 
              across diverse sectors throughout Saudi Arabia and the GCC region. Our expertise spans 
              multiple industries, ensuring tailored solutions for every client&apos;s unique requirements.
            </p>
          </div>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {industries.map((industry, index) => (
            <div
              key={index}
              className={`card-industrial p-6 text-center group hover:shadow-lg transition-all duration-300 animate-fade-in-up animate-stagger-${index + 1}`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {industry.icon}
              </div>
              <h3 className="heading-5 text-brand-navy-900 mb-3">
                {industry.name}
              </h3>
              <p className="text-body-small text-brand-navy-600 leading-relaxed">
                {industry.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 animate-fade-in-up animate-stagger-3">
          <div className="bg-brand-navy-50 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="heading-4 text-brand-navy-900 mb-4">
              Don&apos;t See Your Industry?
            </h3>
            <p className="text-body text-brand-navy-600 mb-6">
              We work with clients across many sectors. Contact us to discuss your specific 
              industrial safety and equipment requirements.
            </p>
            <button
              onClick={() => {
                const element = document.querySelector('#contact');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="btn-primary"
            >
              Discuss Your Requirements
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};