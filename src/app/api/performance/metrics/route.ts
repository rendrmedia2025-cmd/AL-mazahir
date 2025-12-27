import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, RATE_LIMITS } from '@/lib/security'

interface PerformanceMetric {
  metric: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  timestamp: number;
  userAgent: string;
  connection: string;
}

async function handlePerformanceMetrics(req: NextRequest) {
  try {
    const body: PerformanceMetric = await req.json();
    
    // Validate required fields
    if (!body.metric || typeof body.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Log performance metrics for analysis
    console.log('[Performance Metric]', {
      metric: body.metric,
      value: body.value,
      rating: body.rating,
      url: body.url,
      timestamp: new Date(body.timestamp).toISOString(),
      userAgent: body.userAgent?.substring(0, 100), // Truncate for privacy
      connection: body.connection
    });

    // In a production environment, you would typically:
    // 1. Store metrics in a time-series database (e.g., InfluxDB, TimescaleDB)
    // 2. Send to monitoring services (e.g., DataDog, New Relic)
    // 3. Aggregate for dashboards and alerting

    // For now, we'll just acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Metric recorded'
    });

  } catch (error) {
    console.error('Error processing performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

// Apply security middleware with higher rate limits for performance data
export const POST = withSecurity(handlePerformanceMetrics, {
  requireAuth: false, // Public endpoint for client-side metrics
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Allow more requests for performance tracking
    message: 'Too many performance metrics submitted'
  },
  httpsOnly: true,
  validateInput: false // We handle validation manually for performance data
});