# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy proto files first (dependency for gRPC code generation)
COPY protos/ /src/protos/

# Copy csproj and restore dependencies
COPY OrderService/OrderService.csproj OrderService/
RUN dotnet restore OrderService/OrderService.csproj

# Copy source code and build
COPY OrderService/ OrderService/
WORKDIR /src/OrderService
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install grpc_health_probe for Kubernetes health checks
RUN apt-get update && apt-get install -y wget \
    && wget -q https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.28/grpc_health_probe-linux-amd64 \
       -O /bin/grpc_health_probe \
    && chmod +x /bin/grpc_health_probe \
    && apt-get remove -y wget && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos "" --uid 1000 appuser

# Copy published application
COPY --from=build /app/publish .

# Change ownership and switch to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Set the application to listen on port 5011
ENV ASPNETCORE_URLS=http://+:5011

# Expose gRPC/HTTP port
EXPOSE 5011

# Health check using grpc_health_probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["/bin/grpc_health_probe", "-addr=:5011"]

ENTRYPOINT ["dotnet", "OrderService.dll"]
