import React from 'react';
import { CompanyInfo } from '@/lib/types';

interface AboutSectionProps {
  companyInfo?: CompanyInfo;
}

const defaultCompanyInfo: CompanyInfo = {
  name: "Al Mazahir Trading Est.",
  description: "Al Mazahir Trading Est. is a leading provider of industrial safety equipment, construction materials, and logistics solutions in Saudi Arabia and the GCC region. With over a decade of experience, we have built a reputation for quality, reliability, and exceptional customer service.",
  yearsOfExperience: 10,
  location: "Saudi Arabia",
  phone: "+966 XX XXX XXXX",
  email: "info@almazahirtrading.com",
  whatsappNumber: "+966XXXXXXXXX",
  trustIndicators: [
    {
      icon: "🏭",
      title: "Wide Product Range",
      description: "Comprehensive selection of industrial safety equipment and construction materials"
    },
    {
      icon: "💰",
      title: "Competitive Pricing",
      description: "Best market prices with flexible payment terms for bulk orders"
    },
    {
      icon: "🚚",
      title: "Reliable Sourcing",
      description: "Direct partnerships with leading manufacturers worldwide"
    },
    {
      icon: "⏰",
      title: "On-Time Delivery",
      description: "Efficient logistics network ensuring timely delivery across the GCC"
    },
    {
      icon: "👨‍💼",
      title: "Industry Expertise",
      description: "Deep understanding of industrial requirements and safety standards"
    },
    {
      icon: "✅",
      title: "Quality Assurance",
      description: "All products meet international quality standards and certifications"
    }
  ],
  industries: [
    {
      name: "Construction",
      icon: "🏗️",
      description: "Building materials, safety equipment, and construction tools"
    },
    {
      name: "Oil & Gas",
      icon: "⛽",
      description: "Specialized safety equipment for petroleum industry operations"
    },
    {
      name: "Manufacturing",
      icon: "🏭",
      description: "Industrial machinery, tools, and safety solutions for factories"
    },
    {
      name: "Infrastructure",
      icon: "🌉",
      description: "Heavy equipment and materials for infrastructure projects"
    },
    {
      name: "Warehousing",
      icon: "📦",
      description: "Storage solutions, material handling, and logistics equipment"
    },
    {
      name: "Logistics",
      icon: "🚛",
      description: "Transportation equipment and supply chain solutions"
    },
    {
      name: "Government Projects",
      icon: "🏛️",
      description: "Comprehensive solutions for public sector infrastructure"
    }
  ]
};

export const AboutSection: React.FC<AboutSectionProps> = ({
  companyInfo = defaultCompanyInfo
}) => {
  return (
    <section id="about" className="section-padding bg-brand-navy-50">
      <div className="container-industrial">
        {/* Company Information */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="heading-2 text-brand-navy-900 mb-6">
            About {companyInfo.name}
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-body-large text-brand-navy-600 mb-8 leading-relaxed">
              {companyInfo.description}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-center">
              <div className="card-industrial p-6 w-full sm:w-auto group">
                <div className="text-4xl font-bold text-gradient-red mb-3 group-hover:scale-110 transition-transform duration-300">
                  {companyInfo.yearsOfExperience}+
                </div>
                <div className="text-brand-navy-600 font-medium">Years of Experience</div>
              </div>
              <div className="card-industrial p-6 w-full sm:w-auto group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🇸🇦</div>
                <div className="text-brand-navy-600 font-medium">Based in {companyInfo.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <TrustIndicators trustIndicators={companyInfo.trustIndicators} />

        {/* Industries Served */}
        <IndustriesSection industries={companyInfo.industries} />
      </div>
    </section>
  );
};

interface TrustIndicatorsProps {
  trustIndicators: CompanyInfo['trustIndicators'];
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ trustIndicators }) => {
  return (
    <div className="mb-20 animate-fade-in-up animate-stagger-1">
      <h3 className="heading-3 text-brand-navy-900 text-center mb-12">
        Why Choose Al Mazahir Trading?
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {trustIndicators.map((indicator, index) => (
          <div
            key={index}
            className={`card-industrial p-6 text-center animate-fade-in-up animate-stagger-${index + 2}`}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{indicator.icon}</div>
            <h4 className="heading-5 text-brand-navy-900 mb-3">
              {indicator.title}
            </h4>
            <p className="text-body text-brand-navy-600 leading-relaxed">
              {indicator.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface IndustriesSectionProps {
  industries: CompanyInfo['industries'];
}

export const IndustriesSection: React.FC<IndustriesSectionProps> = ({ industries }) => {
  return (
    <div className="animate-fade-in-up animate-stagger-2">
      <h3 className="heading-3 text-brand-navy-900 text-center mb-12">
        Industries We Serve
      </h3>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {industries.map((industry, index) => (
          <div
            key={index}
            className={`card-industrial p-6 text-center touch-target animate-fade-in-up animate-stagger-${index + 3}`}
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{industry.icon}</div>
            <h4 className="heading-6 text-brand-navy-900 mb-2">
              {industry.name}
            </h4>
            <p className="text-body-small text-brand-navy-600 leading-relaxed">
              {industry.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};