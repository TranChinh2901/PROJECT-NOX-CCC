# Notification System Observability Guide

## Overview

This guide provides comprehensive documentation for monitoring, troubleshooting, and maintaining the notification system observability stack.

## Table of Contents

1. [Architecture](#architecture)
2. [Metrics](#metrics)
3. [Logging](#logging)
4. [Health Checks](#health-checks)
5. [Dashboards](#dashboards)
6. [Alerting](#alerting)
7. [Runbooks](#runbooks)
8. [Setup Instructions](#setup-instructions)

---

## Architecture

The observability stack consists of:

- **Metrics Collection**: MetricsCollector (Prometheus-compatible)
- **Structured Logging**: StructuredLogger (JSON format)
- **Health Checks**: HealthController (liveness, readiness, status)
- **Dashboards**: Grafana dashboards (overview, performance, user experience)
- **Alerting**: Prometheus AlertManager rules

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification System                       │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Metrics   │  │  Logging   │  │  Health    │           │
│  │ Collector  │  │  System    │  │  Checks    │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │               │               │                    │
└────────┼───────────────┼───────────────┼────────────────────┘
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │Prometheus│    │   ELK    │    │  K8s     │
    │         │    │  Stack   │    │ Probes   │
    └────┬────┘    └─────┬────┘    └──────────┘
         │               │
         ▼               ▼
    ┌─────────┐    ┌──────────┐
    │ Grafana │    │  Kibana  │
    └─────────┘    └──────────┘
```

---

## Metrics

### Endpoints

- **Prometheus Format**: `GET /metrics`
- **JSON Format**: `GET /metrics/json`

### Available Metrics

#### Counters

| Metric | Description | Labels |
|--------|-------------|--------|
| `notification_created_total` | Total notifications created | `type`, `priority` |
| `notification_delivered_total` | Total notifications delivered | `channel`, `status` |
| `notification_failed_total` | Total failed deliveries | `channel`, `reason` |
| `email_sent_total` | Total emails sent | `status` |
| `websocket_messages_total` | Total WebSocket messages | `event` |
| `websocket_connections_total` | Total WebSocket connections | `user_id` |
| `websocket_reconnections_total` | Total WebSocket reconnections | - |
| `cache_hits_total` | Total cache hits | `operation` |
| `cache_misses_total` | Total cache misses | `operation` |
| `api_requests_total` | Total API requests | `method`, `endpoint`, `status` |
| `queue_jobs_processed_total` | Total queue jobs processed | `job_type`, `status` |

#### Gauges

| Metric | Description | Labels |
|--------|-------------|--------|
| `websocket_active_connections` | Active WebSocket connections | - |
| `queue_depth` | Jobs waiting in queue | `job_type` |
| `unread_notifications` | Unread notifications per user | `user_id` |

#### Histograms

| Metric | Description | Labels | Buckets (seconds) |
|--------|-------------|--------|-------------------|
| `api_latency_seconds` | API endpoint latency | `endpoint`, `method` | 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 |
| `email_delivery_duration_seconds` | Email delivery duration | - | Same as above |
| `database_query_duration_seconds` | Database query duration | `query` | Same as above |
| `notification_delivery_duration_seconds` | Notification delivery duration | `channel` | Same as above |
| `queue_job_duration_seconds` | Queue job processing duration | `job_type` | Same as above |

### Usage in Code

```typescript
import { metricsCollector } from '@/modules/notification/infrastructure/monitoring';

// Increment counter
metricsCollector.incrementNotificationsCreated('order', 'high');

// Observe histogram
const startTime = Date.now();
// ... do work ...
const duration = (Date.now() - startTime) / 1000;
metricsCollector.observeApiLatency('/notifications', 'GET', duration);

// Set gauge
metricsCollector.setWebSocketActiveConnections(150);
```

---

## Logging

### Log Levels

- **ERROR**: System errors, failed operations
- **WARN**: Degraded performance, non-critical issues
- **INFO**: Normal operations, business events
- **DEBUG**: Detailed diagnostic information

Set log level via environment variable:
```bash
export LOG_LEVEL=info
```

### Log Format

All logs are structured JSON with the following schema:

```json
{
  "timestamp": "2026-02-05T10:30:00Z",
  "level": "info",
  "service": "notification",
  "event": "notification.created",
  "message": "Notification created successfully",
  "context": {
    "correlationId": "abc-123",
    "userId": 42,
    "notificationId": 1001,
    "type": "order",
    "priority": "high"
  }
}
```

### Correlation IDs

Correlation IDs are automatically generated for all API requests and propagated through:
- HTTP headers: `X-Correlation-ID`
- Log entries: `context.correlationId`
- Database queries
- Queue jobs

### Domain Events

Predefined log events:

- `notification.created` - Notification created
- `notification.delivered` - Notification delivered
- `notification.delivery.failed` - Delivery failed
- `websocket.connected` - WebSocket connected
- `websocket.disconnected` - WebSocket disconnected
- `email.sent` - Email sent
- `email.failed` - Email failed
- `queue.job.started` - Queue job started
- `queue.job.completed` - Queue job completed
- `queue.job.failed` - Queue job failed
- `cache.hit` - Cache hit
- `cache.miss` - Cache miss
- `api.request` - API request processed

### Sensitive Data Redaction

The logger automatically redacts sensitive fields:
- Passwords
- Tokens
- API keys
- Email addresses (partially redacted: `abc***@example.com`)

### Usage in Code

```typescript
import { logger } from '@/modules/notification/infrastructure/monitoring';

// Simple logging
logger.info('notification.created', 'Notification created successfully', {
  userId: 42,
  notificationId: 1001,
  type: 'order'
});

// Error logging
try {
  // ... operation ...
} catch (error) {
  logger.error('operation.failed', 'Operation failed', error, {
    userId: 42
  });
}

// Domain-specific methods
logger.logNotificationCreated(userId, notificationId, type, priority);
logger.logWebSocketConnected(userId, sessionId);
```

---

## Health Checks

### Endpoints

#### Liveness Probe
```
GET /health/live
```

Returns 200 if server is running. Used by Kubernetes to restart unhealthy pods.

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2026-02-05T10:30:00Z"
}
```

#### Readiness Probe
```
GET /health/ready
```

Returns 200 if server can accept traffic. Checks critical dependencies.

**Response (Ready):**
```json
{
  "status": "ready",
  "timestamp": "2026-02-05T10:30:00Z",
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "websocket": { "status": "healthy", "latency": 2 }
  }
}
```

**Response (Not Ready):**
```json
{
  "status": "not_ready",
  "timestamp": "2026-02-05T10:30:00Z",
  "checks": {
    "database": { "status": "unhealthy", "reason": "Connection timeout" },
    "websocket": { "status": "healthy", "latency": 2 }
  }
}
```

#### Detailed Status
```
GET /health/status
```

Returns comprehensive health information including metrics.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2026-02-05T10:30:00Z",
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "websocket": { "status": "healthy", "latency": 2 },
    "emailService": { "status": "healthy", "latency": 10 }
  },
  "metrics": {
    "notificationsCreated": 1000,
    "notificationsDelivered": 980,
    "websocketConnections": 150,
    "queueDepth": 5
  }
}
```

### Health Status Values

- **healthy**: All checks passing
- **degraded**: Non-critical checks failing (e.g., email service slow)
- **unhealthy**: Critical checks failing (e.g., database down)

### Kubernetes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

---

## Dashboards

### Dashboard 1: Notification Overview

**File**: `dashboards/notification-overview.json`

**Panels**:
1. Notifications Created Over Time (graph)
2. Delivery Success Rate (gauge)
3. Active WebSocket Connections (stat)
4. Queue Depth (stat)
5. Delivery Method Breakdown (pie chart)
6. WebSocket Connections Over Time (graph)
7. Queue Processing Rate (graph)
8. Notification Priority Distribution (graph)
9. Cache Performance (graph)

**Use Cases**:
- Monitor overall system health
- Track notification volume trends
- Identify delivery issues
- Monitor queue performance

### Dashboard 2: Performance

**File**: `dashboards/notification-performance.json`

**Panels**:
1. API Latency (p50, p95, p99) (graph)
2. API Latency by Endpoint (graph)
3. Database Query Duration Heatmap (heatmap)
4. Email Send Duration Histogram (graph)
5. Error Rate (graph)
6. Notification Delivery Duration by Channel (graph)
7. Queue Job Processing Duration (graph)
8. Request Rate by Endpoint (graph)

**Use Cases**:
- Identify performance bottlenecks
- Monitor SLA compliance
- Detect performance regressions
- Optimize slow endpoints

### Dashboard 3: User Experience

**File**: `dashboards/notification-user-experience.json`

**Panels**:
1. Time to Delivery (WebSocket) (graph)
2. Notification Read Rate (graph)
3. Unread Notification Count Distribution (graph)
4. Average Unread Notifications per User (stat)
5. Users with Excessive Unread Notifications (stat)
6. User Preferences Adoption (pie chart)
7. Notification Type Engagement (graph)
8. WebSocket Connection Stability (graph)
9. Quiet Hours Usage (stat)
10. Delivery Method Preferences (bar gauge)

**Use Cases**:
- Monitor user engagement
- Identify notification fatigue
- Track preference adoption
- Measure delivery quality

### Import Instructions

1. Open Grafana
2. Navigate to Dashboards → Import
3. Upload JSON file
4. Select Prometheus data source
5. Click Import

---

## Alerting

### Alert Configuration

**File**: `alerts/prometheus-alerts.yml`

Add to `prometheus.yml`:
```yaml
rule_files:
  - 'alerts/notification-alerts.yml'
```

### Alert Severity Levels

- **Critical (P1)**: Immediate action required, system down
- **Warning (P2)**: Degraded performance, needs attention
- **Info (P3)**: FYI, no immediate action required

### Critical Alerts (PagerDuty)

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| NotificationDatabaseDown | Database unavailable | 1m | Check database connection, restart service |
| NotificationRedisDown | Redis unavailable | 1m | Check Redis connection, verify cache layer |
| NotificationHighErrorRate | Error rate > 5% | 5m | Check logs, investigate errors |
| NotificationWebSocketHighFailureRate | WS failure > 20% | 5m | Check WebSocket server, network issues |

### Warning Alerts (Slack)

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| NotificationEmailHighLatency | p95 > 30s | 10m | Check email provider, investigate delays |
| NotificationLowCacheHitRate | Hit rate < 70% | 15m | Review cache strategy, check invalidation |
| NotificationHighAPILatency | p95 > 500ms | 10m | Profile slow endpoints, optimize queries |
| NotificationHighQueueDepth | Queue > 10,000 | 10m | Scale workers, investigate processing delays |
| NotificationHighReconnectionRate | Reconnect rate > 10% | 10m | Check network stability, server resources |
| NotificationSlowDatabaseQueries | p95 > 1s | 10m | Optimize queries, add indexes |

### AlertManager Configuration

```yaml
route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 3h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<your-pagerduty-key>'

  - name: 'slack'
    slack_configs:
      - api_url: '<your-slack-webhook>'
        channel: '#alerts-notification'
```

---

## Runbooks

### Database Connection Failure

**Alert**: NotificationDatabaseDown

**Symptoms**:
- Health check failing
- 500 errors on all API endpoints
- No notifications being created

**Investigation**:
1. Check database server status
2. Verify network connectivity
3. Check connection pool exhaustion
4. Review database logs

**Resolution**:
1. Restart database if crashed
2. Increase connection pool size if exhausted
3. Fix network issues if connectivity problem
4. Restart notification service to reset connections

### High Error Rate

**Alert**: NotificationHighErrorRate

**Symptoms**:
- Increased 5xx responses
- User complaints
- Errors in logs

**Investigation**:
1. Check recent deployments
2. Review error logs for patterns
3. Check resource utilization (CPU, memory)
4. Verify external dependencies

**Resolution**:
1. Rollback recent deployment if caused by code change
2. Scale up resources if resource constrained
3. Fix identified bugs
4. Rate limit if caused by abuse

### WebSocket Delivery Failures

**Alert**: NotificationWebSocketHighFailureRate

**Symptoms**:
- Users not receiving real-time notifications
- High reconnection rate
- Failed delivery logs

**Investigation**:
1. Check WebSocket server logs
2. Verify network connectivity
3. Check load balancer configuration
4. Review client error logs

**Resolution**:
1. Restart WebSocket server
2. Fix load balancer sticky session issues
3. Scale WebSocket servers if overloaded
4. Update client reconnection logic

### Email High Latency

**Alert**: NotificationEmailHighLatency

**Symptoms**:
- Delayed email notifications
- Queue depth increasing
- Email provider timeouts

**Investigation**:
1. Check email provider status
2. Review email send logs
3. Check rate limiting
4. Verify template rendering performance

**Resolution**:
1. Switch to backup email provider if primary down
2. Increase rate limit quota with provider
3. Optimize email templates
4. Scale email workers

### Low Cache Hit Rate

**Alert**: NotificationLowCacheHitRate

**Symptoms**:
- Increased database load
- Slower response times
- High cache miss rate

**Investigation**:
1. Check cache eviction rate
2. Review cache invalidation logic
3. Verify cache key consistency
4. Check cache server resources

**Resolution**:
1. Increase cache size/TTL
2. Fix cache invalidation bugs
3. Warm up cache with common queries
4. Add caching for frequently accessed data

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64

# Install Grafana
sudo apt-get install -y adduser libfontconfig1
wget https://dl.grafana.com/oss/release/grafana_9.3.0_amd64.deb
sudo dpkg -i grafana_9.3.0_amd64.deb
```

### 2. Configure Prometheus

Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alerts/notification-alerts.yml'

scrape_configs:
  - job_name: 'notification-service'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### 3. Start Services

```bash
# Start Prometheus
./prometheus --config.file=prometheus.yml

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

### 4. Configure Grafana

1. Access Grafana: http://localhost:3000 (admin/admin)
2. Add Prometheus data source:
   - Configuration → Data Sources → Add data source
   - Select Prometheus
   - URL: http://localhost:9090
   - Save & Test

3. Import dashboards:
   - Dashboards → Import
   - Upload each dashboard JSON file

### 5. Configure Logging

For ELK Stack:

```bash
# Install Elasticsearch
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.5.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.5.0-linux-x86_64.tar.gz

# Install Logstash
wget https://artifacts.elastic.co/downloads/logstash/logstash-8.5.0-linux-x86_64.tar.gz
tar -xzf logstash-8.5.0-linux-x86_64.tar.gz

# Install Kibana
wget https://artifacts.elastic.co/downloads/kibana/kibana-8.5.0-linux-x86_64.tar.gz
tar -xzf kibana-8.5.0-linux-x86_64.tar.gz
```

Logstash configuration:
```ruby
input {
  file {
    path => "/var/log/notification/*.log"
    codec => "json"
  }
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "notification-logs-%{+YYYY.MM.dd}"
  }
}
```

### 6. Environment Variables

```bash
# Application
export LOG_LEVEL=info
export APP_VERSION=1.0.0

# Monitoring
export ENABLE_METRICS=true
export METRICS_PATH=/metrics

# Health Checks
export HEALTH_CHECK_TIMEOUT=5000
```

---

## Production Checklist

- [ ] Prometheus configured and scraping metrics
- [ ] Grafana dashboards imported
- [ ] AlertManager configured with PagerDuty/Slack
- [ ] Log aggregation configured (ELK/Splunk)
- [ ] Health checks integrated with Kubernetes
- [ ] Correlation IDs propagated across services
- [ ] Sensitive data redaction verified
- [ ] Performance budgets defined
- [ ] Runbooks documented and accessible
- [ ] On-call rotation established
- [ ] Monitoring reviewed in post-mortems

---

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Site Reliability Engineering Book](https://sre.google/books/)
