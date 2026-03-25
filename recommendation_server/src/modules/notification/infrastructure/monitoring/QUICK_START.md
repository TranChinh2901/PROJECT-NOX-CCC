# Monitoring Quick Start Guide

## For Developers

This guide helps you quickly integrate monitoring into your code.

## 1. Import Monitoring Components

```typescript
import {
  metricsCollector,
  logger,
  monitoringMiddleware,
  correlationMiddleware
} from '@/modules/notification/infrastructure/monitoring';
```

## 2. Add Middleware to Express

```typescript
import express from 'express';
import { correlationMiddleware, monitoringMiddleware } from './infrastructure/monitoring';

const app = express();

// Add correlation ID tracking
app.use(correlationMiddleware);

// Add automatic API metrics and logging
app.use(monitoringMiddleware);

// Your routes...
```

## 3. Log Events

```typescript
// Simple logging
logger.info('user.action', 'User performed action', {
  userId: 42,
  action: 'update_preferences'
});

// Error logging
try {
  await someOperation();
} catch (error) {
  logger.error('operation.failed', 'Operation failed', error, {
    userId: 42
  });
}

// Use domain-specific methods
logger.logNotificationCreated(userId, notificationId, type, priority);
logger.logWebSocketConnected(userId, sessionId);
logger.logEmailSent(templateId, recipient, durationMs);
```

## 4. Track Metrics

```typescript
// Counters
metricsCollector.incrementNotificationsCreated('order', 'high');
metricsCollector.incrementEmailsSent('success');

// Gauges
metricsCollector.setWebSocketActiveConnections(150);
metricsCollector.setQueueDepth('notification:deliver', 10);

// Histograms (timing)
const startTime = Date.now();
await performOperation();
const duration = (Date.now() - startTime) / 1000;
metricsCollector.observeApiLatency('/notifications', 'GET', duration);
```

## 5. Complete Example

```typescript
import { Request, Response } from 'express';
import { logger, metricsCollector } from '@/modules/notification/infrastructure/monitoring';

export class NotificationController {
  async createNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const correlationId = (req as any).correlationId;

    try {
      // Your business logic
      const notification = await this.notificationService.create(req.body);

      // Track metrics
      metricsCollector.incrementNotificationsCreated(
        notification.type,
        notification.priority
      );

      // Log event
      logger.logNotificationCreated(
        notification.userId,
        notification.id,
        notification.type,
        notification.priority,
        correlationId
      );

      // Measure duration
      const duration = (Date.now() - startTime) / 1000;
      metricsCollector.observeApiLatency('/notifications', 'POST', duration);

      res.status(201).json(notification);
    } catch (error) {
      // Log error
      logger.error('notification.create.failed', 'Failed to create notification', error, {
        correlationId,
        userId: req.body.userId
      });

      // Track failure
      metricsCollector.incrementNotificationsFailed('api', 'creation_error');

      res.status(500).json({ error: 'Failed to create notification' });
    }
  }
}
```

## 6. View Metrics

```bash
# Prometheus format
curl http://localhost:3000/metrics

# JSON format
curl http://localhost:3000/metrics/json
```

## 7. Check Health

```bash
# Liveness
curl http://localhost:3000/health/live

# Readiness
curl http://localhost:3000/health/ready

# Detailed status
curl http://localhost:3000/health/status
```

## 8. Search Logs

Logs are structured JSON, so you can easily search:

```bash
# Find all notification creation events
cat logs/app.log | jq 'select(.event == "notification.created")'

# Find errors for specific user
cat logs/app.log | jq 'select(.level == "error" and .context.userId == 42)'

# Find events by correlation ID
cat logs/app.log | jq 'select(.context.correlationId == "abc-123")'
```

## 9. Common Patterns

### Measure Async Operations

```typescript
async function processNotification(notification: Notification): Promise<void> {
  const startTime = Date.now();

  try {
    await deliveryService.deliver(notification);

    const duration = (Date.now() - startTime) / 1000;
    metricsCollector.observeNotificationDeliveryDuration(
      notification.channel,
      duration
    );

    logger.logNotificationDelivered(notification.id, notification.channel, duration * 1000);
  } catch (error) {
    logger.logNotificationDeliveryFailed(
      notification.id,
      notification.channel,
      error,
      0
    );

    metricsCollector.incrementNotificationsFailed(notification.channel, 'delivery_error');
  }
}
```

### Track Cache Performance

```typescript
async function getCachedData(key: string): Promise<Data> {
  const cached = await cache.get(key);

  if (cached) {
    metricsCollector.incrementCacheHits('user_data');
    logger.logCacheHit('user_data', key);
    return cached;
  }

  metricsCollector.incrementCacheMisses('user_data');
  logger.logCacheMiss('user_data', key);

  const data = await database.query(key);
  await cache.set(key, data);

  return data;
}
```

### Monitor Queue Jobs

```typescript
async function processQueueJob(job: QueueJob): Promise<void> {
  const startTime = Date.now();

  logger.logQueueJobStarted(job.id, job.name);

  try {
    await job.process();

    const duration = (Date.now() - startTime) / 1000;
    metricsCollector.observeQueueJobDuration(job.name, duration);
    metricsCollector.incrementQueueJobsProcessed(job.name, 'completed');

    logger.logQueueJobCompleted(job.id, job.name, duration * 1000);
  } catch (error) {
    logger.logQueueJobFailed(job.id, job.name, error, job.attempts);
    metricsCollector.incrementQueueJobsProcessed(job.name, 'failed');
  }
}
```

## 10. Best Practices

1. **Always use correlation IDs** for request tracing
2. **Log at appropriate levels**: DEBUG for diagnostics, INFO for business events, WARN for degraded state, ERROR for failures
3. **Don't log sensitive data**: passwords, tokens, full credit card numbers
4. **Measure everything**: API latency, database queries, external service calls
5. **Use domain-specific log methods** for consistency
6. **Set gauges accurately**: update when state changes
7. **Use histogram buckets wisely**: default buckets work for most cases
8. **Test your instrumentation**: verify metrics and logs in development

## 11. Troubleshooting

### Metrics not appearing in Prometheus

1. Check metrics endpoint: `curl http://localhost:3000/metrics`
2. Verify Prometheus configuration in `prometheus.yml`
3. Check Prometheus targets: http://localhost:9090/targets
4. Ensure metrics are being collected in code

### Logs missing correlation ID

1. Ensure `correlationMiddleware` is added before other middleware
2. Use `logger.setCorrelationId()` for background jobs
3. Propagate correlation ID in async operations

### High memory usage from metrics

1. Avoid high-cardinality labels (e.g., user IDs in labels)
2. Use gauges for user-specific metrics
3. Limit label values to known set
4. Consider sampling for high-volume metrics

## 12. References

- Full documentation: [OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md)
- Dashboards: [dashboards/](./dashboards/)
- Alerts: [alerts/prometheus-alerts.yml](./alerts/prometheus-alerts.yml)
