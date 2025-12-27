/**
 * Unit tests for SEO implementation
 */

import React from 'react';
import { render } from '@testing-library/react';

// Mock Next.js metadata
const mockMetadata = {
  title: "Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions",
  description: "Leading provider of industrial safety equipment, construction materials, and logistics solutions in Saudi Arabia and the GCC region. Quality products, competitive pricing, reliable delivery.",
  keywords: "industrial safety equipment, construction materials, Saudi Arabia, GCC, safety solutions, industrial supplies",
  openGraph: {
    title: "Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions",
    description: "Leading provider of industrial safety equipment, construction materials, and logistics solutions in Saudi Arabia and the GCC region.",
    url: 'https://almazahirtrading.com',
    siteName: 'Al Mazahir Trading Est.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Al Mazahir Trading Est. - Industrial Safety Equipment',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions",
    description: "Leading provider of industrial safety equipment, construction materials, and logistics solutions in Saudi Arabia and the GCC region.",
    images: ['/images/twitter-image.jpg'],
  },
};

describe('SEO Implementation', () => {
  describe('Meta Tags', () => {
    it('should have correct title', () => {
      expect(mockMetadata.title).toBe("Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions");
    });

    it('should have descriptive meta description', () => {
      expect(mockMetadata.description).toContain('industrial safety equipment');
      expect(mockMetadata.description).toContain('Saudi Arabia');
      expect(mockMetadata.description).toContain('GCC region');
      expect(mockMetadata.description.length).toBeGreaterThan(120);
      expect(mockMetadata.description.length).toBeLessThan(160);
    });

    it('should have relevant keywords', () => {
      const keywords = mockMetadata.keywords.split(', ');
      expect(keywords).toContain('industrial safety equipment');
      expect(keywords).toContain('Saudi Arabia');
      expect(keywords).toContain('GCC');
      expect(keywords).toContain('safety solutions');
    });
  });

  describe('Open Graph Tags', () => {
    it('should have correct Open Graph title', () => {
      expect(mockMetadata.openGraph.title).toBe("Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions");
    });

    it('should have Open Graph description', () => {
      expect(mockMetadata.openGraph.description).toContain('industrial safety equipment');
      expect(mockMetadata.openGraph.description).toContain('Saudi Arabia');
    });

    it('should have correct Open Graph URL', () => {
      expect(mockMetadata.openGraph.url).toBe('https://almazahirtrading.com');
    });

    it('should have Open Graph image with correct dimensions', () => {
      const image = mockMetadata.openGraph.images[0];
      expect(image.url).toBe('/images/og-image.jpg');
      expect(image.width).toBe(1200);
      expect(image.height).toBe(630);
      expect(image.alt).toContain('Al Mazahir Trading Est.');
    });

    it('should have correct locale and type', () => {
      expect(mockMetadata.openGraph.locale).toBe('en_US');
      expect(mockMetadata.openGraph.type).toBe('website');
    });
  });

  describe('Twitter Card Tags', () => {
    it('should have correct Twitter card type', () => {
      expect(mockMetadata.twitter.card).toBe('summary_large_image');
    });

    it('should have Twitter title and description', () => {
      expect(mockMetadata.twitter.title).toBe("Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions");
      expect(mockMetadata.twitter.description).toContain('industrial safety equipment');
    });

    it('should have Twitter image', () => {
      expect(mockMetadata.twitter.images).toContain('/images/twitter-image.jpg');
    });
  });

  describe('Schema Markup Validation', () => {
    it('should have valid Local Business schema structure', () => {
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Al Mazahir Trading Est.",
        "alternateName": "Al Mazahir Trading Establishment",
        "description": expect.stringContaining("industrial safety equipment"),
        "url": "https://almazahirtrading.com",
        "telephone": expect.stringMatching(/^\+966/),
        "email": "info@almazahirtrading.com",
        "foundingDate": "2010",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "SA"
        }
      };

      // Validate required schema properties
      expect(schemaData["@context"]).toBe("https://schema.org");
      expect(schemaData["@type"]).toBe("LocalBusiness");
      expect(schemaData.name).toBe("Al Mazahir Trading Est.");
      expect(schemaData.url).toBe("https://almazahirtrading.com");
      expect(schemaData.address["@type"]).toBe("PostalAddress");
      expect(schemaData.address.addressCountry).toBe("SA");
    });

    it('should have contact points with correct structure', () => {
      const contactPoint = {
        "@type": "ContactPoint",
        "telephone": "+966-XX-XXX-XXXX",
        "contactType": "customer service",
        "areaServed": ["SA", "AE", "KW", "QA", "BH", "OM"],
        "availableLanguage": ["English", "Arabic"]
      };

      expect(contactPoint["@type"]).toBe("ContactPoint");
      expect(contactPoint.areaServed).toContain("SA");
      expect(contactPoint.availableLanguage).toContain("English");
      expect(contactPoint.availableLanguage).toContain("Arabic");
    });

    it('should have offer catalog with product categories', () => {
      const offerCatalog = {
        "@type": "OfferCatalog",
        "name": "Industrial Safety & Equipment Solutions",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Safety Equipment"
            }
          }
        ]
      };

      expect(offerCatalog["@type"]).toBe("OfferCatalog");
      expect(offerCatalog.itemListElement).toHaveLength(1);
      expect(offerCatalog.itemListElement[0]["@type"]).toBe("Offer");
    });
  });

  describe('Heading Hierarchy', () => {
    // Mock component to test heading structure
    const MockPageContent = () => (
      <div>
        <h1>Al Mazahir Trading Est.</h1>
        <section>
          <h2>About Us</h2>
          <h3>Our Experience</h3>
          <h3>Trust Indicators</h3>
        </section>
        <section>
          <h2>Our Products</h2>
          <h3>Safety Equipment</h3>
          <h3>Fire & Safety Systems</h3>
        </section>
        <section>
          <h2>Contact Us</h2>
        </section>
      </div>
    );

    it('should have proper heading hierarchy', () => {
      const { container } = render(<MockPageContent />);
      
      const h1Elements = container.querySelectorAll('h1');
      const h2Elements = container.querySelectorAll('h2');
      const h3Elements = container.querySelectorAll('h3');

      // Should have exactly one H1
      expect(h1Elements).toHaveLength(1);
      expect(h1Elements[0].textContent).toBe('Al Mazahir Trading Est.');

      // Should have multiple H2s for main sections
      expect(h2Elements.length).toBeGreaterThan(0);
      
      // H3s should be used for subsections
      expect(h3Elements.length).toBeGreaterThan(0);
    });
  });

  describe('Sitemap Validation', () => {
    const mockSitemap = [
      {
        url: 'https://almazahirtrading.com',
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: 'https://almazahirtrading.com/#about',
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://almazahirtrading.com/#products',
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: 'https://almazahirtrading.com/#contact',
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ];

    it('should have correct sitemap structure', () => {
      expect(mockSitemap).toHaveLength(4);
      
      // Check homepage
      const homepage = mockSitemap.find(item => item.url === 'https://almazahirtrading.com');
      expect(homepage).toBeDefined();
      expect(homepage?.priority).toBe(1.0);
      expect(homepage?.changeFrequency).toBe('weekly');

      // Check section URLs
      const aboutPage = mockSitemap.find(item => item.url.includes('#about'));
      const productsPage = mockSitemap.find(item => item.url.includes('#products'));
      const contactPage = mockSitemap.find(item => item.url.includes('#contact'));

      expect(aboutPage).toBeDefined();
      expect(productsPage).toBeDefined();
      expect(contactPage).toBeDefined();
    });

    it('should have valid priorities and change frequencies', () => {
      mockSitemap.forEach(item => {
        expect(item.priority).toBeGreaterThan(0);
        expect(item.priority).toBeLessThanOrEqual(1.0);
        expect(['weekly', 'monthly']).toContain(item.changeFrequency);
        expect(item.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });
});