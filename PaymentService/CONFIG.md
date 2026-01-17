# PaymentService Configuration Guide

## Environment Variables

All configuration is managed through environment variables defined in the `.env` file.

### Setup

1. **Copy example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update values** for your environment (development, staging, production)

3. **Never commit** `.env` to version control (already in `.gitignore`)

## Configuration Reference

### MongoDB Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URI` | MongoDB connection string | `mongodb://admin:password123@localhost:27017` | Yes |
| `MONGO_DB_NAME` | Database name | `payments_db` | Yes |

### gRPC Server
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | gRPC server port | `50051` | Yes |

### OpenTelemetry (Distributed Tracing)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTel Collector URL | `http://localhost:4317` | Yes |
| `SERVICE_NAME` | Service identifier | `PaymentService` | No |
| `SERVICE_VERSION` | Service version | `1.0.0` | No |

### Logging (ELK Stack)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level | `info` | No |
| `LOGSTASH_HOST` | Logstash hostname | `localhost` | Yes |
| `LOGSTASH_PORT` | Logstash TCP port | `5000` | Yes |

**Log Levels:** `error`, `warn`, `info`, `debug`

### Environment
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |

**Environments:** `development`, `staging`, `production`

## Configuration Hierarchy

Configuration values are resolved in this order (highest priority first):

1. **Environment Variables** (e.g., `export PORT=50051`)
2. **`.env` File** (loaded by `dotenv`)
3. **Code Defaults** (fallback values in `||` operators)

Example:
```typescript
const port = process.env.PORT || '50051';
// 1. Checks environment variable PORT
// 2. If not found, uses '50051'
```

## Docker Configuration

When running in Docker, override variables in `docker-compose.yaml`:

```yaml
payment-service:
  build: ./PaymentService
  environment:
    - MONGO_URI=mongodb://payment-db:27017
    - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
    - LOGSTASH_HOST=logstash
    - NODE_ENV=production
```

## Configuration Loading

Configuration is loaded at startup in this order:

```typescript
// 1. Load .env file (src/server.ts)
import * as dotenv from 'dotenv';
dotenv.config();

// 2. Initialize tracing (reads OTEL_EXPORTER_OTLP_ENDPOINT)
initializeTracing();

// 3. Initialize logging (reads LOG_LEVEL, LOGSTASH_HOST, etc.)
import { logger } from './logger';

// 4. MongoDB connection (reads MONGO_URI, MONGO_DB_NAME)
const mongoUri = process.env.MONGO_URI || 'mongodb://...';

// 5. Start gRPC server (reads PORT)
const port = process.env.PORT || '50051';
```

## Environment-Specific Files

### Development (.env)
```env
NODE_ENV=development
LOG_LEVEL=debug
MONGO_URI=mongodb://localhost:27017
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### Production (.env.production)
```env
NODE_ENV=production
LOG_LEVEL=warn
MONGO_URI=mongodb://mongo-cluster:27017/payments?replicaSet=rs0
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.prod.example.com:4317
```

Load with: `NODE_ENV=production node -r dotenv/config src/server.js dotenv_config_path=.env.production`

## Validation

To verify configuration is loaded correctly:

```bash
# Start service and check logs
npm start

# Expected output:
# "Starting PaymentService"
# "Connected to MongoDB" { database: "payments_db" }
# "Connected to Logstash"
# "gRPC server started" { address: "0.0.0.0:50051" }
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Check `MONGO_URI` is correct
- Verify MongoDB container is running: `docker ps | grep mongo`

### "Cannot connect to Logstash"
- Check `LOGSTASH_HOST` and `LOGSTASH_PORT`
- Verify Logstash container is running: `docker ps | grep logstash`

### "Traces not appearing in Jaeger"
- Check `OTEL_EXPORTER_OTLP_ENDPOINT` points to OTel Collector
- Verify OTel Collector is running: `docker ps | grep otel-collector`

## Circuit Breaker Configuration

Currently hardcoded in `server.ts`. Consider externalizing:

```typescript
const breakerOptions = {
  timeout: parseInt(process.env.BREAKER_TIMEOUT || '3000', 10),
  errorThresholdPercentage: parseInt(process.env.BREAKER_ERROR_THRESHOLD || '50', 10),
  resetTimeout: parseInt(process.env.BREAKER_RESET_TIMEOUT || '30000', 10)
};
```

## Security Best Practices

1. ✅ **Never commit** `.env` to version control
2. ✅ **Use strong passwords** in production (not `password123`)
3. ✅ **Rotate secrets** regularly
4. ✅ **Use environment variables** for secrets in CI/CD
5. ✅ **Encrypt sensitive values** at rest (use secret managers like AWS Secrets Manager, HashiCorp Vault)

## See Also

- [PaymentService README](../README.md) - Service overview
- [Docker Compose Configuration](../../docker-compose.yaml) - Container orchestration
- [Observability README](../../observability/README.md) - Tracing and logging setup
