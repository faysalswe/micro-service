import { Router, Request, Response } from 'express';

export function createHealthRoutes() {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    const appVersion = process.env.APP_VERSION || '1.0.0-dev';
    res.json({ 
      status: 'healthy', 
      service: 'PaymentService', 
      version: appVersion,
      timestamp: new Date().toISOString() 
    });
  });

  return router;
}
