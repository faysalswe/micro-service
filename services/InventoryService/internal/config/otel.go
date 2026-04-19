package config

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"go.opentelemetry.io/contrib/bridges/otelslog"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

func InitTracer() (*sdktrace.TracerProvider, error) {
	ctx := context.Background()

	// Check ONLY for the global environment variable
	endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if endpoint == "" {
		fmt.Println("[OBSERVABILITY] ⚠️ OTEL_EXPORTER_OTLP_ENDPOINT not found. Tracing is DISABLED.")
		return nil, nil
	}

	fmt.Printf("[OBSERVABILITY] ✅ Unified OTLP Enabled (Traces & Logs). Exporting to: %s (Auto-Config)\n", endpoint)

	// 1. Trace Exporter
	traceExporter, err := otlptracegrpc.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create trace exporter: %w", err)
	}

	// 2. Log Exporter
	logExporter, err := otlploggrpc.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create log exporter: %w", err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(os.Getenv("SERVICE_NAME")),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// 3. Trace Provider
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithBatcher(traceExporter, sdktrace.WithBatchTimeout(time.Second)),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	// 4. Log Provider
	lp := log.NewLoggerProvider(
		log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(logExporter)),
	)
	global.SetLoggerProvider(lp)

	// 5. Bridge slog to OTel
	// We use the OTel slog handler so slog.Info() goes to OTLP
	logger := otelslog.NewLogger(os.Getenv("SERVICE_NAME"))
	slog.SetDefault(logger)

	return tp, nil
}
