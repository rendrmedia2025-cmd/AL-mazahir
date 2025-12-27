import React from 'react';
import { render, screen } from '@testing-library/react';
import { AboutSection, TrustIndicators, IndustriesSection } from './AboutSection';
import { CompanyInfo } from '@/lib/types';

const mockCompanyInfo: CompanyInfo = {
  name: "Test Company",
  description: "Test company description for testing purposes",
  yearsOfExperience: 15,
  location: "Test Location",
  phone: "+123 456 7890",
  email: "test@company.com",
  whatsappNumber: "+123456789",
  trustIndicators: [
    {
      icon: "🏭",
      title: "Test Indicator 1",
      description: "Test description 1"
    },
    {
      icon: "💰",
      title: "Test Indicator 2", 
      description: "Test description 2"
    }
  ],
  industries: [
    {
      name: "Test Industry 1",
      icon: "🏗️",
      description: "Test industry description 1"
    },
    {
      name: "Test Industry 2",
      icon: "⛽",
      description: "Test industry description 2"
    }
  ]
};

describe('AboutSection', () => {
  it('displays default company information when no props provided', () => {
    render(<AboutSection />);
    
    // Test that default company name is displayed
    expect(screen.getByText(/About Al Mazahir Trading Est./)).toBeInTheDocument();
    
    // Test that default description is displayed
    expect(screen.getByText(/Al Mazahir Trading Est. is a leading provider/)).toBeInTheDocument();
    
    // Test that years of experience is displayed
    expect(screen.getByText('10+')).toBeInTheDocument();
    expect(screen.getByText('Years of Experience')).toBeInTheDocument();
    
    // Test that location is displayed
    expect(screen.getByText(/Based in Saudi Arabia/)).toBeInTheDocument();
  });

  it('displays custom company information when provided', () => {
    render(<AboutSection companyInfo={mockCompanyInfo} />);
    
    // Test custom company name
    expect(screen.getByText('About Test Company')).toBeInTheDocument();
    
    // Test custom description
    expect(screen.getByText('Test company description for testing purposes')).toBeInTheDocument();
    
    // Test custom years of experience
    expect(screen.getByText('15+')).toBeInTheDocument();
    
    // Test custom location
    expect(screen.getByText(/Based in Test Location/)).toBeInTheDocument();
  });

  it('displays all default trust indicators correctly', () => {
    render(<AboutSection />);
    
    // Test that trust indicators section title is present
    expect(screen.getByText('Why Choose Al Mazahir Trading?')).toBeInTheDocument();
    
    // Test that all default trust indicators are present
    expect(screen.getByText('Wide Product Range')).toBeInTheDocument();
    expect(screen.getByText('Competitive Pricing')).toBeInTheDocument();
    expect(screen.getByText('Reliable Sourcing')).toBeInTheDocument();
    expect(screen.getByText('On-Time Delivery')).toBeInTheDocument();
    expect(screen.getByText('Industry Expertise')).toBeInTheDocument();
    expect(screen.getByText('Quality Assurance')).toBeInTheDocument();
    
    // Test that descriptions are present
    expect(screen.getByText(/Comprehensive selection of industrial safety equipment/)).toBeInTheDocument();
    expect(screen.getByText(/Best market prices with flexible payment terms/)).toBeInTheDocument();
  });

  it('displays all default industries correctly', () => {
    render(<AboutSection />);
    
    // Test that industries section title is present
    expect(screen.getByText('Industries We Serve')).toBeInTheDocument();
    
    // Test that all default industries are present
    expect(screen.getByText('Construction')).toBeInTheDocument();
    expect(screen.getByText('Oil & Gas')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Warehousing')).toBeInTheDocument();
    expect(screen.getByText('Logistics')).toBeInTheDocument();
    expect(screen.getByText('Government Projects')).toBeInTheDocument();
    
    // Test that industry descriptions are present
    expect(screen.getByText(/Building materials, safety equipment/)).toBeInTheDocument();
    expect(screen.getByText(/Specialized safety equipment for petroleum/)).toBeInTheDocument();
  });

  it('has proper section id for navigation', () => {
    render(<AboutSection />);
    
    const aboutSection = document.getElementById('about');
    expect(aboutSection).toBeInTheDocument();
  });
});

describe('TrustIndicators', () => {
  it('renders all trust indicators correctly', () => {
    render(<TrustIndicators trustIndicators={mockCompanyInfo.trustIndicators} />);
    
    // Test that all trust indicators are rendered
    expect(screen.getByText('Test Indicator 1')).toBeInTheDocument();
    expect(screen.getByText('Test Indicator 2')).toBeInTheDocument();
    
    // Test that descriptions are rendered
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
    
    // Test that icons are rendered
    expect(screen.getByText('🏭')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('handles empty trust indicators array', () => {
    render(<TrustIndicators trustIndicators={[]} />);
    
    // Should not crash and should not display any indicators
    expect(screen.queryByText('Test Indicator 1')).not.toBeInTheDocument();
  });
});

describe('IndustriesSection', () => {
  it('renders all industries correctly', () => {
    render(<IndustriesSection industries={mockCompanyInfo.industries} />);
    
    // Test that all industries are rendered
    expect(screen.getByText('Test Industry 1')).toBeInTheDocument();
    expect(screen.getByText('Test Industry 2')).toBeInTheDocument();
    
    // Test that descriptions are rendered
    expect(screen.getByText('Test industry description 1')).toBeInTheDocument();
    expect(screen.getByText('Test industry description 2')).toBeInTheDocument();
    
    // Test that icons are rendered
    expect(screen.getByText('🏗️')).toBeInTheDocument();
    expect(screen.getByText('⛽')).toBeInTheDocument();
  });

  it('handles empty industries array', () => {
    render(<IndustriesSection industries={[]} />);
    
    // Should not crash and should not display any industries
    expect(screen.queryByText('Test Industry 1')).not.toBeInTheDocument();
  });
});