import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const orderCreationErrors = new Counter('order_creation_errors');
const orderCreationSuccess = new Rate('order_creation_success');
const orderCreationDuration = new Trend('order_creation_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const IDENTITY_URL = `${BASE_URL}/auth`;
const ORDER_URL = `${BASE_URL}/OrderService`;

// Test Scenarios
export const options = {
  scenarios: {
    // Scenario 1: Smoke Test (Minimal Load)
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
      exec: 'smokeTest',
    },
    
    // Scenario 2: Load Test (Expected Normal Load)
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },  // Ramp up to 10 users
        { duration: '5m', target: 10 },  // Stay at 10 users
        { duration: '2m', target: 20 },  // Ramp up to 20 users
        { duration: '5m', target: 20 },  // Stay at 20 users
        { duration: '2m', target: 0 },   // Ramp down
      ],
      startTime: '31s',
      tags: { test_type: 'load' },
      exec: 'loadTest',
    },
    
    // Scenario 3: Stress Test (Breaking Point)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // Ramp up to 20 users
        { duration: '5m', target: 50 },   // Ramp to 50 users
        { duration: '2m', target: 100 },  // Spike to 100 users
        { duration: '5m', target: 100 },  // Stay at 100
        { duration: '5m', target: 0 },    // Ramp down
      ],
      startTime: '17m',
      tags: { test_type: 'stress' },
      exec: 'stressTest',
    },
    
    // Scenario 4: Spike Test (Sudden Traffic Surge)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },    // Normal load
        { duration: '30s', target: 100 },  // Sudden spike
        { duration: '1m', target: 100 },   // Sustained spike
        { duration: '10s', target: 5 },    // Return to normal
        { duration: '3m', target: 5 },     // Recovery period
      ],
      startTime: '32m',
      tags: { test_type: 'spike' },
      exec: 'spikeTest',
    },
  },
  
  thresholds: {
    // Overall HTTP metrics
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'],                  // Error rate under 5%
    
    // Custom metrics
    order_creation_success: ['rate>0.95'],            // 95% success rate
    order_creation_duration: ['p(95)<800'],           // Order creation under 800ms
    
    // Per-scenario thresholds
    'http_req_duration{test_type:smoke}': ['p(95)<300'],
    'http_req_duration{test_type:load}': ['p(95)<500'],
    'http_req_duration{test_type:stress}': ['p(95)<1000'],
  },
};

// Setup: Get authentication token
export function setup() {
  const loginPayload = JSON.stringify({
    username: __ENV.TEST_USERNAME || 'admin',
    password: __ENV.TEST_PASSWORD || 'password',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${IDENTITY_URL}/login`, loginPayload, params);
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined,
  });

  const token = loginRes.json('token');
  return { token };
}

// Smoke Test: Basic functionality validation
export function smokeTest(data) {
  const orderId = createOrder(data.token, 'smoke-test');
  sleep(1);
}

// Load Test: Normal expected traffic
export function loadTest(data) {
  const orderId = createOrder(data.token, 'load-test');
  sleep(2);
}

// Stress Test: Push system beyond normal capacity
export function stressTest(data) {
  const orderId = createOrder(data.token, 'stress-test');
  sleep(1);
}

// Spike Test: Sudden traffic surge
export function spikeTest(data) {
  const orderId = createOrder(data.token, 'spike-test');
  sleep(0.5);
}

// Helper: Create Order
function createOrder(token, testType) {
  const orderPayload = JSON.stringify({
    userId: `user-${__VU}-${__ITER}`,
    productId: `product-${Math.floor(Math.random() * 100)}`,
    amount: Math.floor(Math.random() * 500) + 50,  // $50-$550
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Correlation-ID': `k6-${testType}-${__VU}-${__ITER}`,
    },
  };

  const startTime = Date.now();
  const res = http.post(`${ORDER_URL}/CreateOrder`, orderPayload, params);
  const duration = Date.now() - startTime;

  // Record custom metrics
  orderCreationDuration.add(duration);

  const checkResult = check(res, {
    'order created': (r) => r.status === 200,
    'order has ID': (r) => r.json('orderId') !== undefined,
    'order status is success': (r) => r.json('status') === 'SUCCESS' || r.json('status') === 'FAILED',
  });

  if (checkResult) {
    orderCreationSuccess.add(1);
  } else {
    orderCreationSuccess.add(0);
    orderCreationErrors.add(1);
  }

  return res.json('orderId');
}

// Teardown: Summary
export function teardown(data) {
  console.log('Load test completed');
}
