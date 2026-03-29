# --- Build Stage ---
FROM golang:1.25-alpine AS builder

# Install protoc and plugins
RUN apk add --no-cache protobuf protobuf-dev
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1

WORKDIR /app

# Copy the entire project first to have all source and protos
COPY . .

# Generate gRPC code from proto
WORKDIR /app/InventoryService
RUN mkdir -p proto
RUN protoc --proto_path=/app/protos \
    --go_out=proto --go_opt=paths=source_relative \
    --go-grpc_out=proto --go-grpc_opt=paths=source_relative \
    /app/protos/inventory.proto

# Now run go mod tidy to ensure go.sum is up to date
RUN go mod tidy

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

EXPOSE 5013 50013

CMD ["/inventory-service"]
