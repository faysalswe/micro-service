---
name: troubleshoot-latency
description: 'Diagnose and fix performance bottlenecks. Use for: analyzing Jaeger traces, querying Prometheus latency metrics, correlating logs, and identifying the root cause of slow requests or "ghost latency".'
---

# Troubleshoot Latency & Ghost Latency

## When to Use
- A service is responding slowly (p95/p99 latency is high)
- You observe "ghost latency"—high end-to-end latency but individual span durations are low
- Need to identify which service in the call chain is the bottleneck
- Want to correlate latency with CPU, memory, or network metrics

## Procedure

### 1. **Gather Trace Data from Jaeger**

Get the trace ID from your request (should be in request headers or logs).

```bash
# Query Jaeger API for traces of a specific service
curl "http://localhost:16686/api/traces?service=cart-service&limit=20" | jq '.data[] | .traceID'
```

**In Jaeger UI**:
- Visit `http://localhost:16686`
- Select service from dropdown
- Filter by latency (e.g., > 500ms)
- Click a trace to inspect spans and durations

### 2. **Analyze Span Timeline**

Look for:
- **Long spans**: Where time is actually spent
- **Serial vs Parallel**: Are operations running in sequence when they could be parallel?
- **External calls**: Network timeouts, database queries, downstream service calls
- **Gaps**: Time not accounted for in child spans (context switching, scheduling, queue wait)

### 3. **Query Prometheus Latency Metrics**

Use PromQL to identify which service has high latency:

```promql
# P95 latency by service (histogram_quantile requires _bucket metrics)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (service)

# Average latency by endpoint
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]) by (job, endpoint)

# Compare latency before/after code change
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{version="v2"}[5m]))
```

### 4. **Correlate with Resource Metrics**

Check CPU, memory, and network saturation at the time of slow requests:

```promql
# CPU usage during slow requests
node_cpu_seconds_total{mode="system"} by (instance)

# Memory pressure
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

# Network send/receive errors
rate(node_network_transmit_errors_total[5m])
```

### 5. **Search Logs (Loki)**

Use LogQL to find error patterns or warnings near the latency spike:

```logql
{service="cart-service"} | "timeout" or "deadline" | level="error"
{service="product-service"} | duration > "500ms"
```

### 6. **Identify Root Cause**

Common causes:
- **External service latency**: Slow API call to payment service, database, cache miss
- **Serialization overhead**: Large gRPC message serialization/deserialization
- **GC pauses**: Latency spikes due to garbage collection (check JVM/Go metrics)
- **Queue contention**: High concurrency waiting on limited resource (connection pool, thread pool)
- **Network issues**: High packet loss, long RTT, buffer exhaustion

## References

- [Jaeger Documentation](https://www.jaegertracing.io/)
- [Prometheus PromQL Reference](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Loki LogQL Reference](https://grafana.com/docs/loki/latest/logql/)
- [Observability Master Guide](../../docs/OBSERVABILITY_SRE_MASTER_GUIDE.md)
