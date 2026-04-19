/**
 * Internal Business Logic Constants (Not in env to avoid clutter)
 */
export const INTERNAL_CONSTANTS = {
  BREAKER: {
    RESET_TIMEOUT: 30000, // 30 seconds is a standard internal default
    ERROR_THRESHOLD: 50,  // 50% error rate threshold
  },
  HEALTH: {
    CHECK_INTERVAL: 30000, // 30s internal heartbeat
    SHUTDOWN_DELAY: 5000,  // 5s graceful wait
  },
  VERSION: '1.0.0'
};

/**
 * Infrastructure & Tuning Configuration (Relatable to Environment)
 */
export const CONFIG = {
  // Database & Connectivity
  DB: {
    URI: process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017',
    NAME: process.env.MONGO_DB_NAME || 'payments_db',
  },
  SERVER: {
    PORT: process.env.PORT || '50012',
    REST_PORT: process.env.REST_PORT || '5012',
  },

  // Critical Tuning (The "Ghost Latency" Fix)
  // We keep this in env so we can debug latency without code changes.
  TUNING: {
    CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000', 10),
  },

  // Observability
  SERVICE_NAME: process.env.SERVICE_NAME || 'PaymentService',
};
