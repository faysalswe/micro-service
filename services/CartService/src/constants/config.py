import os

# Internal Business Logic Constants
INTERNAL_CONSTANTS = {
    "SESSION_TTL": 3600,  # 1 hour for cart life
    "VERSION": "1.0.0"
}

# Infrastructure Configuration
CONFIG = {
    "REDIS_URL": os.environ.get("REDIS_URL", "redis://redis:6379/0"),
    "ORDER_SERVICE_URL": os.environ.get("ORDER_SERVICE_URL", "order-service:50011"),
    "OTEL_EXPORTER_OTLP_ENDPOINT": os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
    "SERVICE_NAME": os.environ.get("SERVICE_NAME", "CartService"),
}
