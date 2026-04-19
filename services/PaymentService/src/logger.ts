// logger.ts - Winston to OpenTelemetry Bridge
import winston from 'winston';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { trace, context } from '@opentelemetry/api';
import { CONFIG, INTERNAL_CONSTANTS } from './constants/config';

const serviceName = CONFIG.SERVICE_NAME;

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Bridge Winston to OTel
const otelLogger = logs.getLogger(serviceName);

const levelToSeverity = (level: string): SeverityNumber => {
  switch (level.toLowerCase()) {
    case 'error': return SeverityNumber.ERROR;
    case 'warn': return SeverityNumber.WARN;
    case 'info': return SeverityNumber.INFO;
    case 'debug': return SeverityNumber.DEBUG;
    default: return SeverityNumber.INFO;
  }
};

logger.on('data', (info) => {
  const { level, message, timestamp, ...meta } = info;
  
  otelLogger.emit({
    severityNumber: levelToSeverity(level),
    severityText: level.toUpperCase(),
    body: message,
    attributes: {
      ...meta,
      service_name: serviceName,
      service_version: INTERNAL_CONSTANTS.VERSION
    }
  });
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
