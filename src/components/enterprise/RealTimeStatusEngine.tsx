'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { 
  OperationalAreaStatus, 
  OperationalStatus, 
  TrendDirection,
  SystemHealth 
} from '@/lib/types/enterprise';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface RealTimeStatusEngineProps {
  layout?: 'dashboard' | 'compact' | 'detailed';
  updateInterval?: number;
  showTrends?: boolean;
  className?: string;
}

interface StatusEngineData {
  operationalAreas: OperationalAreaStatus[];
  lastUpdated: string;
  systemHealth: SystemHealth;
}

interface StatusEngineResponse {
  success: boolean;
  data: StatusEngineData;
  metadata: {
    cacheStatus: 'live' | 'cached';
    nextUpdate: string;
    dataFreshness: number;
  };
}

// ============================================================================
// STATUS STYLING CONFIGURATION
// ============================================================================

const statusConfig = {
  optimal: {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    indicatorColor: 'bg-green-500',
    label: 'Optimal',
    description: 'Operating at peak performance'
  },
  good: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    indicatorColor: 'bg-blue-500',
    label: 'Good',
    description: 'Operating within normal parameters'
  },
  limited: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    indicatorColor: 'bg-yellow-500',
    label: 'Limited',
    description: 'Operating with some constraints'
  },
  critical: {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    indicatorColor: 'bg-red-500',
    label: 'Critical',
    description: 'Requires immediate attention'
  }
} as const;

const trendConfig = {
  improving: {
    icon: '↗',
    color: 'text-green-600',
    label: 'Improving'
  },
  stable: {
    icon: '→',
    color: 'text-gray-600',
    label: 'Stable'
  },
  declining: {
    icon: '↘',
    color: 'text-red-600',
    label: 'Declining'
  }
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RealTimeStatusEngine({
  layout = 'dashboard',
  updateInterval = 30000, // 30 seconds
  showTrends = true,
  className
}: RealTimeStatusEngineProps) {
  const [statusData, setStatusData] = useState<StatusEngineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchStatusData = useCallback(async () => {
    try {
      const response = await fetch('/api/status/operational', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure fresh data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StatusEngineResponse = await response.json();
      
      if (result.success) {
        setStatusData(result.data);
        setIsLive(result.metadata.cacheStatus === 'live');
        setError(null);
      } else {
        throw new Error('Failed to fetch status data');
      }
    } catch (err) {
      console.error('Error fetching status data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch and interval setup
  useEffect(() => {
    fetchStatusData();
    
    const interval = setInterval(fetchStatusData, updateInterval);
    
    return () => clearInterval(interval);
  }, [fetchStatusData, updateInterval]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusIndicator = (status: OperationalStatus) => {
    const config = statusConfig[status];
    return (
      <div className="flex items-center space-x-2">
        <div className={cn(
          'w-3 h-3 rounded-full',
          config.indicatorColor
        )} />
        <span className={cn('font-medium', config.color)}>
          {config.label}
        </span>
      </div>
    );
  };

  const renderTrendIndicator = (trend: TrendDirection) => {
    if (!showTrends) return null;
    
    const config = trendConfig[trend];
    return (
      <div className={cn(
        'flex items-center space-x-1 text-sm',
        config.color
      )}>
        <span className="font-mono">{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  const renderMetrics = (area: OperationalAreaStatus) => {
    if (!area.metrics || area.metrics.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {area.metrics.slice(0, 4).map((metric, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-gray-600">{metric.name}:</span>
            <span className="font-medium">
              {metric.value}{metric.unit}
              {metric.target && (
                <span className="text-gray-500 ml-1">
                  /{metric.target}{metric.unit}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderCompactView = () => (
    <div className="flex flex-wrap gap-2">
      {statusData?.operationalAreas.map((area) => {
        const config = statusConfig[area.status];
        return (
          <div
            key={area.id}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg border',
              config.bgColor,
              config.borderColor
            )}
          >
            <div className={cn('w-2 h-2 rounded-full', config.indicatorColor)} />
            <span className="text-sm font-medium">{area.name}</span>
            {showTrends && renderTrendIndicator(area.trend)}
          </div>
        );
      })}
    </div>
  );

  const renderDashboardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statusData?.operationalAreas.map((area) => {
        const config = statusConfig[area.status];
        return (
          <div
            key={area.id}
            className={cn(
              'p-4 rounded-lg border transition-all duration-200 hover:shadow-md',
              config.bgColor,
              config.borderColor
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{area.name}</h3>
              {renderTrendIndicator(area.trend)}
            </div>
            
            {renderStatusIndicator(area.status)}
            
            {area.details && (
              <p className="text-sm text-gray-600 mt-2">{area.details}</p>
            )}
            
            {renderMetrics(area)}
            
            <div className="mt-3 text-xs text-gray-500">
              Updated: {new Date(area.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDetailedView = () => (
    <div className="space-y-6">
      {statusData?.operationalAreas.map((area) => {
        const config = statusConfig[area.status];
        return (
          <div
            key={area.id}
            className={cn(
              'p-6 rounded-lg border',
              config.bgColor,
              config.borderColor
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {area.name}
                </h3>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>
              <div className="text-right">
                {renderStatusIndicator(area.status)}
                <div className="mt-1">
                  {renderTrendIndicator(area.trend)}
                </div>
              </div>
            </div>
            
            {area.details && (
              <div className="mb-4 p-3 bg-white/50 rounded border">
                <p className="text-sm text-gray-700">{area.details}</p>
              </div>
            )}
            
            {area.metrics && area.metrics.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {area.metrics.map((metric, index) => (
                  <div key={index} className="text-center p-3 bg-white/50 rounded">
                    <div className="text-lg font-bold text-gray-900">
                      {metric.value}{metric.unit}
                    </div>
                    <div className="text-sm text-gray-600">{metric.name}</div>
                    {metric.target && (
                      <div className="text-xs text-gray-500">
                        Target: {metric.target}{metric.unit}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <span>Last updated: {new Date(area.lastUpdated).toLocaleString()}</span>
              <span>Area ID: {area.id.slice(0, 8)}...</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading && !statusData) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className={cn(
        'p-6 bg-red-50 border border-red-200 rounded-lg',
        className
      )}>
        <div className="flex items-center space-x-2 text-red-700 mb-2">
          <div className="w-4 h-4 bg-red-500 rounded-full" />
          <h3 className="font-semibold">Status Engine Error</h3>
        </div>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <button
          onClick={fetchStatusData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className={cn(
        'p-6 bg-gray-50 border border-gray-200 rounded-lg text-center',
        className
      )}>
        <p className="text-gray-600">No status data available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Operational Status
          </h2>
          <p className="text-sm text-gray-600">
            Real-time business operations monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className={cn(
            'flex items-center space-x-2',
            isLive ? 'text-green-600' : 'text-yellow-600'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              isLive ? 'bg-green-500' : 'bg-yellow-500'
            )} />
            <span>{isLive ? 'Live' : 'Cached'}</span>
          </div>
          
          {lastFetch && (
            <span className="text-gray-500">
              Updated: {lastFetch.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={fetchStatusData}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status Display */}
      {layout === 'compact' && renderCompactView()}
      {layout === 'dashboard' && renderDashboardView()}
      {layout === 'detailed' && renderDetailedView()}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        Enterprise Dynamic Platform • Real-Time Status Engine • 
        Next update in {Math.round(updateInterval / 1000)}s
      </div>
    </div>
  );
}