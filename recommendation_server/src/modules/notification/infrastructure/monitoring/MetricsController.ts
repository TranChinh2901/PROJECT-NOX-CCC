/**
 * Presentation: Metrics Controller
 * Exposes Prometheus and JSON metrics endpoints
 */

import { Request, Response } from 'express';
import { metricsCollector } from './MetricsCollector';

export class MetricsController {
  /**
   * Prometheus metrics endpoint
   * GET /metrics
   */
  async prometheus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = metricsCollector.exportPrometheus();

      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      res.status(200).send(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to export metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * JSON metrics endpoint (for custom dashboards)
   * GET /metrics/json
   */
  async json(req: Request, res: Response): Promise<void> {
    try {
      const metrics = metricsCollector.exportJSON();

      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to export metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
