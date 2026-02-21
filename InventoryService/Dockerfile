# --- Build Stage ---
FROM golang:1.23-alpine AS builder

# Install protoc and plugins
RUN apk add --no-cache protobuf protobuf-dev protoc-gen-go protoc-gen-go-grpc

WORKDIR /app

# Copy go.mod first for better caching
# Note: build context is the root directory
COPY InventoryService/go.mod ./InventoryService/

WORKDIR /app/InventoryService
RUN go mod download || true

# Copy the entire project
WORKDIR /app
COPY . .

# Generate gRPC code from proto
WORKDIR /app/InventoryService
RUN mkdir -p proto
RUN protoc --proto_path=/app/protos \
    --go_out=proto --go_opt=paths=source_relative \
    --go-grpc_out=proto --go-grpc_opt=paths=source_relative \
    /app/protos/inventory.proto

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /inventory-service ./cmd/server/main.go

# --- Final Stage ---
FROM alpine:latest

WORKDIR /

COPY --from=builder /inventory-service /inventory-service

# Install health check probe
RUN apk add --no-cache curl \
    && curl -L https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.24/grpc_health_probe-linux-amd64 -o /bin/grpc_health_probe \
    && chmod +x /bin/grpc_health_probe

EXPOSE 50052

CMD ["/inventory-service"]
