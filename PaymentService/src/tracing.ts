// tracing.ts - OpenTelemetry Setup for PaymentService
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';

export function initializeTracing() {
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || 'PaymentService',
    [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
  });

  const provider = new NodeTracerProvider({ resource });

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new GrpcInstrumentation({
        enabled: true,
      }),
    ],
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    provider.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error: Error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return provider;
}
