// tracing.ts - OpenTelemetry Setup for PaymentService
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { logs } from '@opentelemetry/api-logs';
import { CONFIG, INTERNAL_CONSTANTS } from './constants/config';

export function initializeTracing() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (!endpoint) {
    console.log("[OBSERVABILITY] ⚠️ OTEL_EXPORTER_OTLP_ENDPOINT not found. Tracing is DISABLED.");
    return;
  }

  console.log(`[OBSERVABILITY] ✅ Unified OTLP Enabled (Traces & Logs). Exporting to: ${endpoint} (Auto-Config)`);

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: CONFIG.SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: INTERNAL_CONSTANTS.VERSION,
  });

  // Trace Setup
  const traceProvider = new NodeTracerProvider({ resource });
  const traceExporter = new OTLPTraceExporter();
  traceProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
  traceProvider.register();

  // Logs Setup (OTLP gRPC)
  const loggerProvider = new LoggerProvider({ resource });
  const logExporter = new OTLPLogExporter();
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
  
  // Register the global logger provider
  logs.setGlobalLoggerProvider(loggerProvider);

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new GrpcInstrumentation({
        enabled: true,
      }),
    ],
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    Promise.all([traceProvider.shutdown(), loggerProvider.shutdown()])
      .then(() => console.log('Tracing and Logging terminated'))
      .catch((error: Error) => console.log('Error terminating observability', error))
      .finally(() => process.exit(0));
  });

  return traceProvider;
}
