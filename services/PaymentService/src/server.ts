import './loadenv';

import { MongoClient, Db } from 'mongodb';
import CircuitBreaker from 'opossum';
import { initializeTracing } from './tracing';
import { logger } from './logger';
import { setStatus } from './health-status';
import { HealthCheckResponse_ServingStatus } from './generated/grpc/health/v1/health_pb';
import { createRestApi } from './rest-api';
import { seedDatabase } from './data/seeder';
import { CONFIG, INTERNAL_CONSTANTS } from './constants/config';

// Static gRPC Imports
import { ConnectRouter } from "@connectrpc/connect";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import * as http2 from "http2";
import { createPaymentHandler } from "./api/grpc/payment-handler";
import { createHealthHandler } from "./api/grpc/health-handler";

// Initialize OpenTelemetry tracing
initializeTracing();
const mongoUri = CONFIG.DB.URI;
const dbName = CONFIG.DB.NAME;
let db: Db;


// Circuit Breaker Options
const breakerOptions = {
  timeout: CONFIG.TUNING.CIRCUIT_BREAKER_TIMEOUT, 
  errorThresholdPercentage: INTERNAL_CONSTANTS.BREAKER.ERROR_THRESHOLD, 
  resetTimeout: INTERNAL_CONSTANTS.BREAKER.RESET_TIMEOUT 
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
  const servingStatus = status === 'SERVING'
    ? HealthCheckResponse_ServingStatus.SERVING
    : HealthCheckResponse_ServingStatus.NOT_SERVING;
  setStatus('', servingStatus);
  setStatus('payments.v1.PaymentService', servingStatus);
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
    }, INTERNAL_CONSTANTS.HEALTH.CHECK_INTERVAL);
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  }

  // Create gRPC Server using Connect Node Adapter
  const routes = (router: ConnectRouter) => {
    createPaymentHandler(db, dbBreaker, updateBreaker)(router);
    createHealthHandler()(router);
  };
  const handler = connectNodeAdapter({ routes });
  const grpcServer = http2.createServer(handler);
  
  const grpcPort = CONFIG.SERVER.PORT;
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
  setTimeout(() => process.exit(0), INTERNAL_CONSTANTS.HEALTH.SHUTDOWN_DELAY);
});

process.on('SIGINT', () => {
  setHealthStatus('NOT_SERVING');
  process.exit(0);
});
