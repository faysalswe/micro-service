import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const loginErrors = new Counter('login_errors');
const loginSuccess = new Rate('login_success');
const registrationDuration = new Trend('registration_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const IDENTITY_URL = `${BASE_URL}/auth`;

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      exec: 'identityWorkflow',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 0 },
      ],
      exec: 'identityWorkflow',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    login_success: ['rate>0.99'],
  },
};

export function identityWorkflow() {
  const username = `user_${__VU}_${__ITER}_${Math.floor(Math.random() * 1000000)}`;
  const password = 'Password123!';

  // 1. Register
  const registerPayload = JSON.stringify({
    username: username,
    password: password,
    role: 'User',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const startTime = Date.now();
  const regRes = http.post(`${IDENTITY_URL}/register`, registerPayload, params);
  registrationDuration.add(Date.now() - startTime);

  check(regRes, {
    'registration successful': (r) => r.status === 201,
  });

  if (regRes.status !== 201) {
    return;
  }

  sleep(1);

  // 2. Login
  const loginPayload = JSON.stringify({
    username: username,
    password: password,
  });

  const loginRes = http.post(`${IDENTITY_URL}/login`, loginPayload, params);

  const loginCheck = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  if (loginCheck) {
    loginSuccess.add(1);
  } else {
    loginSuccess.add(0);
    loginErrors.add(1);
  }

  sleep(1);
}
