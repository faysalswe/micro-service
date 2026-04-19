// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { MongoClient, Db } from 'mongodb';
import CircuitBreaker from 'opossum';
import { initializeTracing } from './tracing';
import { logger } from './logger';
import { HealthImplementation, ServingStatusMap } from 'grpc-health-check';
import { createRestApi } from './rest-api';
import { seedDatabase } from './data/seeder';
import { CONFIG } from './constants/config';

// Static gRPC Imports
import { connectNodeAdapter } from "@connectrpc/connect-node";
import * as http2 from "http2";
import { createPaymentHandler } from "./api/grpc/payment-handler";

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
const mongoUri = CONFIG.DB.URI || 'mongodb://admin:password123@localhost:27017';
const dbName = CONFIG.DB.NAME;
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
  timeout: CONFIG.BREAKER.TIMEOUT, 
  errorThresholdPercentage: CONFIG.BREAKER.ERROR_THRESHOLD, 
  resetTimeout: CONFIG.BREAKER.RESET_TIMEOUT 
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
    }, CONFIG.HEALTH.CHECK_INTERVAL);
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  }

  // Create gRPC Server using Connect Node Adapter
  const routes = createPaymentHandler(db, dbBreaker, updateBreaker);
  const handler = connectNodeAdapter({ routes });
  const grpcServer = http2.createServer(handler);
  
  const grpcPort = CONFIG.SERVER.GRPC_PORT;
  grpcServer.listen(parseInt(grpcPort, 10), '0.0.0.0', () => {
    logger.info(`Configured Endpoint: Grpc (Static) -> http://0.0.0.0:${grpcPort} (Http2)`);
  });

  // Start REST API server
  const restApp = createRestApi(db);
  const restPort = parseInt(CONFIG.SERVER.REST_PORT, 10);

  restApp.listen(restPort, '0.0.0.0', () => {
    logger.info(`Configured Endpoint: Http -> http://0.0.0.0:${restPort} (Http1)`);
    logger.info(`API Documentation (Scalar): http://localhost:${restPort}/api-docs`);
  });
}

main();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - initiating graceful shutdown');
  setHealthStatus('NOT_SERVING');
  setTimeout(() => process.exit(0), CONFIG.HEALTH.SHUTDOWN_DELAY);
});

process.on('SIGINT', () => {
  setHealthStatus('NOT_SERVING');
  process.exit(0);
});
