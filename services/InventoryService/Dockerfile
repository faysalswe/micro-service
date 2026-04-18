# --- Build Stage ---
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy the entire monorepo context to access shared protos if needed
# and to keep paths consistent with go.mod
COPY . .

# Navigate to the service directory
WORKDIR /app/services/InventoryService

# Run go mod tidy to ensure go.sum is up to date
RUN go mod tidy

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /inventory-service ./cmd/server/main.go

# --- Final Stage ---
FROM alpine:latest

WORKDIR /

# Create non-root user (using numeric UID 1001)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -u 1001

COPY --from=builder /inventory-service /inventory-service

# Install health check probe
RUN apk add --no-cache curl \
    && curl -L https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.24/grpc_health_probe-linux-amd64 -o /bin/grpc_health_probe \
    && chmod +x /bin/grpc_health_probe

# Set ownership and switch to non-root user
RUN chown -R appuser:appgroup /inventory-service
USER 1001

EXPOSE 5013 50013

CMD ["/inventory-service"]
