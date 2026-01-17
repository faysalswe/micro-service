# OpenTelemetry & Distributed Tracing

## Overview
OpenTelemetry provides distributed tracing across the microservices architecture, enabling end-to-end visibility of request flows through the Saga pattern.

## Architecture

```
Client Request
     │
     ↓
┌────────────────┐
│ OrderService   │──→ Generates Trace (Root Span)
│ (.NET)         │
└────────────────┘
     │ gRPC call
     ↓
┌────────────────┐
│ PaymentService │──→ Child Span (auto-propagated)
│ (Node.js)      │
└────────────────┘
     │
     ↓
   MongoDB ──→ Database Span
     │
     ↓
┌──────────────────┐
│ OTel Collector   │──→ Aggregates all spans
└──────────────────┘
     │
     ↓
┌────────────┐
│   Jaeger   │──→ Visualizes complete trace
│     UI     │
└────────────┘
```

## Components

### 1. OpenTelemetry Collector
**Purpose:** Central aggregation point for telemetry data
- **Location:** `http://localhost:4317` (gRPC)
- **Config:** `observability/otel-collector-config.yaml`
- **Functions:**
  - Receives traces from services via OTLP
  - Batches and processes trace data
  - Exports to Jaeger for visualization
  - Exports metrics to Prometheus

### 2. Jaeger (Tracing UI)
**Purpose:** Visualize distributed traces
- **UI:** `http://localhost:16686`
- **Features:**
  - End-to-end request flow visualization
  - Service dependency mapping
  - Latency breakdown by span
  - Error tracking across services

### 3. Service Instrumentation

#### OrderService (.NET)
**Packages:**
- `OpenTelemetry.Extensions.Hosting`
- `OpenTelemetry.Instrumentation.AspNetCore`
- `OpenTelemetry.Instrumentation.GrpcNetClient`
- `OpenTelemetry.Instrumentation.EntityFrameworkCore`

**Auto-instrumented:**
- HTTP/gRPC incoming requests
- Outgoing gRPC client calls
- Entity Framework database queries
- HTTP client requests

#### PaymentService (Node.js)
**Packages:**
- `@opentelemetry/sdk-trace-node`
- `@opentelemetry/instrumentation-grpc`
- `@opentelemetry/exporter-trace-otlp-grpc`

**Auto-instrumented:**
- gRPC server handlers
- Outgoing gRPC calls
- Database operations (future: MongoDB instrumentation)

## Trace Propagation

### W3C Trace Context Standard
OpenTelemetry uses W3C Trace Context headers for cross-service correlation:

```
traceparent: 00-{trace-id}-{span-id}-{trace-flags}
```

**Example Flow:**
```
1. Client → OrderService
   traceparent: 00-abc123-def456-01

2. OrderService → PaymentService (auto-propagated)
   traceparent: 00-abc123-789xyz-01
   └─ Same trace-id (abc123) links the services
   └─ New span-id (789xyz) for PaymentService operation

3. PaymentService → MongoDB
   traceparent: 00-abc123-111aaa-01
   └─ Still same trace-id!
```

### Correlation with X-Correlation-ID
Our existing `X-Correlation-ID` header complements OpenTelemetry:
- **X-Correlation-ID:** Business-level request tracking (logs, debugging)
- **traceparent:** Technical trace linking (spans, latency)

Both headers are automatically propagated through the system.

## Using Jaeger UI

### 1. Access the Interface
```bash
open http://localhost:16686
```

### 2. Find Traces
**Search Options:**
- Service: `OrderService` or `PaymentService`
- Operation: `POST /CreateOrder` or `ProcessPayment`
- Tags: `error=true` (find failed requests)
- Lookback: Last 1 hour

### 3. Analyze a Trace
**Spans Hierarchy Example:**
```
OrderService: CreateOrder [800ms total]
├─ Database: INSERT order [50ms]
├─ gRPC Call: PaymentService.ProcessPayment [600ms]
│  ├─ MongoDB: INSERT payment [80ms]
│  └─ Business Logic [20ms]
├─ gRPC Call: PaymentService.RefundPayment [100ms] ← Compensation!
└─ Database: UPDATE order status [50ms]
```

**What You See:**
- **Total Duration:** 800ms (matches load test p95!)
- **Bottleneck:** PaymentService call takes 600ms (75% of total)
- **Compensation:** RefundPayment span indicates saga rollback
- **Database Time:** 180ms total across both services

### 4. Error Tracing
**Red Spans = Errors:**
- Click on red span to see exception details
- Follow trace backwards to find root cause
- Check if circuit breaker was triggered

## Key Metrics from Traces

### Latency Breakdown
```
End-to-End: 800ms
├─ Network (gRPC): 100ms (12.5%)
├─ OrderService Processing: 100ms (12.5%)
├─ PaymentService Processing: 600ms (75%) ← Optimize this!
└─ Database: 180ms (22.5%)
```

### Service Dependencies
Jaeger auto-generates dependency graph:
```
Client → OrderService (500 req/min)
         └→ PaymentService (500 req/min)
            └→ MongoDB (1000 queries/min)
```

### Error Rate by Service
```
OrderService: 2% error rate
PaymentService: 5% error rate ← Investigation needed
```

## Correlation with Load Tests

### Before Optimization
```
k6 Load Test Results:
- p95: 800ms

Jaeger Trace Analysis:
- PaymentService: 600ms (75% of total)
- Root Cause: N+1 database queries
```

### After Optimization
```
k6 Load Test Results:
- p95: 500ms (37.5% improvement)

Jaeger Trace Analysis:
- PaymentService: 300ms (now 60% of total)
- Fix Confirmed: Single batched query
```

**Proof:** Tracing shows WHERE the improvement happened!

## Configuration

### Environment Variables
```bash
# OrderService
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_SERVICE_NAME=OrderService

# PaymentService
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_SERVICE_NAME=PaymentService
```

### Custom Spans (Advanced)
```csharp
// OrderService - Add custom business logic span
using var activity = ActivitySource.StartActivity("ValidateOrder");
activity?.SetTag("order.id", orderId);
activity?.SetTag("order.amount", amount);

// If error occurs
activity?.SetStatus(ActivityStatusCode.Error, "Validation failed");
```

```typescript
// PaymentService - Add custom span
const span = tracer.startSpan('ProcessPayment');
span.setAttribute('payment.amount', amount);
span.setAttribute('payment.user_id', userId);

try {
  // Business logic
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
} finally {
  span.end();
}
```

## Troubleshooting

### No Traces Appearing
```bash
# 1. Check OTel Collector health
curl http://localhost:13133/health

# 2. Check services are exporting
docker logs order-service | grep "OpenTelemetry"
docker logs payment-service | grep "Tracing"

# 3. Check OTel Collector logs
docker logs otel-collector
```

### Incomplete Traces
**Symptom:** Only see OrderService span, not PaymentService
**Causes:**
- PaymentService not initialized tracing
- gRPC metadata not propagated
- Network issue between services

**Debug:**
```bash
# Check if traceparent header is sent
docker logs order-service | grep "traceparent"
```

### High Overhead
**Symptom:** Performance degradation after enabling tracing
**Solution:**
- Adjust sampling rate (only trace 10% of requests)
- Increase batch size in collector config
- Disable debug logging

## Integration with CI/CD

### Automated Trace Validation
```yaml
# .github/workflows/trace-validation.yml
- name: Run Load Test with Tracing
  run: k6 run load-tests/order-service.js

- name: Validate Traces in Jaeger
  run: |
    # Query Jaeger API for recent traces
    curl "http://localhost:16686/api/traces?service=OrderService&limit=10"
    
    # Fail if error rate > 5%
    ERROR_COUNT=$(jq '.data[].spans[] | select(.tags[] | .key=="error" and .value==true)' traces.json | wc -l)
    if [ $ERROR_COUNT -gt 50 ]; then exit 1; fi
```

## Best Practices

1. **Always Enable in Development:** Catch issues early
2. **Use Sampling in Production:** Trace 1-10% of requests to reduce overhead
3. **Add Business Tags:** `order.type`, `payment.method` for filtering
4. **Correlate with Logs:** Include trace_id in application logs
5. **Set Alerts:** Alert if p95 latency increases by 20%

## Next Steps
- **Step 18:** ELK Stack for centralized logging (correlate with traces)
- **Step 19:** Prometheus/Grafana dashboards (RED metrics from traces)
