# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["OrderService/OrderService.csproj", "OrderService/"]
COPY ["protos/", "protos/"]
RUN dotnet restore "OrderService/OrderService.csproj"

# Copy remaining source code and publish
COPY . .
RUN dotnet publish "OrderService/OrderService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage (Standard Debian-based .NET ASP.NET 10.0)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install dependencies and grpc_health_probe for Kubernetes readiness/liveness
RUN apt-get update && apt-get install -y wget libgssapi-krb5-2 \
    && wget -q https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/v0.4.28/grpc_health_probe-linux-amd64 \
       -O /bin/grpc_health_probe \
    && chmod +x /bin/grpc_health_probe \
    && apt-get remove -y wget && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --uid 1001 appuser && \
    chown -R appuser:appuser /app

# Copy published application and ensure correct ownership in one layer
COPY --from=build --chown=appuser:appuser /app/publish .

# Switch to non-root user (using numeric ID for K8s compliance)
USER 1001

# Set the application to listen on both REST and gRPC ports
ENV ASPNETCORE_URLS=http://+:5011;http://+:50011

# Expose ports
EXPOSE 5011 50011

# Health check using grpc_health_probe on the gRPC port
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["/bin/grpc_health_probe", "-addr=:50011"]

ENTRYPOINT ["dotnet", "OrderService.dll"]
