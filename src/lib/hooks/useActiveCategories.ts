'use client';

import { useState, useEffect } from 'react';

interface UseActiveCategoriesReturn {
  activeCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the count of active product categories
 * Updates dynamically based on admin settings
 */
export const useActiveCategories = (): UseActiveCategoriesReturn => {
  const [activeCount, setActiveCount] = useState(6); // Default fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/public/availability', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // Count categories that are active (not disabled)
          const activeCategoriesCount = Object.keys(data.data).length;
          setActiveCount(activeCategoriesCount);
        }
      } catch (err) {
        console.error('Error fetching active categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch active categories');
        // Keep the default fallback value on error
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCategories();

    // Set up periodic refresh every 5 minutes to stay in sync with admin changes
    const interval = setInterval(fetchActiveCategories, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    activeCount,
    loading,
    error
  };
};

export default useActiveCategories;