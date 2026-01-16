import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

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

/**
 * Implements the ProcessPayment RPC method.
 */
const processPayment = (call: any, callback: any) => {
  const { order_id, amount, user_id } = call.request;
  console.log(`[PaymentService] Processing payment for Order: ${order_id}, Amount: ${amount}`);

  // Placeholder logic for Step 3
  callback(null, {
    payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
    success: true,
    status_message: 'Payment authorized successfully.',
  });
};

/**
 * Implements the RefundPayment RPC method (Compensating Transaction).
 */
const refundPayment = (call: any, callback: any) => {
  const { payment_id, reason } = call.request;
  console.log(`[PaymentService] Refunding payment: ${payment_id}, Reason: ${reason}`);

  callback(null, {
    payment_id: payment_id,
    success: true,
    status_message: 'Refund processed successfully.',
  });
};

/**
 * Starts the gRPC server.
 */
function main() {
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
