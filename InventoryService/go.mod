module github.com/faysal/micro-service/inventory-service

go 1.23

require (
	google.golang.org/grpc v1.67.1
	google.golang.org/protobuf v1.35.1
	gorm.io/driver/postgres v1.5.9
	gorm.io/gorm v1.25.12
	github.com/gin-gonic/gin v1.10.0
	github.com/swaggo/swag v1.16.3
	github.com/swaggo/gin-swagger v1.6.0
	github.com/swaggo/files v1.0.1
	go.opentelemetry.io/otel v1.31.0
	go.opentelemetry.io/otel/trace v1.31.0
	go.opentelemetry.io/otel/sdk v1.31.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.31.0
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.56.0
	go.uber.org/zap v1.27.0
)
