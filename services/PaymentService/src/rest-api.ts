import express, { Request, Response, NextFunction } from 'express';
import { Db, ObjectId } from 'mongodb';
import { setupApiDocs } from './config/openapi';
import { logger } from './logger';

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

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'PaymentService', timestamp: new Date().toISOString() });
  });

  /**
   * @openapi
   * /api/payments:
   *   get:
   *     summary: List all payments
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: orderId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of payments
   */
  app.get('/api/payments', async (req: Request, res: Response) => {
    try {
      const { userId, orderId } = req.query;

      const filter: any = {};
      if (userId) filter.userId = userId;
      if (orderId) filter.orderId = orderId;

      const payments = await db.collection('payments')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      const result = payments.map(p => ({
        id: p._id.toString(),
        orderId: p.orderId,
        userId: p.userId,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        refundedAt: p.refundedAt,
        refundReason: p.refundReason
      }));

      res.json(result);
    } catch (error) {
      logger.error('Failed to get payments', { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to retrieve payments' });
    }
  });

  /**
   * GET /api/payments/:id - Get a specific payment
   */
  app.get('/api/payments/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid payment ID format' });
      }

      const payment = await db.collection('payments').findOne({ _id: new ObjectId(id) });

      if (!payment) {
        return res.status(404).json({ error: `Payment ${id} not found` });
      }

      res.json({
        id: payment._id.toString(),
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        refundedAt: payment.refundedAt,
        refundReason: payment.refundReason
      });
    } catch (error) {
      logger.error('Failed to get payment', { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to retrieve payment' });
    }
  });

  /**
   * @openapi
   * /api/payments:
   *   post:
   *     summary: Process a new payment
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               orderId:
   *                 type: string
   *               userId:
   *                 type: string
   *               amount:
   *                 type: number
   *     responses:
   *       201:
   *         description: Payment processed
   *       400:
   *         description: Invalid input
   */
  app.post('/api/payments', async (req: Request, res: Response) => {
    try {
      const { orderId, userId, amount } = req.body;

      if (!orderId || !userId || !amount) {
        return res.status(400).json({ error: 'Missing required fields: orderId, userId, amount' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }

      // Simulate payment processing
      const shouldFail = userId === 'fail-payment';

      const paymentRecord = {
        orderId,
        userId,
        amount,
        status: shouldFail ? 'FAILED' : 'COMPLETED',
        createdAt: new Date().toISOString()
      };

      const result = await db.collection('payments').insertOne(paymentRecord);

      logger.info(`Payment processed: ${result.insertedId}`, { orderId, status: paymentRecord.status });

      if (shouldFail) {
        return res.status(400).json({
          success: false,
          paymentId: result.insertedId.toString(),
          status: 'FAILED',
          message: 'Payment declined (simulated failure)'
        });
      }

      res.status(201).json({
        success: true,
        paymentId: result.insertedId.toString(),
        status: 'COMPLETED',
        message: 'Payment processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process payment', { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to process payment' });
    }
  });

  /**
   * POST /api/payments/:id/refund - Refund a payment
   */
  app.post('/api/payments/:id/refund', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid payment ID format' });
      }

      const payment = await db.collection('payments').findOne({ _id: new ObjectId(id) });

      if (!payment) {
        return res.status(404).json({ error: `Payment ${id} not found` });
      }

      if (payment.status === 'REFUNDED') {
        return res.status(400).json({ error: 'Payment already refunded' });
      }

      if (payment.status !== 'COMPLETED') {
        return res.status(400).json({ error: `Cannot refund payment with status: ${payment.status}` });
      }

      await db.collection('payments').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'REFUNDED',
            refundedAt: new Date().toISOString(),
            refundReason: reason || 'No reason provided'
          }
        }
      );

      logger.info(`Payment refunded: ${id}`, { reason });

      res.json({
        success: true,
        paymentId: id,
        status: 'REFUNDED',
        message: 'Payment refunded successfully'
      });
    } catch (error) {
      logger.error('Failed to refund payment', { error: (error as Error).message });
      res.status(500).json({ error: 'Failed to refund payment' });
    }
  });

  return app;
}
