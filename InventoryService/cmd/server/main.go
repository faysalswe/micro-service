package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"github.com/faysal/micro-service/inventory-service/internal/database"
	"github.com/faysal/micro-service/inventory-service/internal/repository"
	"github.com/faysal/micro-service/inventory-service/internal/service"
	"github.com/faysal/micro-service/inventory-service/proto"
	"github.com/gin-gonic/gin"
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

func startRESTServer(svc service.InventoryService, port string) {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "UP"})
	})

	r.GET("/api/inventory/:id", func(c *gin.Context) {
		id := c.Param("id")
		stock, err := svc.GetStock(c.Request.Context(), id)
		if err != nil {
			c.JSON(404, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(200, gin.H{"product_id": id, "quantity": stock})
	})

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
	// 1. Load Config
	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "password123")
	dbName := getEnv("DB_NAME", "inventory_db")
	dbPort := getEnv("DB_PORT", "5432")
	grpcPort := getEnv("GRPC_PORT", "50052")
	restPort := getEnv("REST_PORT", "8081")

	// 2. Init DB
	db := database.InitDB(dbHost, dbUser, dbPassword, dbName, dbPort)

	// 3. Setup Layers
	repo := repository.NewPostgresRepository(db)
	svc := service.NewInventoryService(repo)

	// 4. Start REST Server (in goroutine)
	go startRESTServer(svc, restPort)

	// 5. Start gRPC Server
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", grpcPort))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	proto.RegisterInventoryServiceServer(s, &server{service: svc})
	
	// Enable reflection for easy testing with grpcurl
	reflection.Register(s)

	log.Printf("Inventory Service gRPC server listening on port %s", grpcPort)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
