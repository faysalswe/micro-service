/**
 * Global Constants for PaymentService
 */

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnv = (key: string, fallback: string): string => {
  return process.env[key] || fallback;
};

export const CONFIG = {
  // Circuit Breaker Settings
  BREAKER: {
    TIMEOUT: parseInt(getOptionalEnv('CIRCUIT_BREAKER_TIMEOUT', '3000'), 10),
    RESET_TIMEOUT: parseInt(getOptionalEnv('CIRCUIT_BREAKER_RESET_TIMEOUT', '30000'), 10),
    ERROR_THRESHOLD: parseInt(getOptionalEnv('CIRCUIT_BREAKER_THRESHOLD', '50'), 10),
  },

  // Database Settings
  DB: {
    URI: getRequiredEnv('MONGO_URI'),
    NAME: getOptionalEnv('MONGO_DB_NAME', 'payments_db'),
  },

  // Health Check Settings
  HEALTH: {
    CHECK_INTERVAL: parseInt(getOptionalEnv('HEALTH_CHECK_INTERVAL', '30000'), 10),
    SHUTDOWN_DELAY: parseInt(getOptionalEnv('SHUTDOWN_DELAY', '5000'), 10),
  },

  // Server Settings
  SERVER: {
    GRPC_PORT: getOptionalEnv('PORT', '50012'),
    REST_PORT: getRequiredEnv('REST_PORT'),
  },
  
  // Metadata
  METADATA: {
    NAME: getOptionalEnv('SERVICE_NAME', 'PaymentService'),
    VERSION: getOptionalEnv('SERVICE_VERSION', '1.0.0'),
  }
};
