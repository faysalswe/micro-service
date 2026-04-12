package service

import (
	"context"
	"errors"
	"testing"

	"inventory-service/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRepository is a mock of the InventoryRepository interface
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) ReserveStock(ctx context.Context, orderID string, productID string, quantity int32) error {
	args := m.Called(ctx, orderID, productID, quantity)
	return args.Error(0)
}

func (m *MockRepository) ReleaseStock(ctx context.Context, orderID string, productID string, quantity int32) error {
	args := m.Called(ctx, orderID, productID, quantity)
	return args.Error(0)
}

func (m *MockRepository) GetStock(ctx context.Context, productID string) (int32, error) {
	args := m.Called(ctx, productID)
	return int32(args.Int(0)), args.Error(1)
}

func (m *MockRepository) ListProducts(ctx context.Context) ([]models.ProductStock, error) {
	args := m.Called(ctx)
	return args.Get(0).([]models.ProductStock), args.Error(1)
}

func (m *MockRepository) CreateProduct(ctx context.Context, product models.ProductStock) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockRepository) UpdateProduct(ctx context.Context, product models.ProductStock) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockRepository) DeleteProduct(ctx context.Context, productID string) error {
	args := m.Called(ctx, productID)
	return args.Error(0)
}

func (m *MockRepository) RestockItems(ctx context.Context, productID string, quantity int32) error {
	args := m.Called(ctx, productID, quantity)
	return args.Error(0)
}

func TestInventoryService_Reserve(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewInventoryService(mockRepo)
	ctx := context.Background()

	t.Run("Successful Reservation", func(t *testing.T) {
		mockRepo.On("ReserveStock", ctx, "order-1", "prod-1", int32(5)).Return(nil).Once()

		success, msg, err := svc.Reserve(ctx, "order-1", "prod-1", 5)

		assert.NoError(t, err)
		assert.True(t, success)
		assert.Equal(t, "Stock reserved successfully", msg)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Insufficient Stock", func(t *testing.T) {
		mockRepo.On("ReserveStock", ctx, "order-2", "prod-1", int32(500)).Return(errors.New("insufficient stock")).Once()

		success, msg, err := svc.Reserve(ctx, "order-2", "prod-1", 500)

		assert.NoError(t, err)
		assert.False(t, success)
		assert.Equal(t, "insufficient stock", msg)
		mockRepo.AssertExpectations(t)
	})
}

func TestInventoryService_Release(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewInventoryService(mockRepo)
	ctx := context.Background()

	t.Run("Successful Release", func(t *testing.T) {
		mockRepo.On("ReleaseStock", ctx, "order-1", "prod-1", int32(5)).Return(nil).Once()

		success, msg, err := svc.Release(ctx, "order-1", "prod-1", 5)

		assert.NoError(t, err)
		assert.True(t, success)
		assert.Equal(t, "Stock released successfully", msg)
		mockRepo.AssertExpectations(t)
	})
}

func TestInventoryService_GetStock(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewInventoryService(mockRepo)
	ctx := context.Background()

	t.Run("Get Existing Product Stock", func(t *testing.T) {
		mockRepo.On("GetStock", ctx, "prod-1").Return(100, nil).Once()

		stock, err := svc.GetStock(ctx, "prod-1")

		assert.NoError(t, err)
		assert.Equal(t, int32(100), stock)
		mockRepo.AssertExpectations(t)
	})
}

func TestInventoryService_RestockItems(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewInventoryService(mockRepo)
	ctx := context.Background()

	t.Run("Successful Restock", func(t *testing.T) {
		mockRepo.On("RestockItems", ctx, "prod-1", int32(10)).Return(nil).Once()

		success, msg, err := svc.RestockItems(ctx, "prod-1", 10)

		assert.NoError(t, err)
		assert.True(t, success)
		assert.Equal(t, "Stock restocked successfully", msg)
		mockRepo.AssertExpectations(t)
	})
}

func TestInventoryService_ProductManagement(t *testing.T) {
	mockRepo := new(MockRepository)
	svc := NewInventoryService(mockRepo)
	ctx := context.Background()

	t.Run("Create Product", func(t *testing.T) {
		product := models.ProductStock{
			ProductID: "new-prod",
			Name:      "Test Product",
			Price:     99.99,
			Quantity:  10,
		}
		mockRepo.On("CreateProduct", ctx, product).Return(nil).Once()

		success, msg, err := svc.CreateProduct(ctx, "new-prod", "Test Product", 99.99, 10)

		assert.NoError(t, err)
		assert.True(t, success)
		assert.Equal(t, "Product created successfully", msg)
		mockRepo.AssertExpectations(t)
	})

	t.Run("List Products", func(t *testing.T) {
		products := []models.ProductStock{
			{ProductID: "p1", Name: "P1", Price: 10, Quantity: 5},
		}
		mockRepo.On("ListProducts", ctx).Return(products, nil).Once()

		result, err := svc.ListProducts(ctx)

		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "p1", result[0].ProductID)
		mockRepo.AssertExpectations(t)
	})
}
