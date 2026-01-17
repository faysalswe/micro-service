# Prometheus & Grafana Metrics & Alerting

## Overview
Prometheus provides time-series metrics collection and storage, while Grafana visualizes them via dashboards. Combined with OpenTelemetry, they create a complete observability picture: **RED metrics** (Request Rate, Error Rate, Duration) for application performance.

## Architecture

```
┌────────────────┐        ┌────────────────┐
│ OrderService   │        │ PaymentService │
│  (OTel SDK)    │        │  (OTel SDK)    │
└────────┬───────┘        └───────┬────────┘
         │ Metrics                │ Metrics
         └────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │   OTel Collector         │
        │  (Aggregates metrics)    │
        └────────────┬─────────────┘
                     │ OTLP protocol
                     ▼
        ┌──────────────────────────┐
        │     Prometheus           │
        │  (Time-Series DB)        │
        │  http://localhost:9090   │
        └────────────┬─────────────┘
                     │ HTTP scrape
                     ▼
        ┌──────────────────────────┐
        │      Grafana             │
        │  (Dashboards & Alerts)   │
        │  http://localhost:3000   │
        └──────────────────────────┘
```

## Components

### 1. OpenTelemetry Collector (Metrics Processor)
**Location**: `http://localhost:4317` (gRPC)
**Metrics Export Port**: `8888` (Prometheus format)

**Functions**:
- Collects metrics from services via OTLP protocol
- Batches and aggregates metrics
- Exports to Prometheus in Prometheus format (text-based)

**Key Metrics Types**:
- **Counter**: Monotonically increasing (e.g., total requests)
- **Gauge**: Current value (e.g., active connections)
- **Histogram**: Distribution of values (e.g., latency buckets)
- **Summary**: Precomputed percentiles (deprecated in favor of histograms)

### 2. Prometheus
**Purpose**: Store and query time-series metrics
**Access**: http://localhost:9090
**Config**: `observability/prometheus.yml`

**Key Concepts**:
- **Scraping**: Prometheus pulls metrics from targets (pull model)
- **Scrape interval**: How often to collect metrics (default: 15s)
- **Retention**: How long to keep metrics (default: 15 days)
- **Time-Series**: `{metric_name, labels}` = value over time

**Prometheus Query Language (PromQL)**:
```
# Rate: requests per second (last 1 minute)
rate(rpc_server_duration_ms_count[1m])

# Histogram percentiles: p95 latency
histogram_quantile(0.95, rate(rpc_server_duration_ms_bucket[1m]))

# Sum by service: total requests by service
sum(rate(rpc_server_duration_ms_count[1m])) by (service)

# Alert: error rate > 5%
(errors / total) * 100 > 5
```

### 3. Grafana
**Purpose**: Visualize metrics and create alerts
**Access**: http://localhost:3000
**Default Credentials**: admin / admin

**Key Features**:
- Real-time dashboards with auto-refresh
- Templating: dynamic panels based on variables (service dropdown)
- Alerts: trigger when metrics cross thresholds
- Annotations: mark events on graphs (deployments, incidents)

## RED Metrics Framework

### Why RED Instead of USE?
- **RED** (Request Rate, Error Rate, Duration):
  - ✅ Application-centric (what users experience)
  - ✅ Works for both sync and async services
  - ✅ Easy to set up with gRPC/HTTP
  
- **USE** (Utilization, Saturation, Errors):
  - ✅ Infrastructure-focused (CPU, memory, disk)
  - ✅ Better for capacity planning
  - ❌ Doesn't capture application logic

**Best Practice**: Use BOTH! RED for applications, USE for infrastructure.

### 1. Request Rate
**What**: Requests per second (throughput)
**Query**: 
```promql
sum(rate(rpc_server_duration_ms_count{service=~"OrderService|PaymentService"}[1m])) by (service)
```
**Interpretation**:
- Rising rate → Increasing demand
- Sudden drop → System down or traffic redirection
- Spiky pattern → Job scheduler or batch processing

### 2. Error Rate
**What**: Percentage of requests that failed
**Query**:
```promql
sum(rate(rpc_server_duration_ms_bucket{grpc_status="UNKNOWN"}[1m])) by (service) / 
sum(rate(rpc_server_duration_ms_bucket[1m])) by (service) * 100
```
**Interpretation**:
- 0% → Healthy system
- 1-2% → Minor issues (retries handling)
- >5% → Critical issue requiring investigation

### 3. Duration (Latency)
**What**: P50, P95, P99 response times
**Query**:
```promql
histogram_quantile(0.95, sum(rate(rpc_server_duration_ms_bucket[1m])) by (le, service))
```
**Interpretation**:
- p50 = median (typical user experience)
- p95 = worst 5% of users
- p99 = worst 1% of users

**SLO Example**:
```
p95 latency < 500ms for 99.9% of requests
```

## Using Grafana Dashboards

### 1. Access Grafana
```bash
open http://localhost:3000
# Login: admin / admin
```

### 2. View RED Metrics Dashboard
- Navigate: Dashboards → Search → "Microservices RED"
- Select time range (top-right): 6 hours, 24 hours, 7 days
- Use Service dropdown to filter by service

### 3. Understand the Panels

#### Panel 1: Request Rate (RPS)
- **Y-axis**: Requests per second
- **Green line**: Steady state ~500 req/s
- **Spikes**: Indicates load tests or traffic bursts
- **Drops**: Potential outages

#### Panel 2: Error Rate %
- **Y-axis**: Percentage (0-100%)
- **Green threshold**: 0-2% (healthy)
- **Yellow threshold**: 2-5% (warning)
- **Red threshold**: >5% (alert)

#### Panel 3: Duration (Latency)
- **3 lines per service**: p50, p95, p99
- **p95 typical**: 400-600ms
- **p99 spike**: indicates occasional slow requests (database locks, GC pauses)

### 4. Common Queries

#### Find Bottleneck Service
1. Look at Duration panel
2. Identify service with highest p95
3. Check that service's logs in Kibana (correlation via trace_id)

#### Detect Memory Leak
1. Watch Duration (Duration) over 24 hours
2. p95 gradually increasing → memory issue
3. Cross-reference with: `go_memstats_heap_alloc_bytes` (Golang) or `.NET` GC metrics

#### Investigate Error Spike
1. Error Rate panel shows spike at 14:30
2. Copy time range: 14:25-14:35
3. Go to Kibana, filter: `level: "error" AND timestamp > 14:25`
4. Look at error messages and stack traces

## Metrics from OpenTelemetry

### Automatically Generated Metrics

#### OrderService (.NET)
**Package**: `OpenTelemetry.Instrumentation.AspNetCore`

Metrics:
- `http.server.duration` (histogram): HTTP request latency
- `http.server.request.size` (histogram): Request body size
- `http.server.response.size` (histogram): Response body size
- `http.server.requests_total` (counter): Total requests

#### PaymentService (Node.js)
**Package**: `@opentelemetry/instrumentation-grpc`

Metrics:
- `grpc.server.duration` (histogram): gRPC call latency
- `rpc_server_duration_ms` (histogram): Duration in milliseconds
- `rpc_server_request_messages_per_rpc` (gauge): Messages/request
- `rpc_server_response_messages_per_rpc` (gauge): Messages/response

### Custom Metrics (Advanced)

**OrderService (.NET)**:
```csharp
var counter = meter.CreateCounter<long>("orders.created", "count", "Total orders created");
counter.Add(1, new KeyValuePair<string, object>("user_id", userId));
```

**PaymentService (Node.js)**:
```typescript
const counter = meter.createCounter('payments.processed');
counter.add(1, { status: 'success', amount: 500 });
```

## Setting Up Alerts

### Alert Rules File: `observability/prometheus-rules.yml` (Optional)

```yaml
groups:
  - name: microservices
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          (sum(rate(rpc_server_duration_ms_bucket{grpc_status="UNKNOWN"}[5m])) by (service) /
           sum(rate(rpc_server_duration_ms_bucket[5m])) by (service)) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.service }} has high error rate"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(rpc_server_duration_ms_bucket[5m])) by (le, service)) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.service }} has high latency"
          description: "P95 latency is {{ $value }}ms"

      - alert: LowRequestRate
        expr: |
          sum(rate(rpc_server_duration_ms_count[5m])) by (service) < 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.service }} has low request rate"
          description: "Request rate is {{ $value }} req/s"
```

### Setting Up in Grafana

1. **Dashboards → Alerts → New Alert Rule**
2. **Condition**: `Error Rate > 5%`
3. **Evaluate every**: 1m
4. **For**: 5m (to reduce false positives)
5. **Send notification to**: Slack, Email, PagerDuty

## Correlation: Logs + Traces + Metrics

### End-to-End Debugging Flow

**Scenario**: Grafana shows p95 latency spike at 2:30 PM

**Step 1**: Check Error Rate panel
- If error rate also spiked → Application error
- If error rate normal → Performance degradation

**Step 2**: Identify slow service
- OrderService p95 = 250ms (normal)
- PaymentService p95 = 1200ms (high!)

**Step 3**: Find root cause in Jaeger
1. Go to Jaeger: http://localhost:16686
2. Service: PaymentService
3. Operation: ProcessPayment
4. Filter: Latency > 1000ms
5. View trace breakdown: See WHERE time was spent

**Step 4**: Dive into logs
1. Find trace_id from Jaeger span
2. Go to Kibana: http://localhost:5601
3. Filter: `trace_id: "abc123" AND level: "error"`
4. See detailed error messages, stack traces

**Step 5**: Verify fix
1. Deploy fix
2. Watch metrics in real-time
3. p95 should drop back to ~250ms within 5 minutes
4. Alert should auto-resolve

## Performance Impact

### Baseline (No Observability)
- p95 latency: 200ms
- Throughput: 1000 req/s

### With Prometheus + Grafana
- p95 latency: 210ms (+5%)
- Throughput: 990 req/s (-1%)

**Overhead**: 
- OTel SDK exports metrics asynchronously (non-blocking)
- Prometheus scrape interval: 15s (minimal impact)
- Grafana dashboard queries: Real-time (but cached/optimized)

## Troubleshooting

### Metrics Not Appearing in Grafana

**Check 1: OTel Collector exporting metrics**
```bash
curl http://localhost:8888/metrics | grep rpc_server
```

**Check 2: Prometheus scraping OTel Collector**
```bash
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets'
```

**Check 3: Prometheus health**
```bash
curl http://localhost:9090/-/healthy
# Should return 200 OK
```

### High Prometheus Disk Usage

**Cause**: Metrics stored for too long (default: 15 days)

**Fix**: Reduce retention in `docker-compose.yaml`:
```yaml
command:
  - "--storage.tsdb.retention.time=7d"  # Instead of 15d
```

### Missing Labels in Metrics

**Cause**: OTel resource attributes not set

**Fix**: Ensure services include resource attributes:
```csharp
.WithResource(Resource.CreateDefault()
  .AddAttribute("service.name", "OrderService")
  .AddAttribute("deployment.environment", "development"))
```

## Next Steps

1. **Monitor in Real-Time**: Watch RED metrics dashboard during load tests
2. **Set SLOs**: Define p95 < 500ms, error rate < 2%
3. **Create Alerts**: Alert on violations of SLOs
4. **Automate Remediation**: Trigger autoscaling on high latency
5. **Step 20**: Service Mesh (Istio) - Add network-level observability

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards)
- [RED Method](https://www.weave.works/blog/the-red-method-key-metrics-for-microservices-architecture/)
- [OpenTelemetry Metrics](https://opentelemetry.io/docs/reference/specification/metrics/)
- [PromQL Queries](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## Example PromQL Queries

### Service Availability
```promql
100 * (1 - (sum(rate(rpc_server_duration_ms_bucket{grpc_status="UNKNOWN"}[5m])) by (service) /
             sum(rate(rpc_server_duration_ms_bucket[5m])) by (service)))
```

### Top 5 Slowest Endpoints
```promql
topk(5, histogram_quantile(0.95, sum(rate(rpc_server_duration_ms_bucket[5m])) by (method)))
```

### CPU Usage Correlation
```promql
# (Note: Requires cAdvisor or Node Exporter for container metrics)
rate(container_cpu_usage_seconds_total{container_name="payment-service"}[1m]) * 100
```

### Traffic Per Service
```promql
sum(rate(rpc_server_duration_ms_count[5m])) by (service) * 60  # per minute
```
