/**
 * Infrastructure: Structured Logger
 * Provides structured logging with correlation IDs and sensitive data redaction
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  correlationId?: string;
  userId?: number;
  notificationId?: number;
  jobId?: string;
  sessionId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  event: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured Logger for Notification System
 * Supports log levels, correlation IDs, and sensitive data redaction
 * For production, replace with Winston or Pino
 */
export class StructuredLogger {
  private static instance: StructuredLogger;
  private serviceName: string = 'notification';
  private minLevel: LogLevel = LogLevel.INFO;
  private correlationIdStore: Map<string, string> = new Map();

  // Sensitive field patterns to redact
  private sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /auth/i,
    /credit[_-]?card/i,
    /ssn/i,
    /email/i, // Partially redact emails
  ];

  private constructor() {
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      this.minLevel = envLevel as LogLevel;
    }
  }

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Set correlation ID for current execution context
   */
  setCorrelationId(id: string): void {
    // In production, use AsyncLocalStorage for proper async context
    this.correlationIdStore.set('current', id);
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | undefined {
    return this.correlationIdStore.get('current');
  }

  /**
   * Generate new correlation ID
   */
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Redact sensitive data from objects
   */
  private redactSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = this.sensitivePatterns.some(pattern => pattern.test(key));

      if (isSensitive) {
        if (typeof value === 'string') {
          // Partially redact strings (show first 3 chars for emails)
          if (key.toLowerCase().includes('email') && value.includes('@')) {
            const [local, domain] = value.split('@');
            redacted[key] = `${local.substring(0, 3)}***@${domain}`;
          } else {
            redacted[key] = '***REDACTED***';
          }
        } else {
          redacted[key] = '***REDACTED***';
        }
      } else if (typeof value === 'object') {
        redacted[key] = this.redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentIndex = levels.indexOf(this.minLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  /**
   * Format and output log entry
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Redact sensitive data
    if (entry.context) {
      entry.context = this.redactSensitiveData(entry.context);
    }

    // Output as JSON
    const output = JSON.stringify(entry);

    // In production, send to centralized logging service
    // For now, use console with appropriate level
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Create base log entry
   */
  private createEntry(
    level: LogLevel,
    event: string,
    message: string,
    context?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      event,
      message,
    };

    // Add correlation ID if available
    const correlationId = this.getCorrelationId();
    if (correlationId || context?.correlationId) {
      entry.context = {
        ...context,
        correlationId: context?.correlationId || correlationId,
      };
    } else if (context) {
      entry.context = context;
    }

    return entry;
  }

  // ====================
  // Public Logging Methods
  // ====================

  error(event: string, message: string, error?: Error, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.ERROR, event, message, context);

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.log(entry);
  }

  warn(event: string, message: string, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.WARN, event, message, context);
    this.log(entry);
  }

  info(event: string, message: string, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.INFO, event, message, context);
    this.log(entry);
  }

  debug(event: string, message: string, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.DEBUG, event, message, context);
    this.log(entry);
  }

  // ====================
  // Domain-Specific Logging Methods
  // ====================

  logNotificationCreated(
    userId: number,
    notificationId: number,
    type: string,
    priority: string,
    correlationId?: string
  ): void {
    this.info('notification.created', 'Notification created successfully', {
      correlationId: correlationId || this.getCorrelationId(),
      userId,
      notificationId,
      type,
      priority,
    });
  }

  logNotificationDelivered(
    notificationId: number,
    method: string,
    durationMs: number,
    correlationId?: string
  ): void {
    this.info('notification.delivered', 'Notification delivered successfully', {
      correlationId: correlationId || this.getCorrelationId(),
      notificationId,
      method,
      durationMs,
    });
  }

  logNotificationDeliveryFailed(
    notificationId: number,
    method: string,
    error: Error,
    retryCount: number,
    correlationId?: string
  ): void {
    this.error(
      'notification.delivery.failed',
      'Notification delivery failed',
      error,
      {
        correlationId: correlationId || this.getCorrelationId(),
        notificationId,
        method,
        retryCount,
      }
    );
  }

  logWebSocketConnected(userId: number, sessionId: string): void {
    this.info('websocket.connected', 'WebSocket connection established', {
      userId,
      sessionId,
    });
  }

  logWebSocketDisconnected(userId: number, sessionId: string, reason?: string): void {
    this.info('websocket.disconnected', 'WebSocket connection closed', {
      userId,
      sessionId,
      reason,
    });
  }

  logEmailSent(templateId: string, recipient: string, durationMs: number): void {
    this.info('email.sent', 'Email sent successfully', {
      templateId,
      recipient, // Will be partially redacted
      durationMs,
    });
  }

  logEmailFailed(templateId: string, recipient: string, error: Error): void {
    this.error('email.failed', 'Email sending failed', error, {
      templateId,
      recipient, // Will be partially redacted
    });
  }

  logQueueJobStarted(jobId: string, jobType: string): void {
    this.debug('queue.job.started', 'Queue job started processing', {
      jobId,
      jobType,
    });
  }

  logQueueJobCompleted(jobId: string, jobType: string, durationMs: number): void {
    this.info('queue.job.completed', 'Queue job completed successfully', {
      jobId,
      jobType,
      durationMs,
    });
  }

  logQueueJobFailed(jobId: string, jobType: string, error: Error, attempt: number): void {
    this.error('queue.job.failed', 'Queue job processing failed', error, {
      jobId,
      jobType,
      attempt,
    });
  }

  logCacheHit(operation: string, key: string): void {
    this.debug('cache.hit', 'Cache hit', {
      operation,
      key,
    });
  }

  logCacheMiss(operation: string, key: string): void {
    this.debug('cache.miss', 'Cache miss', {
      operation,
      key,
    });
  }

  logDatabaseQuery(query: string, durationMs: number): void {
    this.debug('database.query', 'Database query executed', {
      query: query.substring(0, 100), // Truncate long queries
      durationMs,
    });
  }

  logApiRequest(method: string, endpoint: string, statusCode: number, durationMs: number): void {
    this.info('api.request', 'API request processed', {
      method,
      endpoint,
      statusCode,
      durationMs,
    });
  }

  logRateLimitExceeded(userId: number, endpoint: string): void {
    this.warn('rate_limit.exceeded', 'Rate limit exceeded', {
      userId,
      endpoint,
    });
  }

  logAuthenticationFailed(userId?: number, reason?: string): void {
    this.warn('auth.failed', 'Authentication failed', {
      userId,
      reason,
    });
  }

  logPreferenceUpdated(userId: number, changes: object): void {
    this.info('preference.updated', 'User preferences updated', {
      userId,
      changes: this.redactSensitiveData(changes),
    });
  }

  // ====================
  // Utility Methods
  // ====================

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Flush logs (useful for graceful shutdown)
   */
  async flush(): Promise<void> {
    // In production with async logging, ensure all logs are written
    // For now, this is a no-op
    return Promise.resolve();
  }
}

/**
 * Child logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: StructuredLogger,
    private context: LogContext
  ) {}

  error(event: string, message: string, error?: Error, context?: LogContext): void {
    this.parent.error(event, message, error, { ...this.context, ...context });
  }

  warn(event: string, message: string, context?: LogContext): void {
    this.parent.warn(event, message, { ...this.context, ...context });
  }

  info(event: string, message: string, context?: LogContext): void {
    this.parent.info(event, message, { ...this.context, ...context });
  }

  debug(event: string, message: string, context?: LogContext): void {
    this.parent.debug(event, message, { ...this.context, ...context });
  }
}

// Export singleton instance
export const logger = StructuredLogger.getInstance();
