# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install all dependencies (including devDependencies for build)
COPY PaymentService/package*.json PaymentService/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy TypeScript source and config
COPY PaymentService/tsconfig.json ./
COPY PaymentService/src/ ./src/

# Compile TypeScript to JavaScript
RUN pnpm run build

# Stage 2: Production dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install only production dependencies
COPY PaymentService/package*.json PaymentService/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install grpc_health_probe for Kubernetes health checks
RUN apk add --no-cache wget \
    && wget -q https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.28/grpc_health_probe-linux-amd64 \
       -O /bin/grpc_health_probe \
    && chmod +x /bin/grpc_health_probe \
    && apk del wget

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled JavaScript
COPY --from=build /app/dist ./dist

# Copy package.json (needed for Node.js)
COPY --from=build /app/package.json ./

# Copy proto files (required at runtime for dynamic loading)
COPY protos/ ./protos/

# Change ownership and switch to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose REST and gRPC ports
EXPOSE 5012 50012

# Health check using grpc_health_probe on gRPC port
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["/bin/grpc_health_probe", "-addr=:50012"]

CMD ["node", "dist/server.js"]
