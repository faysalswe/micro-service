// logger.ts - Winston Configuration for PaymentService with Loki
import winston from 'winston';
import LokiTransport from 'winston-loki';
import { trace, context } from '@opentelemetry/api';

const lokiHost = process.env.LOKI_URL!;

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service_name: process.env.SERVICE_NAME || 'PaymentService',
    service_version: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console output (colorized for local dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
    // Loki transport
    new LokiTransport({
      host: lokiHost,
      labels: {
        service: process.env.SERVICE_NAME || 'PaymentService',
        environment: process.env.NODE_ENV || 'development',
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error('Loki connection error:', err),
    }),
  ],
});

// Helper function to add correlation ID to logs
export function logWithContext(level: string, message: string, meta: any = {}) {
  // Add trace context from OpenTelemetry
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    meta.trace_id = spanContext.traceId;
    meta.span_id = spanContext.spanId;
  }

  logger.log(level, message, meta);
}
