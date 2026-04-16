// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import * as grpc from '@grpc/grpc-js';
import { MongoClient, Db } from 'mongodb';
import CircuitBreaker from 'opossum';
import { initializeTracing } from './tracing';
import { logger } from './logger';
import { HealthImplementation, ServingStatusMap } from 'grpc-health-check';
import { createRestApi } from './rest-api';

// Static gRPC Imports
import { createConnectRouter, ConnectRouter } from "@connectrpc/connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import * as http2 from "http2";
import { PaymentService } from "./generated/payments/v1/payments_connect";
import { 
  ProcessPaymentRequest, 
  ProcessPaymentResponse, 
  RefundPaymentRequest, 
  RefundPaymentResponse 
} from "./generated/payments/v1/payments_pb";

// Validate required environment variables
const requiredEnvVars = ['REST_PORT', 'LOKI_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error('\x1b[31m%s\x1b[0m', `   - ${varName}`);
  });
  console.error('\x1b[33m%s\x1b[0m', '\n💡 Please set these variables in your .env file or environment.');
  process.exit(1);
}

// Initialize OpenTelemetry tracing
initializeTracing();
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'payments_db';
let db: Db;

// Health Status Tracking
let currentHealthStatus: 'SERVING' | 'NOT_SERVING' = 'SERVING';

// gRPC Health Check Setup (for the REST API to report)
const healthStatusMap: ServingStatusMap = {
  '': 'SERVING',
  'payments.PaymentService': 'SERVING'
};
const healthImpl = new HealthImplementation(healthStatusMap);

// Circuit Breaker Options
const breakerOptions = {
  timeout: 3000, 
  errorThresholdPercentage: 50, 
  resetTimeout: 30000 
};

const insertPayment = async (paymentRecord: any) => {
  return await db.collection('payments').insertOne(paymentRecord);
};

const dbBreaker = new CircuitBreaker(insertPayment, breakerOptions);

const updatePayment = async ({ id, update }: { id: string, update: any }) => {
  const { ObjectId } = require('mongodb');
  return await db.collection('payments').updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
};
const updateBreaker = new CircuitBreaker(updatePayment, breakerOptions);

// Fallback logic
dbBreaker.fallback(() => {
  throw new Error('Database is currently unavailable. Circuit is OPEN.');
});
updateBreaker.fallback(() => {
  throw new Error('Database is currently unavailable. Circuit is OPEN.');
});

const setHealthStatus = (status: 'SERVING' | 'NOT_SERVING') => {
  currentHealthStatus = status;
  healthImpl.setStatus('', status);
  healthImpl.setStatus('payments.PaymentService', status);
};

// Update health status based on circuit breaker state
dbBreaker.on('open', () => {
  logger.warn('Circuit breaker OPEN - marking service as NOT_SERVING');
  setHealthStatus('NOT_SERVING');
});

dbBreaker.on('close', () => {
  logger.info('Circuit breaker CLOSED - marking service as SERVING');
  setHealthStatus('SERVING');
});

// Health check function to verify MongoDB connectivity
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!db) return false;
    await db.command({ ping: 1 });
    return true;
  } catch (err) {
    logger.error('Database health check failed', { error: (err as Error).message });
    return false;
  }
}

/**
 * Implementation of the Payment Service router
 */
const routes = (router: ConnectRouter) => {
  router.service(PaymentService, {
    async processPayment(req: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
      const { orderId, amount, userId } = req;
      logger.info('Processing payment', { orderId, amount, userId });

      try {
        const success = amount < 1000;
        const paymentRecord = {
          orderId,
          userId,
          amount,
          status: success ? 'COMPLETED' : 'DECLINED',
          created_at: new Date()
        };

        const result = await dbBreaker.fire(paymentRecord);

        return new ProcessPaymentResponse({
          paymentId: result.insertedId.toString(),
          success: success,
          statusMessage: success ? 'Payment authorized successfully.' : 'Payment declined: Amount too high.',
        });
      } catch (err: any) {
        logger.error('Error processing payment', { error: err.message, orderId });
        throw err;
      }
    },

    async refundPayment(req: RefundPaymentRequest): Promise<RefundPaymentResponse> {
      const { paymentId, reason } = req;
      logger.info('Processing refund', { paymentId, reason });

      try {
        await updateBreaker.fire({
          id: paymentId,
          update: { status: 'REFUNDED', refund_reason: reason, refunded_at: new Date() }
        });

        return new RefundPaymentResponse({
          paymentId: paymentId,
          success: true,
          statusMessage: 'Refund processed successfully.',
        });
      } catch (err: any) {
        logger.error('Refund processing failed', { error: err.message, paymentId });
        throw err;
      }
    }
  });
};

/**
 * Starts the servers.
 */
async function main() {
  try {
    const client = await MongoClient.connect(mongoUri);
    db = client.db(dbName);
    logger.info('Connected to MongoDB', { database: dbName });

    await seedDatabase(db);

    setInterval(async () => {
      const isHealthy = await checkDatabaseHealth();
      setHealthStatus(isHealthy ? 'SERVING' : 'NOT_SERVING');
    }, 30000);
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  }

  // Create gRPC Server using Connect Node Adapter
  const handler = connectNodeAdapter({ routes });
  const grpcServer = http2.createServer(handler);
  
  const grpcPort = process.env.PORT || '50012';
  grpcServer.listen(parseInt(grpcPort, 10), '0.0.0.0', () => {
    logger.info(`Configured Endpoint: Grpc (Static) -> http://0.0.0.0:${grpcPort} (Http2)`);
  });

  // Start REST API server
  const restApp = createRestApi(db);
  const restPort = parseInt(process.env.REST_PORT!, 10);

  restApp.listen(restPort, '0.0.0.0', () => {
    logger.info(`Configured Endpoint: Http -> http://0.0.0.0:${restPort} (Http1)`);
    logger.info(`API Documentation (Scalar): http://localhost:${restPort}/api-docs`);
  });
}

async function seedDatabase(db: Db) {
  const collection = db.collection('payments');
  const count = await collection.countDocuments();
  if (count === 0) {
    const seedPayments = [
      {
        orderId: "f284b868-e7c6-4318-8743-3453b3b44b20",
        userId: "admin",
        amount: 999.99,
        status: "COMPLETED",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        orderId: "d7f57c5e-8e8e-4a4a-9b9b-1c1c1c1c1c1c",
        userId: "admin",
        amount: 1199.00,
        status: "COMPLETED",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    ];
    await collection.insertMany(seedPayments);
    logger.info('✅ Payment database seeded with initial records');
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - initiating graceful shutdown');
  setHealthStatus('NOT_SERVING');
  setTimeout(() => process.exit(0), 5000);
});

process.on('SIGINT', () => {
  setHealthStatus('NOT_SERVING');
  process.exit(0);
});
