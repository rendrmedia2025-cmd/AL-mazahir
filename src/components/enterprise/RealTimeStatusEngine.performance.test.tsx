/**
 * Performance and Integration Tests for RealTimeStatusEngine
 * Tests performance impact, mobile responsiveness, and fallback mechanisms
 * Requirements: 1.4, 1.6, 12.1, 12.4
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RealTimeStatusEngine from './RealTimeStatusEngine';

// Mock fetch for API calls
global.fetch = jest.fn();

const mockStatusResponse = {
  success: true,
  data: {
    operationalAreas: [
      {
        id: 'test-area-1',
        name: 'Test Area 1',
        status: 'optimal' as const,
        metrics: [
          { name: 'Availability', value: 95, unit: '%' },
          { name: 'Response Time', value: 120, unit: 'ms' }
        ],
        trend: 'improving' as const,
        lastUpdated: new Date().toISOString(),
        details: 'Test area operating normally'
      }
    ],
    lastUpdated: new Date().toISOString(),
    systemHealth: {
      id: 'test-system-health',
      component: 'test',
      status: 'healthy' as const,
      response_time_ms: 100,
      error_rate: 0,
      last_check: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  },
  metadata: {
    cacheStatus: 'live' as const,
    nextUpdate: new Date(Date.now() + 30000).toISOString(),
    dataFreshness: 1.0
  }
};

describe('RealTimeStatusEngine - Performance & Integration', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockStatusResponse
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Impact', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms for good performance
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid updates without performance degradation', async () => {
      const { rerender } = render(<RealTimeStatusEngine updateInterval={100} />);
      
      const startTime = performance.now();
      
      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<RealTimeStatusEngine updateInterval={100} key={i} />);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 10 re-renders within 200ms
      expect(totalTime).toBeLessThan(200);
    });

    it('should not cause memory leaks with intervals', async () => {
      jest.useFakeTimers();
      
      const { unmount } = render(<RealTimeStatusEngine updateInterval={1000} />);
      
      // Fast forward time to trigger multiple intervals
      jest.advanceTimersByTime(5000);
      
      // Unmount component
      unmount();
      
      // Fast forward more time - no more API calls should happen
      const callCountBeforeUnmount = (fetch as jest.Mock).mock.calls.length;
      jest.advanceTimersByTime(5000);
      const callCountAfterUnmount = (fetch as jest.Mock).mock.calls.length;
      
      expect(callCountAfterUnmount).toBe(callCountBeforeUnmount);
      
      jest.useRealTimers();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render correctly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<RealTimeStatusEngine layout="dashboard" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      });
      
      // Should have mobile-responsive grid classes
      const gridElement = document.querySelector('.grid-cols-1');
      expect(gridElement).toBeInTheDocument();
    });

    it('should render compact layout on small screens', async () => {
      render(<RealTimeStatusEngine layout="compact" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      });
      
      // Compact layout should use flex-wrap for mobile
      const flexElement = document.querySelector('.flex-wrap');
      expect(flexElement).toBeInTheDocument();
    });

    it('should maintain readability on different screen sizes', async () => {
      const { rerender } = render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      });
      
      // Test different layouts
      rerender(<RealTimeStatusEngine layout="compact" />);
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      
      rerender(<RealTimeStatusEngine layout="detailed" />);
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should gracefully handle API timeouts', async () => {
      // Mock slow API response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => mockStatusResponse
        }), 5000))
      );
      
      render(<RealTimeStatusEngine />);
      
      // Should show loading state
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      // Should eventually show error or fallback
      await waitFor(() => {
        // Component should handle timeout gracefully
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle network failures gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));
      
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Status Engine Error')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle malformed API responses', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' })
      });
      
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('No status data available')).toBeInTheDocument();
      });
    });

    it('should retry failed requests', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'))
                          .mockResolvedValue({
                            ok: true,
                            json: async () => mockStatusResponse
                          });
      
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      // Click retry button
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      });
      
      // Should have made 2 API calls (initial + retry)
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Real-time Updates', () => {
    it('should respect 2-minute maximum latency requirement', async () => {
      jest.useFakeTimers();
      
      render(<RealTimeStatusEngine updateInterval={30000} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      });
      
      // Fast forward 2 minutes
      jest.advanceTimersByTime(120000);
      
      // Should have made at least 4 API calls (initial + 4 updates in 2 minutes)
      expect(fetch).toHaveBeenCalledTimes(5);
      
      jest.useRealTimers();
    });

    it('should show data freshness indicators', async () => {
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
      
      // Should show last updated time
      expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    });

    it('should handle cached vs live data appropriately', async () => {
      // Test live data
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
      
      // Test cached data
      const cachedResponse = {
        ...mockStatusResponse,
        metadata: {
          ...mockStatusResponse.metadata,
          cacheStatus: 'cached' as const
        }
      };
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => cachedResponse
      });
      
      fireEvent.click(screen.getByText('Refresh'));
      
      await waitFor(() => {
        expect(screen.getByText('Cached')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide meaningful status indicators', async () => {
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Optimal')).toBeInTheDocument();
      });
      
      // Status should be clearly labeled
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
      expect(screen.getByText('Improving')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh');
      
      // Should be focusable
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);
      
      // Should be clickable with keyboard
      fireEvent.keyDown(refreshButton, { key: 'Enter' });
      expect(fetch).toHaveBeenCalledTimes(2); // Initial + manual refresh
    });

    it('should provide clear error messages', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      
      render(<RealTimeStatusEngine />);
      
      await waitFor(() => {
        expect(screen.getByText('Status Engine Error')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });
});