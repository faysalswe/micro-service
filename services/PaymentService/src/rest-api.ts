import express, { Request, Response, NextFunction } from 'express';
import { Db } from 'mongodb';
import { setupApiDocs } from './config/openapi';
import { logger } from './logger';
import { createHealthRoutes } from './api/rest/health-routes';
import { createPaymentRoutes } from './api/rest/payment-routes';

export function createRestApi(db: Db) {
  const app = express();

  // API Documentation Setup (OpenAPI + Scalar UI)
  setupApiDocs(app);

  // Middleware
  app.use(express.json());

  // Logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers['x-correlation-id'] || 'none';
    logger.info(`REST: ${req.method} ${req.path}`, { correlationId });
    next();
  });

  // Register Routes
  app.use(createHealthRoutes());
  app.use(createPaymentRoutes(db));

  return app;
}
