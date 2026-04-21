---
name: sre-troubleshooter
description: Guided workflow for solving performance bottlenecks using the full observability stack.
---

# SRE Troubleshooter Skill

Use this skill when the user reports "slowness," "timeouts," or "latency spikes."

## Phase 1: Detection (Prometheus)
1. Query `go_sql_stats_connections_wait` or `nodejs_eventloop_lag`.
2. Determine if the issue is global (infrastructure) or local (specific service saturation).

## Phase 2: Tracing (Jaeger)
1. Find a trace with high latency (> 2s).
2. Look for "Spans" with significant gaps between them (The Ghost Latency).
3. Identify the "Callee" that is not returning a response in time.

## Phase 3: Diagnosis (Loki)
1. Extract the `TraceID`.
2. Filter Loki logs using `{trace_id="<ID>"}`.
3. Look for exceptions, timeouts, or database connection errors.

## Phase 4: Resolution & Validation
1. Propose a fix (e.g., increasing pool size, adding a timeout, or fixing a query).
2. **Crucial:** After the fix, run a load test to verify the P99 latency has dropped.
