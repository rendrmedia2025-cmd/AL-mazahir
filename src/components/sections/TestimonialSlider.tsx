'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTestimonials } from '@/lib/hooks/useTestimonials';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  position: string;
  content: string;
  rating?: number;
  image?: string;
  isActive: boolean;
}

interface TestimonialSliderProps {
  /** Auto-advance interval in milliseconds (0 to disable) */
  autoAdvanceInterval?: number;
  /** Show navigation dots */
  showDots?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Fallback testimonials if API fails */
  fallbackTestimonials?: Testimonial[];
}

const defaultFallbackTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Ahmed Al-Rashid',
    company: 'Saudi Construction Co.',
    position: 'Safety Manager',
    content: 'Al Mazahir Trading has been our trusted partner for industrial safety equipment for over 5 years. Their commitment to quality and timely delivery has been exceptional.',
    rating: 5,
    isActive: true
  },
  {
    id: '2',
    name: 'Fatima Al-Zahra',
    company: 'Gulf Manufacturing Ltd.',
    position: 'Procurement Director',
    content: 'The comprehensive range of safety solutions and professional service from Al Mazahir has significantly improved our workplace safety standards.',
    rating: 5,
    isActive: true
  },
  {
    id: '3',
    name: 'Mohammed Al-Otaibi',
    company: 'Riyadh Infrastructure Projects',
    position: 'Project Manager',
    content: 'Outstanding service and high-quality industrial equipment. Al Mazahir understands the unique requirements of large-scale infrastructure projects.',
    rating: 5,
    isActive: true
  }
];

export const TestimonialSlider: React.FC<TestimonialSliderProps> = ({
  autoAdvanceInterval = 5000,
  showDots = true,
  showArrows = true,
  className = '',
  fallbackTestimonials = defaultFallbackTestimonials
}) => {
  const { testimonials: apiTestimonials, loading, error } = useTestimonials();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use API testimonials if available, otherwise fallback
  const testimonials = apiTestimonials.length > 0 ? apiTestimonials : fallbackTestimonials;
  const activeTestimonials = testimonials.filter(t => t.isActive);

  // Don't render if no active testimonials and not loading
  if (activeTestimonials.length === 0 && !loading) {
    return null;
  }

  // Auto-advance functionality
  useEffect(() => {
    if (!isPlaying || !isVisible || autoAdvanceInterval === 0 || activeTestimonials.length <= 1) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === activeTestimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, autoAdvanceInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isVisible, autoAdvanceInterval, activeTestimonials.length]);

  // Intersection Observer for performance
  useEffect(() => {
    const element = sliderRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  // Navigation functions
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
    // Resume auto-play after 3 seconds
    setTimeout(() => setIsPlaying(true), 3000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? activeTestimonials.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === activeTestimonials.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case ' ':
        event.preventDefault();
        setIsPlaying(!isPlaying);
        break;
    }
  };

  const currentTestimonial = activeTestimonials[currentIndex];

  // Loading state
  if (loading) {
    return (
      <section className={`section-padding bg-white ${className}`}>
        <div className="container-industrial">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="heading-2 text-brand-navy-900 mb-6">
              What Our Clients Say
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-body-large text-brand-navy-600 leading-relaxed">
                Trusted by leading industrial companies across Saudi Arabia and the GCC region.
              </p>
            </div>
          </div>
          
          {/* Loading skeleton */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-brand-navy-50 rounded-lg p-8 md:p-12 text-center min-h-[300px] flex flex-col justify-center animate-pulse">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-gray-300 rounded mr-1"></div>
                ))}
              </div>
              <div className="space-y-4 mb-8">
                <div className="h-4 bg-gray-300 rounded mx-auto w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded mx-auto w-full"></div>
                <div className="h-4 bg-gray-300 rounded mx-auto w-2/3"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-28"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={sliderRef}
      className={`section-padding bg-white ${className}`}
      aria-label="Customer testimonials"
    >
      <div className="container-industrial">
        {/* Section Header - Mobile optimized */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in-up px-4 sm:px-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-brand-navy-900 mb-4 sm:mb-6">
            What Our Clients Say
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-base sm:text-lg text-brand-navy-600 leading-relaxed text-readable">
              <span className="hidden sm:inline">Trusted by leading industrial companies across Saudi Arabia and the GCC region.</span>
              <span className="sm:hidden">Trusted by leading industrial companies across the region.</span>
            </p>
          </div>
        </div>

        {/* Testimonial Slider */}
        <div 
          className="relative max-w-4xl mx-auto"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Testimonial slider"
          aria-live="polite"
        >
          {/* Main Testimonial - Mobile optimized */}
          <div className="bg-brand-navy-50 rounded-lg p-4 sm:p-6 md:p-8 lg:p-12 text-center min-h-[250px] sm:min-h-[300px] flex flex-col justify-center">
            {/* Rating Stars */}
            {currentTestimonial.rating && (
              <div className="flex justify-center mb-4 sm:mb-6" aria-label={`Rating: ${currentTestimonial.rating} out of 5 stars`}>
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xl sm:text-2xl ${
                      i < currentTestimonial.rating! ? 'text-brand-orange-500' : 'text-gray-300'
                    }`}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                ))}
              </div>
            )}

            {/* Testimonial Content */}
            <blockquote className="text-sm sm:text-base md:text-lg text-brand-navy-700 leading-relaxed mb-6 sm:mb-8 italic text-readable">
              "{currentTestimonial.content}"
            </blockquote>

            {/* Author Info */}
            <div className="flex flex-col items-center">
              {currentTestimonial.image && (
                <img
                  src={currentTestimonial.image}
                  alt={`${currentTestimonial.name}, ${currentTestimonial.position}`}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mb-3 sm:mb-4"
                />
              )}
              <cite className="not-italic">
                <div className="text-base sm:text-lg font-semibold text-brand-navy-900 mb-1">
                  {currentTestimonial.name}
                </div>
                <div className="text-xs sm:text-sm text-brand-navy-600 text-readable">
                  {currentTestimonial.position}
                </div>
                <div className="text-xs sm:text-sm text-brand-orange-600 font-medium">
                  {currentTestimonial.company}
                </div>
              </cite>
            </div>
          </div>

          {/* Navigation Arrows - Mobile optimized */}
          {showArrows && activeTestimonials.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-navy-600 hover:text-brand-orange-500 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 touch-target"
                aria-label="Previous testimonial"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-navy-600 hover:text-brand-orange-500 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 touch-target"
                aria-label="Next testimonial"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Navigation Dots - Mobile optimized */}
        {showDots && activeTestimonials.length > 1 && (
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2" role="tablist" aria-label="Testimonial navigation">
            {activeTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 sm:w-3 sm:h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 touch-target ${
                  index === currentIndex
                    ? 'bg-brand-orange-500 scale-125'
                    : 'bg-brand-navy-300 hover:bg-brand-navy-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                role="tab"
                aria-selected={index === currentIndex}
              />
            ))}
          </div>
        )}

        {/* Play/Pause Control */}
        {autoAdvanceInterval > 0 && activeTestimonials.length > 1 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-brand-navy-600 hover:text-brand-orange-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2 rounded p-2"
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialSlider;