// logger.ts - Winston Configuration for PaymentService
import winston from 'winston';
import * as net from 'net';
import { api, context } from '@opentelemetry/api';

// Custom transport to send logs to Logstash via TCP
class LogstashTransport extends winston.transports.Stream {
  private client: net.Socket | null = null;
  private host: string;
  private port: number;

  constructor(options?: { host?: string; port?: number }) {
    super({ stream: process.stdout });
    this.host = options?.host || process.env.LOGSTASH_HOST || 'localhost';
    this.port = options?.port || parseInt(process.env.LOGSTASH_PORT || '5000', 10);
    this.connect();
  }

  connect() {
    this.client = net.createConnection({ host: this.host, port: this.port }, () => {
      console.log('Connected to Logstash');
    });

    this.client.on('error', (err) => {
      console.error('Logstash connection error:', err.message);
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    });

    this.client.on('close', () => {
      console.log('Logstash connection closed. Reconnecting...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    // Add OpenTelemetry trace context
    const span = api.trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      info.trace_id = spanContext.traceId;
      info.span_id = spanContext.spanId;
    }

    const logEntry = JSON.stringify(info) + '\n';

    if (this.client && this.client.writable) {
      this.client.write(logEntry, (err) => {
        if (err) console.error('Error sending log to Logstash:', err);
      });
    }

    callback();
  }
}

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
    // Console output (JSON format for Docker logs)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
    // Logstash TCP transport
    new LogstashTransport(),
  ],
});

// Helper function to add correlation ID to logs
export function logWithContext(level: string, message: string, meta: any = {}) {
  // Add trace context from OpenTelemetry
  const span = api.trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    meta.trace_id = spanContext.traceId;
    meta.span_id = spanContext.spanId;
  }

  logger.log(level, message, meta);
}
