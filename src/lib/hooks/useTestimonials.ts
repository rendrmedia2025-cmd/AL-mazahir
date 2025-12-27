'use client';

import { useState, useEffect } from 'react';

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

interface UseTestimonialsReturn {
  testimonials: Testimonial[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch testimonials from the API
 * Automatically filters to active testimonials for public use
 */
export const useTestimonials = (): UseTestimonialsReturn => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/public/testimonials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTestimonials(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch testimonials');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch testimonials');
      // Keep empty array on error to prevent component crashes
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();

    // Set up periodic refresh every 15 minutes to stay in sync with admin changes
    const interval = setInterval(fetchTestimonials, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    testimonials,
    loading,
    error,
    refetch: fetchTestimonials
  };
};

export default useTestimonials;