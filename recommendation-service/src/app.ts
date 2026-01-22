import express from 'express';
import { pinoHttp } from 'pino-http';
import { createCombinedAuthMiddleware } from './middleware/combined-auth.middleware.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp());

  // Health check (no auth)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware for GraphQL
  app.use('/graphql', createCombinedAuthMiddleware({
    db: pool,
    jwtSecret: env.JWT_SECRET,
  }));

  return app;
}
