import os
import sys
import logging

_logger = logging.getLogger(__name__)

def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        _logger.critical("Required environment variable '%s' is not set", name)
        sys.exit(1)
    return value

# Internal Business Logic Constants
INTERNAL_CONSTANTS = {
    "VERSION": "1.0.0",
    "INVOICE_BUCKET": "invoices"
}

CONFIG = {
    "S3_ENDPOINT": _require_env("S3_ENDPOINT"),
    "S3_ACCESS_KEY": _require_env("S3_ACCESS_KEY"),
    "S3_SECRET_KEY": _require_env("S3_SECRET_KEY"),
    "OTEL_EXPORTER_OTLP_ENDPOINT": _require_env("OTEL_EXPORTER_OTLP_ENDPOINT"),
    "SERVICE_NAME": _require_env("SERVICE_NAME"),
}
