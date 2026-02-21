# PaymentService Configuration

## Environment Variables

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | gRPC server port | `50012` | Yes |
| `REST_PORT` | REST API server port | `5012` | Yes |
| `MONGO_URI` | MongoDB connection string | `mongodb://admin:password123@localhost:27017` | Yes |
| `MONGO_DB_NAME` | MongoDB database name | `payments_db` | Yes |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTel Collector gRPC URL | `http://localhost:4317` | Yes |
| `LOKI_URL` | Grafana Loki URL | `http://localhost:3100` | Yes |
| `SERVICE_NAME` | Service identifier | `PaymentService` | No |
| `LOG_LEVEL` | Logging verbosity (debug, info, warn, error) | `info` | No |
| `NODE_ENV` | Environment (development, production) | `development` | No |

## Logging Architecture

The service uses **Winston** with two main transports:
1. **Console**: Colorized output for local terminal debugging.
2. **Loki**: JSON-formatted logs pushed to Grafana Loki for centralized aggregation.

### Trace Correlation
Logs automatically include `trace_id` and `span_id` when running within an active OpenTelemetry context, allowing seamless correlation between traces in Jaeger and logs in Loki.

## Resilience

A **Circuit Breaker** (using `opossum`) is implemented for MongoDB operations to prevent cascading failures when the database is under load or unavailable.
