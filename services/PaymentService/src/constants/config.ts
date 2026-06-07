// logger.ts imports CONFIG, so we cannot import logger here — circular dependency.
// Missing env vars throw at module load time and surface in the startup crash trace.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable '${name}' is not set`);
  }
  return value;
}

function requireEnvInt(name: string): number {
  const raw = requireEnv(name);
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable '${name}' must be a valid integer, got: '${raw}'`);
  }
  if (parsed <= 0) {
    throw new Error(`Environment variable '${name}' must be a positive integer, got: ${parsed}`);
  }
  return parsed;
}

export const INTERNAL_CONSTANTS = {
  BREAKER: {
    RESET_TIMEOUT: 30000,
    ERROR_THRESHOLD: 50,
  },
  HEALTH: {
    CHECK_INTERVAL: 30000,
    SHUTDOWN_DELAY: 5000,
  },
  VERSION: '1.0.0'
};

export const CONFIG = {
  DB: {
    URI: requireEnv('MONGO_URI'),
    NAME: requireEnv('MONGO_DB_NAME'),
  },
  SERVER: {
    PORT: requireEnv('GRPC_PORT'),
    REST_PORT: requireEnv('REST_PORT'),
  },
  TUNING: {
    CIRCUIT_BREAKER_TIMEOUT: requireEnvInt('CIRCUIT_BREAKER_TIMEOUT'),
  },
  SERVICE_NAME: requireEnv('SERVICE_NAME'),
};
