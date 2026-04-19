package service

import (
	"context"
	"inventory-service/internal/models"
	"inventory-service/internal/repository"
	"log/slog"
)

type InventoryService interface {
	Reserve(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error)
	Release(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error)
	GetStock(ctx context.Context, productID string) (int32, error)
	GetProduct(ctx context.Context, productID string) (models.ProductStock, error)
	ListProducts(ctx context.Context) ([]models.ProductStock, error)
	CreateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error)
	UpdateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error)
	DeleteProduct(ctx context.Context, productID string) (bool, string, error)
	RestockItems(ctx context.Context, productID string, quantity int32) (bool, string, error)
}

type inventoryService struct {
	repo repository.InventoryRepository
}

func NewInventoryService(repo repository.InventoryRepository) InventoryService {
	return &inventoryService{repo: repo}
}

func (s *inventoryService) ListProducts(ctx context.Context) ([]models.ProductStock, error) {
	slog.InfoContext(ctx, "Listing all products")
	return s.repo.ListProducts(ctx)
}

func (s *inventoryService) CreateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error) {
	slog.InfoContext(ctx, "Creating product", "product_id", productID, "name", name)
	product := models.ProductStock{
		ProductID: productID,
		Name:      name,
		Price:     price,
		Quantity:  quantity,
	}
	err := s.repo.CreateProduct(ctx, product)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to create product", "error", err)
		return false, err.Error(), nil
	}
	return true, "Product created successfully", nil
}

func (s *inventoryService) UpdateProduct(ctx context.Context, productID string, name string, price float64, quantity int32) (bool, string, error) {
	slog.InfoContext(ctx, "Updating product", "product_id", productID)
	product := models.ProductStock{
		ProductID: productID,
		Name:      name,
		Price:     price,
		Quantity:  quantity,
	}
	err := s.repo.UpdateProduct(ctx, product)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to update product", "error", err)
		return false, err.Error(), nil
	}
	return true, "Product updated successfully", nil
}

func (s *inventoryService) DeleteProduct(ctx context.Context, productID string) (bool, string, error) {
	slog.WarnContext(ctx, "Deleting product", "product_id", productID)
	err := s.repo.DeleteProduct(ctx, productID)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to delete product", "error", err)
		return false, err.Error(), nil
	}
	return true, "Product deleted successfully", nil
}

func (s *inventoryService) RestockItems(ctx context.Context, productID string, quantity int32) (bool, string, error) {
	slog.InfoContext(ctx, "Restocking items", "product_id", productID, "quantity", quantity)
	err := s.repo.RestockItems(ctx, productID, quantity)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Stock restocked successfully", nil
}

func (s *inventoryService) Reserve(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error) {
	slog.InfoContext(ctx, "Reserving stock", "order_id", orderID, "product_id", productID, "quantity", quantity)
	err := s.repo.ReserveStock(ctx, orderID, productID, quantity)
	if err != nil {
		slog.ErrorContext(ctx, "Failed to reserve stock", "error", err, "order_id", orderID)
		return false, err.Error(), nil
	}
	return true, "Stock reserved successfully", nil
}

func (s *inventoryService) Release(ctx context.Context, orderID string, productID string, quantity int32) (bool, string, error) {
	slog.InfoContext(ctx, "Releasing stock", "order_id", orderID, "product_id", productID)
	err := s.repo.ReleaseStock(ctx, orderID, productID, quantity)
	if err != nil {
		return false, err.Error(), nil
	}
	return true, "Stock released successfully", nil
}

func (s *inventoryService) GetProduct(ctx context.Context, productID string) (models.ProductStock, error) {
	return s.repo.GetProduct(ctx, productID)
}

func (s *inventoryService) GetStock(ctx context.Context, productID string) (int32, error) {
	return s.repo.GetStock(ctx, productID)
}
