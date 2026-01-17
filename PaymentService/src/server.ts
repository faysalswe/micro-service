import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import CircuitBreaker from 'opossum';

dotenv.config();

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
let db: any;

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

/**
 * Implements the ProcessPayment RPC method.
 */
const processPayment = async (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
  const metadata = call.metadata.getMap();
  const correlationId = metadata['x-correlation-id'] || 'no-correlation-id';
  
  const { order_id, amount, user_id } = call.request;
  console.log(`[${correlationId}] [PaymentService] Processing payment for Order: ${order_id}, Amount: ${amount}`);

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
    
    callback(null, {
      payment_id: result.insertedId.toString(),
      success: success,
      status_message: success ? 'Payment authorized successfully.' : 'Payment declined: Amount too high.',
    });
  } catch (err: any) {
    console.error(`[${correlationId}] Error in PaymentService: ${err.message}`);
    
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
  console.log(`[PaymentService] Refunding payment: ${payment_id}, Reason: ${reason}`);

  try {
    await updateBreaker.fire({
      id: payment_id,
      update: { status: 'REFUNDED', refund_reason: reason, refunded_at: new Date() }
    });

    callback(null, {
      payment_id: payment_id,
      success: true,
      status_message: 'Refund processed successfully.',
    });
  } catch (err: any) {
    console.error(`[PaymentService] Refund Error: ${err.message}`);
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
    console.log('[PaymentService] Connected to MongoDB');
  } catch (err) {
    console.error(`[PaymentService] Failed to connect to MongoDB: ${err}`);
    process.exit(1);
  }

  const server = new grpc.Server();
  server.addService(paymentPackage.PaymentService.service, {
    processPayment: processPayment,
    refundPayment: refundPayment,
  });

  const port = '0.0.0.0:50051';
  server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, actualPort) => {
    if (err) {
      console.error(`Failed to bind server: ${err.message}`);
      return;
    }
    console.log(`[PaymentService] gRPC Server running at ${port}`);
  });
}

main();
