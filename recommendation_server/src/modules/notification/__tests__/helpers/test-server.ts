/**
 * Test Server Helper
 * Provides configured Express app for testing
 */
import express, { Application } from 'express';
import notificationRouter from '@/routes/notification';
import { exceptionHandler } from '@/middlewares/exception-filter';

export class TestServer {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Test route without auth
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Notification routes (route module already applies auth)
    this.app.use('/api/v1/notifications', notificationRouter);
  }

  private setupErrorHandling(): void {
    this.app.use(exceptionHandler);
  }

  getApp(): Application {
    return this.app;
  }
}

export const createTestServer = (): Application => {
  const server = new TestServer();
  return server.getApp();
};
