import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { setupProgressiveEnhancement } from "@/lib/progressive-enhancement";
import { setupGlobalErrorHandling } from "@/lib/error-reporting";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial', 'sans-serif']
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: "Al Mazahir Trading Est. - Industrial Safety & Equipment Solutions",
  description: "Leading provider of industrial safety equipment, construction materials, and logistics solutions in Saudi Arabia and the GCC region. Quality products, competitive pricing, reliable delivery.",
  keywords: "industrial safety equipment, construction materials, Saudi Arabia, GCC, safety solutions, industrial supplies",
  authors: [{ name: "Al Mazahir Trading Est." }],
  creator: "Al Mazahir Trading Est.",
  publisher: "Al Mazahir Trading Est.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://almazahirtrading.com'),
  alternates: {
    canonical: '/',
  },
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Progressive enhancement CSS */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* No-JS fallback styles */
            .no-js .js-only { display: none !important; }
            .no-js .no-js-fallback { display: block !important; }
            .js .no-js-fallback { display: none !important; }
            
            /* Offline styles */
            .offline .offline-indicator { display: block !important; }
            .online .offline-indicator { display: none !important; }
            
            /* Loading skeleton */
            .loading-skeleton {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }
            
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `
        }} />
        
        {/* Structured Data for SEO - Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Al Mazahir Trading Est.",
              "alternateName": "Al Mazahir Trading Establishment",
              "description": "Leading provider of industrial safety equipment, construction materials, and logistics solutions in Saudi Arabia and the GCC region. Serving construction, oil & gas, manufacturing, and government projects with quality products and reliable delivery.",
              "url": "https://almazahirtrading.com",
              "logo": "https://almazahirtrading.com/images/logo.png",
              "image": "https://almazahirtrading.com/images/og-image.jpg",
              "telephone": "+966-XX-XXX-XXXX",
              "email": "info@almazahirtrading.com",
              "foundingDate": "2010",
              "priceRange": "$$",
              "currenciesAccepted": "SAR, USD",
              "paymentAccepted": "Cash, Credit Card, Bank Transfer",
              "openingHours": "Mo-Th 08:00-17:00, Su 08:00-17:00",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Industrial Area",
                "addressLocality": "Riyadh",
                "addressRegion": "Riyadh Province",
                "postalCode": "11564",
                "addressCountry": "SA"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "24.7136",
                "longitude": "46.6753"
              },
              "areaServed": [
                {
                  "@type": "Country",
                  "name": "Saudi Arabia"
                },
                {
                  "@type": "Country", 
                  "name": "United Arab Emirates"
                },
                {
                  "@type": "Country",
                  "name": "Kuwait"
                },
                {
                  "@type": "Country",
                  "name": "Qatar"
                },
                {
                  "@type": "Country",
                  "name": "Bahrain"
                },
                {
                  "@type": "Country",
                  "name": "Oman"
                }
              ],
              "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                  "@type": "GeoCoordinates",
                  "latitude": "24.7136",
                  "longitude": "46.6753"
                },
                "geoRadius": "2000000"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "telephone": "+966-XX-XXX-XXXX",
                  "contactType": "customer service",
                  "areaServed": ["SA", "AE", "KW", "QA", "BH", "OM"],
                  "availableLanguage": ["English", "Arabic"],
                  "hoursAvailable": "Mo-Th 08:00-17:00, Su 08:00-17:00"
                },
                {
                  "@type": "ContactPoint",
                  "telephone": "+966-XX-XXX-XXXX",
                  "contactType": "sales",
                  "areaServed": ["SA", "AE", "KW", "QA", "BH", "OM"],
                  "availableLanguage": ["English", "Arabic"]
                }
              ],
              "sameAs": [
                "https://www.linkedin.com/company/almazahirtrading",
                "https://www.facebook.com/almazahirtrading"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Industrial Safety & Equipment Solutions",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Safety Equipment",
                      "description": "Personal protective equipment, safety gear, and workplace safety solutions"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Fire & Safety Systems",
                      "description": "Fire protection equipment, emergency systems, and safety installations"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product", 
                      "name": "Construction & Building Materials",
                      "description": "Quality construction materials and building supplies for industrial projects"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Tools & Machinery",
                      "description": "Industrial tools, machinery, and equipment for construction and manufacturing"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "Industrial Supplies",
                      "description": "General industrial supplies and materials for various applications"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Rental & Logistics Equipment",
                      "description": "Equipment rental services and logistics solutions for industrial projects"
                    }
                  }
                ]
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "127",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        
        {/* Performance monitoring and Analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Progressive enhancement setup
              (function() {
                // Remove no-js class immediately
                document.documentElement.classList.remove('no-js');
                document.documentElement.classList.add('js');
                
                // Setup progressive enhancement
                if (typeof window !== 'undefined') {
                  // Feature detection
                  const isModernBrowser = !!(
                    window.fetch &&
                    window.Promise &&
                    window.IntersectionObserver &&
                    document.querySelector &&
                    Array.prototype.includes
                  );
                  
                  document.documentElement.classList.toggle('modern-browser', isModernBrowser);
                  
                  // Online/offline detection
                  const updateOnlineStatus = function() {
                    document.documentElement.classList.toggle('offline', !navigator.onLine);
                    document.documentElement.classList.toggle('online', navigator.onLine);
                  };
                  
                  window.addEventListener('online', updateOnlineStatus);
                  window.addEventListener('offline', updateOnlineStatus);
                  updateOnlineStatus();
                }
              })();
              
              // Service Worker Registration
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[SW] Registration successful:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('[SW] Registration failed:', error);
                    });
                });
              }
              
              // Google Analytics
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'GA_MEASUREMENT_ID'}', {
                page_title: document.title,
                page_location: window.location.href,
              });
              
              // Initialize comprehensive performance monitoring
              (function() {
                // Core Web Vitals monitoring with enhanced tracking
                if ('PerformanceObserver' in window) {
                  const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      let metric = null;
                      
                      if (entry.entryType === 'largest-contentful-paint') {
                        metric = {
                          name: 'LCP',
                          value: entry.startTime,
                          rating: entry.startTime <= 2500 ? 'good' : entry.startTime <= 4000 ? 'needs-improvement' : 'poor'
                        };
                      } else if (entry.entryType === 'first-input') {
                        const value = entry.processingStart - entry.startTime;
                        metric = {
                          name: 'FID',
                          value: value,
                          rating: value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
                        };
                      } else if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                        metric = {
                          name: 'CLS',
                          value: entry.value,
                          rating: entry.value <= 0.1 ? 'good' : entry.value <= 0.25 ? 'needs-improvement' : 'poor'
                        };
                      } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
                        metric = {
                          name: 'FCP',
                          value: entry.startTime,
                          rating: entry.startTime <= 1800 ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor'
                        };
                      }
                      
                      if (metric) {
                        console.log('[Performance]', metric.name + ':', metric.value + 'ms', '(' + metric.rating + ')');
                        
                        // Send to Google Analytics
                        gtag('event', 'web_vitals', {
                          event_category: 'performance',
                          event_label: metric.name,
                          value: Math.round(metric.value),
                          custom_map: {
                            metric_rating: metric.rating
                          }
                        });
                        
                        // Send to custom performance endpoint
                        fetch('/api/performance/metrics', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            metric: metric.name,
                            value: metric.value,
                            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                            delta: metric.value,
                            rating: metric.rating,
                            url: window.location.href,
                            timestamp: Date.now(),
                            userAgent: navigator.userAgent,
                            connection: navigator.connection?.effectiveType || 'unknown'
                          })
                        }).catch(function(error) {
                          console.warn('Failed to send performance metric:', error);
                        });
                        
                        // Alert on poor performance
                        if (metric.rating === 'poor') {
                          console.warn('[Performance Alert] Poor ' + metric.name + ':', metric.value);
                        }
                      }
                    }
                  });
                  
                  try {
                    observer.observe({ 
                      entryTypes: [
                        'largest-contentful-paint',
                        'first-input', 
                        'layout-shift',
                        'paint',
                        'navigation'
                      ] 
                    });
                  } catch (error) {
                    console.warn('Performance observer not fully supported:', error);
                  }
                }
                
                // Global error tracking
                window.addEventListener('error', function(event) {
                  console.error('[Global Error]', event.message, 'at', event.filename + ':' + event.lineno);
                  
                  fetch('/api/monitoring/errors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: event.message,
                      stack: event.error?.stack,
                      context: event.filename + ':' + event.lineno + ':' + event.colno,
                      severity: 'high',
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: Date.now()
                    })
                  }).catch(function(error) {
                    console.warn('Failed to send error report:', error);
                  });
                });
                
                // Unhandled promise rejection tracking
                window.addEventListener('unhandledrejection', function(event) {
                  console.error('[Unhandled Promise Rejection]', event.reason);
                  
                  fetch('/api/monitoring/errors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: event.reason?.message || 'Unhandled promise rejection',
                      stack: event.reason?.stack,
                      context: 'unhandled_promise',
                      severity: 'high',
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: Date.now()
                    })
                  }).catch(function(error) {
                    console.warn('Failed to send error report:', error);
                  });
                });
                
                // Resource loading error tracking
                window.addEventListener('error', function(event) {
                  if (event.target && event.target !== window) {
                    console.warn('[Resource Error]', event.target.tagName, event.target.src || event.target.href);
                    
                    fetch('/api/monitoring/errors', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        message: 'Resource loading failed: ' + event.target.tagName,
                        context: 'resource_loading',
                        severity: 'medium',
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: Date.now()
                      })
                    }).catch(function(error) {
                      console.warn('Failed to send error report:', error);
                    });
                  }
                }, true);
                
                console.log('[Performance Monitoring] Initialized successfully');
              })();
            `
          }}
        />
        
        {/* Google Analytics Script */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'GA_MEASUREMENT_ID'}`}
        />
      </body>
    </html>
  );
}
