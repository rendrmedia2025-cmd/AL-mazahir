import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, RATE_LIMITS } from '@/lib/security'

interface ErrorReport {
  message: string;
  stack?: string;
  context?: string;
  severity: 'low' | 'medium' | 'high';
  url: string;
  userAgent: string;
  timestamp: number;
}

async function handleErrorReport(req: NextRequest) {
  try {
    const body: ErrorReport = await req.json();
    
    // Validate required fields
    if (!body.message || !body.severity) {
      return NextResponse.json(
        { error: 'Invalid error report data' },
        { status: 400 }
      );
    }

    // Log error with structured format for monitoring
    const errorLog = {
      level: body.severity === 'high' ? 'error' : body.severity === 'medium' ? 'warn' : 'info',
      message: body.message,
      context: body.context || 'client_error',
      url: body.url,
      userAgent: body.userAgent?.substring(0, 200), // Truncate for privacy
      timestamp: new Date(body.timestamp).toISOString(),
      stack: body.stack?.substring(0, 1000) // Limit stack trace size
    };

    // Log to console with appropriate level
    if (body.severity === 'high') {
      console.error('[HIGH SEVERITY ERROR]', errorLog);
    } else if (body.severity === 'medium') {
      console.warn('[MEDIUM SEVERITY ERROR]', errorLog);
    } else {
      console.info('[LOW SEVERITY ERROR]', errorLog);
    }

    // In production, you would typically:
    // 1. Send to error tracking service (e.g., Sentry, Rollbar)
    // 2. Store in database for analysis
    // 3. Send alerts for high severity errors
    // 4. Aggregate for error dashboards

    // Check if this is a critical error that needs immediate attention
    const isCritical = body.severity === 'high' || 
                      body.message.includes('ChunkLoadError') ||
                      body.message.includes('Network Error') ||
                      body.context === 'availability_system';

    if (isCritical) {
      // In production, send alert to monitoring system
      console.error('[CRITICAL ERROR ALERT]', {
        message: body.message,
        context: body.context,
        url: body.url,
        timestamp: errorLog.timestamp
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Error report received',
      severity: body.severity
    });

  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

// Apply security middleware with rate limiting for error reports
export const POST = withSecurity(handleErrorReport, {
  requireAuth: false, // Public endpoint for client-side error reporting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // Reasonable limit for error reports
    message: 'Too many error reports submitted'
  },
  httpsOnly: true,
  validateInput: false // We handle validation manually for error data
});