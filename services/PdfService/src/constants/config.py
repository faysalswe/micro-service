import os

# Internal Business Logic Constants
INTERNAL_CONSTANTS = {
    "VERSION": "1.0.0",
    "INVOICE_BUCKET": "invoices"
}

# Infrastructure Configuration
CONFIG = {
    "S3_ENDPOINT": os.environ.get("S3_ENDPOINT", "http://minio:9000"),
    "S3_ACCESS_KEY": os.environ.get("S3_ACCESS_KEY", "admin"),
    "S3_SECRET_KEY": os.environ.get("S3_SECRET_KEY", "password123"),
    "OTEL_EXPORTER_OTLP_ENDPOINT": os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
    "SERVICE_NAME": os.environ.get("SERVICE_NAME", "PdfService"),
}
