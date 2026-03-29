# Load Testing with k6

## Overview
Comprehensive load testing suite for the microservices architecture using Grafana k6, measuring performance, reliability, and breaking points under various traffic patterns.

## Test Scenarios

### OrderService Tests (`order-service.js`)

#### 1. Smoke Test (Minimal Validation)
- **Duration**: 30 seconds
- **Load**: 1 concurrent user
- **Purpose**: Validate basic functionality and catch obvious errors
- **Threshold**: p95 < 300ms

#### 2. Load Test (Normal Traffic)
- **Duration**: 16 minutes
- **Load**: Ramps 0 → 10 → 20 users
- **Purpose**: Verify system handles expected production load
- **Threshold**: p95 < 500ms, p99 < 1000ms

#### 3. Stress Test (Breaking Point)
- **Duration**: 19 minutes
- **Load**: Ramps to 100 concurrent users
- **Purpose**: Find system limits and observe degradation
- **Threshold**: p95 < 1000ms

#### 4. Spike Test (Traffic Surge)
- **Duration**: 5 minutes
- **Load**: 5 → 100 → 5 users (sudden spike)
- **Purpose**: Test autoscaling and recovery
- **Threshold**: Maintain functionality during spike

### PaymentService Tests (`payment-service.js`)

#### 1. Payment Processing Load
- **Duration**: 5 minutes
- **Load**: 0 → 10 users
- **Purpose**: Test gRPC payment endpoint under load
- **Threshold**: p95 < 400ms

#### 2. Mixed Operations
- **Duration**: 5 minutes
- **Rate**: 10 requests/second (constant arrival)
- **Purpose**: Test both ProcessPayment and RefundPayment
- **Mix**: 80% payments, 20% refunds

## Custom Metrics

### OrderService
- `order_creation_errors`: Total failed order creations
- `order_creation_success`: Success rate percentage
- `order_creation_duration`: End-to-end order processing time

### PaymentService
- `payment_processing_errors`: Total failed payments
- `payment_processing_success`: Success rate percentage
- `payment_processing_duration`: gRPC call latency
- `compensation_calls`: Number of refund requests

## Running Tests

### Prerequisites
```bash
# Install k6
brew install k6  # macOS
# or
curl https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz -L | tar xvz
```

### Local Execution

#### 1. Start Services
```bash
docker-compose up -d
```

#### 2. Run OrderService Load Test
```bash
# Full test suite (all scenarios)
k6 run load-tests/order-service.js

# Specific scenario only
k6 run --env SCENARIO=smoke load-tests/order-service.js

# Custom base URL
k6 run --env BASE_URL=http://localhost:8000 load-tests/order-service.js
```

#### 3. Run PaymentService Load Test
```bash
k6 run --env PAYMENT_GRPC_URL=localhost:50051 load-tests/payment-service.js
```

#### 4. Generate HTML Report
```bash
k6 run --out html=report.html load-tests/order-service.js
```

### CI/CD Integration
Tests run automatically in GitHub Actions on:
- Manual trigger (workflow_dispatch)
- Nightly schedule
- Before production deployments

## Performance Baselines

### Expected Results (Local Development)

| Metric | Smoke | Load | Stress |
|--------|-------|------|--------|
| p95 Response Time | < 300ms | < 500ms | < 1000ms |
| p99 Response Time | < 500ms | < 1000ms | < 2000ms |
| Success Rate | > 99% | > 95% | > 90% |
| Error Rate | < 1% | < 5% | < 10% |

### Production Baselines (Target)
- **Throughput**: 100 req/sec sustained
- **Latency**: p95 < 200ms
- **Availability**: 99.9% success rate
- **Concurrency**: 500 concurrent users

## Interpreting Results

### Green Flags ✅
- All thresholds pass
- Error rate < 5%
- Latency consistent across scenarios
- No degradation during spike recovery

### Yellow Flags ⚠️
- p95 latency > 500ms
- Error rate 5-10%
- Slow ramp-up performance
- Memory leaks during sustained load

### Red Flags 🚨
- Any threshold failure
- Error rate > 10%
- Cascading failures
- Service crashes under load

## Optimization Workflow

1. **Baseline**: Run smoke test to confirm functionality
2. **Profile**: Run load test and identify bottlenecks
3. **Optimize**: Fix identified issues (DB queries, N+1 problems, etc.)
4. **Validate**: Re-run tests to confirm improvements
5. **Document**: Update baselines with new metrics

## Advanced Usage

### Custom Scenarios
Edit `options.scenarios` in test files to create custom traffic patterns:

```javascript
custom_scenario: {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 50,
  stages: [
    { duration: '5m', target: 100 },
  ],
}
```

### Cloud Execution
```bash
# Run distributed test from k6 Cloud
k6 cloud load-tests/order-service.js
```

### Prometheus Integration
```bash
# Export metrics to Prometheus
k6 run --out experimental-prometheus-rw load-tests/order-service.js
```

## Troubleshooting

### High Error Rates
- Check service logs: `docker-compose logs order-service`
- Verify database connections
- Check circuit breaker status

### Timeout Errors
- Increase `http_req_duration` threshold
- Scale service replicas
- Optimize database queries

### Memory Issues
- Monitor with: `docker stats`
- Check for memory leaks in services
- Adjust Docker resource limits

## Next Steps
- **Step 17**: Integrate with OpenTelemetry for distributed tracing during load tests
- **Step 19**: Visualize k6 metrics in Grafana dashboards
- **Phase 5**: Automated performance regression detection in CI/CD
