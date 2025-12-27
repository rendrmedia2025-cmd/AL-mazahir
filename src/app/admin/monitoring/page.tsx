/**
 * Monitoring Dashboard
 * Displays performance metrics, errors, and system health
 * Requirements: 9.3, 10.2
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PerformanceMetric {
  metric_name: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  count_values: number;
}

interface ErrorSummary {
  severity: string;
  error_count: number;
  unique_messages: number;
}

interface SystemHealth {
  component: string;
  status: string;
  response_time_ms?: number;
  error_rate?: number;
  last_check: string;
  metadata?: any;
}

interface Alert {
  id: string;
  name: string;
  severity: string;
  message: string;
  triggered_at: string;
  status: string;
  data?: any;
}

export default function MonitoringDashboard() {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [metricsRes, errorsRes, healthRes, alertsRes] = await Promise.all([
        fetch(`/api/admin/monitoring/performance?timeRange=${timeRange}`),
        fetch(`/api/admin/monitoring/errors?timeRange=${timeRange}`),
        fetch('/api/admin/monitoring/health'),
        fetch('/api/admin/monitoring/alerts?status=active')
      ]);

      if (!metricsRes.ok || !errorsRes.ok || !healthRes.ok || !alertsRes.ok) {
        throw new Error('Failed to load monitoring data');
      }

      const [metricsData, errorsData, healthData, alertsData] = await Promise.all([
        metricsRes.json(),
        errorsRes.json(),
        healthRes.json(),
        alertsRes.json()
      ]);

      setPerformanceMetrics(metricsData.metrics || []);
      setErrorSummary(errorsData.errors || []);
      setSystemHealth(healthData.health || []);
      setAlerts(alertsData.alerts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatMetricValue = (value: number, metricName: string) => {
    if (metricName.includes('time') || metricName.includes('duration')) {
      return `${Math.round(value)}ms`;
    }
    if (metricName.includes('percentage') || metricName.includes('rate')) {
      return `${Math.round(value * 100) / 100}%`;
    }
    if (metricName.includes('bytes') || metricName.includes('size')) {
      return `${Math.round(value / 1024)}KB`;
    }
    return Math.round(value * 100) / 100;
  };

  if (loading && performanceMetrics.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto Refresh
          </label>
          <Button onClick={loadDashboardData} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚨 Active Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card key={alert.id} className="p-4 border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{alert.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      Triggered: {new Date(alert.triggered_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* System Health Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemHealth.map(health => (
            <Card key={health.component} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 capitalize">
                  {health.component.replace('_', ' ')}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
                  {health.status}
                </span>
              </div>
              {health.response_time_ms && (
                <p className="text-sm text-gray-600">
                  Response: {health.response_time_ms}ms
                </p>
              )}
              {health.error_rate !== null && (
                <p className="text-sm text-gray-600">
                  Error Rate: {health.error_rate}%
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Last Check: {new Date(health.last_check).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performanceMetrics.map(metric => (
            <Card key={metric.metric_name} className="p-6">
              <h3 className="font-medium text-gray-900 mb-4 capitalize">
                {metric.metric_name.replace(/_/g, ' ')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average:</span>
                  <span className="font-medium">
                    {formatMetricValue(metric.avg_value, metric.metric_name)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Min:</span>
                  <span className="text-green-600">
                    {formatMetricValue(metric.min_value, metric.metric_name)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max:</span>
                  <span className="text-red-600">
                    {formatMetricValue(metric.max_value, metric.metric_name)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Samples:</span>
                  <span className="text-gray-900">{metric.count_values}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Error Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {errorSummary.map(error => (
            <Card key={error.severity} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 capitalize">{error.severity}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                  {error.error_count}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Unique Messages: {error.unique_messages}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => window.open('/api/admin/monitoring/export', '_blank')}>
            Export Metrics
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin/monitoring/alerts'}>
            Manage Alert Rules
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin/monitoring/errors'}>
            View Error Details
          </Button>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg">
          Refreshing data...
        </div>
      )}
    </div>
  );
}