import grpc from 'k6/experimental/grpc';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const reserveStockErrors = new Counter('reserve_stock_errors');
const reserveStockSuccess = new Rate('reserve_stock_success');
const getStockDuration = new Trend('get_stock_duration');

// Configuration
const INVENTORY_GRPC_URL = __ENV.INVENTORY_GRPC_URL || 'localhost:5013';

export const options = {
  scenarios: {
    inventory_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    'grpc_req_duration': ['p(95)<400'],
    'reserve_stock_success': ['rate>0.98'],
  },
};

const client = new grpc.Client();
// Using relative path from k6 execution directory which is tests/load-tests/
client.load(['../../protos'], 'inventory/v1/inventory.proto');

export function setup() {
  client.connect(INVENTORY_GRPC_URL, {
    plaintext: true,
  });
}

export default function () {
  const product_ids = ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005'];
  const product_id = product_ids[Math.floor(Math.random() * product_ids.length)];

  // 1. Get Stock
  const getStockRequest = { product_id: product_id };
  const getStockRes = client.invoke('inventory.v1.InventoryService/GetStock', getStockRequest);
  
  check(getStockRes, {
    'get stock ok': (r) => r && r.status === grpc.StatusOK,
    'get stock valid': (r) => r && r.message && r.message.product_id === product_id,
  });

  sleep(1);

  // 2. Reserve Stock
  const reserveRequest = {
    order_id: `order-${__VU}-${__ITER}`,
    product_id: product_id,
    quantity: Math.floor(Math.random() * 2) + 1, // 1-2 items
  };

  const startTime = Date.now();
  const reserveRes = client.invoke('inventory.v1.InventoryService/ReserveStock', reserveRequest);
  const duration = Date.now() - startTime;

  const reserveCheck = check(reserveRes, {
    'reserve stock processed': (r) => r && r.status === grpc.StatusOK,
  });

  if (reserveCheck) {
    reserveStockSuccess.add(1);
  } else {
    reserveStockSuccess.add(0);
    reserveStockErrors.add(1);
  }

  sleep(1);
}

export function teardown() {
  client.close();
}
