package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"inventory-service/internal/config"
	"inventory-service/internal/database"
	"inventory-service/internal/repository"
	"inventory-service/internal/service"
	"inventory-service/internal/api/rest"
	"inventory-service/proto"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type server struct {
	proto.UnimplementedInventoryServiceServer
	service service.InventoryService
}

func (s *server) ReserveStock(ctx context.Context, req *proto.ReserveRequest) (*proto.ReserveResponse, error) {
	success, msg, err := s.service.Reserve(ctx, req.OrderId, req.ProductId, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &proto.ReserveResponse{Success: success, Message: msg}, nil
}

func (s *server) ReleaseStock(ctx context.Context, req *proto.ReleaseRequest) (*proto.ReleaseResponse, error) {
	success, msg, err := s.service.Release(ctx, req.OrderId, req.ProductId, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &proto.ReleaseResponse{Success: success, Message: msg}, nil
}

func (s *server) GetStock(ctx context.Context, req *proto.GetStockRequest) (*proto.GetStockResponse, error) {
	quantity, err := s.service.GetStock(ctx, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &proto.GetStockResponse{ProductId: req.ProductId, Quantity: quantity}, nil
}

func (s *server) ListProducts(ctx context.Context, req *proto.ListProductsRequest) (*proto.ListProductsResponse, error) {
	products, err := s.service.ListProducts(ctx)
	if err != nil {
		return nil, err
	}

	var protoProducts []*proto.ProductInfo
	for _, p := range products {
		protoProducts = append(protoProducts, &proto.ProductInfo{
			ProductId: p.ProductID,
			Name:      p.Name,
			Price:     p.Price,
			Quantity:  p.Quantity,
		})
	}

	return &proto.ListProductsResponse{Products: protoProducts}, nil
}

func (s *server) CreateProduct(ctx context.Context, req *proto.CreateProductRequest) (*proto.CreateProductResponse, error) {
	success, msg, err := s.service.CreateProduct(ctx, req.ProductId, req.Name, req.Price, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &proto.CreateProductResponse{Success: success, Message: msg}, nil
}

func (s *server) UpdateProduct(ctx context.Context, req *proto.UpdateProductRequest) (*proto.UpdateProductResponse, error) {
	success, msg, err := s.service.UpdateProduct(ctx, req.ProductId, req.Name, req.Price, req.Quantity)
	if err != nil {
		return nil, err
	}
	return &proto.UpdateProductResponse{Success: success, Message: msg}, nil
}

func (s *server) DeleteProduct(ctx context.Context, req *proto.DeleteProductRequest) (*proto.DeleteProductResponse, error) {
	success, msg, err := s.service.DeleteProduct(ctx, req.ProductId)
	if err != nil {
		return nil, err
	}
	return &proto.DeleteProductResponse{Success: success, Message: msg}, nil
}

func startRESTServer(svc service.InventoryService, port string) {
	r := gin.Default()
	handler := rest.NewInventoryHandler(svc)
	handler.SetupRoutes(r)

	log.Printf("Inventory REST server listening on port %s", port)
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
	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "password123")
	dbName := getEnv("DB_NAME", "inventory_db")
	dbPort := getEnv("DB_PORT", "5432")
	grpcPort := getEnv("GRPC_PORT", "50013")
	restPort := getEnv("REST_PORT", "5013")

	// 3. Init DB
	db := database.InitDB(dbHost, dbUser, dbPassword, dbName, dbPort)

	// 4. Setup Layers
	repo := repository.NewPostgresRepository(db)
	svc := service.NewInventoryService(repo)

	// 5. Start REST Server (in goroutine)
	go startRESTServer(svc, restPort)

	// 6. Start gRPC Server with OTel Interceptor
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", grpcPort))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	proto.RegisterInventoryServiceServer(s, &server{service: svc})
	
	// Enable reflection for easy testing with grpcurl
	reflection.Register(s)

	log.Printf("Inventory Service gRPC server listening on port %s", grpcPort)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
