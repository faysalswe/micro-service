import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
import CircuitBreaker from 'opossum';
import { initializeTracing } from './tracing';
import { logger, logWithContext } from './logger';
import { HealthImplementation, ServingStatusMap } from 'grpc-health-check';
import { createRestApi } from './rest-api';

dotenv.config();

// Initialize OpenTelemetry tracing FIRST
initializeTracing();

logger.info('Starting PaymentService');

// Load the protobuf file
const PROTO_PATH = path.resolve(__dirname, '../../protos/payments.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition) as any;
const paymentPackage = paymentProto.payments;

// MongoDB Setup
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'payments_db';
let db: Db;

// gRPC Health Check Setup
const healthStatusMap: ServingStatusMap = {
  '': 'SERVING',  // Overall service status
  'payments.PaymentService': 'SERVING'  // Specific service status
};
const healthImpl = new HealthImplementation(healthStatusMap);

// Circuit Breaker Options
const breakerOptions = {
  timeout: 3000, // If our DB takes > 3s, fail
  errorThresholdPercentage: 50, // Trip if 50% fail
  resetTimeout: 30000 // Wait 30s before trying again
};

const insertPayment = async (paymentRecord: any) => {
  return await db.collection('payments').insertOne(paymentRecord);
};

const dbBreaker = new CircuitBreaker(insertPayment, breakerOptions);

// Define a separate breaker or use the same for updates
const updatePayment = async ({ id, update }: { id: string, update: any }) => {
  const { ObjectId } = require('mongodb');
  return await db.collection('payments').updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
};
const updateBreaker = new CircuitBreaker(updatePayment, breakerOptions);

// Fallback logic if the circuit is open
dbBreaker.fallback(() => {
  throw new Error('Database is currently unavailable. Circuit is OPEN.');
});
updateBreaker.fallback(() => {
  throw new Error('Database is currently unavailable. Circuit is OPEN.');
});

// Update health status based on circuit breaker state
dbBreaker.on('open', () => {
  logger.warn('Circuit breaker OPEN - marking service as NOT_SERVING');
  healthImpl.setStatus('payments.PaymentService', 'NOT_SERVING');
  healthImpl.setStatus('', 'NOT_SERVING');
});

dbBreaker.on('halfOpen', () => {
  logger.info('Circuit breaker HALF_OPEN - service recovering');
});

dbBreaker.on('close', () => {
  logger.info('Circuit breaker CLOSED - marking service as SERVING');
  healthImpl.setStatus('payments.PaymentService', 'SERVING');
  healthImpl.setStatus('', 'SERVING');
});

// Health check function to verify MongoDB connectivity
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.command({ ping: 1 });
    return true;
  } catch (err) {
    logger.error('Database health check failed', { error: (err as Error).message });
    return false;
  }
}

// Periodic health check (every 30 seconds)
setInterval(async () => {
  const isHealthy = await checkDatabaseHealth();
  if (!isHealthy) {
    healthImpl.setStatus('payments.PaymentService', 'NOT_SERVING');
    healthImpl.setStatus('', 'NOT_SERVING');
  } else {
    healthImpl.setStatus('payments.PaymentService', 'SERVING');
    healthImpl.setStatus('', 'SERVING');
  }
}, 30000);

/**
 * Implements the ProcessPayment RPC method.
 */
const processPayment = async (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
  const metadata = call.metadata.getMap();
  const correlationId = metadata['x-correlation-id'] || 'no-correlation-id';
  
  const { order_id, amount, user_id } = call.request;
  
  logger.info('Processing payment', {
    order_id,
    amount,
    user_id,
    correlation_id: correlationId
  });

  try {
    const success = amount < 1000;
    const paymentRecord = {
      order_id,
      user_id,
      amount,
      status: success ? 'COMPLETED' : 'DECLINED',
      correlation_id: correlationId,
      created_at: new Date()
    };

    // Use Circuit Breaker to perform the DB insertion
    const result = await dbBreaker.fire(paymentRecord);
    
    logger.info('Payment processed successfully', {
      payment_id: result.insertedId.toString(),
      order_id,
      status: success ? 'COMPLETED' : 'DECLINED'
    });
    
    callback(null, {
      payment_id: result.insertedId.toString(),
      success: success,
      status_message: success ? 'Payment authorized successfully.' : 'Payment declined: Amount too high.',
    });
  } catch (err: any) {
    logger.error('Error processing payment', {
      error: err.message,
      stack: err.stack,
      order_id,
      correlation_id: correlationId
    });
    
    // Check if error is from the Circuit Breaker
    const isCircuitOpen = err.message.includes('Circuit is OPEN');
    
    callback({
      code: isCircuitOpen ? grpc.status.UNAVAILABLE : grpc.status.INTERNAL,
      message: isCircuitOpen ? 'Payment system is overloaded (Circuit Open)' : 'Internal Database Error',
    });
  }
};

/**
 * Implements the RefundPayment RPC method (Compensating Transaction).
 */
const refundPayment = async (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
  const { payment_id, reason } = call.request;
  
  logger.info('Processing refund', { payment_id, reason });

  try {
    await updateBreaker.fire({
      id: payment_id,
      update: { status: 'REFUNDED', refund_reason: reason, refunded_at: new Date() }
    });

    logger.info('Refund processed successfully', { payment_id });

    callback(null, {
      payment_id: payment_id,
      success: true,
      status_message: 'Refund processed successfully.',
    });
  } catch (err: any) {
    logger.error('Refund processing failed', {
      error: err.message,
      stack: err.stack,
      payment_id
    });
    callback({
      code: grpc.status.INTERNAL,
      message: `Refund error: ${err.message}`,
    });
  }
};

/**
 * Starts the gRPC server.
 */
async function main() {
  // Connect to MongoDB
  try {
    const client = await MongoClient.connect(mongoUri);
    db = client.db(dbName);
    logger.info('Connected to MongoDB', { database: dbName });
  } catch (err: any) {
    logger.error('Failed to connect to MongoDB', { error: err.message, stack: err.stack });
    process.exit(1);
  }

  const server = new grpc.Server();

  // Add Payment service
  server.addService(paymentPackage.PaymentService.service, {
    processPayment: processPayment,
    refundPayment: refundPayment,
  });

  // Add gRPC Health service for Kubernetes probes
  healthImpl.addToServer(server);
  logger.info('gRPC Health service registered');

  const grpcPort = `0.0.0.0:${process.env.PORT || '50051'}`;
  server.bindAsync(grpcPort, grpc.ServerCredentials.createInsecure(), (err, actualPort) => {
    if (err) {
      logger.error('Failed to bind gRPC server', { error: err.message });
      return;
    }
    logger.info('gRPC server started', { address: grpcPort, actualPort });
  });

  // Start REST API server
  const restApp = createRestApi(db);
  const restPort = process.env.REST_PORT || '5012';
  restApp.listen(restPort, () => {
    logger.info('REST API server started', { port: restPort });
  });
}

main();

// Graceful shutdown handling for Kubernetes
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - initiating graceful shutdown');
  healthImpl.setStatus('', 'NOT_SERVING');
  healthImpl.setStatus('payments.PaymentService', 'NOT_SERVING');

  // Allow time for load balancer to stop sending traffic
  setTimeout(() => {
    logger.info('Shutting down gRPC server');
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received - initiating graceful shutdown');
  healthImpl.setStatus('', 'NOT_SERVING');
  healthImpl.setStatus('payments.PaymentService', 'NOT_SERVING');
  process.exit(0);
});
