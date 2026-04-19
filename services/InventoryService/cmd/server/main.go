package main

// Professional Automation: This directive uses 'buf' to update all contracts
// for both Go and Node.js in one centralized step.
//go:generate buf generate ../../..

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"inventory-service/internal/api/grpc"
	"inventory-service/internal/api/rest"
	"inventory-service/internal/config"
	"inventory-service/internal/database"
	"inventory-service/internal/repository"
	"inventory-service/internal/service"
	inventoryv1 "inventory-service/proto/inventory/v1"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	googlegrpc "google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func startRESTServer(svc service.InventoryService, port string) {
	// Set Gin to ReleaseMode to hide the debug output
	gin.SetMode(gin.ReleaseMode)

	r := gin.New() // Use gin.New() + Recovery to keep logs clean
	r.Use(gin.Recovery())

	handler := rest.NewInventoryHandler(svc)
	handler.SetupRoutes(r)

	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("failed to run REST server: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func requireEnv(key string) string {
	value, ok := os.LookupEnv(key)
	if !ok {
		log.Fatalf("CRITICAL: Missing required environment variable: %s", key)
	}
	return value
}

func main() {
	// 0. Load .env file for local development
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	// 1. Initialize Tracer
	tp, err := config.InitTracer()
	if err != nil {
		log.Fatalf("failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}()

	// 2. Load Config
	dbHost := requireEnv("DB_HOST")
	dbUser := requireEnv("DB_USER")
	dbPassword := requireEnv("DB_PASSWORD")
	dbName := requireEnv("DB_NAME")
	dbPort := requireEnv("DB_PORT")
	grpcPort := requireEnv("GRPC_PORT")
	restPort := requireEnv("REST_PORT")

	// 3. Init DB
	db := database.InitDB(dbHost, dbUser, dbPassword, dbName, dbPort)

	// 4. Setup Layers
	repo := repository.NewPostgresRepository(db)
	svc := service.NewInventoryService(repo)

	// 5. Start REST Server (in goroutine)
	go startRESTServer(svc, restPort)

	// Log Configured Endpoints (Go style)
	log.Printf("Configured Endpoint: HttpApi -> http://0.0.0.0:%s (Http1)", restPort)
	log.Printf("API Documentation (Scalar): http://localhost:%s/docs", restPort)
	log.Printf("Configured Endpoint: GrpcApi -> http://0.0.0.0:%s (Http2)", grpcPort)

	// 6. Start gRPC Server with OTel Interceptor
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", grpcPort))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := googlegrpc.NewServer(
		googlegrpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	
	inventoryHandler := grpc.NewInventoryHandler(svc)
	inventoryv1.RegisterInventoryServiceServer(s, inventoryHandler)

	// Enable reflection for easy testing with grpcurl
	reflection.Register(s)

	log.Printf("Inventory Service gRPC server listening on port %s", grpcPort)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
