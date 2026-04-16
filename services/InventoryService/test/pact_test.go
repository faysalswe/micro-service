package test

import (
	"context"
	"fmt"
	"net"
	"testing"
	"time"

	"inventory-service/internal/api/rest"
	invmodels "inventory-service/internal/models"
	"github.com/gin-gonic/gin"
	pactmodels "github.com/pact-foundation/pact-go/v2/models"
	"github.com/pact-foundation/pact-go/v2/provider"
	"github.com/stretchr/testify/mock"
)

// MockInventoryService is a mock of the InventoryService interface
type MockInventoryService struct {
	mock.Mock
}

func (m *MockInventoryService) Reserve(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error) {
	args := m.Called(ctx, orderID, productID, quantity)
	return args.Bool(0), args.String(1), args.Error(2)
}

func (m *MockInventoryService) Release(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error) {
	args := m.Called(ctx, orderID, productID, quantity)
	return args.Bool(0), args.String(1), args.Error(2)
}

func (m *MockInventoryService) GetStock(ctx context.Context, productID string) (int32, error) {
	args := m.Called(ctx, productID)
	return int32(args.Int(0)), args.Error(1)
}

func (m *MockInventoryService) GetProduct(ctx context.Context, productID string) (invmodels.ProductStock, error) {
	args := m.Called(ctx, productID)
	return args.Get(0).(invmodels.ProductStock), args.Error(1)
}

func (m *MockInventoryService) ListProducts(ctx context.Context) ([]invmodels.ProductStock, error) {
	args := m.Called(ctx)
	return args.Get(0).([]invmodels.ProductStock), args.Error(1)
}

func (m *MockInventoryService) CreateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error) {
	args := m.Called(ctx, productID, name, price, quantity)
	return args.Bool(0), args.String(1), args.Error(2)
}

func (m *MockInventoryService) UpdateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error) {
	args := m.Called(ctx, productID, name, price, quantity)
	return args.Bool(0), args.String(1), args.Error(2)
}

func (m *MockInventoryService) DeleteProduct(ctx context.Context, productID string) (bool, string, error) {
	args := m.Called(ctx, productID)
	return args.Bool(0), args.String(1), args.Error(2)
}

func (m *MockInventoryService) RestockItems(ctx context.Context, productID string, quantity int32) (bool, string, error) {
	args := m.Called(ctx, productID, quantity)
	return args.Bool(0), args.String(1), args.Error(2)
}

func TestInventoryPactProvider(t *testing.T) {
	// 1. Setup Mock Service
	mockSvc := new(MockInventoryService)
	
	// Default mock behavior for interactions without specific state handlers
	mockSvc.On("RestockItems", mock.Anything, "PROD-001", int32(10)).Return(true, "Stock restocked successfully", nil).Maybe()

	// 2. Start the REST server
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	
	handler := rest.NewInventoryHandler(mockSvc)
	handler.SetupRoutes(r)
	
	// Start server on a random port
	ln, err := net.Listen("tcp", "localhost:0")
	if err != nil {
		t.Fatalf("Failed to listen: %v", err)
	}
	addr := ln.Addr().String()
	ln.Close()

	go func() {
		if err := r.Run(addr); err != nil {
			t.Logf("Server exited: %v", err)
		}
	}()

	// Wait for server to be ready
	for i := 0; i < 10; i++ {
		conn, err := net.DialTimeout("tcp", addr, 100*time.Millisecond)
		if err == nil {
			conn.Close()
			break
		}
		time.Sleep(100 * time.Millisecond)
		if i == 9 {
			t.Fatalf("Server failed to start on %s", addr)
		}
	}

	// 3. Verify the Pact
	verifier := provider.NewVerifier()
	
	err = verifier.VerifyProvider(t, provider.VerifyRequest{
		Provider:           "InventoryService",
		ProviderBaseURL:    fmt.Sprintf("http://%s", addr),
		PactFiles:          []string{"../../../tests/pacts/OrderService-InventoryService.json"},
		ProviderBranch:     "main",
		FailIfNoPactsFound: true,
		StateHandlers: pactmodels.StateHandlers{
			"Product PROD-001 exists with 100 units": func(setup bool, state pactmodels.ProviderState) (pactmodels.ProviderStateResponse, error) {
				mockSvc.On("GetStock", mock.Anything, "PROD-001").Return(100, nil)
				return nil, nil
			},
			"Product PROD-001 has 100 units": func(setup bool, state pactmodels.ProviderState) (pactmodels.ProviderStateResponse, error) {
				// This state is for reservation test
				mockSvc.On("Reserve", mock.Anything, mock.Anything, "PROD-001", int32(5)).Return(true, "Stock reserved successfully", nil)
				return nil, nil
			},
		},
	})

	if err != nil {
		t.Fatalf("Pact verification failed: %v", err)
	}
}
