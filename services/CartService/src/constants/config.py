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
    "SESSION_TTL": 3600,
    "VERSION": "1.0.0"
}

CONFIG = {
    "REDIS_URL": _require_env("REDIS_URL"),
    "ORDER_SERVICE_URL": _require_env("ORDER_SERVICE_URL"),
    "OTEL_EXPORTER_OTLP_ENDPOINT": _require_env("OTEL_EXPORTER_OTLP_ENDPOINT"),
    "SERVICE_NAME": _require_env("SERVICE_NAME"),
}
