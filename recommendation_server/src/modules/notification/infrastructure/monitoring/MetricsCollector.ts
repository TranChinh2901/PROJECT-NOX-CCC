/**
 * Infrastructure: Metrics Collector
 * Collects and exposes Prometheus-compatible metrics for the notification system
 */

import { DeliveryChannel, DeliveryStatus, NotificationType, NotificationPriority } from '../../enum/notification.enum';

interface MetricLabels {
  [key: string]: string;
}

interface Counter {
  value: number;
  labels: Map<string, number>;
}

interface Gauge {
  value: number;
  labels: Map<string, number>;
}

interface Histogram {
  count: number;
  sum: number;
  buckets: Map<number, number>;
  labels: Map<string, { count: number; sum: number; buckets: Map<number, number> }>;
}

/**
 * Lightweight Prometheus-compatible metrics collector
 * For production, replace with prom-client library
 */
export class MetricsCollector {
  private static instance: MetricsCollector;

  // Counters
  private notificationsCreatedCounter: Counter = { value: 0, labels: new Map() };
  private notificationsDeliveredCounter: Counter = { value: 0, labels: new Map() };
  private notificationsFailedCounter: Counter = { value: 0, labels: new Map() };
  private emailsSentCounter: Counter = { value: 0, labels: new Map() };
  private websocketMessagesCounter: Counter = { value: 0, labels: new Map() };
  private websocketConnectionsCounter: Counter = { value: 0, labels: new Map() };
  private websocketReconnectionsCounter: Counter = { value: 0, labels: new Map() };
  private cacheHitsCounter: Counter = { value: 0, labels: new Map() };
  private cacheMissesCounter: Counter = { value: 0, labels: new Map() };
  private apiRequestsCounter: Counter = { value: 0, labels: new Map() };
  private queueJobsProcessedCounter: Counter = { value: 0, labels: new Map() };

  // Gauges
  private websocketActiveConnectionsGauge: Gauge = { value: 0, labels: new Map() };
  private queueDepthGauge: Gauge = { value: 0, labels: new Map() };
  private unreadNotificationsGauge: Gauge = { value: 0, labels: new Map() };

  // Histograms (with default buckets)
  private readonly defaultBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  private apiLatencyHistogram: Histogram = this.createHistogram();
  private emailDeliveryDurationHistogram: Histogram = this.createHistogram();
  private databaseQueryDurationHistogram: Histogram = this.createHistogram();
  private notificationDeliveryDurationHistogram: Histogram = this.createHistogram();
  private queueJobDurationHistogram: Histogram = this.createHistogram();

  // Metadata
  private startTime: number = Date.now();

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private createHistogram(): Histogram {
    const buckets = new Map<number, number>();
    this.defaultBuckets.forEach(bucket => buckets.set(bucket, 0));
    buckets.set(Infinity, 0);
    return { count: 0, sum: 0, buckets, labels: new Map() };
  }

  private getLabelKey(labels: MetricLabels): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  // ====================
  // Counter Methods
  // ====================

  incrementNotificationsCreated(type: string, priority: string): void {
    this.notificationsCreatedCounter.value++;
    const key = this.getLabelKey({ type, priority });
    this.notificationsCreatedCounter.labels.set(
      key,
      (this.notificationsCreatedCounter.labels.get(key) || 0) + 1
    );
  }

  incrementNotificationsDelivered(channel: string, status: string): void {
    this.notificationsDeliveredCounter.value++;
    const key = this.getLabelKey({ channel, status });
    this.notificationsDeliveredCounter.labels.set(
      key,
      (this.notificationsDeliveredCounter.labels.get(key) || 0) + 1
    );
  }

  incrementNotificationsFailed(channel: string, reason: string): void {
    this.notificationsFailedCounter.value++;
    const key = this.getLabelKey({ channel, reason });
    this.notificationsFailedCounter.labels.set(
      key,
      (this.notificationsFailedCounter.labels.get(key) || 0) + 1
    );
  }

  incrementEmailsSent(status: 'success' | 'failed'): void {
    this.emailsSentCounter.value++;
    const key = this.getLabelKey({ status });
    this.emailsSentCounter.labels.set(
      key,
      (this.emailsSentCounter.labels.get(key) || 0) + 1
    );
  }

  incrementWebSocketMessages(event: string): void {
    this.websocketMessagesCounter.value++;
    const key = this.getLabelKey({ event });
    this.websocketMessagesCounter.labels.set(
      key,
      (this.websocketMessagesCounter.labels.get(key) || 0) + 1
    );
  }

  incrementWebSocketConnections(userId: string): void {
    this.websocketConnectionsCounter.value++;
    const key = this.getLabelKey({ user_id: userId });
    this.websocketConnectionsCounter.labels.set(
      key,
      (this.websocketConnectionsCounter.labels.get(key) || 0) + 1
    );
  }

  incrementWebSocketReconnections(): void {
    this.websocketReconnectionsCounter.value++;
  }

  incrementCacheHits(operation: string): void {
    this.cacheHitsCounter.value++;
    const key = this.getLabelKey({ operation });
    this.cacheHitsCounter.labels.set(
      key,
      (this.cacheHitsCounter.labels.get(key) || 0) + 1
    );
  }

  incrementCacheMisses(operation: string): void {
    this.cacheMissesCounter.value++;
    const key = this.getLabelKey({ operation });
    this.cacheMissesCounter.labels.set(
      key,
      (this.cacheMissesCounter.labels.get(key) || 0) + 1
    );
  }

  incrementApiRequests(method: string, endpoint: string, statusCode: number): void {
    this.apiRequestsCounter.value++;
    const key = this.getLabelKey({
      method,
      endpoint,
      status: statusCode.toString()
    });
    this.apiRequestsCounter.labels.set(
      key,
      (this.apiRequestsCounter.labels.get(key) || 0) + 1
    );
  }

  incrementQueueJobsProcessed(jobType: string, status: 'completed' | 'failed'): void {
    this.queueJobsProcessedCounter.value++;
    const key = this.getLabelKey({ job_type: jobType, status });
    this.queueJobsProcessedCounter.labels.set(
      key,
      (this.queueJobsProcessedCounter.labels.get(key) || 0) + 1
    );
  }

  // ====================
  // Gauge Methods
  // ====================

  setWebSocketActiveConnections(count: number): void {
    this.websocketActiveConnectionsGauge.value = count;
  }

  setQueueDepth(jobType: string, count: number): void {
    this.queueDepthGauge.value += count;
    const key = this.getLabelKey({ job_type: jobType });
    this.queueDepthGauge.labels.set(key, count);
  }

  setUnreadNotifications(userId: string, count: number): void {
    const key = this.getLabelKey({ user_id: userId });
    this.unreadNotificationsGauge.labels.set(key, count);
  }

  // ====================
  // Histogram Methods
  // ====================

  private observeHistogram(
    histogram: Histogram,
    value: number,
    labels?: MetricLabels
  ): void {
    const labelKey = labels ? this.getLabelKey(labels) : '';

    if (labelKey) {
      let labelData = histogram.labels.get(labelKey);
      if (!labelData) {
        const buckets = new Map<number, number>();
        this.defaultBuckets.forEach(bucket => buckets.set(bucket, 0));
        buckets.set(Infinity, 0);
        labelData = { count: 0, sum: 0, buckets };
        histogram.labels.set(labelKey, labelData);
      }

      labelData.count++;
      labelData.sum += value;

      for (const [bucket, count] of labelData.buckets) {
        if (value <= bucket) {
          labelData.buckets.set(bucket, count + 1);
        }
      }
    } else {
      histogram.count++;
      histogram.sum += value;

      for (const [bucket, count] of histogram.buckets) {
        if (value <= bucket) {
          histogram.buckets.set(bucket, count + 1);
        }
      }
    }
  }

  observeApiLatency(endpoint: string, method: string, durationSeconds: number): void {
    this.observeHistogram(this.apiLatencyHistogram, durationSeconds, { endpoint, method });
  }

  observeEmailDeliveryDuration(durationSeconds: number): void {
    this.observeHistogram(this.emailDeliveryDurationHistogram, durationSeconds);
  }

  observeDatabaseQueryDuration(query: string, durationSeconds: number): void {
    this.observeHistogram(this.databaseQueryDurationHistogram, durationSeconds, { query });
  }

  observeNotificationDeliveryDuration(channel: string, durationSeconds: number): void {
    this.observeHistogram(this.notificationDeliveryDurationHistogram, durationSeconds, { channel });
  }

  observeQueueJobDuration(jobType: string, durationSeconds: number): void {
    this.observeHistogram(this.queueJobDurationHistogram, durationSeconds, { job_type: jobType });
  }

  // ====================
  // Metrics Export
  // ====================

  /**
   * Export all metrics in Prometheus text format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Helper to format counter
    const formatCounter = (name: string, help: string, counter: Counter) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} counter`);

      if (counter.labels.size > 0) {
        for (const [labels, value] of counter.labels) {
          lines.push(`${name}{${labels}} ${value}`);
        }
      } else {
        lines.push(`${name} ${counter.value}`);
      }
    };

    // Helper to format gauge
    const formatGauge = (name: string, help: string, gauge: Gauge) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} gauge`);

      if (gauge.labels.size > 0) {
        for (const [labels, value] of gauge.labels) {
          lines.push(`${name}{${labels}} ${value}`);
        }
      } else {
        lines.push(`${name} ${gauge.value}`);
      }
    };

    // Helper to format histogram
    const formatHistogram = (name: string, help: string, histogram: Histogram) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} histogram`);

      if (histogram.labels.size > 0) {
        for (const [labelStr, data] of histogram.labels) {
          for (const [bucket, count] of data.buckets) {
            const le = bucket === Infinity ? '+Inf' : bucket.toString();
            lines.push(`${name}_bucket{${labelStr},le="${le}"} ${count}`);
          }
          lines.push(`${name}_sum{${labelStr}} ${data.sum}`);
          lines.push(`${name}_count{${labelStr}} ${data.count}`);
        }
      } else {
        for (const [bucket, count] of histogram.buckets) {
          const le = bucket === Infinity ? '+Inf' : bucket.toString();
          lines.push(`${name}_bucket{le="${le}"} ${count}`);
        }
        lines.push(`${name}_sum ${histogram.sum}`);
        lines.push(`${name}_count ${histogram.count}`);
      }
    };

    // Export counters
    formatCounter(
      'notification_created_total',
      'Total number of notifications created',
      this.notificationsCreatedCounter
    );
    formatCounter(
      'notification_delivered_total',
      'Total number of notifications delivered',
      this.notificationsDeliveredCounter
    );
    formatCounter(
      'notification_failed_total',
      'Total number of failed notification deliveries',
      this.notificationsFailedCounter
    );
    formatCounter(
      'email_sent_total',
      'Total number of emails sent',
      this.emailsSentCounter
    );
    formatCounter(
      'websocket_messages_total',
      'Total number of WebSocket messages',
      this.websocketMessagesCounter
    );
    formatCounter(
      'websocket_connections_total',
      'Total number of WebSocket connections',
      this.websocketConnectionsCounter
    );
    formatCounter(
      'websocket_reconnections_total',
      'Total number of WebSocket reconnections',
      this.websocketReconnectionsCounter
    );
    formatCounter(
      'cache_hits_total',
      'Total number of cache hits',
      this.cacheHitsCounter
    );
    formatCounter(
      'cache_misses_total',
      'Total number of cache misses',
      this.cacheMissesCounter
    );
    formatCounter(
      'api_requests_total',
      'Total number of API requests',
      this.apiRequestsCounter
    );
    formatCounter(
      'queue_jobs_processed_total',
      'Total number of queue jobs processed',
      this.queueJobsProcessedCounter
    );

    // Export gauges
    formatGauge(
      'websocket_active_connections',
      'Number of active WebSocket connections',
      this.websocketActiveConnectionsGauge
    );
    formatGauge(
      'queue_depth',
      'Number of jobs waiting in queue',
      this.queueDepthGauge
    );
    formatGauge(
      'unread_notifications',
      'Number of unread notifications per user',
      this.unreadNotificationsGauge
    );

    // Export histograms
    formatHistogram(
      'api_latency_seconds',
      'API endpoint latency in seconds',
      this.apiLatencyHistogram
    );
    formatHistogram(
      'email_delivery_duration_seconds',
      'Email delivery duration in seconds',
      this.emailDeliveryDurationHistogram
    );
    formatHistogram(
      'database_query_duration_seconds',
      'Database query duration in seconds',
      this.databaseQueryDurationHistogram
    );
    formatHistogram(
      'notification_delivery_duration_seconds',
      'Notification delivery duration in seconds',
      this.notificationDeliveryDurationHistogram
    );
    formatHistogram(
      'queue_job_duration_seconds',
      'Queue job processing duration in seconds',
      this.queueJobDurationHistogram
    );

    // Add process metrics
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${(Date.now() - this.startTime) / 1000}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Export metrics as JSON for custom dashboards
   */
  exportJSON(): object {
    const calculatePercentiles = (histogram: Histogram, labels?: string) => {
      const data = labels ? histogram.labels.get(labels) : histogram;
      if (!data) return { p50: 0, p95: 0, p99: 0 };

      const buckets = Array.from(data.buckets.entries()).sort((a, b) => a[0] - b[0]);
      const total = data.count;

      const findPercentile = (p: number): number => {
        const target = total * p;
        let cumulative = 0;

        for (const [bucket, count] of buckets) {
          cumulative += count;
          if (cumulative >= target) {
            return bucket === Infinity ? buckets[buckets.length - 2][0] : bucket;
          }
        }
        return 0;
      };

      return {
        p50: findPercentile(0.5),
        p95: findPercentile(0.95),
        p99: findPercentile(0.99),
      };
    };

    return {
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.startTime) / 1000,
      counters: {
        notificationsCreated: this.notificationsCreatedCounter.value,
        notificationsDelivered: this.notificationsDeliveredCounter.value,
        notificationsFailed: this.notificationsFailedCounter.value,
        emailsSent: this.emailsSentCounter.value,
        websocketMessages: this.websocketMessagesCounter.value,
        websocketConnections: this.websocketConnectionsCounter.value,
        websocketReconnections: this.websocketReconnectionsCounter.value,
        cacheHits: this.cacheHitsCounter.value,
        cacheMisses: this.cacheMissesCounter.value,
        apiRequests: this.apiRequestsCounter.value,
        queueJobsProcessed: this.queueJobsProcessedCounter.value,
      },
      gauges: {
        websocketActiveConnections: this.websocketActiveConnectionsGauge.value,
        queueDepth: this.queueDepthGauge.value,
      },
      histograms: {
        apiLatency: {
          count: this.apiLatencyHistogram.count,
          sum: this.apiLatencyHistogram.sum,
          average: this.apiLatencyHistogram.count > 0
            ? this.apiLatencyHistogram.sum / this.apiLatencyHistogram.count
            : 0,
          ...calculatePercentiles(this.apiLatencyHistogram),
        },
        emailDeliveryDuration: {
          count: this.emailDeliveryDurationHistogram.count,
          sum: this.emailDeliveryDurationHistogram.sum,
          average: this.emailDeliveryDurationHistogram.count > 0
            ? this.emailDeliveryDurationHistogram.sum / this.emailDeliveryDurationHistogram.count
            : 0,
          ...calculatePercentiles(this.emailDeliveryDurationHistogram),
        },
        databaseQueryDuration: {
          count: this.databaseQueryDurationHistogram.count,
          sum: this.databaseQueryDurationHistogram.sum,
          average: this.databaseQueryDurationHistogram.count > 0
            ? this.databaseQueryDurationHistogram.sum / this.databaseQueryDurationHistogram.count
            : 0,
          ...calculatePercentiles(this.databaseQueryDurationHistogram),
        },
      },
      calculated: {
        cacheHitRate: this.cacheHitsCounter.value + this.cacheMissesCounter.value > 0
          ? this.cacheHitsCounter.value / (this.cacheHitsCounter.value + this.cacheMissesCounter.value)
          : 0,
        deliverySuccessRate: this.notificationsDeliveredCounter.value + this.notificationsFailedCounter.value > 0
          ? this.notificationsDeliveredCounter.value / (this.notificationsDeliveredCounter.value + this.notificationsFailedCounter.value)
          : 0,
        averageQueueDepth: this.queueDepthGauge.value,
      }
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.notificationsCreatedCounter = { value: 0, labels: new Map() };
    this.notificationsDeliveredCounter = { value: 0, labels: new Map() };
    this.notificationsFailedCounter = { value: 0, labels: new Map() };
    this.emailsSentCounter = { value: 0, labels: new Map() };
    this.websocketMessagesCounter = { value: 0, labels: new Map() };
    this.websocketConnectionsCounter = { value: 0, labels: new Map() };
    this.websocketReconnectionsCounter = { value: 0, labels: new Map() };
    this.cacheHitsCounter = { value: 0, labels: new Map() };
    this.cacheMissesCounter = { value: 0, labels: new Map() };
    this.apiRequestsCounter = { value: 0, labels: new Map() };
    this.queueJobsProcessedCounter = { value: 0, labels: new Map() };

    this.websocketActiveConnectionsGauge = { value: 0, labels: new Map() };
    this.queueDepthGauge = { value: 0, labels: new Map() };
    this.unreadNotificationsGauge = { value: 0, labels: new Map() };

    this.apiLatencyHistogram = this.createHistogram();
    this.emailDeliveryDurationHistogram = this.createHistogram();
    this.databaseQueryDurationHistogram = this.createHistogram();
    this.notificationDeliveryDurationHistogram = this.createHistogram();
    this.queueJobDurationHistogram = this.createHistogram();

    this.startTime = Date.now();
  }
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();
