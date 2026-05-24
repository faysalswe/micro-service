# SRE Troubleshooter

Guided workflow for diagnosing "slowness," "timeouts," or "latency spikes" using the full observability stack (Prometheus → Jaeger → Loki).

## Phase 1: Detection (Prometheus)

1. Query `go_sql_stats_connections_wait` or `nodejs_eventloop_lag` for the affected service.
2. Determine if the issue is **global** (infrastructure saturation) or **local** (specific service bottleneck).
3. Check cAdvisor and Node Exporter metrics for CPU/Memory pressure on the underlying node.

## Phase 2: Tracing (Jaeger)

1. Find a trace with high latency (> 2s) for the affected endpoint.
2. Examine each Span for gaps between them — this is the "Ghost Latency."
3. Identify the Callee that is not returning a response in time.

## Phase 3: Log Correlation (Loki)

1. Extract the `TraceID` from the slow Jaeger trace.
2. Filter Loki logs: `{service_name="<service>"} |= "<TraceID>"`.
3. Look for exceptions, timeouts, or database connection errors near the timestamp of the slow trace.

## Phase 4: Resolution & Validation

1. Propose a fix (e.g., increasing pool size, adding a timeout, optimizing a query).
2. Apply the fix.
3. Run a load test to verify that P99 latency has dropped to acceptable levels.

## Service Reference

| Service          | Stack   | HTTP  | gRPC  |
|------------------|---------|-------|-------|
| OrderService     | .NET    | 5011  | 50011 |
| PaymentService   | Node.js | 5012  | —     |
| InventoryService | Go      | 5013  | —     |
| OTel Collector   | —       | —     | 4317  |
