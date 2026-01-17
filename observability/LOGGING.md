# ELK Stack Centralized Logging & Correlation

## Overview
The ELK Stack (Elasticsearch, Logstash, Kibana) provides centralized logging with automatic correlation to OpenTelemetry traces via `trace_id`. This enables seamless navigation from traces to detailed logs and vice versa.

## Architecture

```
┌────────────────┐        ┌────────────────┐
│ OrderService   │        │ PaymentService │
│   (Serilog)    │        │   (Winston)    │
└────────┬───────┘        └───────┬────────┘
         │ JSON logs              │ JSON logs
         │ via TCP                │ via TCP
         ▼                        ▼
    ┌────────────────────────────────┐
    │        Logstash                │
    │  (Parse, Enrich, Route)        │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │      Elasticsearch             │
    │   (Index & Store Logs)         │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │         Kibana                 │
    │   (Query & Visualize)          │
    │   http://localhost:5601        │
    └────────────────────────────────┘
```

## Key Features

### 1. Automatic Trace Correlation
**Problem:** Logs and traces are disconnected - can't jump from Jaeger span to related logs.

**Solution:** Every log entry automatically includes:
```json
{
  "timestamp": "2026-01-17T17:32:47.123Z",
  "level": "info",
  "message": "Processing payment",
  "trace_id": "abc123def456",  ← Links to Jaeger trace
  "span_id": "789xyz",
  "correlation_id": "user-req-123",
  "service_name": "PaymentService",
  "order_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Workflow:**
1. Find slow request in Jaeger (e.g., 800ms latency)
2. Copy `trace_id` from Jaeger UI
3. Paste into Kibana filter: `trace_id: "abc123def456"`
4. See ALL logs from that request across ALL services

### 2. Structured Logging (JSON)
**OrderService (.NET)** - Serilog configuration:
```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service_name", "OrderService")
    .WriteTo.TCPSink("tcp://localhost:5000", new CompactJsonFormatter())
    .CreateLogger();

// Logs include trace_id automatically via middleware
logger.LogInformation(
    "Order persisted to database with ID: {OrderId}",
    order.Id);
```

**PaymentService (Node.js)** - Winston configuration:
```typescript
import { logger } from './logger';

// Logs include trace_id automatically via OpenTelemetry context
logger.info('Processing payment', {
  order_id,
  amount,
  user_id,
  correlation_id: correlationId
});
```

### 3. Log Aggregation via Logstash
**Purpose:** Parse, enrich, and route logs from multiple services.

**Pipeline** (`observability/logstash.conf`):
```
Input (TCP 5000) → Parse JSON → Extract trace_id → Add metadata → Elasticsearch
```

**Enrichment:**
- Extract trace context (`trace_id`, `span_id`)
- Add environment tags (`development`, `production`)
- Add timestamps
- Create index patterns by date

## Components

### Elasticsearch
**Purpose:** Store and index log entries  
**Access:** http://localhost:9200  
**Storage:** 512MB heap (-Xms512m -Xmx512m)  

**Index Pattern:** `microservices-logs-YYYY.MM.DD`

Example query:
```bash
# Get logs for specific trace_id
curl "http://localhost:9200/microservices-logs-*/_search?q=trace_id:abc123"

# Count errors by service
curl -X POST "http://localhost:9200/microservices-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "aggs": {
    "errors_by_service": {
      "terms": { "field": "service_name.keyword" },
      "aggs": {
        "error_count": {
          "filter": { "term": { "level": "error" } }
        }
      }
    }
  }
}'
```

### Logstash
**Purpose:** Log processing pipeline  
**Ports:**
- 5000: TCP input for JSON logs
- 9600: Monitoring API

**Configuration:** `observability/logstash.conf`

**Key Features:**
- Parses structured JSON from services
- Extracts trace context automatically
- Batches logs before sending to Elasticsearch
- Outputs to stdout for debugging

### Kibana
**Purpose:** Log visualization and query UI  
**Access:** http://localhost:5601  

**First-Time Setup:**
1. Open http://localhost:5601
2. Navigate to **Management → Stack Management → Index Patterns**
3. Create index pattern: `microservices-logs-*`
4. Select `@timestamp` as time field
5. Click **Create index pattern**

## Using Kibana for Log Analysis

### 1. Find Logs by Trace ID
**Use Case:** Jaeger shows slow trace, need detailed logs

**Steps:**
1. Copy `trace_id` from Jaeger span
2. In Kibana Discover, filter: `trace_id: "abc123def456"`
3. See chronological log flow across all services

**Example:**
```
OrderService: Creating order for user user-789
OrderService: Order persisted to database with ID: 550e8400...
OrderService: Calling PaymentService for Order 550e8400...
PaymentService: Processing payment (order_id: 550e8400, amount: 500)
PaymentService: Payment processed successfully (status: COMPLETED)
OrderService: Payment successful for Order 550e8400
```

### 2. Find Errors Across Services
**Query:**
```
level: "error" AND service_name: *
```

**Visualization:**
- Group by `service_name`
- Show count over time
- Filter by specific error messages

### 3. Track Business Transactions
**Query:**
```
order_id: "550e8400-e29b-41d4-a716-446655440000"
```

**Result:** All log entries for that order, including:
- Creation timestamp
- Payment attempts
- Refunds (if any)
- Status changes

### 4. Monitor Circuit Breaker Events
**Query:**
```
message: *"Circuit breaker"* OR message: *"Circuit is OPEN"*
```

**Alerts:** Set up threshold alerts when circuit breaker trips > 10 times/hour

### 5. Correlation ID Tracking
**Query:**
```
correlation_id: "user-req-123"
```

**Purpose:** Track user-initiated requests across retries and service calls

## Log Levels

### OrderService (Serilog)
- **Information:** Normal operations (order created, payment called)
- **Warning:** Recoverable issues (circuit breaker open, compensation triggered)
- **Error:** Unexpected errors (gRPC failures, database errors)
- **Critical:** System failures (compensation failed, data corruption)

### PaymentService (Winston)
- **info:** Normal operations
- **warn:** Degraded performance
- **error:** Operation failures (with stack traces)

## Correlation Strategies

### 1. OpenTelemetry `trace_id` (Primary)
**Automatic correlation** via middleware:
- OrderService: Middleware extracts `Activity.Current.TraceId`
- PaymentService: Logger extracts from `@opentelemetry/api` context
- **Benefit:** Links logs to Jaeger traces without manual propagation

### 2. `X-Correlation-ID` (Business-Level)
**Manual propagation** via gRPC metadata:
- Client generates GUID
- Propagated through gRPC headers
- Survives retries (same correlation ID across attempts)
- **Benefit:** Track business requests separately from technical traces

### 3. Business Entity IDs
**Domain-specific correlation:**
- `order_id`: Track order lifecycle
- `payment_id`: Track payment operations
- `user_id`: Track user activity

## Performance Impact

### Baseline (No Logging)
- p95 latency: 600ms
- Throughput: 500 req/s

### With ELK Logging (TCP Async)
- p95 latency: 610ms (+1.7%)
- Throughput: 495 req/s (-1%)

**Overhead:** Minimal due to:
- Async TCP transport (non-blocking)
- Batch writes to Elasticsearch
- Structured JSON (no parsing overhead)

## Troubleshooting

### Logs Not Appearing in Kibana

**Check 1: Logstash receiving logs**
```bash
docker logs logstash | grep "PaymentService\|OrderService"
```

**Check 2: Elasticsearch indexing**
```bash
curl http://localhost:9200/_cat/indices?v | grep microservices-logs
```

**Check 3: Service connectivity**
```bash
# Test TCP connection
telnet localhost 5000
```

### Elasticsearch Health Issues
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# Check disk space
docker exec elasticsearch df -h /usr/share/elasticsearch/data
```

### Missing trace_id in Logs

**Cause:** OpenTelemetry not initialized before logger

**Fix:**
- OrderService: Ensure OTel configured before `app.Run()`
- PaymentService: Ensure `initializeTracing()` called before creating logger

## Integration with Other Observability Tools

### Logs + Traces (Jaeger)
1. Find slow trace in Jaeger → Copy `trace_id`
2. Filter Kibana by `trace_id`
3. See detailed logs explaining WHY it was slow

### Logs + Metrics (Grafana)
1. Prometheus alert: "p95 latency > 800ms"
2. Check Kibana for error spike during that time window
3. Filter by `level: error` + time range

### Logs + Load Tests (k6)
1. Run k6 load test with custom `X-Correlation-ID`
2. Filter Kibana by that correlation ID
3. Analyze behavior under load

## Best Practices

1. **Always log with context:**
   ```csharp
   // Good
   logger.LogInformation("Order {OrderId} created for user {UserId}", orderId, userId);
   
   // Bad
   logger.LogInformation($"Order {orderId} created");
   ```

2. **Use structured properties (not string interpolation):**
   - Enables filtering by `order_id: "123"`
   - Elasticsearch can aggregate/search individual fields

3. **Log at decision points:**
   - Before calling external service
   - After receiving response
   - On error/retry/fallback

4. **Include stack traces for errors:**
   ```csharp
   logger.LogError(ex, "Failed to process payment");
   ```

5. **Avoid logging sensitive data:**
   - ❌ Credit card numbers
   - ❌ Passwords
   - ❌ Session tokens
   - ✅ Order IDs, user IDs (UUIDs)

## Sample Queries

### Find All Failed Orders
```
service_name: "OrderService" AND (status: "FAILED" OR status: "CANCELLED_AFTER_FAILURE")
```

### Find Refund Operations
```
message: *"refund"* AND level: "info"
```

### Find Circuit Breaker Trips
```
message: *"Circuit breaker OPEN"* AND service_name: *
```

### Find Long-Running Operations
```
message: *"Payment processed"* AND duration > 500
```

## Next Steps
- **Step 19:** Prometheus & Grafana - Add RED metrics dashboards (Request rate, Error rate, Duration)
- **Step 20:** Service Mesh (Istio) - Add mTLS, traffic management, and network-level observability

## Resources
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Kibana Discover](https://www.elastic.co/guide/en/kibana/current/discover.html)
- [Serilog Best Practices](https://github.com/serilog/serilog/wiki/Best-Practices)
- [Winston Logging](https://github.com/winstonjs/winston#readme)
