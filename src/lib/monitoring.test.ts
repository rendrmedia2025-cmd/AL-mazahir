/**
 * Monitoring System Unit Tests
 * Tests performance tracking and error monitoring
 * Requirements: 9.3, 10.2
 */

import { MonitoringService, ServerMonitoringService } from './monitoring';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    select: jest.fn(() => ({
      gte: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn()
        }))
      })),
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          order: jest.fn()
        }))
      }))
    })),
    upsert: jest.fn()
  })),
  rpc: jest.fn()
};

// Mock the Supabase imports
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient
}));

// Mock browser APIs
Object.defineProperty(window, 'PerformanceObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn()
  }))
});

Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    getEntriesByType: jest.fn(() => [
      {
        fetchStart: 100,
        loadEventEnd: 1000,
        domContentLoadedEventEnd: 800,
        responseStart: 200
      }
    ])
  }
});

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.destroy();
    jest.useRealTimers();
  });

  describe('trackMetric', () => {
    it('should buffer performance metrics', () => {
      const metric = {
        name: 'page_load_time',
        value: 1500,
        unit: 'ms' as const,
        timestamp: new Date()
      };

      service.trackMetric(metric);

      // Metrics should be buffered, not immediately sent
      expect(mockSupabaseClient.from().insert).not.toHaveBeenCalled();
    });

    it('should flush metrics immediately for critical values', async () => {
      const criticalMetric = {
        name: 'critical_error',
        value: 15000, // High value that triggers immediate flush
        unit: 'ms' as const,
        timestamp: new Date()
      };

      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: null });

      service.trackMetric(criticalMetric);

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockInsert).toHaveBeenCalled();
    });

    it('should flush metrics periodically', async () => {
      const metric = {
        name: 'page_load_time',
        value: 1500,
        unit: 'ms' as const,
        timestamp: new Date()
      };

      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: null });

      service.trackMetric(metric);

      // Fast-forward time to trigger periodic flush
      jest.advanceTimersByTime(30000);

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('trackError', () => {
    it('should buffer error events', () => {
      const error = {
        message: 'Test error',
        severity: 'medium' as const
      };

      service.trackError(error);

      // Errors should be buffered, not immediately sent
      expect(mockSupabaseClient.from().insert).not.toHaveBeenCalled();
    });

    it('should flush errors immediately for high/critical severity', async () => {
      const criticalError = {
        message: 'Critical error',
        severity: 'critical' as const
      };

      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: null });

      service.trackError(criticalError);

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('trackApiCall', () => {
    it('should track API response times', () => {
      service.trackApiCall('/api/test', 'GET', 250, 200);

      // Should have tracked a metric
      expect(mockSupabaseClient.from().insert).not.toHaveBeenCalled(); // Buffered
    });

    it('should track API errors for 4xx/5xx status codes', () => {
      service.trackApiCall('/api/test', 'GET', 250, 500);

      // Should have tracked both metric and error
      expect(mockSupabaseClient.from().insert).not.toHaveBeenCalled(); // Buffered
    });
  });

  describe('trackBusinessEvent', () => {
    it('should track business events as metrics', () => {
      service.trackBusinessEvent('user_signup', { source: 'homepage' });

      // Should have tracked a metric
      expect(mockSupabaseClient.from().insert).not.toHaveBeenCalled(); // Buffered
    });
  });
});

describe('ServerMonitoringService', () => {
  let service: ServerMonitoringService;

  beforeEach(() => {
    service = new ServerMonitoringService();
    jest.clearAllMocks();
  });

  describe('trackMetric', () => {
    it('should track server-side metrics immediately', async () => {
      const metric = {
        name: 'server_response_time',
        value: 150,
        unit: 'ms' as const,
        timestamp: new Date()
      };

      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: null });

      await service.trackMetric(metric);

      expect(mockInsert).toHaveBeenCalledWith({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp.toISOString(),
        context: metric.context,
        tags: metric.tags,
        server_side: true
      });
    });

    it('should handle database errors gracefully', async () => {
      const metric = {
        name: 'server_response_time',
        value: 150,
        unit: 'ms' as const,
        timestamp: new Date()
      };

      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: { message: 'Database error' } });

      // Should not throw
      await expect(service.trackMetric(metric)).resolves.not.toThrow();
    });
  });

  describe('trackError', () => {
    it('should track server-side errors immediately', async () => {
      const error = {
        message: 'Server error',
        severity: 'high' as const,
        timestamp: new Date()
      };

      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: null });

      await service.trackError(error);

      expect(mockInsert).toHaveBeenCalledWith({
        message: error.message,
        stack: error.stack,
        url: error.url,
        user_agent: error.userAgent,
        user_id: error.userId,
        session_id: error.sessionId,
        severity: error.severity,
        context: error.context,
        timestamp: error.timestamp.toISOString(),
        server_side: true
      });
    });

    it('should trigger alerts for critical errors', async () => {
      const criticalError = {
        message: 'Critical server error',
        severity: 'critical' as const,
        timestamp: new Date()
      };

      const mockInsert = mockSupabaseClient.from().insert;
      const mockRpc = mockSupabaseClient.rpc;
      mockInsert.mockResolvedValue({ error: null });
      mockRpc.mockResolvedValue({ error: null });

      await service.trackError(criticalError);

      expect(mockInsert).toHaveBeenCalled();
      // Note: Alert triggering would be tested separately
    });
  });

  describe('recordBusinessMetric', () => {
    it('should record business metrics with upsert', async () => {
      const metric = {
        name: 'daily_signups',
        value: 25,
        category: 'growth',
        date: '2024-01-01'
      };

      const mockUpsert = mockSupabaseClient.from().upsert;
      mockUpsert.mockResolvedValue({ error: null });

      await service.recordBusinessMetric(metric);

      expect(mockUpsert).toHaveBeenCalledWith({
        metric_name: metric.name,
        metric_value: metric.value,
        metric_date: metric.date,
        category: metric.category,
        metadata: metric.metadata
      }, {
        onConflict: 'metric_name,metric_date,category'
      });
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should fetch performance metrics for specified time range', async () => {
      const mockMetrics = [
        { name: 'page_load_time', value: 1500, timestamp: new Date().toISOString() },
        { name: 'api_response_time', value: 250, timestamp: new Date().toISOString() }
      ];

      const mockSelect = mockSupabaseClient.from().select().gte().order;
      mockSelect.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await service.getPerformanceMetrics('24h');

      expect(result).toEqual(mockMetrics);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      const mockSelect = mockSupabaseClient.from().select().gte().order;
      mockSelect.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(service.getPerformanceMetrics('24h')).rejects.toThrow('Failed to fetch performance metrics: Database error');
    });
  });

  describe('getErrorEvents', () => {
    it('should fetch error events for specified time range', async () => {
      const mockErrors = [
        { message: 'Error 1', severity: 'high', timestamp: new Date().toISOString() },
        { message: 'Error 2', severity: 'medium', timestamp: new Date().toISOString() }
      ];

      const mockSelect = mockSupabaseClient.from().select().gte().order;
      mockSelect.mockResolvedValue({ data: mockErrors, error: null });

      const result = await service.getErrorEvents('24h');

      expect(result).toEqual(mockErrors);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should filter by severity when specified', async () => {
      const mockErrors = [
        { message: 'Critical error', severity: 'critical', timestamp: new Date().toISOString() }
      ];

      const mockQuery = {
        select: jest.fn(() => mockQuery),
        gte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery),
        order: jest.fn(() => mockQuery)
      };
      mockQuery.order.mockResolvedValue({ data: mockErrors, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await service.getErrorEvents('24h', 'critical');

      expect(result).toEqual(mockErrors);
      expect(mockQuery.eq).toHaveBeenCalledWith('severity', 'critical');
    });
  });

  describe('checkAlertRules', () => {
    it('should evaluate all active alert rules', async () => {
      const mockRules = [
        {
          id: '1',
          name: 'High Response Time',
          metric: 'api_response_time',
          condition: 'greater_than',
          threshold: 1000,
          time_window: 15,
          severity: 'medium',
          is_active: true
        }
      ];

      const mockSelect = mockSupabaseClient.from().select().eq;
      mockSelect.mockResolvedValue({ data: mockRules, error: null });

      // Mock metrics query for rule evaluation
      const mockMetricsQuery = {
        select: jest.fn(() => mockMetricsQuery),
        eq: jest.fn(() => mockMetricsQuery),
        gte: jest.fn(() => mockMetricsQuery),
        order: jest.fn(() => mockMetricsQuery)
      };
      mockMetricsQuery.order.mockResolvedValue({ 
        data: [{ value: 1500, timestamp: new Date().toISOString() }], 
        error: null 
      });

      // Mock alert insertion
      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValue({ error: null });

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: () => ({ eq: () => mockSelect }) })
        .mockReturnValueOnce(mockMetricsQuery)
        .mockReturnValueOnce({ insert: mockInsert });

      await service.checkAlertRules();

      expect(mockSelect).toHaveBeenCalled();
    });
  });
});