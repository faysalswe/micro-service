# Grafana Loki Centralized Logging & Correlation

## Overview
Grafana Loki provides centralized logging with automatic correlation to OpenTelemetry traces via `trace_id`. Logs and metrics are accessible in a unified Grafana UI.

## Architecture

```
┌────────────────┐        ┌────────────────┐
│ OrderService   │        │ PaymentService │
│   (Serilog)    │        │   (Winston)    │
└────────┬───────┘        └───────┬────────┘
         │ HTTP POST              │ HTTP POST
         │ to Loki                │ to Loki
         ▼                        ▼
    ┌────────────────────────────────┐
    │           Loki                 │
    │   (Store & Index Logs)         │
    │   http://localhost:3100        │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │         Grafana                │
    │   (Query & Visualize)          │
    │   http://localhost:3000        │
    └────────────────────────────────┘
```

## Key Features

### 1. Unified Grafana UI
**Problem:** ELK requires separate Kibana UI from Grafana metrics.

**Solution:** Loki integrates natively with Grafana:
- Logs + Metrics in same dashboard
- Same query interface (Explore)
- Single UI to learn

### 2. Automatic Trace Correlation
Every log entry automatically includes:
```json
{
  "timestamp": "2026-01-17T17:32:47.123Z",
  "level": "info",
  "message": "Processing payment",
  "trace_id": "abc123def456",
  "span_id": "789xyz",
  "service_name": "PaymentService",
  "order_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Workflow:**
1. Find slow request in Jaeger (e.g., 800ms latency)
2. Copy `trace_id` from Jaeger UI
3. In Grafana Explore, query: `{service="PaymentService"} |= "abc123def456"`
4. See ALL logs from that request

### 3. Label-Based Querying (LogQL)
Loki uses labels for efficient filtering, then parses log content:

```logql
# Filter by service label, then search text
{service="OrderService"} |= "error"

# Parse JSON fields and filter
{service="PaymentService"} | json | order_id="550e8400-..."
```

## Components

### Loki
**Purpose:** Store and index log entries
**Access:** http://localhost:3100
**Storage:** Filesystem-based (production would use S3/GCS)

**Configuration:** `observability/loki-config.yaml`

### Grafana (Logs)
**Purpose:** Query and visualize logs
**Access:** http://localhost:3000 → Explore → Select "Loki" datasource

## Service Configuration

### OrderService (.NET - Serilog)

**Package:** `Serilog.Sinks.Grafana.Loki`

```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service_name", "OrderService")
    .WriteTo.GrafanaLoki(
        "http://localhost:3100",
        labels: new List<LokiLabel>
        {
            new LokiLabel { Key = "service", Value = "OrderService" },
            new LokiLabel { Key = "environment", Value = "Development" }
        })
    .CreateLogger();
```

### PaymentService (Node.js - Winston)

**Package:** `winston-loki`

```typescript
import LokiTransport from 'winston-loki';

const logger = winston.createLogger({
  transports: [
    new LokiTransport({
      host: 'http://localhost:3100',
      labels: {
        service: 'PaymentService',
        environment: 'development',
      },
      json: true,
    }),
  ],
});
```

## Using Grafana for Log Analysis

### 1. Find Logs by Trace ID
**Use Case:** Jaeger shows slow trace, need detailed logs

**LogQL Query:**
```logql
{service=~".+"} |= "abc123def456"
```

### 2. Find Errors Across Services
```logql
{service=~".+"} |= "error" | json | level="error"
```

### 3. Track Business Transactions
```logql
{service="OrderService"} | json | order_id="550e8400-e29b-41d4-a716-446655440000"
```

### 4. Monitor Circuit Breaker Events
```logql
{service=~".+"} |= "Circuit breaker"
```

## LogQL Cheat Sheet

| Query | Purpose |
|-------|---------|
| `{service="OrderService"}` | All logs from OrderService |
| `{service=~".+"}` | All logs from any service |
| `\|= "text"` | Contains text (case-sensitive) |
| `\|~ "regex"` | Matches regex |
| `!= "text"` | Does NOT contain text |
| `\| json` | Parse JSON content |
| `\| json \| field="value"` | Filter by parsed field |
| `\| line_format "{{.message}}"` | Format output |

## Correlation Strategies

### 1. OpenTelemetry `trace_id` (Primary)
- Automatic via middleware
- Links logs to Jaeger traces

### 2. `X-Correlation-ID` (Business-Level)
- Manual propagation via gRPC metadata
- Survives retries

### 3. Business Entity IDs
- `order_id`, `payment_id`, `user_id`

## Performance

| Metric | ELK Stack | Loki |
|--------|-----------|------|
| RAM Usage | ~2GB | ~200MB |
| Containers | 3 | 1 |
| Query Style | Full-text KQL | Label + LogQL |

## Troubleshooting

### Logs Not Appearing in Grafana

**Check 1: Loki is running**
```bash
curl http://localhost:3100/ready
# Expected: "ready"
```

**Check 2: Labels exist**
```bash
curl http://localhost:3100/loki/api/v1/labels
# Expected: ["service", "environment", ...]
```

**Check 3: Query for recent logs**
```logql
{service=~".+"} | json
```

### Missing trace_id in Logs

**Cause:** OpenTelemetry not initialized before logger

**Fix:**
- OrderService: Ensure OTel configured in `Program.cs` before logging
- PaymentService: Call `initializeTracing()` before creating logger

## Integration with Other Tools

### Logs + Traces (Jaeger)
1. Find slow trace in Jaeger → Copy `trace_id`
2. Query Loki: `{service=~".+"} |= "trace_id_value"`

### Logs + Metrics (Prometheus/Grafana)
1. See latency spike in Grafana dashboard
2. Switch to Explore → Loki
3. Filter by time range + `|= "error"`

## Best Practices

1. **Use labels wisely:**
   - Good labels: `service`, `environment`, `level`
   - Avoid high-cardinality labels: `order_id`, `user_id`

2. **Parse JSON at query time:**
   ```logql
   {service="OrderService"} | json | order_id="123"
   ```

3. **Log at decision points:**
   - Before calling external service
   - After receiving response
   - On error/retry/fallback

4. **Include structured context:**
   ```csharp
   logger.LogInformation("Order {OrderId} created", orderId);
   ```

## Resources
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Serilog.Sinks.Grafana.Loki](https://github.com/serilog-contrib/serilog-sinks-grafana-loki)
- [winston-loki](https://github.com/JaniAnttwormo/winston-loki)
