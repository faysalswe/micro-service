# --- Build Stage ---
FROM golang:1.23-alpine AS builder

# Install protoc and plugins
RUN apk add --no-cache protobuf protobuf-dev protoc-gen-go protoc-gen-go-grpc

WORKDIR /app

# Copy go.mod and go.sum (if it exists)
COPY go.mod ./
# RUN go mod download

# Copy the entire project
COPY . .

# Generate gRPC code from proto (using the shared protos folder if mounted, or copied)
# For now, we assume the proto file is copied into the container or available
RUN mkdir -p proto
RUN protoc --proto_path=/app/../protos --go_out=. --go_opt=paths=source_relative 
    --go-grpc_out=. --go-grpc_opt=paths=source_relative 
    /app/../protos/inventory.proto

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /inventory-service ./cmd/server/main.go

# --- Final Stage ---
FROM alpine:latest

WORKDIR /

COPY --from=builder /inventory-service /inventory-service

# Install health check probe
RUN apk add --no-cache curl
RUN curl -L https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.24/grpc_health_probe-linux-amd64 -o /bin/grpc_health_probe && 
    chmod +x /bin/grpc_health_probe

EXPOSE 50052

CMD ["/inventory-service"]
