/**
 * Infrastructure: Monitoring Middleware
 * Automatic instrumentation for API requests
 */

import { Request, Response, NextFunction } from 'express';
import { metricsCollector } from './MetricsCollector';
import { logger } from './StructuredLogger';

/**
 * Middleware to instrument API requests with metrics and logging
 */
export function monitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Generate correlation ID
  const correlationId = logger.generateCorrelationId();
  logger.setCorrelationId(correlationId);

  // Add correlation ID to request
  (req as any).correlationId = correlationId;

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Track response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const durationMs = Date.now() - startTime;
    const durationSeconds = durationMs / 1000;

    // Record metrics
    metricsCollector.incrementApiRequests(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    );

    metricsCollector.observeApiLatency(
      req.route?.path || req.path,
      req.method,
      durationSeconds
    );

    // Log request
    logger.logApiRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      durationMs
    );

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware to track correlation ID across async operations
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if correlation ID already exists in headers
  const existingId = req.header('X-Correlation-ID');

  if (existingId) {
    logger.setCorrelationId(existingId);
    (req as any).correlationId = existingId;
    res.setHeader('X-Correlation-ID', existingId);
  } else {
    const correlationId = logger.generateCorrelationId();
    logger.setCorrelationId(correlationId);
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
  }

  next();
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(
    'api.error',
    'Unhandled API error',
    err,
    {
      correlationId: (req as any).correlationId,
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
    }
  );

  next(err);
}
