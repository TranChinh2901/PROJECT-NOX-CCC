/**
 * Presentation: Health Check Controller
 * Provides liveness, readiness, and detailed health status endpoints
 */

import { Request, Response } from 'express';
import { AppDataSource } from '@/config/database.config';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  reason?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: HealthCheck;
    redis?: HealthCheck;
    websocket: HealthCheck;
    emailService: HealthCheck;
  };
  metrics?: {
    notificationsCreated: number;
    notificationsDelivered: number;
    websocketConnections: number;
    queueDepth: number;
  };
}

export class HealthController {
  private startTime: number = Date.now();
  private version: string = process.env.APP_VERSION || '1.0.0';

  /**
   * Liveness probe - checks if server is running
   * Used by Kubernetes to restart unhealthy pods
   * GET /health/live
   */
  async liveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Readiness probe - checks if server can accept traffic
   * Used by Kubernetes to route traffic only to ready pods
   * GET /health/ready
   */
  async readiness(req: Request, res: Response): Promise<void> {
    try {
      // Check critical dependencies
      const dbCheck = await this.checkDatabase();
      const wsCheck = await this.checkWebSocket();

      // Service is ready if all critical checks pass
      const isReady = dbCheck.status === 'healthy' && wsCheck.status === 'healthy';

      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: dbCheck,
            websocket: wsCheck,
          },
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          checks: {
            database: dbCheck,
            websocket: wsCheck,
          },
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Detailed health status - comprehensive health information
   * GET /health/status
   */
  async status(req: Request, res: Response): Promise<void> {
    try {
      // Run all health checks
      const [dbCheck, wsCheck, emailCheck] = await Promise.all([
        this.checkDatabase(),
        this.checkWebSocket(),
        this.checkEmailService(),
      ]);

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (
        dbCheck.status === 'unhealthy' ||
        wsCheck.status === 'unhealthy'
      ) {
        overallStatus = 'unhealthy';
      } else if (
        dbCheck.status === 'degraded' ||
        wsCheck.status === 'degraded' ||
        emailCheck.status === 'degraded'
      ) {
        overallStatus = 'degraded';
      }

      // Get metrics (optional - comment out if MetricsCollector not available)
      const metrics = await this.getMetrics();

      const healthStatus: HealthStatus = {
        status: overallStatus,
        version: this.version,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck,
          websocket: wsCheck,
          emailService: emailCheck,
        },
        metrics,
      };

      // Return appropriate status code
      const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ====================
  // Health Check Methods
  // ====================

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();

      // Check if database is initialized
      if (!AppDataSource.isInitialized) {
        return {
          status: 'unhealthy',
          reason: 'Database not initialized',
        };
      }

      // Simple query to check connection
      await AppDataSource.query('SELECT 1');

      const latency = Date.now() - startTime;

      // Latency thresholds
      if (latency > 1000) {
        return {
          status: 'degraded',
          latency,
          reason: 'High database latency',
        };
      }

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkWebSocket(): Promise<HealthCheck> {
    try {
      // In production, check actual WebSocket server status
      // For now, assume healthy if no errors
      const startTime = Date.now();

      // Check if WebSocket service is available
      // This would require injecting the WebSocket service
      // For now, return basic health status

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error instanceof Error ? error.message : 'WebSocket check failed',
      };
    }
  }

  private async checkEmailService(): Promise<HealthCheck> {
    try {
      // In production, check email service connectivity
      // This could be a simple ping to email provider API
      const startTime = Date.now();

      // Simulate check
      const latency = Date.now() - startTime;

      // For mock service, always return healthy
      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'degraded',
        reason: error instanceof Error ? error.message : 'Email service check failed',
      };
    }
  }

  private async getMetrics(): Promise<HealthStatus['metrics']> {
    try {
      // Import metrics collector dynamically to avoid circular dependencies
      const { metricsCollector } = await import('./MetricsCollector');
      const metrics = metricsCollector.exportJSON() as any;

      return {
        notificationsCreated: metrics.counters?.notificationsCreated || 0,
        notificationsDelivered: metrics.counters?.notificationsDelivered || 0,
        websocketConnections: metrics.counters?.websocketConnections || 0,
        queueDepth: metrics.gauges?.queueDepth || 0,
      };
    } catch (error) {
      // Metrics not available
      return undefined;
    }
  }
}
