/**
 * Real-Time Status Engine Component Tests
 * Tests the enterprise status dashboard functionality
 * Requirements: 1.1, 1.2, 1.3, 1.7
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
      },
      {
        id: 'test-area-2',
        name: 'Test Area 2',
        status: 'good' as const,
        metrics: [
          { name: 'Capacity', value: 85, unit: '%' }
        ],
        trend: 'stable' as const,
        lastUpdated: new Date().toISOString()
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

describe('RealTimeStatusEngine', () => {
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

  it('should render loading state initially', () => {
    render(<RealTimeStatusEngine />);
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should fetch and display operational status data', async () => {
    render(<RealTimeStatusEngine />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Operational Status')).toBeInTheDocument();
    });

    // Should display operational areas
    expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    expect(screen.getByText('Test Area 2')).toBeInTheDocument();
    
    // Should display status indicators
    expect(screen.getByText('Optimal')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('should display metrics for operational areas', async () => {
    render(<RealTimeStatusEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    });

    // Should display metrics
    expect(screen.getByText('Availability:')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Response Time:')).toBeInTheDocument();
    expect(screen.getByText('120ms')).toBeInTheDocument();
  });

  it('should show trend indicators when enabled', async () => {
    render(<RealTimeStatusEngine showTrends={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    });

    // Should display trend indicators
    expect(screen.getByText('Improving')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('should hide trend indicators when disabled', async () => {
    render(<RealTimeStatusEngine showTrends={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    });

    // Should not display trend indicators
    expect(screen.queryByText('Improving')).not.toBeInTheDocument();
    expect(screen.queryByText('Stable')).not.toBeInTheDocument();
  });

  it('should render different layouts correctly', async () => {
    const { rerender } = render(<RealTimeStatusEngine layout="compact" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    });

    // Compact layout should have different structure
    expect(document.querySelector('.flex.flex-wrap')).toBeInTheDocument();

    // Test dashboard layout
    rerender(<RealTimeStatusEngine layout="dashboard" />);
    await waitFor(() => {
      expect(document.querySelector('.grid.grid-cols-1')).toBeInTheDocument();
    });

    // Test detailed layout
    rerender(<RealTimeStatusEngine layout="detailed" />);
    await waitFor(() => {
      expect(document.querySelector('.space-y-6')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<RealTimeStatusEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Status Engine Error')).toBeInTheDocument();
    });

    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should allow manual refresh', async () => {
    render(<RealTimeStatusEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should call fetch again
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should show live/cached status indicator', async () => {
    render(<RealTimeStatusEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // Test cached status
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

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('Cached')).toBeInTheDocument();
    });
  });

  it('should update at specified intervals', async () => {
    jest.useFakeTimers();
    
    render(<RealTimeStatusEngine updateInterval={5000} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Area 1')).toBeInTheDocument();
    });

    // Initial fetch
    expect(fetch).toHaveBeenCalledTimes(1);

    // Fast forward time
    jest.advanceTimersByTime(5000);

    // Should fetch again
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('should apply custom className', () => {
    render(<RealTimeStatusEngine className="custom-class" />);
    
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should display area details when available', async () => {
    render(<RealTimeStatusEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Test area operating normally')).toBeInTheDocument();
    });
  });

  it('should handle empty operational areas', async () => {
    const emptyResponse = {
      ...mockStatusResponse,
      data: {
        ...mockStatusResponse.data,
        operationalAreas: []
      }
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => emptyResponse
    });

    render(<RealTimeStatusEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Operational Status')).toBeInTheDocument();
    });

    // Should still render the header and controls
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});