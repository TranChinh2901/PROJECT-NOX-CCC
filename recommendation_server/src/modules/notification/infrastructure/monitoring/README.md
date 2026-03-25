# Notification System Observability

Comprehensive observability stack for the notification system with metrics, logging, health checks, and dashboards.

## Features

- **Metrics Collection**: Prometheus-compatible metrics for all critical paths
- **Structured Logging**: JSON-formatted logs with correlation IDs and sensitive data redaction
- **Health Checks**: Kubernetes-ready liveness, readiness, and detailed status endpoints
- **Dashboards**: Pre-built Grafana dashboards for overview, performance, and user experience
- **Alerting**: Prometheus alerting rules with PagerDuty and Slack integration
- **Documentation**: Comprehensive guides and runbooks

## Quick Start

### 1. Install Monitoring Stack

```typescript
import {
  metricsCollector,
  logger,
  monitoringMiddleware,
  correlationMiddleware
} from '@/modules/notification/infrastructure/monitoring';
```

### 2. Add Middleware

```typescript
import express from 'express';

const app = express();

// Add correlation ID tracking
app.use(correlationMiddleware);

// Add automatic API metrics and logging
app.use(monitoringMiddleware);
```

### 3. Expose Endpoints

```typescript
import { HealthController, MetricsController } from './infrastructure/monitoring';

const healthController = new HealthController();
const metricsController = new MetricsController();

app.get('/health/live', (req, res) => healthController.liveness(req, res));
app.get('/health/ready', (req, res) => healthController.readiness(req, res));
app.get('/health/status', (req, res) => healthController.status(req, res));
app.get('/metrics', (req, res) => metricsController.prometheus(req, res));
app.get('/metrics/json', (req, res) => metricsController.json(req, res));
```

### 4. Log and Track

```typescript
// Log business events
logger.logNotificationCreated(userId, notificationId, type, priority);

// Track metrics
metricsCollector.incrementNotificationsCreated('order', 'high');

// Measure performance
const startTime = Date.now();
await performOperation();
const duration = (Date.now() - startTime) / 1000;
metricsCollector.observeApiLatency('/notifications', 'GET', duration);
```

## Components

### MetricsCollector

Collects Prometheus-compatible metrics:

- **Counters**: Total counts (notifications created, emails sent, errors)
- **Gauges**: Current state (active connections, queue depth)
- **Histograms**: Distributions (latency, duration)

```typescript
import { metricsCollector } from './infrastructure/monitoring';

// Increment counter
metricsCollector.incrementNotificationsCreated('order', 'high');

// Set gauge
metricsCollector.setWebSocketActiveConnections(150);

// Observe histogram
metricsCollector.observeApiLatency('/notifications', 'GET', 0.125);
```

### StructuredLogger

Provides structured logging with:

- Log levels (ERROR, WARN, INFO, DEBUG)
- Correlation IDs for request tracing
- Sensitive data redaction
- Domain-specific log methods

```typescript
import { logger } from './infrastructure/monitoring';

// Simple logging
logger.info('event.name', 'Event description', { userId: 42 });

// Error logging
logger.error('error.name', 'Error description', error, { userId: 42 });

// Domain-specific methods
logger.logNotificationCreated(userId, notificationId, type, priority);
logger.logWebSocketConnected(userId, sessionId);
```

### HealthController

Kubernetes-ready health checks:

- `/health/live` - Liveness probe (is server running?)
- `/health/ready` - Readiness probe (can accept traffic?)
- `/health/status` - Detailed status (comprehensive health info)

### MonitoringMiddleware

Express middleware for automatic instrumentation:

- Correlation ID generation and propagation
- API request metrics and logging
- Error logging

## Dashboards

Pre-built Grafana dashboards in `dashboards/`:

1. **notification-overview.json** - System overview, volume, queue performance
2. **notification-performance.json** - Latency, error rates, database performance
3. **notification-user-experience.json** - Delivery time, read rates, engagement

Import into Grafana: Dashboards → Import → Upload JSON

## Alerting

Prometheus alerting rules in `alerts/prometheus-alerts.yml`:

### Critical Alerts (PagerDuty)
- Database connection failure
- Redis connection failure
- High error rate (>5%)
- WebSocket delivery failure (>20%)

### Warning Alerts (Slack)
- Email high latency (>30s)
- Low cache hit rate (<70%)
- High API latency (p95 > 500ms)
- High queue depth (>10,000)

Add to Prometheus configuration:
```yaml
rule_files:
  - 'alerts/notification-alerts.yml'
```

## Documentation

- **[OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md)** - Comprehensive guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick start for developers
- **[examples/](./examples/)** - Example instrumented services

## Architecture

```
┌─────────────────────────────────────────┐
│      Notification System                │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Metrics  │  │  Logging │  │ Health ││
│  │Collector │  │  System  │  │ Checks ││
│  └────┬─────┘  └────┬─────┘  └───┬────┘│
│       │             │             │     │
└───────┼─────────────┼─────────────┼─────┘
        │             │             │
        ▼             ▼             ▼
   Prometheus    ELK Stack    Kubernetes
        │             │
        ▼             ▼
    Grafana       Kibana
```

## Metrics Available

### Counters
- `notification_created_total` - Notifications created by type and priority
- `notification_delivered_total` - Notifications delivered by channel and status
- `notification_failed_total` - Failed deliveries by channel and reason
- `email_sent_total` - Emails sent by status
- `websocket_messages_total` - WebSocket messages by event
- `api_requests_total` - API requests by method, endpoint, and status

### Gauges
- `websocket_active_connections` - Active WebSocket connections
- `queue_depth` - Queue depth by job type
- `unread_notifications` - Unread notifications per user

### Histograms
- `api_latency_seconds` - API latency by endpoint and method
- `email_delivery_duration_seconds` - Email delivery duration
- `database_query_duration_seconds` - Database query duration
- `notification_delivery_duration_seconds` - Notification delivery duration
- `queue_job_duration_seconds` - Queue job processing duration

## Environment Variables

```bash
# Logging
export LOG_LEVEL=info  # error, warn, info, debug

# Application
export APP_VERSION=1.0.0

# Monitoring
export ENABLE_METRICS=true
export METRICS_PATH=/metrics
```

## Production Setup

### 1. Install Prometheus

```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
```

Configure `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'notification-service'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### 2. Install Grafana

```bash
wget https://dl.grafana.com/oss/release/grafana_9.3.0_amd64.deb
sudo dpkg -i grafana_9.3.0_amd64.deb
sudo systemctl start grafana-server
```

Access Grafana at http://localhost:3000 (admin/admin)

### 3. Configure Alerting

Add to Prometheus:
```yaml
rule_files:
  - 'alerts/notification-alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

Configure AlertManager for PagerDuty/Slack integration.

### 4. Set Up Log Aggregation

Configure log shipping to ELK stack, Splunk, or cloud logging service.

## Best Practices

1. **Always use correlation IDs** for request tracing
2. **Log at appropriate levels**: DEBUG for diagnostics, INFO for business events
3. **Don't log sensitive data**: passwords, tokens, full credit cards
4. **Measure everything**: API latency, database queries, external calls
5. **Set gauges accurately**: update when state changes
6. **Use domain-specific methods** for consistency
7. **Test instrumentation**: verify metrics and logs work

## Troubleshooting

### Metrics not appearing

1. Check `/metrics` endpoint: `curl http://localhost:3000/metrics`
2. Verify Prometheus is scraping: http://localhost:9090/targets
3. Check Prometheus configuration

### Logs missing correlation ID

1. Ensure `correlationMiddleware` is added first
2. Use `logger.setCorrelationId()` for background jobs
3. Propagate correlation ID in async operations

### High memory usage

1. Avoid high-cardinality labels (user IDs)
2. Use gauges for user-specific metrics
3. Limit label values to known set

## Examples

See `examples/InstrumentedNotificationDeliveryService.ts` for complete example.

## Support

- Documentation: [OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md)
- Quick Start: [QUICK_START.md](./QUICK_START.md)
- Issues: GitHub Issues

## License

MIT
