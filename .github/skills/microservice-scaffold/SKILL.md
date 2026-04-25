---
name: microservice-scaffold
description: 'Scaffold a new microservice with boilerplate code, tests, and OpenTelemetry instrumentation. Use for: bootstrapping Go, Node.js, or .NET services, setting up gRPC/REST endpoints, and adding tracing.'
---

# Microservice Scaffold & Boilerplate

## When to Use
- Starting a new microservice from scratch
- Need consistent structure across all services (Go, Node.js, .NET)
- Want pre-configured OpenTelemetry tracing and Prometheus metrics
- Building gRPC or REST API with health checks and graceful shutdown

## Procedure

### 1. **Generate Service Scaffold**

Choose a language and create the project structure:

#### **Go Service**
```bash
mkdir -p services/my-service/{cmd,internal/{api,service,config},pkg,tests}
cd services/my-service

# Create main.go with graceful shutdown
cat > cmd/main.go << 'EOF'
package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

const port = ":50051"

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	
	// Health check
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(s, healthServer)
	healthServer.SetServingStatus("my.service.Service", grpc_health_v1.HealthCheckResponse_SERVING)

	go func() {
		sigchan := make(chan os.Signal, 1)
		signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)
		<-sigchan
		log.Println("Shutting down...")
		s.GracefulStop()
		cancel()
	}()

	log.Printf("Server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
EOF
```

#### **Node.js Service**
```bash
mkdir -p services/my-service/{src,tests,config}
cd services/my-service

npm init -y
npm install express @opentelemetry/api @opentelemetry/sdk-node

cat > src/index.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
EOF
```

### 2. **Add OpenTelemetry Instrumentation**

#### **Go**
```bash
go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/exporters/jaeger
go get go.opentelemetry.io/otel/sdk/trace
```

```go
// internal/config/tracing.go
package config

import (
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
)

func InitTracing(serviceName string) (*trace.TracerProvider, error) {
	exp, err := jaeger.New(jaeger.WithAgentHost("localhost"))
	if err != nil {
		return nil, err
	}

	tp := trace.NewTracerProvider(
		trace.WithBatcher(exp),
		trace.WithResource(resource.NewWithAttributes(
			"service.name", serviceName,
		)),
	)
	otel.SetTracerProvider(tp)
	return tp, nil
}
```

#### **Node.js**
```bash
npm install @opentelemetry/auto
npm install @opentelemetry/exporter-jaeger

# Create instrumentation in src/otel.js
cat > src/otel.js << 'EOF'
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
module.exports = sdk;
EOF

# Load at app startup
node -r ./src/otel.js src/index.js
```

### 3. **Add Health Checks**

All services must expose health endpoints:

```bash
# GET /health - liveness probe
# GET /ready - readiness probe (dependencies available)
```

### 4. **Write Tests**

#### **Go Unit Test**
```bash
cat > internal/service/service_test.go << 'EOF'
package service

import (
	"testing"
)

func TestMyService(t *testing.T) {
	// Test logic here
}
EOF

go test ./...
```

#### **Node.js Unit Test**
```bash
npm install --save-dev jest

cat > tests/service.test.js << 'EOF'
test('my service works', () => {
  expect(1 + 1).toBe(2);
});
EOF

npm test
```

### 5. **Create Dockerfile**

```dockerfile
# services/my-service/Dockerfile
FROM golang:1.21 as builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .

USER 1001
EXPOSE 50051
CMD ["./main"]
```

### 6. **Add to Helm Charts**

```bash
helm create ../helm/my-service
# Customize platform/charts/my-service/values.yaml with your service config
```

## Common Patterns

### Graceful Shutdown
Always handle SIGTERM/SIGINT to drain requests before exiting.

### Health Probes
- **Liveness**: Simple check (e.g., memory not exhausted)
- **Readiness**: Check dependencies (database, cache connection available)

### Logging
Use structured logging (JSON) for easy log aggregation:
```json
{"timestamp":"2024-01-15T10:30:00Z","level":"info","service":"my-service","traceID":"abc123","message":"Request processed"}
```

### Environment Configuration
Use env vars for:
- Database URL
- Logging level
- Jaeger agent endpoint
- Feature flags

## References

- [gRPC Tutorial](https://grpc.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Go Best Practices](https://golang.org/doc/effective_go)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- Service examples in `services/` folder
