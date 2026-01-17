import grpc from 'k6/experimental/grpc';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const paymentProcessingErrors = new Counter('payment_processing_errors');
const paymentProcessingSuccess = new Rate('payment_processing_success');
const paymentProcessingDuration = new Trend('payment_processing_duration');
const compensationCalls = new Counter('compensation_calls');

// Configuration
const PAYMENT_GRPC_URL = __ENV.PAYMENT_GRPC_URL || 'localhost:50051';

// Test Scenarios
export const options = {
  scenarios: {
    // Scenario 1: Payment Processing Load Test
    payment_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'payment_load' },
    },
    
    // Scenario 2: Mixed Operations (Payment + Refund)
    mixed_operations: {
      executor: 'constant-arrival-rate',
      rate: 10,              // 10 iterations per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      startTime: '6m',
      tags: { test_type: 'mixed' },
    },
  },
  
  thresholds: {
    'grpc_req_duration': ['p(95)<400', 'p(99)<800'],
    'payment_processing_success': ['rate>0.98'],
    'payment_processing_duration': ['p(95)<500'],
  },
};

// Setup gRPC client
const client = new grpc.Client();
client.load(['../protos'], 'payments.proto');

export function setup() {
  client.connect(PAYMENT_GRPC_URL, {
    plaintext: true,
  });
}

export default function () {
  // Randomly choose between payment and refund operations
  const operation = Math.random() > 0.8 ? 'refund' : 'payment';
  
  if (operation === 'payment') {
    processPayment();
  } else {
    processRefund();
  }
  
  sleep(1);
}

function processPayment() {
  const paymentRequest = {
    order_id: `order-${__VU}-${__ITER}`,
    amount: Math.floor(Math.random() * 900) + 100,  // $100-$1000
    user_id: `user-${__VU}`,
  };

  const startTime = Date.now();
  const response = client.invoke('payments.PaymentService/ProcessPayment', paymentRequest, {
    metadata: {
      'x-correlation-id': `k6-payment-${__VU}-${__ITER}`,
    },
  });
  const duration = Date.now() - startTime;

  paymentProcessingDuration.add(duration);

  const checkResult = check(response, {
    'payment processed': (r) => r && r.status === grpc.StatusOK,
    'payment successful': (r) => r && r.message && r.message.success === true,
    'payment ID received': (r) => r && r.message && r.message.payment_id !== '',
  });

  if (checkResult) {
    paymentProcessingSuccess.add(1);
  } else {
    paymentProcessingSuccess.add(0);
    paymentProcessingErrors.add(1);
  }
}

function processRefund() {
  const refundRequest = {
    payment_id: `pay-${Math.floor(Math.random() * 10000)}`,
    reason: 'Load test compensation',
  };

  const response = client.invoke('payments.PaymentService/RefundPayment', refundRequest, {
    metadata: {
      'x-correlation-id': `k6-refund-${__VU}-${__ITER}`,
    },
  });

  compensationCalls.add(1);

  check(response, {
    'refund processed': (r) => r && r.status === grpc.StatusOK,
    'refund message received': (r) => r && r.message && r.message.status_message !== '',
  });
}

export function teardown() {
  client.close();
}
