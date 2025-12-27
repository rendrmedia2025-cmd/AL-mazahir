/**
 * Enterprise Logging System
 * Provides structured logging with multiple transports and security features
 * Requirements: 11.2, 14.6
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

// Log categories
export enum LogCategory {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SYSTEM = 'system',
  API = 'api',
  DATABASE = 'database',
  AUTH = 'auth',
  ERROR = 'error'
}

interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  url?: string
  method?: string
  statusCode?: number
  duration?: number
  category?: LogCategory
  component?: string
  action?: string
  resourceId?: string
  metadata?: Record<string, any>
}

class EnterpriseLogger {
  private logger: winston.Logger
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.logger = this.createLogger()
  }

  private createLogger(): winston.Logger {
    const logLevel = process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug')
    
    // Custom format for structured logging
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          message,
          ...meta
        }
        
        // Sanitize sensitive data
        this.sanitizeLogEntry(logEntry)
        
        return JSON.stringify(logEntry)
      })
    )

    const transports: winston.transport[] = []

    // Console transport for development
    if (!this.isProduction) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      )
    }

    // File transports for production
    if (this.isProduction) {
      // General application logs
      transports.push(
        new DailyRotateFile({
          filename: process.env.LOG_FILE_PATH || './logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: process.env.LOG_MAX_SIZE || '20m',
          maxFiles: process.env.LOG_MAX_FILES || '14d',
          format: customFormat
        })
      )

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: './logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: customFormat
        })
      )

      // Security logs
      transports.push(
        new DailyRotateFile({
          filename: './logs/security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: customFormat,
          // Only log security-related entries
          filter: (info) => info.category === LogCategory.SECURITY
        })
      )

      // Performance logs
      transports.push(
        new DailyRotateFile({
          filename: './logs/performance-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          format: customFormat,
          filter: (info) => info.category === LogCategory.PERFORMANCE
        })
      )
    }

    return winston.createLogger({
      level: logLevel,
      format: customFormat,
      transports,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: this.isProduction ? [
        new DailyRotateFile({
          filename: './logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ] : [],
      rejectionHandlers: this.isProduction ? [
        new DailyRotateFile({
          filename: './logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ] : []
    })
  }

  private sanitizeLogEntry(entry: any): void {
    // Remove or mask sensitive data
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'credit_card', 'ssn', 'email'
    ]

    const sanitize = (obj: any, path: string = ''): void => {
      if (typeof obj !== 'object' || obj === null) return

      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key
        const lowerKey = key.toLowerCase()

        // Check if field contains sensitive data
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          sanitize(value, fullPath)
        }
      }
    }

    sanitize(entry)
  }

  // Core logging methods
  error(message: string, context?: LogContext): void {
    this.logger.error(message, { ...context, category: context?.category || LogCategory.ERROR })
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { ...context, category: context?.category || LogCategory.SYSTEM })
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, { ...context, category: context?.category || LogCategory.SYSTEM })
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { ...context, category: context?.category || LogCategory.SYSTEM })
  }

  // Specialized logging methods
  security(message: string, context?: Omit<LogContext, 'category'>): void {
    this.logger.warn(message, { ...context, category: LogCategory.SECURITY })
  }

  performance(message: string, context?: Omit<LogContext, 'category'>): void {
    this.logger.info(message, { ...context, category: LogCategory.PERFORMANCE })
  }

  business(message: string, context?: Omit<LogContext, 'category'>): void {
    this.logger.info(message, { ...context, category: LogCategory.BUSINESS })
  }

  api(message: string, context?: Omit<LogContext, 'category'>): void {
    this.logger.info(message, { ...context, category: LogCategory.API })
  }

  database(message: string, context?: Omit<LogContext, 'category'>): void {
    this.logger.info(message, { ...context, category: LogCategory.DATABASE })
  }

  auth(message: string, context?: Omit<LogContext, 'category'>): void {
    this.logger.info(message, { ...context, category: LogCategory.AUTH })
  }

  // HTTP request logging
  logRequest(req: any, res: any, duration: number): void {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
      userId: req.user?.id,
      sessionId: req.sessionId,
      category: LogCategory.API
    }

    const level = res.statusCode >= 400 ? 'error' : 'info'
    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`

    this.logger.log(level, message, context)
  }

  // Error logging with stack trace
  logError(error: Error, context?: LogContext): void {
    this.logger.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
      category: LogCategory.ERROR
    })
  }

  // Business event logging
  logBusinessEvent(event: string, data?: any, context?: LogContext): void {
    this.business(`Business Event: ${event}`, {
      ...context,
      event,
      data,
      timestamp: new Date().toISOString()
    })
  }

  // Security event logging
  logSecurityEvent(
    event: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    this.security(`Security Event: ${event}`, {
      ...context,
      event,
      severity,
      timestamp: new Date().toISOString()
    })
  }

  // Performance metric logging
  logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: LogContext
  ): void {
    this.performance(`Performance Metric: ${metric}`, {
      ...context,
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    })
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext
  ): void {
    this.database(`Database Operation: ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  // Authentication event logging
  logAuthEvent(
    event: string,
    userId?: string,
    success: boolean = true,
    context?: LogContext
  ): void {
    this.auth(`Auth Event: ${event}`, {
      ...context,
      event,
      userId,
      success,
      timestamp: new Date().toISOString()
    })
  }
}

// Singleton instance
export const logger = new EnterpriseLogger()

// Express middleware for request logging
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    
    res.on('finish', () => {
      const duration = Date.now() - start
      logger.logRequest(req, res, duration)
    })
    
    next()
  }
}

// Error handling middleware
export function errorLoggingMiddleware() {
  return (error: Error, req: any, res: any, next: any) => {
    logger.logError(error, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
      userId: req.user?.id,
      sessionId: req.sessionId
    })
    
    next(error)
  }
}

export default logger